import type { CareerProgressResult } from "../game-progress/progressCareer";
import type { MessageNewsFrequency } from "../settings/appSettings";
import type { CareerMessage, CareerSave, MatchRecord } from "../../types/game";
import type { MessageDraft } from "./messageDraft";

export type AiNewsMessageFacts = {
  competition: string;
  eventType: "match_review";
  facts: string[];
  opponent: string;
  result: "loss" | "win";
  score: string;
  stageName: string;
  team: string;
  winProbability?: number;
};

const templateNewsMessageIdPrefix = "template-news-";

function getNewUserMatchRecords({
  nextCareer,
  previousCareer,
}: {
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}) {
  const previousRecordIds = new Set(
    previousCareer.seasonState.matchRecords.map((record) => record.id),
  );
  const latestRecordIds = new Set(nextCareer.seasonState.lastMatchRecordIds);

  return nextCareer.seasonState.matchRecords.filter(
    (record) =>
      latestRecordIds.has(record.id) &&
      !previousRecordIds.has(record.id) &&
      record.userResult !== "none",
  );
}

function getMatchScore(record: MatchRecord) {
  return `${record.score.blueWins}-${record.score.redWins}`;
}

function createMediaReviewBody({
  headline,
  notes,
  takeaway,
}: {
  headline: string;
  notes: string[];
  takeaway: string;
}) {
  return [`${headline}.`, ...notes, takeaway].join(" ");
}

function getMediaAngle(
  record: MatchRecord,
  frequency: MessageNewsFrequency = "normal",
) {
  const winProbability = record.winProbability ?? 0.5;
  const thresholdByFrequency = {
    low: {
      loss: 0.68,
      win: 0.38,
    },
    normal: {
      loss: 0.58,
      win: 0.46,
    },
    high: {
      loss: 0.5,
      win: 0.55,
    },
    debug: {
      loss: 0,
      win: 1,
    },
  } satisfies Record<MessageNewsFrequency, { loss: number; win: number }>;
  const threshold = thresholdByFrequency[frequency];

  if (record.userResult === "win" && winProbability <= threshold.win) {
    return {
      headline: "예상보다 강한 승리",
      notes: [
        `${record.stageName}에서 ${record.winnerTeamName}이 어려운 승부 예측을 뒤집었습니다.`,
        "언론 반응은 밴픽 적응력, 후반 집중력, 시리즈 운영 완성도에 모이고 있습니다.",
        "이런 승리는 다음 경기 전 선수단 자신감과 팬 반응을 함께 끌어올릴 수 있습니다.",
      ],
      takeaway: "관전 포인트: 다음 경기에서도 같은 강점이 반복되는지 확인할 필요가 있습니다.",
    };
  }

  if (record.userResult === "loss" && winProbability >= threshold.loss) {
    return {
      headline: "흔들린 우세 전망",
      notes: [
        `${record.stageName}에서 우세 전망을 살리지 못했습니다.`,
        "언론은 다음 경기 전 초반 설계, 오브젝트 교전, 선수단 컨디션 점검이 필요하다고 보고 있습니다.",
        "예상보다 무거운 패배라면 단순 전술 변경보다 선발 상태 확인이 먼저일 수 있습니다.",
      ],
      takeaway: "관전 포인트: 다음 경기에서 초반 주도권 회복 여부가 가장 중요한 체크포인트입니다.",
    };
  }

  if (frequency === "debug") {
    return {
      headline:
        record.userResult === "win" ? "승리 흐름 점검" : "패배 후 점검",
      notes:
        record.userResult === "win"
          ? [
              `${record.stageName} 승리 이후 선수단 흐름을 점검할 시점입니다.`,
              "다음 경기까지 컨디션과 전략 완성도를 이어가는 것이 중요합니다.",
              "디버그 빈도에서는 일반 승리도 뉴스 후보로 남겨 흐름을 확인할 수 있습니다.",
            ]
          : [
              `${record.stageName} 패배 이후 선수단 흐름을 점검할 시점입니다.`,
              "다음 경기 전 컨디션과 밴픽 방향을 다시 살펴볼 필요가 있습니다.",
              "디버그 빈도에서는 일반 패배도 뉴스 후보로 남겨 흐름을 확인할 수 있습니다.",
            ],
      takeaway: "관전 포인트: 메시지 빈도 설정을 조정하며 뉴스 생성 흐름을 테스트할 수 있습니다.",
    };
  }

  return null;
}

export function createTemplateNewsMessages({
  lastMatch,
  messageNewsFrequency = "normal",
  nextCareer,
  previousCareer,
}: {
  lastMatch: CareerProgressResult["lastMatch"];
  messageNewsFrequency?: MessageNewsFrequency;
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}): MessageDraft[] {
  if (!lastMatch) {
    return [];
  }

  const mediaCandidate = getNewUserMatchRecords({ nextCareer, previousCareer })
    .map((candidate) => ({
      angle: getMediaAngle(candidate, messageNewsFrequency),
      record: candidate,
    }))
    .find((candidate) => Boolean(candidate.angle));

  if (!mediaCandidate?.angle) {
    return [];
  }

  return [
    {
      id: `template-news-${mediaCandidate.record.id}`,
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "news",
      priority: "normal",
      title: "미디어 리뷰",
      body: createMediaReviewBody(mediaCandidate.angle),
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "media",
      relatedCompetitionId: mediaCandidate.record.competitionId,
      relatedTeamId: mediaCandidate.record.winnerTeamId,
    },
  ];
}

export function isAiNewsCandidateMessage(message: CareerMessage) {
  return (
    message.category === "news" &&
    message.source === "media" &&
    message.title === "미디어 리뷰" &&
    message.id.startsWith(templateNewsMessageIdPrefix)
  );
}

export function createAiNewsFactsForMessage({
  career,
  message,
}: {
  career: CareerSave;
  message: CareerMessage;
}): AiNewsMessageFacts | null {
  if (!isAiNewsCandidateMessage(message)) {
    return null;
  }

  const recordId = message.id.slice(templateNewsMessageIdPrefix.length);
  const record = career.seasonState.matchRecords.find(
    (matchRecord) => matchRecord.id === recordId,
  );

  if (!record || record.userResult === "none") {
    return null;
  }

  const schedule = career.seasonState.scheduledMatches.find(
    (match) => match.id === record.scheduleId,
  );
  const competitionName =
    career.seasonState.competitions.find(
      (competition) => competition.competitionId === record.competitionId,
    )?.name ?? record.competitionId;
  const team = career.userTeam.name;
  const opponent =
    schedule?.blueTeamName === team
      ? schedule.redTeamName
      : schedule?.redTeamName === team
        ? schedule.blueTeamName
        : record.winnerTeamName === team
          ? "상대 팀"
          : record.winnerTeamName;
  const resultLabel = record.userResult === "win" ? "승리" : "패배";
  const facts = [
    `${team}은 ${opponent} 상대 ${record.stageName} 경기에서 ${resultLabel}했습니다.`,
    `${competitionName} 경기 스코어는 ${getMatchScore(record)}입니다.`,
  ];

  if (typeof record.winProbability === "number") {
    facts.push(
      `경기 전 ${team}의 예상 승률은 ${Math.round(
        record.winProbability * 100,
      )}%였습니다.`,
    );
  }

  facts.push(message.body);

  return {
    competition: competitionName,
    eventType: "match_review",
    facts,
    opponent,
    result: record.userResult,
    score: getMatchScore(record),
    stageName: record.stageName,
    team,
    winProbability: record.winProbability,
  };
}
