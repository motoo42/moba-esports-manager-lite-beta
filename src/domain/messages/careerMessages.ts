import {
  getNextScheduledMatches,
  getPreviewMatches,
} from "../season/progressSeason";
import type {
  CareerMessage,
  CareerMessageCategory,
  CareerMessagePriority,
  CareerMessageSource,
  CareerSave,
  MatchRecord,
  MatchSchedule,
  OffseasonLogEntry,
} from "../../types/game";
import type { CareerProgressResult } from "../game-progress/progressCareer";
import type { AppSettings } from "../settings/appSettings";
import type { MessageDraft } from "./messageDraft";
import { createTemplateNewsMessages } from "./newsTemplates";
import { createOffseasonWeeklySummaryMessages } from "./offseasonSummaries";
import { createSquadReportMessages } from "./squadReports";

export const maxCareerMessages = 120;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function getCareerMessageDedupeKey(message: CareerMessage | MessageDraft) {
  return [
    message.source,
    message.dateKey,
    message.relatedPlayerId ??
      message.relatedTeamId ??
      message.relatedCompetitionId ??
      "general",
    message.title,
    message.body.slice(0, 120),
  ].join("::");
}

function createCareerMessage(draft: MessageDraft, index: number): CareerMessage {
  const baseKey = getCareerMessageDedupeKey(draft);

  return {
    ...draft,
    id:
      draft.id ??
      `msg-${draft.source}-${draft.dateKey}-${slugify(draft.title)}-${hashString(
        baseKey,
      )}-${index}`,
    read: draft.read ?? false,
  };
}

export function appendCareerMessages(
  career: CareerSave,
  drafts: MessageDraft[],
): CareerSave {
  if (drafts.length === 0) {
    return {
      ...career,
      messages: career.messages ?? [],
    };
  }

  const existingMessages = career.messages ?? [];
  const seenIds = new Set(existingMessages.map((message) => message.id));
  const seenKeys = new Set(existingMessages.map(getCareerMessageDedupeKey));
  const newMessages = drafts
    .map((draft, index) => createCareerMessage(draft, existingMessages.length + index))
    .filter((message) => {
      const key = getCareerMessageDedupeKey(message);

      if (seenIds.has(message.id) || seenKeys.has(key)) {
        return false;
      }

      seenIds.add(message.id);
      seenKeys.add(key);
      return true;
    });

  return {
    ...career,
    messages: [...existingMessages, ...newMessages].slice(-maxCareerMessages),
  };
}

export function markCareerMessageRead(
  career: CareerSave,
  messageId: string,
): CareerSave {
  return {
    ...career,
    messages: (career.messages ?? []).map((message) =>
      message.id === messageId ? { ...message, read: true } : message,
    ),
  };
}

export function markAllCareerMessagesRead(career: CareerSave): CareerSave {
  return {
    ...career,
    messages: (career.messages ?? []).map((message) => ({
      ...message,
      read: true,
    })),
  };
}

export function applyAiNewsToCareerMessage({
  body,
  career,
  messageId,
  title,
}: {
  body: string;
  career: CareerSave;
  messageId: string;
  title: string;
}): CareerSave {
  return {
    ...career,
    messages: (career.messages ?? []).map((message) =>
      message.id === messageId && message.category === "news"
        ? {
            ...message,
            body,
            title,
          }
        : message,
    ),
  };
}

export function isImportantCareerMessage(message: CareerMessage) {
  return message.category === "important" || message.priority !== "normal";
}

function getUserTeamId(career: CareerSave) {
  return (
    career.seasonState.competitions
      .find(
        (competition) =>
          competition.competitionId === career.seasonState.currentCompetitionId,
      )
      ?.standings.find((entry) => entry.isUserTeam)?.teamId ?? undefined
  );
}

function isUserMatch(match: MatchSchedule, userTeamId: string | undefined) {
  return (
    Boolean(userTeamId) &&
    (match.blueTeamId === userTeamId || match.redTeamId === userTeamId)
  );
}

function getOpponentName(match: MatchSchedule, userTeamId: string | undefined) {
  if (!userTeamId) {
    return `${match.blueTeamName} vs ${match.redTeamName}`;
  }

  if (match.blueTeamId === userTeamId) {
    return match.redTeamName;
  }

  if (match.redTeamId === userTeamId) {
    return match.blueTeamName;
  }

  return `${match.blueTeamName} vs ${match.redTeamName}`;
}

