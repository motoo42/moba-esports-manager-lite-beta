import { getTrainingIntensityPowerBonus } from "../weekly-plan";
import type {
  MoraleLevel,
  Player,
  StrategyId,
  Team,
  TrainingIntensity,
} from "../../types/game";

const roleWeights = {
  top: 1,
  jungle: 1.05,
  mid: 1.08,
  bot: 1.06,
  support: 0.98,
};

const moralePower: Record<MoraleLevel, number> = {
  "very-high": 4,
  high: 2,
  neutral: 0,
  low: -2,
  "very-low": -4,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getPlayerStatusPower(player: Player) {
  const formPower = clamp((player.status.form - 70) / 7, -5, 5);
  const fatiguePower = clamp((20 - player.status.fatigue) / 8, -7, 3);
  const moraleBonus = moralePower[player.status.morale];

  return formPower + fatiguePower + moraleBonus;
}

export function calculateTeamPower(
  team: Team,
  players: Player[],
  strategy: StrategyId,
  trainingIntensity: TrainingIntensity,
) {
  const rosterPlayers = Object.entries(team.roster)
    .map(([role, playerId]) => {
      const player = players.find((candidate) => candidate.id === playerId);
      return player ? { role, player } : null;
    })
    .filter((entry): entry is { role: keyof typeof roleWeights; player: Player } =>
      Boolean(entry),
    );

  if (rosterPlayers.length === 0) {
    return 0;
  }

  const basePower =
    rosterPlayers.reduce((total, { role, player }) => {
      const detailAverage =
        (player.mechanics +
          player.macro +
          player.laning +
          player.teamfight +
          player.mental +
          player.championPool) /
        6;

      return total + ((player.ability + player.overall + detailAverage) / 3) * roleWeights[role];
    }, 0) / rosterPlayers.length;

  const strategyAffinity =
    rosterPlayers.reduce((total, { player }) => {
      if (strategy === "aggressive") {
        return total + player.mechanics * 0.34 + player.laning * 0.28 + player.teamfight * 0.24 + player.mental * 0.14;
      }

      if (strategy === "tempo") {
        return total + player.laning * 0.34 + player.mechanics * 0.26 + player.macro * 0.24 + player.championPool * 0.16;
      }

      if (strategy === "macro") {
        return total + player.macro * 0.44 + player.mental * 0.24 + player.championPool * 0.18 + player.teamfight * 0.14;
      }

      if (strategy === "vision") {
        return total + player.macro * 0.34 + player.mindset.communication * 0.28 + player.mindset.teamwork * 0.22 + player.mental * 0.16;
      }

      if (strategy === "scaling") {
        return total + player.teamfight * 0.34 + player.mental * 0.26 + player.championPool * 0.24 + player.macro * 0.16;
      }

      return total + (player.mechanics + player.macro + player.laning + player.teamfight + player.mental + player.championPool) / 6;
    }, 0) / rosterPlayers.length;

  const strategyBonus = Math.round((strategyAffinity - 70) / 8);
  const trainingBonus = getTrainingIntensityPowerBonus(trainingIntensity);
  const playerStatusBonus = Math.round(
    rosterPlayers.reduce((total, { player }) => total + getPlayerStatusPower(player), 0) /
      rosterPlayers.length,
  );
  const chemistryBonus = rosterPlayers.length === 5 ? 5 : 0;

  return Math.round(
    basePower + strategyBonus + trainingBonus + playerStatusBonus + chemistryBonus,
  );
}
