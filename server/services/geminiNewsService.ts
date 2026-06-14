import {
  getAiNewsModel,
  getAiNewsProvider,
  getGeminiApiKey,
  isAiNewsEnabled,
  isAiNewsTestEndpointEnabled,
} from "../config.js";
import { BadRequestError, HttpStatusError } from "../errors/httpErrors.js";

export type AiNewsInput = {
  competition?: unknown;
  eventType?: unknown;
  facts?: unknown;
  opponent?: unknown;
  result?: unknown;
  score?: unknown;
  stageName?: unknown;
  team?: unknown;
  winProbability?: unknown;
};

type SafeAiNewsFacts = {
  competition: string;
  eventType: string;
  facts: string[];
  opponent: string;
  result: string;
  score: string;
  stageName: string;
  team: string;
  winProbability?: number;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        thought?: boolean;
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

export type GeneratedAiNews = {
  angle: "competition" | "fallback" | "match_review" | "streak" | "transfer" | "upset";
  body: string;
  safetyNotes: string[];
  title: string;
};

const defaultAiNewsFacts: SafeAiNewsFacts = {
  competition: "LCK Cup",
  eventType: "match_review",
  facts: [
    "T1이 예상 승률 44% 경기에서 승리했습니다.",
    "T1은 최근 3연승을 기록했습니다.",
    "다음 상대는 Hanwha Life Esports입니다.",
  ],
  opponent: "Gen.G",
  result: "win",
  score: "2-1",
  stageName: "Group Stage",
  team: "T1",
  winProbability: 0.44,
};

const newsResponseSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Korean esports news headline. 12 to 40 Korean characters.",
    },
    body: {
      type: "string",
      description:
        "Korean news body. One paragraph with three concise sentences based only on provided facts.",
    },
    angle: {
      type: "string",
      enum: ["competition", "fallback", "match_review", "streak", "transfer", "upset"],
      description: "Primary editorial angle for the news.",
    },
    safetyNotes: {
      type: "array",
      description: "Short notes confirming which facts were used.",
      items: {
        type: "string",
      },
    },
  },
  required: ["title", "body", "angle", "safetyNotes"],
  additionalProperties: false,
} as const;

function getThinkingConfig(model: string) {
  if (model.startsWith("gemini-3")) {
    return { thinkingLevel: "minimal" };
  }

  if (model.startsWith("gemini-2.5-flash")) {
    return { thinkingBudget: 0 };
  }

  return undefined;
}

function getCleanString(value: unknown, fallback: string, maxLength = 80) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, maxLength);
}

function getCleanFacts(value: unknown) {
  if (!Array.isArray(value)) {
    return defaultAiNewsFacts.facts;
  }

  const facts = value
    .filter((fact): fact is string => typeof fact === "string")
    .map((fact) => fact.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((fact) => fact.slice(0, 180));

  return facts.length > 0 ? facts : defaultAiNewsFacts.facts;
}

function getCleanProbability(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(1, Math.max(0, value));
}

function getSafeFacts(input: AiNewsInput | undefined): SafeAiNewsFacts {
  const source = input ?? defaultAiNewsFacts;

  return {
    competition: getCleanString(source.competition, defaultAiNewsFacts.competition),
    eventType: getCleanString(source.eventType, defaultAiNewsFacts.eventType),
    facts: getCleanFacts(source.facts),
    opponent: getCleanString(source.opponent, defaultAiNewsFacts.opponent),
    result: getCleanString(source.result, defaultAiNewsFacts.result, 24),
    score: getCleanString(source.score, defaultAiNewsFacts.score, 24),
    stageName: getCleanString(source.stageName, defaultAiNewsFacts.stageName),
    team: getCleanString(source.team, defaultAiNewsFacts.team),
    winProbability: getCleanProbability(source.winProbability),
  };
}

function buildPrompt(facts: SafeAiNewsFacts) {
  return [
    "너는 MOBA Esports Manager Lite 게임 안의 e스포츠 미디어 기자다.",
    "아래 JSON facts에 있는 사실만 사용해서 한국어 뉴스 제목과 본문을 작성한다.",
    "반드시 JSON 객체만 출력한다. 마크다운 코드블록, 설명 문장, 머리말은 쓰지 않는다.",
    "실제 현실 뉴스, 존재하지 않는 선수명, 부상, 이적, 징계, 인터뷰를 새로 만들지 않는다.",
    "팀명과 대회명은 facts에 주어진 표기 그대로 사용한다.",
    "본문은 줄바꿈이나 bullet 없이 한 문단 3문장으로 작성하고, 과장된 표현은 피한다.",
    "1문장은 결과 요약, 1문장은 경기 흐름 또는 의미, 1문장은 다음 경기 관전 포인트로 쓴다.",
    "",
    "facts:",
    JSON.stringify(facts, null, 2),
  ].join("\n");
}

function normalizeModelName(model: string) {
  return model.startsWith("models/") ? model.slice("models/".length) : model;
}

function parseGeminiText(responseBody: GeminiGenerateContentResponse) {
  const text = responseBody.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  if (!text) {
    throw new HttpStatusError("Gemini response did not include text.", 502);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as unknown;
      } catch {
        // Fall through to the normalized upstream error below.
      }
    }

    throw new HttpStatusError("Gemini response was not valid JSON.", 502);
  }
}

