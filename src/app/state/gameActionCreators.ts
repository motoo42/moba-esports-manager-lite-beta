import type { ContractTypeSelections } from "../../domain/roster";
import type {
  CareerProgressResult,
} from "../../domain/game-progress/progressCareer";
import type { OffseasonContractOfferInput } from "../../domain/season";
import type {
  AsianGamesPlayMode,
  CareerSave,
  CompetitionId,
  Player,
  Role,
  StrategyId,
  TrainingIntensity,
} from "../../types/game";
import type { AppRoute } from "../routes";
import type { GameAction } from "./gameActions";

export const gameActions = {
  startCareer(teamName: string): GameAction {
    return { type: "start-career", teamName };
  },
  loadCareer(career: CareerSave): GameAction {
    return { type: "load-career", career };
  },
  goToRoute(route: AppRoute): GameAction {
    return { type: "go-to", route };
  },
  syncRoute(
    route: AppRoute,
    competitionId?: CompetitionId | null,
  ): GameAction {
    return { type: "sync-route", route, competitionId };
  },
  viewCompetition(competitionId?: CompetitionId | null): GameAction {
    return { type: "view-competition", competitionId };
  },
  signRosterPlayer(player: Player): GameAction {
    return { type: "sign-roster-player", player };
  },
  releaseRosterPlayer(playerId: string): GameAction {
    return { type: "release-roster-player", playerId };
  },
  setRosterPlayer(role: Role, player: Player | null): GameAction {
    return { type: "set-roster-player", role, player };
  },
  callUpPlayer(playerId: string): GameAction {
    return { type: "call-up-player", playerId };
  },
  sendDownPlayer(playerId: string): GameAction {
    return { type: "send-down-player", playerId };
  },
  confirmRoster(contractTypes: ContractTypeSelections): GameAction {
    return { type: "confirm-roster", contractTypes };
  },
  renewExpiredContracts(contractTypes: ContractTypeSelections): GameAction {
    return { type: "renew-expired-contracts", contractTypes };
  },
  startOffseasonMarket(): GameAction {
    return { type: "start-offseason-market" };
  },
  submitOffseasonRenewalOffer(
    offer: OffseasonContractOfferInput,
  ): GameAction {
    return { type: "submit-offseason-renewal-offer", offer };
  },
  releaseExpiredOffseasonPlayer(playerId: string): GameAction {
    return { type: "release-expired-offseason-player", playerId };
  },
  submitFreeAgentOffer(offer: OffseasonContractOfferInput): GameAction {
    return { type: "submit-free-agent-offer", offer };
  },
  confirmFreeAgentSigning(offerId: string): GameAction {
    return { type: "confirm-free-agent-signing", offerId };
  },
  cancelFreeAgentSigning(offerId: string): GameAction {
    return { type: "cancel-free-agent-signing", offerId };
  },
  startNextSeason(): GameAction {
    return { type: "start-next-season" };
  },
  setStrategy(strategy: StrategyId): GameAction {
    return { type: "set-strategy", strategy };
  },
  setTrainingIntensity(trainingIntensity: TrainingIntensity): GameAction {
    return { type: "set-training-intensity", trainingIntensity };
  },
  setAsianGamesPlayMode(
    playMode: Exclude<AsianGamesPlayMode, "undecided">,
  ): GameAction {
    return { type: "set-asian-games-play-mode", playMode };
  },
  simulateNextMatch(): GameAction {
    return { type: "simulate-next-match" };
  },
  progressSeason(): GameAction {
    return { type: "progress-season" };
  },
  commitProgressResult(result: CareerProgressResult): GameAction {
    return { type: "commit-progress-result", result };
  },
};