function getMatchScore(record: MatchRecord) {
  return `${record.score.blueWins}-${record.score.redWins}`;
}

function createReportBody({
  bullets,
  footer,
  title,
}: {
  bullets: string[];
  footer?: string;
  title: string;
}) {
  return [
    title,
    ...bullets.map((bullet) => `- ${bullet}`),
    ...(footer ? [footer] : []),
  ].join("\n");
}

function createParagraphBody(sentences: string[]) {
  return sentences.join(" ");
}

function getOffseasonLogAdvice(log: OffseasonLogEntry) {
  if (log.type === "system") {
    return "다음 단계로 넘어가기 전에 선수단 등록 조건과 예산 여유를 함께 확인하세요.";
  }

  if (log.type === "rejection") {
    return "거절 사유를 확인한 뒤 연봉, 역할 약속, 대체 후보를 다시 비교하는 것이 좋습니다.";
  }

  if (log.type === "blocked") {
    return "진행이 막힌 항목이 있다면 해결 조건을 먼저 정리해야 다음 일정을 안정적으로 넘길 수 있습니다.";
  }

  if (log.type === "renewal") {
    return "재계약 결과는 다음 시즌 로스터 안정성과 예산 운용에 바로 영향을 줍니다.";
  }

  if (log.type === "release") {
    return "방출된 선수의 포지션 공백과 2군 자동 보충 여부를 함께 확인하세요.";
  }

  if (log.type === "signing") {
    return "영입이 확정된 선수는 배치 역할과 기존 선수단 구성을 함께 점검해야 합니다.";
  }

  return "스토브리그 로그를 기준으로 다음 협상 우선순위를 다시 정리하세요.";
}

function createMatchResultMessages({
  nextCareer,
  previousCareer,
}: {
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}): MessageDraft[] {
  const previousRecordIds = new Set(
    previousCareer.seasonState.matchRecords.map((record) => record.id),
  );
  const latestRecordIds = new Set(nextCareer.seasonState.lastMatchRecordIds);
  const latestUserRecords = nextCareer.seasonState.matchRecords.filter(
    (record) =>
      latestRecordIds.has(record.id) &&
      !previousRecordIds.has(record.id) &&
      record.userResult !== "none",
  );

  return latestUserRecords.map((record) => {
    const isWin = record.userResult === "win";
    const score = getMatchScore(record);
    return {
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "match",
      priority: isWin ? "normal" : "important",
      title: "경기 결과 도착",
      body: createParagraphBody([
        `${record.stageName} 경기가 ${score} 스코어로 종료됐고, 승리 팀은 ${record.winnerTeamName}입니다.`,
        isWin
          ? "선수단 분위기와 최근 경기력을 이어갈 수 있는 결과라 다음 경기 전에는 과한 변화보다 현재 강점을 유지하는 쪽이 좋아 보입니다."
          : "다음 경기 전에는 밴픽 방향, 선수 컨디션, 피로도 누적을 함께 확인해야 하는 결과입니다.",
        isWin
          ? "전략/훈련 탭에서 다음 상대 리포트를 확인하고, 현재 흐름을 해치지 않는 선에서 주간 계획을 조정하세요."
          : "전략/훈련 탭의 상대 리포트와 주간 계획을 먼저 점검한 뒤 선발 유지 여부를 판단하세요.",
      ]),
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "competition",
      relatedCompetitionId: record.competitionId,
      relatedTeamId: record.winnerTeamId,
    };
  });
}

