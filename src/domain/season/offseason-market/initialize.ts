import type { CareerSave } from "../../../types/game";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "../seasonScheduleDates";
import { createAiRenewalPlans } from "./aiRenewals";
import {
  applyOffseasonDepartures,
  appendDepartureLogs,
  getInitialFreeAgentIds,
  mergeOffseasonFreeAgents,
  normalizeUserContractedPlayers,
} from "./playerPool";
import { appendLog } from "./shared";

export function initializeOffseasonMarket(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status === "career-completed"
  ) {
    return career;
  }

  if (offseason.status === "active") {
    return career;
  }

  const startedDateKey = addDaysToDateKey(offseason.startedDateKey, 1);
  const normalizedPlayers = normalizeUserContractedPlayers(
    career,
    mergeOffseasonFreeAgents(career.lckPlayers),
  );
  const departures = applyOffseasonDepartures(career, normalizedPlayers);
  const departedIdSet = new Set([
    ...departures.retiredPlayerIds,
    ...departures.militaryServicePlayerIds,
  ]);
  const expiredContractPlayerIds = offseason.expiredContractPlayerIds.filter(
    (playerId) => !departedIdSet.has(playerId),
  );
  const freeAgentPlayerIds = getInitialFreeAgentIds(
    departures.lckPlayers,
    offseason.freeAgentPlayerIds ?? [],
  ).filter((playerId) => {
    const player = departures.lckPlayers.find(
      (candidate) => candidate.id === playerId,
    );

    return Boolean(player?.availableForRoster) && !departedIdSet.has(playerId);
  });
  const resolvedExpiredPlayerIds =
    expiredContractPlayerIds.length === 0
      ? []
      : offseason.resolvedExpiredPlayerIds ?? [];
  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: departures.lckPlayers,
    userTeam: departures.userTeam,
    seasonState: {
      ...career.seasonState,
      currentDateKey: startedDateKey,
      currentDateLabel: formatSeasonDateLabel(startedDateKey),
      progressStatus: "idle" as const,
      nextMatchIds: [],
      lastMatchRecordIds: [],
      offseason: {
        ...offseason,
        context: offseason.context ?? "postseason",
        status: "active",
        expiredContractPlayerIds,
        currentDay: 1,
        currentWeek: 1,
        totalDays: 28,
        totalWeeks: 4,
        marketStatus: "renewal-week",
        freeAgentPlayerIds,
        pendingOffers: [],
        resolvedOffers: [],
        releasedPlayerIds: offseason.releasedPlayerIds ?? [],
        signedPlayerIds: offseason.signedPlayerIds ?? [],
        retiredPlayerIds: [
          ...(offseason.retiredPlayerIds ?? []),
          ...departures.retiredPlayerIds,
        ],
        militaryServicePlayerIds: [
          ...(offseason.militaryServicePlayerIds ?? []),
          ...departures.militaryServicePlayerIds,
        ],
        aiRenewalPlans: createAiRenewalPlans(
          departures.lckPlayers,
          career.userTeam.name,
        ),
        resolvedExpiredPlayerIds,
        logEntries: [],
        validationErrors: [],
        bridgeNote:
          "Advanced stove league market initialized for daily offseason progress.",
      },
    },
  };

  return appendLog(
    appendDepartureLogs(nextCareer, departures),
    "system",
    "스토브리그가 시작됐습니다. 1주차에는 계약 만료 선수의 재계약 또는 방출을 결정해야 합니다.",
  );
}
