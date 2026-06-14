import { handleCareerAction } from "./careerHandlers";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";
import { handleOffseasonAction } from "./offseasonHandlers";
import { handleMessageAction } from "./messageHandlers";
import { handleRosterAction } from "./rosterHandlers";
import { handleRouteAction } from "./routeHandlers";
import { handleSeasonProgressAction } from "./seasonProgressHandlers";
import { handleSettingsAction } from "./settingsHandlers";
import { handleWeeklyPlanAction } from "./weeklyPlanHandlers";

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start-career":
    case "load-career":
      return handleCareerAction(state, action);
    case "sync-route":
    case "go-to":
    case "view-competition":
      return handleRouteAction(state, action);
    case "set-roster-player":
    case "call-up-player":
    case "send-down-player":
    case "sign-roster-player":
    case "release-roster-player":
    case "confirm-roster":
      return handleRosterAction(state, action);
    case "set-strategy":
    case "set-training-intensity":
      return handleWeeklyPlanAction(state, action);
    case "renew-expired-contracts":
    case "start-offseason-market":
    case "submit-offseason-renewal-offer":
    case "release-expired-offseason-player":
    case "submit-free-agent-offer":
    case "confirm-free-agent-signing":
    case "cancel-free-agent-signing":
    case "start-next-season":
      return handleOffseasonAction(state, action);
    case "set-first-entry-guides-enabled":
    case "set-theme-mode":
    case "set-background-music-enabled":
    case "set-background-music-volume":
    case "set-sound-effects-enabled":
    case "set-sound-effects-volume":
    case "set-ai-news-enabled":
    case "set-message-news-frequency":
    case "mark-career-guide-seen":
      return handleSettingsAction(state, action);
    case "mark-message-read":
    case "mark-all-messages-read":
    case "apply-ai-news-message":
      return handleMessageAction(state, action);
    case "set-asian-games-play-mode":
    case "request-scrim":
    case "run-today-scrim":
    case "simulate-next-match":
    case "progress-season":
    case "commit-progress-result":
      return handleSeasonProgressAction(state, action);
    default:
      return state;
  }
}