function validateGeneratedNews(value: unknown, facts: SafeAiNewsFacts): GeneratedAiNews {
  if (!value || typeof value !== "object") {
    throw new HttpStatusError("Gemini news response was empty.", 502);
  }

  const candidate = value as Partial<GeneratedAiNews>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const body =
    typeof candidate.body === "string"
      ? candidate.body.trim().replace(/\s*\n+\s*/g, " ")
      : "";
  const angle = candidate.angle;
  const safetyNotes = Array.isArray(candidate.safetyNotes)
    ? candidate.safetyNotes
        .filter((note): note is string => typeof note === "string")
        .map((note) => note.trim())
        .filter(Boolean)
    : [];
  const validAngles: GeneratedAiNews["angle"][] = [
    "competition",
    "fallback",
    "match_review",
    "streak",
    "transfer",
    "upset",
  ];

  if (title.length < 4 || title.length > 80) {
    throw new HttpStatusError("Gemini news title failed validation.", 502);
  }

  if (body.length < 40 || body.length > 560) {
    throw new HttpStatusError("Gemini news body failed validation.", 502);
  }

  if (!validAngles.includes(angle as GeneratedAiNews["angle"])) {
    throw new HttpStatusError("Gemini news angle failed validation.", 502);
  }

  if (!body.includes(facts.team) && !body.includes(facts.opponent)) {
    throw new HttpStatusError("Gemini news body did not mention a provided team.", 502);
  }

  if (title.includes("undefined") || body.includes("undefined")) {
    throw new HttpStatusError("Gemini news contained invalid placeholder text.", 502);
  }

  return {
    angle: angle as GeneratedAiNews["angle"],
    body,
    safetyNotes,
    title,
  };
}

export async function generateGeminiNews(input?: AiNewsInput) {
  if (!isAiNewsEnabled()) {
    throw new HttpStatusError("AI news generation is disabled.", 503);
  }

  if (getAiNewsProvider() !== "gemini") {
    throw new BadRequestError("AI_NEWS_PROVIDER must be set to gemini.");
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new HttpStatusError("Missing GEMINI_API_KEY.", 503);
  }

  const facts = getSafeFacts(input);
  const model = normalizeModelName(getAiNewsModel());
  const thinkingConfig = getThinkingConfig(model);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(facts) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          responseJsonSchema: newsResponseSchema,
          responseMimeType: "application/json",
          temperature: 0.35,
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      method: "POST",
    },
  );
  const responseBody = (await response.json()) as GeminiGenerateContentResponse;

  if (!response.ok) {
    throw new HttpStatusError(
      responseBody.error?.message ?? "Gemini API request failed.",
      response.status,
    );
  }

  return {
    facts,
    model,
    provider: "gemini" as const,
    ...validateGeneratedNews(parseGeminiText(responseBody), facts),
  };
}

export async function generateGeminiNewsTest(input?: AiNewsInput) {
  if (!isAiNewsTestEndpointEnabled()) {
    throw new HttpStatusError("AI news test endpoint is disabled.", 403);
  }

  return generateGeminiNews(input);
}
