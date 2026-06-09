import {
  cancelFreeAgentSigning,
  confirmFreeAgentSigning,
  initializeOffseasonMarket,
  releaseExpiredOffseasonPlayer,
  renewExpiredContractsForOffseason,
  submitFreeAgentOffer,
  submitOffseasonRenewalOffer,
  startNextSeasonFromOffseason,
} from "../../domain/season";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";
import { getRouteForCareer } from "./routeSelectors";

type OffseasonAction = Extract<
  GameAction,
  {
    type:
      | "renew-expired-contracts"
      | "start-offseason-market"
      | "submit-offseason-renewal-offer"
      | "release-expired-offseason-player"
      | "submit-free-agent-offer"
      | "confirm-free-agent-signing"
      | "cancel-free-agent-signing"
      | "start-next-season";
  }
>;

export function handleOffseasonAction(
  state: GameState,
  action: OffseasonAction,
): GameState {
  if (!state.career) {
    return state;
  }

  if (action.type === "renew-expired-contracts") {
    return {
      ...state,
      route: "season-summary",
      career: renewExpiredContractsForOffseason({
        career: state.career,
        contractTypes: action.contractTypes,
      }),
    };
  }

  if (action.type === "start-offseason-market") {
    const nextCareer = initializeOffseasonMarket(state.career);

    return {
      ...state,
      route: getRouteForCareer(nextCareer),
      career: nextCareer,
      lastMatch: null,
      selectedCompetitionId: nextCareer.seasonState.currentCompetitionId,
    };
  }

  if (action.type === "submit-offseason-renewal-offer") {
    return {
      ...state,
      route: "offseason",
      career: submitOffseasonRenewalOffer(state.career, action.offer),
    };
  }

  if (action.type === "release-expired-offseason-player") {
    return {
      ...state,
      route: "offseason",
      career: releaseExpiredOffseasonPlayer(state.career, action.playerId),
    };
  }

  if (action.type === "submit-free-agent-offer") {
    return {
      ...state,
      route: "offseason",
      career: submitFreeAgentOffer(state.career, action.offer),
    };
  }

  if (action.type === "confirm-free-agent-signing") {
    return {
      ...state,
      route: "offseason",
      career: confirmFreeAgentSigning(state.career, action.offerId),
    };
  }

  if (action.type === "cancel-free-agent-signing") {
    return {
      ...state,
      route: "offseason",
      career: cancelFreeAgentSigning(state.career, action.offerId),
    };
  }

  const nextCareer = startNextSeasonFromOffseason(state.career);

  return {
    ...state,
    route: getRouteForCareer(nextCareer),
    career: nextCareer,
    lastMatch: null,
    selectedCompetitionId: nextCareer.seasonState.currentCompetitionId,
  };
}
