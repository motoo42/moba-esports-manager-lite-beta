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

export type GameAction =
  | { type: "start-career"; teamName: string }
  | { type: "load-career"; career: CareerSave }
  | { type: "go-to"; route: AppRoute }
  | {
      type: "sync-route";
      route: AppRoute;
      competitionId?: CompetitionId | null;
    }
  | { type: "view-competition"; competitionId?: CompetitionId | null }
  | { type: "sign-roster-player"; player: Player }
  | { type: "release-roster-player"; playerId: string }
  | { type: "set-roster-player"; role: Role; player: Player | null }
  | { type: "call-up-player"; playerId: string }
  | { type: "send-down-player"; playerId: string }
  | { type: "confirm-roster"; contractTypes: ContractTypeSelections }
  | { type: "renew-expired-contracts"; contractTypes: ContractTypeSelections }
  | { type: "start-offseason-market" }
  | {
      type: "submit-offseason-renewal-offer";
      offer: OffseasonContractOfferInput;
    }
  | { type: "release-expired-offseason-player"; playerId: string }
  | { type: "submit-free-agent-offer"; offer: OffseasonContractOfferInput }
  | { type: "confirm-free-agent-signing"; offerId: string }
  | { type: "cancel-free-agent-signing"; offerId: string }
  | { type: "start-next-season" }
  | { type: "set-strategy"; strategy: StrategyId }
  | { type: "set-training-intensity"; trainingIntensity: TrainingIntensity }
  | {
      type: "set-asian-games-play-mode";
      playMode: Exclude<AsianGamesPlayMode, "undecided">;
    }
  | { type: "simulate-next-match" }
  | { type: "progress-season" }
  | { type: "commit-progress-result"; result: CareerProgressResult };
