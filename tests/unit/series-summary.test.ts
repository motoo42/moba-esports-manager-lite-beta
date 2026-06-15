import { describe, expect, it } from "vitest";
import { summarizeSeriesGames } from "../../src/domain/series/summarizeSeriesGames";
import type { SeriesResult } from "../../src/domain/series/seriesTypes";
import type { MatchResult } from "../../src/types/game";

function gameResult(winner: "user" | "opponent", winProbability: number): MatchResult {
  return {
    winner,
    winProbability,
    teamPower: 0,
    opponentPower: 0,
    draftPower: 0,
    log: [],
  };
}

const series: SeriesResult = {
  winner: "user",
  userWins: 2,
  opponentWins: 1,
  format: "bo3",
  usedChampionIds: [],
  games: [
    { gameNumber: 1, result: gameResult("opponent", 0.55) },
    { gameNumber: 2, result: gameResult("user", 0.6) },
    { gameNumber: 3, result: gameResult("user", 0.48) },
  ],
};

describe("summarizeSeriesGames", () => {
  it("keeps per-game order, win probability, and game number", () => {
    const summaries = summarizeSeriesGames(series, true);

    expect(summaries).toHaveLength(3);
    expect(summaries.map((game) => game.gameNumber)).toEqual([1, 2, 3]);
    expect(summaries.map((game) => game.winProbability)).toEqual([0.55, 0.6, 0.48]);
  });

  it("maps the user as blue: user wins -> blue, opponent wins -> red", () => {
    const summaries = summarizeSeriesGames(series, true);

    expect(summaries.map((game) => game.winnerSide)).toEqual([
      "red",
      "blue",
      "blue",
    ]);
  });

  it("maps the user as red: user wins -> red, opponent wins -> blue", () => {
    const summaries = summarizeSeriesGames(series, false);

    expect(summaries.map((game) => game.winnerSide)).toEqual([
      "blue",
      "red",
      "red",
    ]);
  });
});
