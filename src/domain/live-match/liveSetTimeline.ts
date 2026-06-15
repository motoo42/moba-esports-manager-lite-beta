import {
  dominanceFromWinnerWinProbability,
  generateMatchTimeline,
  type GeneratedMatchTimeline,
} from "./matchTimeline";
import type { LiveMatchSide } from "./types";

// The single seam between "what decided the game" and "how we replay it". In the
// prototype this outcome is a stand-in derived from draft power; in step 7 (D) it
// is built from the real SeriesResult (winner + win probability). Keeping it here
// means swapping the source later touches only the construction of this object.

export type LiveMatchOutcome = {
  // Pre-game win chance of the team that actually won, on a 0..1 scale. Used to
  // size the replay's dominance so an upset stays close, not a blowout.
  winnerWinProbability: number;
  seed: string;
  winningSide: LiveMatchSide;
};

export function createSetTimeline(
  outcome: LiveMatchOutcome,
): GeneratedMatchTimeline {
  return generateMatchTimeline({
    dominance: dominanceFromWinnerWinProbability(outcome.winnerWinProbability),
    seed: outcome.seed,
    winningSide: outcome.winningSide,
  });
}
