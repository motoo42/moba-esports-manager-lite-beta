import type {
  CareerSave,
  OffseasonLogEntry,
  OffseasonLogType,
  Player,
} from "../../types/game";
import type { MessageDraft } from "./messageDraft";

type NotableOffseasonMove = {
  label: string;
  player: Player;
  score: number;
};

const weeklySummaryLogTypes = new Set<OffseasonLogType>([
  "ai-signing",
  "signing",
  "renewal",
  "release",
]);

function getPlayerMarketScore(player: Player) {
  return (
    player.overall * 2.4 +
    player.potential * 0.7 +
    player.salaryExpectation * 0.9 +
    player.marketProfile.marketability * 0.55 +
    player.marketProfile.fanbase * 0.45
  );
}

function isNotablePlayer(player: Player) {
  return (
    player.overall >= 78 ||
    player.salaryExpectation >= 90 ||
    player.marketProfile.marketability >= 75 ||
    player.marketProfile.fanbase >= 75
  );
}

function findMentionedPlayer(career: CareerSave, log: OffseasonLogEntry) {
  return career.lckPlayers
    .filter((player) => log.message.includes(player.name))
    .sort((left, right) => right.name.length - left.name.length)[0];
}

function getRelatedTeamName(log: OffseasonLogEntry, player: Player) {
  if (log.relatedTeamNames?.[0]) {
    return log.relatedTeamNames[0];
  }

  if (player.currentTeam && log.message.includes(player.currentTeam)) {
    return player.currentTeam;
  }

  return undefined;
}

function getSigningTeamName(log: OffseasonLogEntry, player: Player) {
  const patterns = [
    `${player.name} FA 영입 경쟁에서 `,
    `${player.name} 영입 경쟁에서 `,
  ];
  const matchedPrefix = patterns.find((pattern) => log.message.includes(pattern));

  if (!matchedPrefix) {
    return getRelatedTeamName(log, player);
  }

  const suffix = log.message.slice(
    log.message.indexOf(matchedPrefix) + matchedPrefix.length,
  );
  const teamName = suffix.split("이 승리")[0].split("가 승리")[0].trim();

  return teamName || getRelatedTeamName(log, player);
}

function getMoveLabel(log: OffseasonLogEntry, player: Player) {
  if (log.type === "ai-signing" || log.type === "signing") {
    const teamName = getSigningTeamName(log, player);

    return teamName ? `${player.name} -> ${teamName}` : `${player.name} FA 영입`;
  }

  const teamName = getRelatedTeamName(log, player);

  if (log.type === "renewal") {
    return teamName
      ? `${player.name} 재계약(${teamName})`
      : `${player.name} 재계약`;
  }

  if (log.type === "release") {
    return teamName
      ? `${player.name} FA 등록(${teamName} 방출)`
      : `${player.name} FA 등록`;
  }

  return player.name;
}

function getNotableMovesForWeek({
  career,
  week,
}: {
  career: CareerSave;
  week: number;
}) {
  const logs = career.seasonState.offseason?.logEntries ?? [];
  const seenPlayerIds = new Set<string>();

  return logs
    .filter(
      (log) =>
        log.week === week &&
        !log.isUserTeamRelated &&
        weeklySummaryLogTypes.has(log.type),
    )
    .map((log) => {
      const player = findMentionedPlayer(career, log);

      if (!player || seenPlayerIds.has(player.id) || !isNotablePlayer(player)) {
        return null;
      }

      seenPlayerIds.add(player.id);

      return {
        label: getMoveLabel(log, player),
        player,
        score: getPlayerMarketScore(player),
      };
    })
    .filter((move): move is NotableOffseasonMove => Boolean(move))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

function createWeeklySummaryBody(week: number, moves: NotableOffseasonMove[]) {
  const marketTone =
    moves.length >= 3
      ? "시장 상위권 선수들의 이동이 이어지며 다음 주 협상 경쟁도 더 치열해질 수 있습니다."
      : "큰 폭의 연쇄 이동은 아니지만, 주요 선수의 행선지가 정해지며 시장 구도가 조금씩 정리되고 있습니다.";

  return [
    `${week}주차 스토브리그 주요 이동`,
    ...moves.map((move) => `- ${move.label}`),
    `시장 흐름: ${marketTone}`,
    "권장 행동: 같은 포지션의 FA 후보와 우리 팀 예산 상황을 다시 비교하세요.",
  ].join("\n");
}

export function createOffseasonWeeklySummaryMessages({
  nextCareer,
  previousCareer,
}: {
  nextCareer: CareerSave;
  previousCareer: CareerSave;
}): MessageDraft[] {
  const previousWeek = previousCareer.seasonState.offseason?.currentWeek;
  const nextWeek = nextCareer.seasonState.offseason?.currentWeek;

  if (!previousWeek || !nextWeek || nextWeek <= previousWeek) {
    return [];
  }

  const notableMoves = getNotableMovesForWeek({
    career: nextCareer,
    week: previousWeek,
  });

  if (notableMoves.length === 0) {
    return [];
  }

  return [
    {
      id: `offseason-weekly-summary-${nextCareer.currentSeason}-${previousWeek}`,
      dateKey: nextCareer.seasonState.currentDateKey,
      dateLabel: nextCareer.seasonState.currentDateLabel,
      category: "transfer",
      priority: "normal",
      title: "스토브리그 주간 요약",
      body: createWeeklySummaryBody(previousWeek, notableMoves),
      createdTurn: nextCareer.seasonState.currentTurn,
      source: "offseason",
    },
  ];
}
