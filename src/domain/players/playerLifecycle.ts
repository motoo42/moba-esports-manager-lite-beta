import type { Player } from "../../types/game";
import { ensurePlayerEvaluationStatus } from "./playerEvaluation";
import { blendPlayerSalaryExpectation, calculatePlayerMarketValue } from "./playerMarketValue";
import { clampStatusValue } from "./playerStatus";

const ratingFields = [
  "ability",
  "overall",
  "mechanics",
  "macro",
  "laning",
  "teamfight",
  "mental",
  "championPool",
] as const;

function clampRating(value: number) {
  return Math.max(45, Math.min(95, Math.round(value)));
}

function getDevelopmentDelta(player: Player) {
  if (player.age < player.development.peakAgeStart) {
    const growthRoom = Math.max(0, player.potential - player.overall);
    const growthPressure = player.development.growthRate / 100;

    return Math.min(3, Math.max(0, Math.round(growthRoom * growthPressure * 0.25)));
  }

  if (player.age > player.development.peakAgeEnd) {
    return -Math.min(3, Math.max(1, Math.round(player.development.declineRate / 6)));
  }

  return 0;
}

function applyRatingDelta(player: Player, delta: number): Player {
  if (delta === 0) {
    return player;
  }

  return ratingFields.reduce(
    (nextPlayer, field) => ({
      ...nextPlayer,
      [field]:
        delta > 0
          ? Math.min(player.potential, clampRating(nextPlayer[field] + delta))
          : clampRating(nextPlayer[field] + delta),
    }),
    player,
  );
}

export function rollPlayerIntoNextSeason(player: Player): Player {
  const nextAge = player.age + 1;
  const ratingUpdatedPlayer = applyRatingDelta(player, getDevelopmentDelta(player));
  const marketValue = calculatePlayerMarketValue(ratingUpdatedPlayer);
  const salaryExpectation = blendPlayerSalaryExpectation(
    ratingUpdatedPlayer.salaryExpectation,
    marketValue,
    ratingUpdatedPlayer,
  );

  const nextStatus = {
    ...ratingUpdatedPlayer.status,
    form: clampStatusValue((ratingUpdatedPlayer.status.form + 50) / 2),
    evaluationForm: undefined,
    evaluationStars: undefined,
    fatigue: 0,
    morale: "neutral" as const,
    condition: 100,
    injuryRisk: clampStatusValue(
      Math.min(10, ratingUpdatedPlayer.status.injuryRisk / 2),
    ),
  };
  const nextPlayer = {
    ...ratingUpdatedPlayer,
    age: nextAge,
    cost: salaryExpectation,
    salaryExpectation,
    retirementCandidate: player.retirementAge
      ? nextAge >= player.retirementAge
      : player.retirementCandidate,
    status: nextStatus,
    marketProfile: {
      ...ratingUpdatedPlayer.marketProfile,
      buyoutEstimate: Math.round(salaryExpectation * 2.4),
    },
  };

  return {
    ...nextPlayer,
    status: ensurePlayerEvaluationStatus(nextPlayer, nextStatus),
  };
}
