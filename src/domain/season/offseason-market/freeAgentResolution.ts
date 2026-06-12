import type { CareerSave, OffseasonOffer } from "../../../types/game";
import { createAiOffer, getAiCandidateTeams } from "./aiMarket";
import { evaluateOffer } from "./offerEvaluation";
import {
  getPlayer,
  isFreeAgentMarketPlayer,
  setPlayerCurrentTeam,
} from "./playerPool";
import { getRequestedRosterRoleLabel } from "./rosterPlacement";
import {
  appendLog,
  getCurrentOffseasonDay,
  removeValue,
  setOffseasonState,
} from "./shared";

export function getPendingFreeAgentOffersToResolve(career: CareerSave) {
  const currentDay = getCurrentOffseasonDay(career);

  return (career.seasonState.offseason?.pendingOffers ?? []).filter(
    (offer) =>
      offer.kind === "contract" &&
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent" &&
      offer.createdDay <= currentDay,
  );
}

export function resolveFreeAgentOffers(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;
  const offersToResolve = getPendingFreeAgentOffersToResolve(career);

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
      !isFreeAgentMarketPlayer(currentCareer, player)
    ) {
      return currentCareer;
    }

    const evaluatedUserOffer = evaluateOffer({
      career: currentCareer,
      context: "free-agent",
      offer: userOffer,
      player,
    });
    const remainingPendingOffers = (currentOffseason.pendingOffers ?? []).filter(
      (offer) => offer.id !== userOffer.id,
    );

    if (userOffer.requestedRosterRole === "academy") {
      const resolvedUserOffer: OffseasonOffer = {
        ...userOffer,
        status: evaluatedUserOffer.isAcceptable
          ? "confirmation-pending"
          : "rejected",
        resolvedDay: getCurrentOffseasonDay(currentCareer),
        score: evaluatedUserOffer.score,
        minAcceptableSalary: evaluatedUserOffer.minAcceptableSalary,
        moodScore: evaluatedUserOffer.moodScore,
        rejectionReason: evaluatedUserOffer.isAcceptable
          ? undefined
          : "minimum-salary-not-met",
        visibleDemand: evaluatedUserOffer.visibleDemand,
      };
      const nextCareer = setOffseasonState(currentCareer, {
        ...currentOffseason,
        pendingOffers: remainingPendingOffers,
        resolvedOffers: [
          ...(currentOffseason.resolvedOffers ?? []),
          resolvedUserOffer,
        ],
        validationErrors: [],
      });

      if (!evaluatedUserOffer.isAcceptable) {
        return appendLog(
          nextCareer,
          "rejection",
          `${player.name}이 2군 FA 제안을 거절했습니다. 협상 분위기 ${evaluatedUserOffer.moodScore}%입니다.`,
          { isUserTeamRelated: true },
        );
      }

      return appendLog(
        nextCareer,
        "signing",
        `${player.name}이 2군 역할 FA 제안을 수락했습니다. 최종 영입 확정을 기다립니다.`,
        { isUserTeamRelated: true },
      );
    }

    const aiOffers = getAiCandidateTeams(currentCareer, player).map(({ team }) =>
      createAiOffer({
        career: currentCareer,
        player,
        teamName: team.name,
      }),
    );
    const evaluatedAiOffers = aiOffers.map((offer) =>
      evaluateOffer({
        career: currentCareer,
        context: "free-agent",
        offer,
        player,
      }),
    );
    const acceptableOffers = [
      evaluatedUserOffer,
      ...evaluatedAiOffers,
    ].filter((offer) => offer.isAcceptable);
    const winningOffer = acceptableOffers.sort(
      (left, right) => (right.score ?? 0) - (left.score ?? 0),
    )[0];
    const userWins = winningOffer?.id === userOffer.id;
    const resolvedUserOffer: OffseasonOffer = {
      ...userOffer,
      status: !winningOffer
        ? "rejected"
        : userWins
          ? "confirmation-pending"
          : evaluatedUserOffer.isAcceptable
            ? "lost"
            : "rejected",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
      score: evaluatedUserOffer.score,
      minAcceptableSalary: evaluatedUserOffer.minAcceptableSalary,
      moodScore: evaluatedUserOffer.moodScore,
      rejectionReason:
        winningOffer && evaluatedUserOffer.isAcceptable
          ? undefined
          : "minimum-salary-not-met",
      visibleDemand: evaluatedUserOffer.visibleDemand,
    };
    const rejectedAiOffers: OffseasonOffer[] = evaluatedAiOffers
      .filter((offer) => offer.id !== winningOffer?.id)
      .map((offer) => ({
        ...offer,
        status: "rejected",
        resolvedDay: getCurrentOffseasonDay(currentCareer),
        rejectionReason: "minimum-salary-not-met",
      }));

    if (!winningOffer) {
      const nextCareer = setOffseasonState(currentCareer, {
        ...currentOffseason,
        pendingOffers: remainingPendingOffers,
        resolvedOffers: [
          ...(currentOffseason.resolvedOffers ?? []),
          resolvedUserOffer,
          ...rejectedAiOffers,
        ],
        validationErrors: [],
      });

      return appendLog(
        nextCareer,
        "rejection",
        `${player.name}이 모든 제안을 거절했습니다. 협상 분위기 ${evaluatedUserOffer.moodScore}%입니다.`,
        { isUserTeamRelated: true },
      );
    }

    if (userWins) {
      const nextCareer: CareerSave = {
        ...currentCareer,
        seasonState: {
          ...currentCareer.seasonState,
          offseason: {
            ...currentOffseason,
            pendingOffers: remainingPendingOffers,
            resolvedOffers: [
              ...(currentOffseason.resolvedOffers ?? []),
              resolvedUserOffer,
              ...rejectedAiOffers,
            ],
            validationErrors: [],
          },
        },
      };

      return appendLog(
        nextCareer,
        "signing",
        `${player.name} 영입 경쟁에서 승리했습니다. 제안 연봉 ${Math.round(
          userOffer.salaryOffer,
        )}, 역할 ${getRequestedRosterRoleLabel(
          userOffer.requestedRosterRole,
        )}. 최종 영입 확정을 기다립니다.`,
        { isUserTeamRelated: true },
      );
    }

    const acceptedAiOffer: OffseasonOffer = {
      ...winningOffer,
      id: `${winningOffer.id}-ai-win`,
      status: "accepted",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
    };
    const aiTeamName = acceptedAiOffer.fromTeamName;
    const nextCareer: CareerSave = {
      ...currentCareer,
      lckPlayers: setPlayerCurrentTeam(
        currentCareer.lckPlayers,
        playerId,
        aiTeamName,
      ),
      seasonState: {
        ...currentCareer.seasonState,
        offseason: {
          ...currentOffseason,
          pendingOffers: remainingPendingOffers,
          resolvedOffers: [
            ...(currentOffseason.resolvedOffers ?? []),
            resolvedUserOffer,
            acceptedAiOffer,
            ...rejectedAiOffers,
          ],
          freeAgentPlayerIds: removeValue(
            currentOffseason.freeAgentPlayerIds ?? [],
            playerId,
          ),
          validationErrors: [],
        },
      },
    };

    return appendLog(
      nextCareer,
      "ai-signing",
      `${player.name} 영입 경쟁에서 ${aiTeamName}이 승리했습니다.`,
      { isUserTeamRelated: true },
    );
  }, career);
}
