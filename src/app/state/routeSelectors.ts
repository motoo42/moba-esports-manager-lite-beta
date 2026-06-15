import type {
  CareerProgressResult,
} from "../../domain/game-progress/progressCareer";
import {
  appendOffseasonLogMessages,
  appendProgressMessages,
} from "../../domain/messages";
import type { CareerSave, CompetitionId } from "../../types/game";
import type { AppRoute } from "../routes";
import type { GameState } from "./gameState";

export function getSelectedCompetitionIdForRoute(
  state: GameState,
  route: AppRoute,
  competitionId?: CompetitionId | null,
) {
  if (route !== "competition-dashboard") {
    return state.selectedCompetitionId;
  }

  return (
    competitionId ??
    state.career?.seasonState.currentCompetitionId ??
    state.selectedCompetitionId ??
    null
  );
}

export function getRouteForCareer(career: CareerSave): AppRoute {
  if (career.seasonState.phase === "completed") {
    return "season-summary";
  }

  if (career.seasonState.phase === "offseason") {
    const offseasonStatus = career.seasonState.offseason?.status;

    return offseasonStatus === "active" || offseasonStatus === "ready-for-next-season"
      ? "offseason"
      : "season-summary";
  }

  return "main-dashboard";
}

export function commitProgressResult(
  state: GameState,
  result: CareerProgressResult,
): GameState {
  const career = state.career
    ? appendOffseasonLogMessages(
        state.career,
        appendProgressMessages(
          state.career,
          result.career,
          result.lastMatch,
          state.appSettings,
        ),
      )
    : result.career;

  return {
    ...state,
    route: getRouteForCareer(career),
    career,
    lastMatch: result.lastMatch,
    liveMatchSeries: result.liveMatchSeries ?? null,
    selectedCompetitionId: career.seasonState.currentCompetitionId,
  };
}
