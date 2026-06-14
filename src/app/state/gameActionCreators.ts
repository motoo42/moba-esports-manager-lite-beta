import type { ContractTypeSelections } from "../../domain/roster";
import type { CareerStartMode } from "../../domain/career/createInitialCareer";
import type {
  CareerProgressResult,
} from "../../domain/game-progress/progressCareer";
import type { OffseasonContractOfferInput } from "../../domain/season";
import type { ScrimRequestInput } from "../../domain/scrim";
import type {
  MessageNewsFrequency,
  ThemeMode,
} from "../../domain/settings/appSettings";
import type {
  AsianGamesPlayMode,
  CareerSave,
  CareerGuideId,
  CompetitionId,
  Player,
  Role,
  StrategyId,
  TrainingIntensity,
} from "../../types/game";
import type { AppRoute } from "../routes";
import type { GameAction } from "./gameActions";

export const gameActions = {
  startCareer(teamName: string, startMode?: CareerStartMode): GameAction {
    return { type: "start-career", teamName, startMode };
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
  setThemeMode(mode: ThemeMode): GameAction {
    return { type: "set-theme-mode", mode };
  },
  setBackgroundMusicEnabled(enabled: boolean): GameAction {
    return { type: "set-background-music-enabled", enabled };
  },
  setBackgroundMusicVolume(volume: number): GameAction {
    return { type: "set-background-music-volume", volume };
  },
  setSoundEffectsEnabled(enabled: boolean): GameAction {
    return { type: "set-sound-effects-enabled", enabled };
  },
  setSoundEffectsVolume(volume: number): GameAction {
    return { type: "set-sound-effects-volume", volume };
  },
  setFirstEntryGuidesEnabled(enabled: boolean): GameAction {
    return { type: "set-first-entry-guides-enabled", enabled };
  },
  setAiNewsEnabled(enabled: boolean): GameAction {
    return { type: "set-ai-news-enabled", enabled };
  },
  setMessageNewsFrequency(frequency: MessageNewsFrequency): GameAction {
    return { type: "set-message-news-frequency", frequency };
  },
  markCareerGuideSeen(guideId: CareerGuideId): GameAction {
    return { type: "mark-career-guide-seen", guideId };
  },
  markMessageRead(messageId: string): GameAction {
    return { type: "mark-message-read", messageId };
  },
  markAllMessagesRead(): GameAction {
    return { type: "mark-all-messages-read" };
  },
  applyAiNewsMessage({
    body,
    messageId,
    title,
  }: {
    body: string;
    messageId: string;
    title: string;
  }): GameAction {
    return { type: "apply-ai-news-message", messageId, news: { body, title } };
  },
  setStrategy(strategy: StrategyId): GameAction {
    return { type: "set-strategy", strategy };
  },
  setTrainingIntensity(trainingIntensity: TrainingIntensity): GameAction {
    return { type: "set-training-intensity", trainingIntensity };
  },
  requestScrim(request: ScrimRequestInput): GameAction {
    return { type: "request-scrim", request };
  },
  runTodayScrim(): GameAction {
    return { type: "run-today-scrim" };
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
