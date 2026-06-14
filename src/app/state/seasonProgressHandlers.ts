import {
  progressCareer,
  simulatePracticeMatch,
} from "../../domain/game-progress/progressCareer";
import { setAsianGamesPlayMode } from "../../domain/season";
import {
  getTodayAcceptedScrim,
  requestScrim,
  resolvePendingScrimRequests,
  runTodayScrim,
} from "../../domain/scrim";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";
import { commitProgressResult } from "./routeSelectors";

type SeasonProgressAction = Extract<
  GameAction,
  {
    type:
      | "set-asian-games-play-mode"
      | "request-scrim"
      | "run-today-scrim"
      | "simulate-next-match"
      | "progress-season"
      | "commit-progress-result";
  }
>;

function progressCareerAndResolveScrims(state: GameState) {
  if (!state.career) {
    return state;
  }

  if (getTodayAcceptedScrim(state.career)) {
    return state;
  }

  const result = progressCareer(state.career);

  return commitProgressResult(state, {
    ...result,
    career: resolvePendingScrimRequests(result.career),
  });
}

export function handleSeasonProgressAction(
  state: GameState,
  action: SeasonProgressAction,
): GameState {
  if (action.type === "commit-progress-result") {
    return commitProgressResult(state, action.result);
  }

  if (!state.career) {
    return state;
  }

  if (action.type === "set-asian-games-play-mode") {
    return {
      ...state,
      route: "competition-dashboard",
      selectedCompetitionId: "asian-games",
      career: {
        ...state.career,
        seasonState: setAsianGamesPlayMode(
          state.career.seasonState,
          action.playMode,
        ),
      },
    };
  }

  if (action.type === "request-scrim") {
    return {
      ...state,
      career: requestScrim(state.career, action.request),
    };
  }

  if (action.type === "run-today-scrim") {
    const result = runTodayScrim(state.career);

    if (result.error || result.career === state.career) {
      return state;
    }

    const progressResult = progressCareer(result.career);

    return commitProgressResult(state, {
      ...progressResult,
      career: resolvePendingScrimRequests(progressResult.career),
    });
  }

  if (action.type === "progress-season") {
    return progressCareerAndResolveScrims(state);
  }

  return {
    ...state,
    ...simulatePracticeMatch(state.career),
  };
}
