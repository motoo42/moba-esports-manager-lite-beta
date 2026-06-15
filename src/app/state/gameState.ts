import type { CareerProgressResult } from "../../domain/game-progress/progressCareer";
import {
  loadAppSettings,
  type AppSettings,
} from "../../domain/settings/appSettings";
import type { CareerSave, CompetitionId } from "../../types/game";
import type { AppRoute } from "../routes";

export type GameState = {
  route: AppRoute;
  career: CareerSave | null;
  lastMatch: CareerProgressResult["lastMatch"];
  // Transient per-game detail of the just-played series, used by the live-match
  // replay. Not persisted; cleared on the next progress that isn't a user match.
  liveMatchSeries: CareerProgressResult["liveMatchSeries"];
  selectedCompetitionId: CompetitionId | null;
  appSettings: AppSettings;
};

export function createInitialGameState(): GameState {
  return {
    route: "career-setup",
    career: null,
    lastMatch: null,
    liveMatchSeries: null,
    selectedCompetitionId: null,
    appSettings: loadAppSettings(),
  };
}

export const initialGameState: GameState = createInitialGameState();