function createScheduleMessages({
  nextCareer,
  previousCareer,
}: {
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}): MessageDraft[] {
  const userTeamId = getUserTeamId(nextCareer);
  const previousPreviewIds = new Set(previousCareer.seasonState.nextMatchIds);
  const previewUserMatch = getPreviewMatches(nextCareer.seasonState).find((match) =>
    isUserMatch(match, userTeamId),
  );
  const drafts: MessageDraft[] = [];

  if (previewUserMatch && !previousPreviewIds.has(previewUserMatch.id)) {
    const opponentName = getOpponentName(previewUserMatch, userTeamId);
    const format = previewUserMatch.format.toUpperCase();

    drafts.push({
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "schedule",
      priority: "important",
      title: "다음 경기 일정 안내",
      body: createReportBody({
        title: "오늘 경기 준비 알림",
        bullets: [
          `${opponentName} 상대 ${previewUserMatch.stageName} ${format} 경기가 오늘 예정되어 있습니다.`,
          "상단 진행 버튼은 경기 프리뷰와 플레이 흐름으로 전환됩니다.",
          "경기 전에는 선발 5인의 컨디션, 피로도, 최근 폼을 먼저 확인하세요.",
          "상대 리포트에서 강점과 약점을 확인하면 전략 선택을 더 명확하게 할 수 있습니다.",
        ],
        footer: "권장 행동: 로스터 관리와 전략/훈련 탭을 확인한 뒤 경기를 진행하세요.",
      }),
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "competition",
      relatedCompetitionId: previewUserMatch.competitionId,
      relatedTeamId:
        previewUserMatch.blueTeamId === userTeamId
          ? previewUserMatch.redTeamId
          : previewUserMatch.blueTeamId,
    });

    return drafts;
  }

  const previousNextMatch = getNextScheduledMatches(previousCareer.seasonState).find(
    (match) => isUserMatch(match, getUserTeamId(previousCareer)),
  );
  const nextMatch = getNextScheduledMatches(nextCareer.seasonState).find((match) =>
    isUserMatch(match, userTeamId),
  );

  if (nextMatch && previousNextMatch?.id !== nextMatch.id) {
    const opponentName = getOpponentName(nextMatch, userTeamId);
    const scheduleLabel = nextMatch.scheduledDate ?? `${nextMatch.week}주차`;
    const format = nextMatch.format.toUpperCase();

    drafts.push({
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "schedule",
      priority: "normal",
      title: "다음 경기 일정 안내",
      body: createReportBody({
        title: "다음 경기 일정 브리핑",
        bullets: [
          `${opponentName} 상대 ${nextMatch.stageName} ${format} 경기가 ${scheduleLabel}에 예정되어 있습니다.`,
          "아직 경기일까지 시간이 남아 있으므로 주간 계획과 스크림 일정을 함께 조정할 수 있습니다.",
          "상대 전력에 따라 선발 고정, 후보 테스트, 휴식 운영 중 어느 쪽이 필요한지 미리 판단하세요.",
        ],
        footer: "권장 행동: 시즌 캘린더에서 남은 일정을 보고 훈련 강도를 무리 없이 배치하세요.",
      }),
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "competition",
      relatedCompetitionId: nextMatch.competitionId,
      relatedTeamId:
        nextMatch.blueTeamId === userTeamId ? nextMatch.redTeamId : nextMatch.blueTeamId,
    });
  }

  return drafts;
}

export function createProgressMessages({
  appSettings,
  lastMatch,
  nextCareer,
  previousCareer,
}: {
  appSettings?: AppSettings;
  lastMatch: CareerProgressResult["lastMatch"];
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}): MessageDraft[] {
  const matchMessages = createMatchResultMessages({
    nextCareer,
    previousCareer,
  });
  const scheduleMessages = createScheduleMessages({
    nextCareer,
    previousCareer,
  });
  const squadReportMessages = createSquadReportMessages({
    lastMatchPlayed: Boolean(lastMatch),
    nextCareer,
    previousCareer,
  });
  const newsMessages = createTemplateNewsMessages({
    lastMatch,
    messageNewsFrequency: appSettings?.messageNews.frequency,
    nextCareer,
    previousCareer,
  });

  return [
    ...matchMessages,
    ...scheduleMessages,
    ...squadReportMessages,
    ...newsMessages,
  ];
}

export function appendProgressMessages(
  previousCareer: CareerSave,
  nextCareer: CareerSave,
  lastMatch: CareerProgressResult["lastMatch"],
  appSettings?: AppSettings,
) {
  return appendCareerMessages(
    nextCareer,
    createProgressMessages({
      appSettings,
      lastMatch,
      nextCareer,
      previousCareer,
    }),
  );
}

