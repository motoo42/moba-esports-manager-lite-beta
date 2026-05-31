import type { Champion, ChampionFit } from "../champions";
import type { MatchDraftSummary, Player, Role, StrategyId } from "../../types/game";

export type SeriesFormat = "bo1" | "bo3" | "bo5";

export type DraftSide = "blue" | "red";

export type DraftContext = {
  format: SeriesFormat;
  gameNumber: number;
  fearlessEnabled: boolean;
  unavailableChampionIds: string[];
  banCount?: number;
};

export type DraftTeam = {
  name: string;
  players: Partial<Record<Role, Player>>;
  strategy: StrategyId;
};

export type DraftPick = {
  role: Role;
  player: Player;
  champion: Champion;
  fit: ChampionFit;
};

export type DraftResult = MatchDraftSummary;
