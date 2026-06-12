import type { CareerSave, OffseasonOffer } from "../../../types/game";
import { getOffseasonNegotiationSnapshot } from "./negotiation";
import { evaluateOffer } from "./offerEvaluation";
import { createContract, createOffer } from "./offerFactory";
import { getPlayer, setPlayerCurrentTeam } from "./playerPool";
import {
  applyRequestedRosterRole,
  getRequestedRosterRoleLabel,
  removePlayerFromUserTeam,
  replaceContract,
} from "./rosterPlacement";
import {
  addUnique,
  appendLog,
  getCurrentOffseasonDay,
  setOffseasonState,
} from "./shared";
import type { OffseasonContractOfferInput } from "./types";

export function submitOffseasonRenewalOffer(
  career: CareerSave,
  offerInput: OffseasonContractOfferInput,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const player = getPlayer(career, offerInput.playerId);

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    (offseason.currentWeek ?? 1) !== 1 ||
    !player ||
    !player.availableForRoster ||
    !offseason.expiredContractPlayerIds.includes(offerInput.playerId)
  ) {
    return career;
  }

  const hasPendingOffer = (offseason.pendingOffers ?? []).some(
    (offer) =>
      offer.status === "pending" &&
      offer.negotiationContext === "renewal" &&
      offer.fromTeamName === career.userTeam.name &&
      offer.playerIds.includes(player.id),
  );

  if (hasPendingOffer) {
    return career;
  }

  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context: "renewal",
    contractType: offerInput.contractType,
    player,
    requestedRosterRole: offerInput.requestedRosterRole,
    salaryOffer: offerInput.salaryOffer,
  });
  const pendingOffer = createOffer({
    career,
    contractType: offerInput.contractType,
    fromTeamName: career.userTeam.name,
    minAcceptableSalary: snapshot.minAcceptableSalary,
    moodScore: snapshot.moodScore,
    negotiationContext: "renewal",
    playerId: offerInput.playerId,
    requestedRosterRole: offerInput.requestedRosterRole,
    salaryOffer: offerInput.salaryOffer,
    status: "pending",
    toTeamName: career.userTeam.name,
    visibleDemand: snapshot.visibleDemand,
  });
  const nextCareer: CareerSave = {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        marketStatus: "renewal-week",
        pendingOffers: [...(offseason.pendingOffers ?? []), pendingOffer],
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "renewal",
    `${player.name}에게 ${Math.round(offerInput.salaryOffer)} 규모의 ${getRequestedRosterRoleLabel(
      offerInput.requestedRosterRole,
    )} 재계약을 제안했습니다. 다음날 수락 여부를 확인합니다.`,
    { isUserTeamRelated: true },
  );
}

export function releaseExpiredOffseasonPlayer(
  career: CareerSave,
  playerId: string,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const player = getPlayer(career, playerId);

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    (offseason.currentWeek ?? 1) !== 1 ||
    !player ||
    !offseason.expiredContractPlayerIds.includes(playerId)
  ) {
    return career;
  }

  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: setPlayerCurrentTeam(career.lckPlayers, playerId, undefined),
    userTeam: removePlayerFromUserTeam(career.userTeam, playerId),
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        marketStatus: "renewal-week",
        pendingOffers: (offseason.pendingOffers ?? []).filter(
          (offer) => !offer.playerIds.includes(playerId),
        ),
        releasedPlayerIds: addUnique(offseason.releasedPlayerIds ?? [], playerId),
        resolvedExpiredPlayerIds: addUnique(
          offseason.resolvedExpiredPlayerIds ?? [],
          playerId,
        ),
        freeAgentPlayerIds: addUnique(
          offseason.freeAgentPlayerIds ?? [],
          playerId,
        ),
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "release",
    `${player.name}을 방출했습니다. 해당 선수는 FA 시장에 등록됐습니다.`,
    { isUserTeamRelated: true },
  );
}

