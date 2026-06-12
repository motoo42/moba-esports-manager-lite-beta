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
  Player,
} from "../../types/game";
import type { CareerProgressResult } from "../game-progress/progressCareer";

export const maxCareerMessages = 120;

type MessageDraft = Omit<CareerMessage, "id" | "read"> & {
  id?: string;
  read?: boolean;
};

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
  const seenKeys = new Set(existingMessages.map(getCareerMessageDedupeKey));
  const newMessages = drafts
    .map((draft, index) => createCareerMessage(draft, existingMessages.length + index))
    .filter((message) => {
      const key = getCareerMessageDedupeKey(message);

      if (seenKeys.has(key)) {
        return false;
      }

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
    return {
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "match",
      priority: isWin ? "normal" : "important",
      title: "경기 결과 도착",
      body: `${record.stageName} 경기가 ${getMatchScore(
        record,
      )} 스코어로 종료됐습니다. 승리 팀은 ${record.winnerTeamName}입니다. ${
        isWin
          ? "선수단 분위기를 이어갈 수 있는 결과입니다."
          : "다음 경기 전 전략과 선수 상태를 다시 확인하는 것이 좋습니다."
      }`,
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
    drafts.push({
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "schedule",
      priority: "important",
      title: "다음 경기 일정 안내",
      body: `${getOpponentName(
        previewUserMatch,
        userTeamId,
      )} 상대 ${previewUserMatch.stageName} ${previewUserMatch.format.toUpperCase()} 경기가 오늘 예정되어 있습니다. 상단 진행 버튼이 플레이 흐름으로 전환됩니다.`,
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
    drafts.push({
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "schedule",
      priority: "normal",
      title: "다음 경기 일정 안내",
      body: `${getOpponentName(
        nextMatch,
        userTeamId,
      )} 상대 ${nextMatch.stageName} ${nextMatch.format.toUpperCase()} 경기가 ${
        nextMatch.scheduledDate ?? `${nextMatch.week}주차`
      }에 예정되어 있습니다.`,
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "competition",
      relatedCompetitionId: nextMatch.competitionId,
      relatedTeamId:
        nextMatch.blueTeamId === userTeamId ? nextMatch.redTeamId : nextMatch.blueTeamId,
    });
  }

  return drafts;
}

function getPlayerById(career: CareerSave, playerId: string) {
  return career.lckPlayers.find((player) => player.id === playerId);
}

function getStatusWarningDraft({
  nextCareer,
  player,
  previousPlayer,
}: {
  nextCareer: CareerSave;
  player: Player;
  previousPlayer?: Player;
}): MessageDraft | null {
  if (player.status.condition <= 55) {
    return {
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "training",
      priority: "urgent",
      title: "훈련 상태 보고",
      body: `${player.name}의 컨디션이 ${player.status.condition}까지 내려갔습니다. 훈련 강도와 선발 기용을 점검하세요.`,
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "club",
      relatedPlayerId: player.id,
    };
  }

  if (player.status.fatigue >= 85) {
    return {
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "training",
      priority: "important",
      title: "훈련 상태 보고",
      body: `${player.name}의 피로도가 ${player.status.fatigue}까지 상승했습니다. 가벼운 훈련이나 휴식을 고려할 수 있습니다.`,
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "club",
      relatedPlayerId: player.id,
    };
  }

  if (
    previousPlayer &&
    previousPlayer.status.form - player.status.form >= 8 &&
    player.status.form <= 62
  ) {
    return {
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "training",
      priority: "important",
      title: "훈련 상태 보고",
      body: `${player.name}의 최근 폼이 하락했습니다. 다음 경기 전 역할과 훈련 방향을 확인하세요.`,
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "club",
      relatedPlayerId: player.id,
    };
  }

  return null;
}

function createTrainingMessages({
  nextCareer,
  previousCareer,
}: {
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}): MessageDraft[] {
  return Object.values(nextCareer.userTeam.roster)
    .filter((playerId): playerId is string => Boolean(playerId))
    .map((playerId) => {
      const player = getPlayerById(nextCareer, playerId);

      if (!player) {
        return null;
      }

      return getStatusWarningDraft({
        nextCareer,
        player,
        previousPlayer: getPlayerById(previousCareer, playerId),
      });
    })
    .filter((draft): draft is MessageDraft => Boolean(draft))
    .slice(0, 2);
}

export function createProgressMessages({
  lastMatch,
  nextCareer,
  previousCareer,
}: {
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
  const trainingMessages = lastMatch
    ? createTrainingMessages({ nextCareer, previousCareer })
    : [];

  return [...matchMessages, ...scheduleMessages, ...trainingMessages];
}

export function appendProgressMessages(
  previousCareer: CareerSave,
  nextCareer: CareerSave,
  lastMatch: CareerProgressResult["lastMatch"],
) {
  return appendCareerMessages(
    nextCareer,
    createProgressMessages({
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
    log.type === "signing" ||
    log.type === "ai-signing" ||
    log.type === "renewal" ||
    log.type === "release" ||
    log.type === "rejection" ||
    log.type === "blocked";

  return {
    dateKey: career.seasonState.currentDateKey,
    dateLabel: career.seasonState.currentDateLabel,
    category: "transfer",
    priority: isImportantOffseasonNews ? "important" : "normal",
    title: "FA 협상 결과",
    body: `${log.week}주차 ${log.day}일 기록입니다. ${log.message}`,
    createdTurn: career.seasonState.currentTurn,
    source: "offseason",
  };
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

  return nextLogs
    .filter(
      (log) =>
        !previousLogIds.has(log.id) &&
        (log.isUserTeamRelated ||
          log.type === "signing" ||
          log.type === "ai-signing" ||
          log.type === "renewal" ||
          log.type === "release" ||
          log.type === "rejection" ||
          log.type === "blocked"),
    )
    .map((log) => createTransferMessageFromLog({ career: nextCareer, log }));
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
        ? "2026 실제 LCK 로스터를 기준으로 커리어를 시작했습니다. LCK Cup부터 바로 시즌을 진행할 수 있습니다."
        : "1주차에는 기존 선수단의 재계약 또는 방출을 결정합니다. 2주차부터 FA 시장이 열립니다.",
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
