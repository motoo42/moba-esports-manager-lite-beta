import type { CareerSave } from "../../../types/game";
import { completeStoveLeague } from "../createInitialSeasonState";
import { autoAssignOffseasonRosters } from "../offseasonRosterAutomation";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "../seasonScheduleDates";
import { startNextSeasonFromOffseason } from "../seasonEnd";
import { resolveAiDepthSignings } from "./aiMarket";
import { processAiRenewalsForCurrentDay } from "./aiRenewals";
import {
  getPendingFreeAgentOffersToResolve,
  resolveFreeAgentOffers,
} from "./freeAgentResolution";
import { getPlayer, getUnresolvedExpiredPlayerIds } from "./playerPool";
import {
  getPendingRenewalOffersToResolve,
  resolveRenewalOffers,
} from "./renewalFlow";
import {
  appendLog,
  getCurrentOffseasonWeek,
  getMarketStatusForDay,
} from "./shared";
import { validateOffseasonRoster } from "./validation";

function getPendingOfferPlayerIdsToResolve(career: CareerSave) {
  return new Set(
    [
      ...getPendingRenewalOffersToResolve(career),
      ...getPendingFreeAgentOffersToResolve(career),
    ].flatMap((offer) => offer.playerIds),
  );
}

function setBlocked(career: CareerSave, errors: string[]) {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  return appendLog(
    {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...offseason,
          marketStatus: "blocked",
          validationErrors: errors,
        },
      },
    },
    "blocked",
    errors[0] ?? "스토브리그 진행 조건을 충족하지 못했습니다.",
  );
}

function advanceOffseasonDate(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  const nextDay = (offseason.currentDay ?? 1) + 1;
  const nextWeek = getCurrentOffseasonWeek(nextDay);
  const nextDateKey = addDaysToDateKey(career.seasonState.currentDateKey, 1);
  const nextMarketStatus = getMarketStatusForDay(nextDay);

  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      currentDateKey: nextDateKey,
      currentDateLabel: formatSeasonDateLabel(nextDateKey),
      currentTurn: career.seasonState.currentTurn + 1,
      progressStatus: "idle" as const,
      nextMatchIds: [],
      lastMatchRecordIds: [],
      offseason: {
        ...offseason,
        currentDay: nextDay,
        currentWeek: nextWeek,
        marketStatus: nextMarketStatus,
        validationErrors: [],
      },
    },
  };
}

export function progressOffseasonDay(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active"
  ) {
    return career;
  }

  const currentDay = offseason.currentDay ?? 1;
  const negotiatedPlayerIds = getPendingOfferPlayerIdsToResolve(career);
  const careerWithResolvedOffers = resolveAiDepthSignings(
    resolveFreeAgentOffers(
      processAiRenewalsForCurrentDay(resolveRenewalOffers(career)),
    ),
    negotiatedPlayerIds,
  );
  const unresolvedExpiredPlayerIds = getUnresolvedExpiredPlayerIds(
    careerWithResolvedOffers,
  );

  if (currentDay >= 7 && unresolvedExpiredPlayerIds.length > 0) {
    const unresolvedNames = unresolvedExpiredPlayerIds
      .map((playerId) => getPlayer(careerWithResolvedOffers, playerId)?.name ?? playerId)
      .join(", ");

    return setBlocked(careerWithResolvedOffers, [
      `1주차 종료 전 ${unresolvedNames}의 재계약 또는 방출을 결정해야 합니다.`,
    ]);
  }

  if (currentDay >= 28) {
    const confirmationPendingErrors = validateOffseasonRoster(
      careerWithResolvedOffers,
      { academyPolicy: "auto-fill" },
    ).errors.filter((error) => error.includes("영입 확정 대기"));

    if (confirmationPendingErrors.length > 0) {
      return setBlocked(careerWithResolvedOffers, confirmationPendingErrors);
    }

    const careerWithAutoAssignedRosters =
      autoAssignOffseasonRosters(careerWithResolvedOffers);
    const validation = validateOffseasonRoster(careerWithAutoAssignedRosters, {
      academyPolicy: "auto-fill",
    });

    if (!validation.isValid) {
      return setBlocked(careerWithAutoAssignedRosters, validation.errors);
    }

    const readyCareer: CareerSave = {
      ...careerWithAutoAssignedRosters,
      seasonState: {
        ...careerWithAutoAssignedRosters.seasonState,
        offseason: {
          ...careerWithAutoAssignedRosters.seasonState.offseason!,
          status: "ready-for-next-season",
          marketStatus: "completed",
          validationErrors: [],
        },
      },
    };
    const readyCareerWithLog = appendLog(
      readyCareer,
      "system",
      offseason.context === "preseason"
        ? "프리시즌 최종 등록을 마치고 2026 LCK Cup에 진입합니다."
        : "스토브리그 최종 등록을 마치고 다음 시즌으로 이동합니다.",
    );

    if (offseason.context === "preseason") {
      const nextSeasonState = completeStoveLeague(
        readyCareerWithLog.seasonState,
      );

      return {
        ...readyCareerWithLog,
        seasonState: {
          ...nextSeasonState,
          offseason: undefined,
        },
      };
    }

    return startNextSeasonFromOffseason(readyCareerWithLog);
  }

  return advanceOffseasonDate(careerWithResolvedOffers);
}
