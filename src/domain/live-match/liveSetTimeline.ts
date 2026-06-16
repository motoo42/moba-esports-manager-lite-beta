import type { MatchAbilities } from "./matchAbilityBias";
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

const STANDIN_MIN_WIN_PROBABILITY = 0.55;
const STANDIN_WIN_PROBABILITY_RANGE = 0.15;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Prototype stand-in: until step 7 feeds the real SeriesResult, derive an outcome
// from draft power alone. The winner is the better-drafting side; the win chance
// stays in a gentle 0.55..0.70 band so dominance never reads as a blowout from
// draft power alone (netDraftPower already ranges -10..10). A dead-even draft
// (netDraftPower === 0) falls to blue — acceptable only because this is
// prototype-only and step 7 replaces it with the real match winner.
export function standInOutcomeFromDraftPower({
  netDraftPower,
  seed,
}: {
  netDraftPower: number;
  seed: string;
}): LiveMatchOutcome {
  const magnitude = clamp(Math.abs(netDraftPower) / 10, 0, 1);
  const winnerWinProbability =
    STANDIN_MIN_WIN_PROBABILITY + magnitude * STANDIN_WIN_PROBABILITY_RANGE;

  return {
    seed,
    // Round to drop float artifacts (0.55 + 0.15 -> 0.7000000000000001).
    winnerWinProbability: Math.round(winnerWinProbability * 1000) / 1000,
    winningSide: netDraftPower >= 0 ? "blue" : "red",
  };
}

// Build a replay outcome from a real, already-decided match record. This is the
// step 7 path: the match simulation already produced winnerSide / winProbability,
// so the replay reproduces that result instead of re-simulating. winProbability
// is the user's pre-game chance, so the winner's chance flips on a user loss.
export function liveMatchOutcomeFromRecord(record: {
  id: string;
  userResult: "win" | "loss" | "none";
  winnerSide: LiveMatchSide;
  winProbability?: number;
}): LiveMatchOutcome {
  const userChance = record.winProbability ?? 0.5;
  // "none" has no user perspective (e.g. an AI-only match), so treat the winner
  // as a coin-flip rather than reading the user-keyed probability.
  const winnerWinProbability =
    record.userResult === "none"
      ? 0.5
      : record.userResult === "win"
        ? userChance
        : 1 - userChance;

  return {
    seed: record.id,
    winnerWinProbability,
    winningSide: record.winnerSide,
  };
}

export function createSetTimeline(
  outcome: LiveMatchOutcome,
  options?: {
    aggressiveSupportSides?: LiveMatchSide[];
    playerAbilities?: MatchAbilities;
  },
): GeneratedMatchTimeline {
  return generateMatchTimeline({
    aggressiveSupportSides: options?.aggressiveSupportSides,
    dominance: dominanceFromWinnerWinProbability(outcome.winnerWinProbability),
    playerAbilities: options?.playerAbilities,
    seed: outcome.seed,
    winningSide: outcome.winningSide,
  });
}
