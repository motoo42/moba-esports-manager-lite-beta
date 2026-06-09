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
import { appendOffseasonLogMessages } from "../../domain/messages";
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
    const nextCareer = renewExpiredContractsForOffseason({
      career: state.career,
      contractTypes: action.contractTypes,
    });

    return {
      ...state,
      route: "season-summary",
      career: appendOffseasonLogMessages(state.career, nextCareer),
    };
  }

  if (action.type === "start-offseason-market") {
    const nextCareer = initializeOffseasonMarket(state.career);

    return {
      ...state,
      route: getRouteForCareer(nextCareer),
      career: appendOffseasonLogMessages(state.career, nextCareer),
      lastMatch: null,
      selectedCompetitionId: nextCareer.seasonState.currentCompetitionId,
    };
  }

  if (action.type === "submit-offseason-renewal-offer") {
    const nextCareer = submitOffseasonRenewalOffer(state.career, action.offer);

    return {
      ...state,
      route: "offseason",
      career: appendOffseasonLogMessages(state.career, nextCareer),
    };
  }

  if (action.type === "release-expired-offseason-player") {
    const nextCareer = releaseExpiredOffseasonPlayer(state.career, action.playerId);

    return {
      ...state,
      route: "offseason",
      career: appendOffseasonLogMessages(state.career, nextCareer),
    };
  }

  if (action.type === "submit-free-agent-offer") {
    const nextCareer = submitFreeAgentOffer(state.career, action.offer);

    return {
      ...state,
      route: "offseason",
      career: appendOffseasonLogMessages(state.career, nextCareer),
    };
  }

  if (action.type === "confirm-free-agent-signing") {
    const nextCareer = confirmFreeAgentSigning(state.career, action.offerId);

    return {
      ...state,
      route: "offseason",
      career: appendOffseasonLogMessages(state.career, nextCareer),
    };
  }

  if (action.type === "cancel-free-agent-signing") {
    const nextCareer = cancelFreeAgentSigning(state.career, action.offerId);

    return {
      ...state,
      route: "offseason",
      career: appendOffseasonLogMessages(state.career, nextCareer),
    };
  }

  const nextCareer = startNextSeasonFromOffseason(state.career);

  return {
    ...state,
    route: getRouteForCareer(nextCareer),
    career: appendOffseasonLogMessages(state.career, nextCareer),
    lastMatch: null,
    selectedCompetitionId: nextCareer.seasonState.currentCompetitionId,
  };
}
