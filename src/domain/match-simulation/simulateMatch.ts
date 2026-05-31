import { createSeededRandom } from "../rng/createSeededRandom";
import { getStyleMatchupScore } from "../opponent-analysis";
import { calculateTeamPower } from "./calculateTeamPower";
import { getStrategyLabel, getTrainingIntensityLabel } from "../weekly-plan";
import type {
  MatchDraftSummary,
  MatchResult,
  Opponent,
  Player,
  StrategyId,
  Team,
  TrainingIntensity,
} from "../../types/game";

type SimulateMatchInput = {
  team: Team;
  players: Player[];
  opponent: Opponent;
  strategy: StrategyId;
  trainingIntensity: TrainingIntensity;
  seed: string;
  draft?: MatchDraftSummary;
};

function toElo(power: number) {
  return 1200 + power * 7;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function simulateMatch(input: SimulateMatchInput): MatchResult {
  const random = createSeededRandom(input.seed);
  const variance = Math.round((random() - 0.5) * 12);
  const baseTeamPower =
    calculateTeamPower(input.team, input.players, input.strategy, input.trainingIntensity) + variance;
  const styleMatchupPower = getStyleMatchupScore(input.strategy, input.opponent.style);
  const draftPower = clamp(input.draft?.netDraftPower ?? 0, -10, 10);
  const teamPower = baseTeamPower + draftPower + styleMatchupPower;
  const opponentPower = input.opponent.strength + Math.round((random() - 0.5) * 10);
  const teamElo = toElo(teamPower);
  const opponentElo = toElo(opponentPower);
  const winProbability = 1 / (1 + 10 ** ((opponentElo - teamElo) / 400));
  const roll = random();
  const winner = roll <= winProbability ? "user" : "opponent";

  return {
    winner,
    winProbability,
    teamPower,
    opponentPower,
    draftPower,
    draft: input.draft,
    log: [
      `Win chance: ${Math.round(winProbability * 100)}%.`,
      `Draft power: ${draftPower >= 0 ? "+" : ""}${draftPower}.`,
      `Style matchup: ${styleMatchupPower >= 0 ? "+" : ""}${styleMatchupPower}.`,
      `Plan: ${getStrategyLabel(input.strategy)} / ${getTrainingIntensityLabel(input.trainingIntensity)}.`,
      winner === "user"
        ? "The roster executed the plan and converted the key fights."
        : "The opponent punished weak preparation windows.",
      `Opponent style: ${input.opponent.style}.`,
    ],
  };
}
