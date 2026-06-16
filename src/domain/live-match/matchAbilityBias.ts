import type { Role } from "../../types/game";
import { liveMatchRoles } from "./mockDraft";
import type { LiveMatchSide } from "./types";

// Per-player ability used to SHAPE (not decide) the replay's internal distribution.
// Pulled from the real roster. The match result/score is untouched — these only bias
// who, within an already-decided outcome, gets the gold and the kills.
export type MatchPlayerAbility = {
  laning: number;
  macro: number;
  mechanics: number;
  overall: number;
  teamfight: number;
};

export type MatchAbilities = Record<
  LiveMatchSide,
  Record<Role, MatchPlayerAbility>
>;

// Ability is centred near a typical pro rating; gaps from here scale the weights.
const ABILITY_CENTER = 72;
const SUPPORT_KILLER_BASELINE = 0.35;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Per-role weight for choosing WHICH teammate lands a kill on a side. Role baseline
// (a non-aggressive support mostly assists) is blended with the player's overall, so a
// stronger player claims a larger share of the team's kills. The caller normalises and
// weighted-picks exactly one killer per kill, so only the intra-team share shifts — the
// side's kill total (and thus blue-kills = red-deaths and the winner) is unchanged.
export function killerWeightsForSide(
  side: LiveMatchSide,
  abilities: MatchAbilities | undefined,
  options: { aggressiveSupportSides: LiveMatchSide[] },
): Record<Role, number> {
  const supportBaseline = options.aggressiveSupportSides.includes(side)
    ? 1
    : SUPPORT_KILLER_BASELINE;
  const roleBaseline: Record<Role, number> = {
    top: 1,
    jungle: 1,
    mid: 1,
    bot: 1,
    support: supportBaseline,
  };

  if (!abilities) {
    return roleBaseline;
  }

  const sideAbilities = abilities[side];
  const weights = {} as Record<Role, number>;

  for (const role of liveMatchRoles) {
    const overall = sideAbilities[role]?.overall ?? ABILITY_CENTER;
    const factor = clamp(1 + (overall - ABILITY_CENTER) / 55, 0.55, 1.6);
    weights[role] = roleBaseline[role] * factor;
  }

  return weights;
}

// Per-role weight for choosing WHICH player on a side dies — the inverse of ability, so
// weaker players feed more. Same intra-team-only property as killer weights.
export function victimWeightsForSide(
  side: LiveMatchSide,
  abilities: MatchAbilities | undefined,
): Record<Role, number> {
  if (!abilities) {
    return { top: 1, jungle: 1, mid: 1, bot: 1, support: 1 };
  }

  const sideAbilities = abilities[side];
  const weights = {} as Record<Role, number>;

  for (const role of liveMatchRoles) {
    const overall = sideAbilities[role]?.overall ?? ABILITY_CENTER;
    weights[role] = clamp(1 + (ABILITY_CENTER - overall) / 55, 0.55, 1.6);
  }

  return weights;
}

// Lane advantage in [-1, 1] for a role: positive favours blue, negative red, scaled by
// the laning gap. Biases the DIRECTION of a lane-phase solo kill (better laner wins the
// duel), without forcing it — the caller still rolls against it.
export function laneAdvantage(
  role: Role,
  abilities: MatchAbilities | undefined,
): number {
  if (!abilities) {
    return 0;
  }

  const blue = abilities.blue[role]?.laning ?? ABILITY_CENTER;
  const red = abilities.red[role]?.laning ?? ABILITY_CENTER;

  return clamp((blue - red) / 24, -1, 1);
}

// Killer-role weights for a LANE solo kill on `side`: the base kill weights tilted
// toward the roles this side out-lanes, so the better laner tends to claim the solo
// kill (its victim is that same role's lane opponent). Side totals are still unchanged —
// the scoring side was already decided; this only shapes WHICH lane popped off.
export function soloKillerWeightsForSide(
  side: LiveMatchSide,
  abilities: MatchAbilities | undefined,
  baseKillerWeights: Record<Role, number>,
): Record<Role, number> {
  if (!abilities) {
    return baseKillerWeights;
  }

  const weights = {} as Record<Role, number>;

  for (const role of liveMatchRoles) {
    const advantage = laneAdvantage(role, abilities); // + favours blue
    const edge = side === "blue" ? advantage : -advantage; // + = this side out-lanes
    weights[role] = baseKillerWeights[role] * clamp(1 + edge * 0.8, 0.3, 1.8);
  }

  return weights;
}

// Passive (CS) gold-rate multiplier from laning, gently bounded so a strong laner pulls
// a CS lead without distorting the HUD gold tone.
export function goldRateMultiplier(
  ability: MatchPlayerAbility | undefined,
): number {
  const laning = ability?.laning ?? ABILITY_CENTER;

  return clamp(1 + (laning - ABILITY_CENTER) / 120, 0.9, 1.12);
}

// Neutral-objective control nudge for the WINNING side, from team macro (the jungle
// leads objective setups, the team helps secure). Roughly [-0.18, 0.18]. The caller
// keeps the winner's objective majority (clamped >= 0.5), so this only widens or narrows
// the lead by who actually controls the map — the winner is never overturned.
export function objectiveControlEdge(
  winningSide: LiveMatchSide,
  abilities: MatchAbilities | undefined,
): number {
  if (!abilities) {
    return 0;
  }

  const macroFor = (side: LiveMatchSide) => {
    const roles = abilities[side];
    const teamAverage =
      liveMatchRoles.reduce(
        (sum, role) => sum + (roles[role]?.macro ?? ABILITY_CENTER),
        0,
      ) / liveMatchRoles.length;
    const jungle = roles.jungle?.macro ?? ABILITY_CENTER;

    return jungle * 0.5 + teamAverage * 0.5;
  };

  const losingSide = winningSide === "blue" ? "red" : "blue";

  return clamp((macroFor(winningSide) - macroFor(losingSide)) / 80, -0.18, 0.18);
}