function createTransferMessageFromLog({
  career,
  log,
}: {
  career: CareerSave;
  log: OffseasonLogEntry;
}): MessageDraft {
  const isImportantOffseasonNews =
    log.isUserTeamRelated ||
    log.type === "system" ||
    log.type === "rejection" ||
    log.type === "blocked";

  return {
    dateKey: career.seasonState.currentDateKey,
    dateLabel: career.seasonState.currentDateLabel,
    category: log.type === "system" ? "important" : "transfer",
    priority: isImportantOffseasonNews ? "important" : "normal",
    title: log.type === "system" ? "스토브리그 안내" : "FA 협상 결과",
    body: createReportBody({
      title: log.type === "system" ? "스토브리그 진행 안내" : "협상 결과 요약",
      bullets: [
        `${log.week}주차 ${log.day}일 기록입니다.`,
        log.message,
        getOffseasonLogAdvice(log),
      ],
      footer:
        log.type === "system"
          ? "권장 행동: 스토브리그 화면에서 남은 처리 항목을 확인하세요."
          : "권장 행동: 다음 제안 전에 예산, 역할 약속, 같은 포지션 후보를 함께 비교하세요.",
    }),
    createdTurn: career.seasonState.currentTurn,
    source: "offseason",
  };
}

function shouldCreateIndividualOffseasonMessage(log: OffseasonLogEntry) {
  return (
    log.isUserTeamRelated ||
    log.type === "system" ||
    log.type === "rejection" ||
    log.type === "blocked"
  );
}

export function createOffseasonLogMessages({
  nextCareer,
  previousCareer,
}: {
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}) {
  const previousLogIds = new Set(
    previousCareer.seasonState.offseason?.logEntries?.map((log) => log.id) ?? [],
  );
  const nextLogs = nextCareer.seasonState.offseason?.logEntries ?? [];
  const individualMessages = nextLogs
    .filter(
      (log) =>
        !previousLogIds.has(log.id) && shouldCreateIndividualOffseasonMessage(log),
    )
    .map((log) => createTransferMessageFromLog({ career: nextCareer, log }));
  const weeklySummaryMessages = createOffseasonWeeklySummaryMessages({
    nextCareer,
    previousCareer,
  });

  return [...individualMessages, ...weeklySummaryMessages];
}

export function appendOffseasonLogMessages(
  previousCareer: CareerSave,
  nextCareer: CareerSave,
) {
  return appendCareerMessages(
    nextCareer,
    createOffseasonLogMessages({
      nextCareer,
      previousCareer,
    }),
  );
}

export function createInitialCareerMessages(career: CareerSave): CareerSave {
  const isCompetitionStart = career.seasonState.phase === "competition";

  return appendCareerMessages(career, [
    {
      dateKey: career.seasonState.currentDateKey,
      dateLabel: career.seasonState.currentDateLabel,
      category: "important",
      priority: "important",
      title: isCompetitionStart
        ? "LCK Cup 개막 준비 완료"
        : "프리시즌 스토브리그 시작",
      body: isCompetitionStart
        ? createReportBody({
            title: "시즌 시작 안내",
            bullets: [
              "2026 실제 LCK 로스터를 기준으로 커리어를 시작했습니다.",
              "LCK Cup부터 바로 시즌을 진행할 수 있습니다.",
              "첫 경기 전에는 선발 5인 상태와 전략/훈련 탭의 상대 리포트를 함께 확인하세요.",
            ],
            footer: "권장 행동: 홈 화면에서 오늘 일정과 메시지함을 먼저 확인하세요.",
          })
        : createReportBody({
            title: "스토브리그 시작 안내",
            bullets: [
              "1주차에는 기존 선수단의 재계약 또는 방출을 결정합니다.",
              "2주차부터 FA 시장이 열리며, 주요 선수 영입 경쟁이 본격적으로 시작됩니다.",
              "1군 선발 5인 구성이 최우선이고, 2군은 필요한 경우에만 직접 보강해도 됩니다.",
            ],
            footer: "권장 행동: 재계약 대상과 예산 여유를 먼저 확인한 뒤 FA 계획을 세우세요.",
          }),
      createdTurn: career.seasonState.currentTurn,
      source: "system",
    },
  ]);
}

export const careerMessageCategoryLabels: Record<CareerMessageCategory, string> = {
  important: "중요",
  schedule: "일정",
  match: "경기",
  training: "훈련",
  transfer: "이적",
  system: "시스템",
  news: "뉴스",
};

export const careerMessageSourceLabels: Record<CareerMessageSource, string> = {
  system: "시스템",
  club: "구단",
  competition: "대회",
  offseason: "스토브리그",
  media: "언론",
  interview: "인터뷰",
  "random-news": "뉴스",
};

export const careerMessagePriorityLabels: Record<CareerMessagePriority, string> = {
  normal: "일반",
  important: "중요",
  urgent: "긴급",
};