export function getPendingRenewalOffersToResolve(career: CareerSave) {
  const currentDay = getCurrentOffseasonDay(career);

  return (career.seasonState.offseason?.pendingOffers ?? []).filter(
    (offer) =>
      offer.kind === "contract" &&
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      offer.negotiationContext === "renewal" &&
      (offer.createdDay <= currentDay || currentDay >= 7),
  );
}

export function resolveRenewalOffers(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;
  const offersToResolve = getPendingRenewalOffersToResolve(career);

  if (!offseason || offersToResolve.length === 0) {
    return career;
  }

  return offersToResolve.reduce((currentCareer, userOffer) => {
    const currentOffseason = currentCareer.seasonState.offseason;
    const playerId = userOffer.playerIds[0];
    const player = getPlayer(currentCareer, playerId);

    if (
      !currentOffseason ||
      !player ||
      !currentOffseason.expiredContractPlayerIds.includes(playerId)
    ) {
      return currentCareer;
    }

    const evaluated = evaluateOffer({
      career: currentCareer,
      context: "renewal",
      offer: userOffer,
      player,
    });
    const remainingPendingOffers = (currentOffseason.pendingOffers ?? []).filter(
      (offer) => offer.id !== userOffer.id,
    );
    const resolvedUserOffer: OffseasonOffer = {
      ...userOffer,
      status: evaluated.isAcceptable ? "accepted" : "rejected",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
      score: evaluated.score,
      minAcceptableSalary: evaluated.minAcceptableSalary,
      moodScore: evaluated.moodScore,
      rejectionReason: evaluated.isAcceptable
        ? undefined
        : "minimum-salary-not-met",
      visibleDemand: evaluated.visibleDemand,
    };

    if (!evaluated.isAcceptable) {
      const nextCareer = setOffseasonState(currentCareer, {
        ...currentOffseason,
        pendingOffers: remainingPendingOffers,
        resolvedOffers: [
          ...(currentOffseason.resolvedOffers ?? []),
          resolvedUserOffer,
        ],
        validationErrors: [],
      });

      return appendLog(
        nextCareer,
        "rejection",
        `${player.name}이 재계약 제안을 거절했습니다. 협상 분위기 ${evaluated.moodScore}%입니다.`,
        { isUserTeamRelated: true },
      );
    }

    const contractType = userOffer.contractType ?? "one-year";
    const nextContract = createContract({
      playerId,
      contractType,
      salaryOffer: userOffer.salaryOffer,
    });
    const nextCareer: CareerSave = {
      ...currentCareer,
      lckPlayers: setPlayerCurrentTeam(
        currentCareer.lckPlayers,
        player.id,
        currentCareer.userTeam.name,
      ),
      userTeam: applyRequestedRosterRole({
        player,
        requestedRosterRole: userOffer.requestedRosterRole,
        team: replaceContract(currentCareer.userTeam, nextContract),
      }),
      seasonState: {
        ...currentCareer.seasonState,
        offseason: {
          ...currentOffseason,
          pendingOffers: remainingPendingOffers,
          resolvedOffers: [
            ...(currentOffseason.resolvedOffers ?? []),
            resolvedUserOffer,
          ],
          renewedPlayerIds: addUnique(
            currentOffseason.renewedPlayerIds,
            player.id,
          ),
          resolvedExpiredPlayerIds: addUnique(
            currentOffseason.resolvedExpiredPlayerIds ?? [],
            player.id,
          ),
          validationErrors: [],
        },
      },
    };

    return appendLog(
      nextCareer,
      "renewal",
      `${player.name}과 ${Math.round(userOffer.salaryOffer)} 규모의 ${contractType} 재계약에 합의했습니다. 역할: ${getRequestedRosterRoleLabel(
        userOffer.requestedRosterRole,
      )}.`,
      { isUserTeamRelated: true },
    );
  }, career);
}
