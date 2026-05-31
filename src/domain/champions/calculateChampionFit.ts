import type { Champion } from "./championTypes";
import type { Player, Role, StrategyId } from "../../types/game";

export type ChampionFitInput = {
  player: Player;
  champion: Champion;
  role: Role;
  strategy: StrategyId;
  unavailableChampionIds?: string[];
};

export type ChampionFit = {
  championId: string;
  championName: string;
  score: number;
  unavailable: boolean;
  reasons: string[];
};

const strategyArchetypeMap: Record<StrategyId, string[]> = {
  aggressive: ["lane-bully", "dive", "pick", "skirmish", "engage"],
  tempo: ["lane-bully", "skirmish", "global", "pick"],
  macro: ["global", "utility", "poke", "blind-pick"],
  vision: ["utility", "poke", "pick", "frontline"],
  scaling: ["scaling", "carry", "enchanter", "frontline"],
  balanced: ["blind-pick", "teamfight", "utility", "frontline"],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calculateChampionFit({
  player,
  champion,
  role,
  strategy,
  unavailableChampionIds = [],
}: ChampionFitInput): ChampionFit {
  if (unavailableChampionIds.includes(champion.id)) {
    return {
      championId: champion.id,
      championName: champion.name,
      score: -999,
      unavailable: true,
      reasons: ["Unavailable by fearless draft rules."],
    };
  }

  if (!champion.roles.includes(role)) {
    return {
      championId: champion.id,
      championName: champion.name,
      score: -999,
      unavailable: true,
      reasons: [`${champion.name} is not a ${role} champion.`],
    };
  }

  const reasons: string[] = [];
  const override = player.championProfile.masteryOverrides[champion.id];
  const baseMastery =
    override ??
    Math.round(
      player.championPool * 0.34 +
        player.mechanics * 0.22 +
        player.adaptability.championLearning * 0.22 +
        player.adaptability.metaAdaptability * 0.22,
    );

  let score = baseMastery * 0.5 + champion.metaScore * 0.22;

  if (player.championProfile.preferredChampionIds.includes(champion.id)) {
    score += 8;
    reasons.push("preferred pick");
  }

  if (player.championProfile.signatureChampionIds.includes(champion.id)) {
    score += 12;
    reasons.push("signature pick");
  }

  if (player.championProfile.dislikedChampionIds.includes(champion.id)) {
    score -= 14;
    reasons.push("disliked pick");
  }

  const strategyMatches = champion.archetypes.filter((archetype) =>
    strategyArchetypeMap[strategy].includes(archetype),
  ).length;

  if (strategyMatches > 0) {
    score += strategyMatches * 3;
    reasons.push(`${strategy} strategy fit`);
  }

  const archetypeMatches = champion.archetypes.filter((archetype) =>
    player.championProfile.preferredArchetypes.includes(archetype),
  ).length;

  if (archetypeMatches > 0) {
    score += archetypeMatches * 2;
    reasons.push("player archetype fit");
  }

  if (champion.difficulty > player.mechanics) {
    const penalty = Math.round((champion.difficulty - player.mechanics) / 5);
    score -= penalty;
    reasons.push("difficulty tax");
  }

  const roleFlexBonus =
    role !== player.role && player.secondaryRoles.includes(role)
      ? player.adaptability.roleFlexibility / 20
      : 0;
  score += roleFlexBonus;

  return {
    championId: champion.id,
    championName: champion.name,
    score: Math.round(clamp(score, 0, 100)),
    unavailable: false,
    reasons,
  };
}
