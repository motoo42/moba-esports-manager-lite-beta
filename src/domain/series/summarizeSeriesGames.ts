import type { MatchSeriesGameSummary } from "../../types/game";
import type { SeriesResult } from "./seriesTypes";

// Map a played series into per-game summaries keyed to the schedule's blue/red
// sides (the series itself is user/opponent based). Carries each game's real
// winner, banpick, and win probability for the live-match replay.
export function summarizeSeriesGames(
  series: SeriesResult,
  userIsBlue: boolean,
): MatchSeriesGameSummary[] {
  return series.games.map((game) => ({
    draft: game.result.draft,
    gameNumber: game.gameNumber,
    winnerSide:
      game.result.winner === "user"
        ? userIsBlue
          ? "blue"
          : "red"
        : userIsBlue
          ? "red"
          : "blue",
    winProbability: game.result.winProbability,
  }));
}
