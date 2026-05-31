import type { Champion } from "../champions";
import type { MatchResult, Opponent, Player, StrategyId, Team, TrainingIntensity } from "../../types/game";
import type { SeriesFormat } from "../draft";

export type SimulateSeriesInput = {
  team: Team;
  players: Player[];
  opponent: Opponent;
  strategy: StrategyId;
  trainingIntensity: TrainingIntensity;
  seed: string;
  format: SeriesFormat;
  fearlessEnabled: boolean;
  champions?: Champion[];
};

export type SeriesGameResult = {
  gameNumber: number;
  result: MatchResult;
};

export type SeriesResult = {
  winner: "user" | "opponent";
  userWins: number;
  opponentWins: number;
  format: SeriesFormat;
  games: SeriesGameResult[];
  usedChampionIds: string[];
};
