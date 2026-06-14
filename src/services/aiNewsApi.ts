import type { AiNewsMessageFacts } from "../domain/messages";

export type AiNewsStatus = {
  enabled: boolean;
  hasGeminiApiKey: boolean;
  model: string;
  provider: string;
  testEndpointEnabled: boolean;
};

export type GeneratedAiNews = {
  angle: "competition" | "fallback" | "match_review" | "streak" | "transfer" | "upset";
  body: string;
  safetyNotes: string[];
  title: string;
};

type AiNewsResponse = {
  news: GeneratedAiNews;
};

const defaultApiBaseUrl = "/api";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
}

function createUrl(path: string) {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    return `${baseUrl}${path}`;
  }

  return new URL(`${baseUrl}${path}`).toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : "AI news API request failed.",
    );
  }

  return body as T;
}

export async function getAiNewsStatus() {
  const response = await fetch(createUrl("/ai-news/status"));

  return parseResponse<AiNewsStatus>(response);
}

export async function generateAiNews(facts: AiNewsMessageFacts) {
  const response = await fetch(createUrl("/ai-news/generate"), {
    body: JSON.stringify(facts),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = await parseResponse<AiNewsResponse>(response);

  return body.news;
}
