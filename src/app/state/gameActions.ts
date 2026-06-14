import type { ContractTypeSelections } from "../../domain/roster";
import type {
  CareerProgressResult,
} from "../../domain/game-progress/progressCareer";
import type { ScrimRequestInput } from "../../domain/scrim";
import type { OffseasonContractOfferInput } from "../../domain/season";
import type { CareerStartMode } from "../../domain/career/createInitialCareer";
import type {
  AsianGamesPlayMode,
  CareerSave,
  CareerGuideId,
  CompetitionId,
  CareerMessage,
  Player,
  Role,
  StrategyId,
  TrainingIntensity,
} from "../../types/game";
import type {
  MessageNewsFrequency,
  ThemeMode,
} from "../../domain/settings/appSettings";
import type { AppRoute } from "../routes";

export type GameAction =
  | { type: "start-career"; teamName: string; startMode?: CareerStartMode }
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
  | { type: "set-theme-mode"; mode: ThemeMode }
  | { type: "set-background-music-enabled"; enabled: boolean }
  | { type: "set-background-music-volume"; volume: number }
  | { type: "set-sound-effects-enabled"; enabled: boolean }
  | { type: "set-sound-effects-volume"; volume: number }
  | { type: "set-first-entry-guides-enabled"; enabled: boolean }
  | { type: "set-ai-news-enabled"; enabled: boolean }
  | { type: "set-message-news-frequency"; frequency: MessageNewsFrequency }
  | { type: "mark-career-guide-seen"; guideId: CareerGuideId }
  | { type: "mark-message-read"; messageId: string }
  | { type: "mark-all-messages-read" }
  | {
      type: "apply-ai-news-message";
      messageId: string;
      news: Pick<CareerMessage, "body" | "title">;
    }
  | { type: "set-strategy"; strategy: StrategyId }
  | { type: "set-training-intensity"; trainingIntensity: TrainingIntensity }
  | { type: "request-scrim"; request: ScrimRequestInput }
  | { type: "run-today-scrim" }
  | {
      type: "set-asian-games-play-mode";
      playMode: Exclude<AsianGamesPlayMode, "undecided">;
    }
  | { type: "simulate-next-match" }
  | { type: "progress-season" }
  | { type: "commit-progress-result"; result: CareerProgressResult };
