import type {
  MoraleLevel,
  Player,
  Role,
  TrainingIntensity,
} from "../../types/game";

export const moraleLevels: MoraleLevel[] = [
  "very-low",
  "low",
  "neutral",
  "high",
  "very-high",
];

export const moraleLabels: Record<MoraleLevel, string> = {
  "very-high": "최상",
  high: "중상",
  neutral: "중",
  low: "중하",
  "very-low": "최하",
};

export const moraleRotations: Record<MoraleLevel, number> = {
  "very-high": 0,
  high: 45,
  neutral: 90,
  low: 135,
  "very-low": 180,
};

export const moraleTones: Record<MoraleLevel, "green" | "yellow" | "red"> = {
  "very-high": "green",
  high: "green",
  neutral: "yellow",
  low: "red",
  "very-low": "red",
};

type MatchStatusResult = "win" | "loss" | "none";

type PlayerStatusChangeInput = {
  players: Player[];
  roster: Partial<Record<Role, string>>;
  contractedPlayerIds: string[];
  userResult: MatchStatusResult;
  trainingIntensity: TrainingIntensity;
};

type TrainingStatusEffect = {
  form: number;
  starterFatigue: number;
  benchFatigue: number;
};

const trainingEffects: Record<TrainingIntensity, TrainingStatusEffect> = {
  high: {
    form: 1,
    starterFatigue: 5,
    benchFatigue: 1,
  },
  normal: {
    form: 0,
    starterFatigue: 0,
    benchFatigue: -4,
  },
  light: {
    form: 0,
    starterFatigue: -2,
    benchFatigue: -7,
  },
  rest: {
    form: -1,
    starterFatigue: -6,
    benchFatigue: -10,
  },
};

export function clampStatusValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function increaseMorale(level: MoraleLevel, amount = 1): MoraleLevel {
  const currentIndex = moraleLevels.indexOf(level);
  const nextIndex = Math.min(moraleLevels.length - 1, currentIndex + amount);

  return moraleLevels[nextIndex];
}

export function decreaseMorale(level: MoraleLevel, amount = 1): MoraleLevel {
  const currentIndex = moraleLevels.indexOf(level);
  const nextIndex = Math.max(0, currentIndex - amount);

  return moraleLevels[nextIndex];
}

export function getMoraleLabel(level: MoraleLevel) {
  return moraleLabels[level];
}

export function applyCallUpMoraleBoost(players: Player[], playerId: string) {
  return players.map((player) =>
    player.id === playerId
      ? {
          ...player,
          status: {
            ...player.status,
            morale: increaseMorale(player.status.morale),
          },
        }
      : player,
  );
}

export function applyWeeklyPlayerStatusChanges({
  players,
  roster,
  contractedPlayerIds,
  trainingIntensity,
  userResult,
}: PlayerStatusChangeInput) {
  const starterIds = new Set(Object.values(roster).filter(Boolean));
  const contractedIds = new Set(contractedPlayerIds);
  const trainingEffect = trainingEffects[trainingIntensity];

  if (userResult === "none") {
    return players;
  }

  return players.map((player) => {
    if (!contractedIds.has(player.id)) {
      return player;
    }

    const isStarter = starterIds.has(player.id);
    const resultForm = isStarter ? (userResult === "win" ? 2 : -2) : 0;
    const resultFatigue = isStarter ? 8 : 0;
    const nextMorale = isStarter
      ? userResult === "win"
        ? increaseMorale(player.status.morale)
        : decreaseMorale(player.status.morale)
      : player.status.morale;

    return {
      ...player,
      status: {
        ...player.status,
        form: clampStatusValue(
          player.status.form + resultForm + trainingEffect.form,
        ),
        fatigue: clampStatusValue(
          player.status.fatigue +
            resultFatigue +
            (isStarter
              ? trainingEffect.starterFatigue
              : trainingEffect.benchFatigue),
        ),
        morale: nextMorale,
      },
    };
  });
}
