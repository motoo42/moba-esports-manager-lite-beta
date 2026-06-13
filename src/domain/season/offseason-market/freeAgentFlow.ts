import type { CareerSave, OffseasonOffer } from "../../../types/game";
import { getOffseasonNegotiationSnapshot } from "./negotiation";
import { createContract, createOffer } from "./offerFactory";
import {
  getConfirmationPendingOffer,
  getPlayer,
  isFreeAgentMarketPlayer,
  setPlayerCurrentTeam,
} from "./playerPool";
import {
  applyRequestedRosterRole,
  getRequestedRosterRoleLabel,
  replaceContract,
} from "./rosterPlacement";
import {
  addUnique,
  appendLog,
  getCurrentOffseasonDay,
  removeValue,
  setOffseasonState,
} from "./shared";
import type { OffseasonContractOfferInput } from "./types";
import {
  getBudgetLimitError,
  getRoleLimitError,
  setOffseasonValidationErrors,
} from "./validation";

export function confirmFreeAgentSigning(
  career: CareerSave,
  offerId: string,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const offer = getConfirmationPendingOffer(career, offerId);
  const playerId = offer?.playerIds[0];
  const player = playerId ? getPlayer(career, playerId) : undefined;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    !offer ||
    !player ||
    !player.availableForRoster ||
    player.currentTeam ||
    !(offseason.freeAgentPlayerIds ?? []).includes(player.id)
  ) {
    return career;
  }

  const errors = [
    getBudgetLimitError(career, offer.salaryOffer),
    getRoleLimitError(career, player),
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    return appendLog(
      setOffseasonValidationErrors(career, errors),
      "blocked",
      `${player.name} 영입 확정에 실패했습니다. ${errors[0]}`,
      { isUserTeamRelated: true },
    );
  }

  const contractType = offer.contractType ?? "one-year";
  const nextContract = createContract({
    playerId: player.id,
    contractType,
    salaryOffer: offer.salaryOffer,
  });
  const updatedOffer: OffseasonOffer = {
    ...offer,
    status: "accepted",
    resolvedDay: getCurrentOffseasonDay(career),
  };
  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: setPlayerCurrentTeam(
      career.lckPlayers,
      player.id,
      career.userTeam.name,
    ),
    userTeam: applyRequestedRosterRole({
      player,
      requestedRosterRole: offer.requestedRosterRole,
      team: replaceContract(career.userTeam, nextContract),
    }),
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        resolvedOffers: (offseason.resolvedOffers ?? []).map((candidate) =>
          candidate.id === offer.id ? updatedOffer : candidate,
        ),
        freeAgentPlayerIds: removeValue(
          offseason.freeAgentPlayerIds ?? [],
          player.id,
        ),
        signedPlayerIds: addUnique(offseason.signedPlayerIds ?? [], player.id),
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "signing",
    `${player.name} 영입을 확정했습니다. 역할: ${getRequestedRosterRoleLabel(
      offer.requestedRosterRole,
    )}.`,
    { isUserTeamRelated: true },
  );
}

export function cancelFreeAgentSigning(
  career: CareerSave,
  offerId: string,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const offer = getConfirmationPendingOffer(career, offerId);
  const playerId = offer?.playerIds[0];
  const player = playerId ? getPlayer(career, playerId) : undefined;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    !offer
  ) {
    return career;
  }

  const updatedOffer: OffseasonOffer = {
    ...offer,
    status: "withdrawn",
    resolvedDay: getCurrentOffseasonDay(career),
    rejectionReason: "user-cancelled-confirmation",
  };
  const nextCareer = setOffseasonState(career, {
    ...offseason,
    resolvedOffers: (offseason.resolvedOffers ?? []).map((candidate) =>
      candidate.id === offer.id ? updatedOffer : candidate,
    ),
    validationErrors: [],
  });

  return appendLog(
    nextCareer,
    "signing",
    `${player?.name ?? playerId ?? "선수"} 영입을 취소했습니다. 해당 선수는 FA 시장에 남습니다.`,
    { isUserTeamRelated: true },
  );
}

export function submitFreeAgentOffer(
  career: CareerSave,
  offerInput: OffseasonContractOfferInput,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const player = getPlayer(career, offerInput.playerId);
  const currentDay = getCurrentOffseasonDay(career);

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    currentDay < 8 ||
    currentDay >= 28 ||
    !player ||
    !isFreeAgentMarketPlayer(career, player)
  ) {
    return career;
  }

  const hasPendingOffer = (offseason.pendingOffers ?? []).some(
    (offer) =>
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent" &&
      offer.playerIds.includes(player.id),
  );
  const hasConfirmationPendingOffer = (offseason.resolvedOffers ?? []).some(
    (offer) =>
      offer.status === "confirmation-pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent" &&
      offer.playerIds.includes(player.id),
  );

  if (hasPendingOffer || hasConfirmationPendingOffer) {
    return career;
  }

  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context: "free-agent",
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
    negotiationContext: "free-agent",
    playerId: player.id,
    requestedRosterRole: offerInput.requestedRosterRole,
    salaryOffer: offerInput.salaryOffer,
    status: "pending",
    visibleDemand: snapshot.visibleDemand,
  });
  const nextCareer: CareerSave = {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        pendingOffers: [...(offseason.pendingOffers ?? []), pendingOffer],
        validationErrors: [],
      },
    },
  };
  const resolutionMessage =
    offerInput.requestedRosterRole === "academy"
      ? "다음날 선수 측 수락 여부만 확인합니다."
      : "다음날 다른 구단 제안과 함께 결과가 확정됩니다.";

  return appendLog(
    nextCareer,
    "signing",
    `${player.name}에게 ${Math.round(offerInput.salaryOffer)} 규모의 FA 계약을 제안했습니다. 제안 역할: ${getRequestedRosterRoleLabel(
      offerInput.requestedRosterRole,
    )}. ${resolutionMessage}`,
    { isUserTeamRelated: true },
  );
}
