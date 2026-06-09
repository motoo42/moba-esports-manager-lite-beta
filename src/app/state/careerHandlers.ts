import { createInitialCareer } from "../../domain/career/createInitialCareer";
import { createInitialCareerMessages } from "../../domain/messages";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";
import { getRouteForCareer } from "./routeSelectors";

type CareerAction = Extract<
  GameAction,
  { type: "start-career" | "load-career" }
>;

export function handleCareerAction(
  state: GameState,
  action: CareerAction,
): GameState {
  if (action.type === "start-career") {
    const career = createInitialCareerMessages(createInitialCareer(action.teamName));

    return {
      ...state,
      career,
      route: "offseason",
      lastMatch: null,
      selectedCompetitionId: null,
    };
  }

  return {
    ...state,
    career: action.career,
    route: getRouteForCareer(action.career),
    lastMatch: null,
    selectedCompetitionId: action.career.seasonState.currentCompetitionId,
  };
}
