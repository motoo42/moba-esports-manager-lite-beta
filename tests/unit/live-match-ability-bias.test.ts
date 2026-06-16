import { describe, expect, it } from "vitest";
import type { Role } from "../../src/types/game";
import {
  goldRateMultiplier,
  killerWeightsForSide,
  laneAdvantage,
  victimWeightsForSide,
  type MatchAbilities,
  type MatchPlayerAbility,
} from "../../src/domain/live-match/matchAbilityBias";

const roles: Role[] = ["top", "jungle", "mid", "bot", "support"];

function ability(overall: number, laning = overall): MatchPlayerAbility {
  return { laning, macro: overall, mechanics: overall, overall, teamfight: overall };
}

function abilitiesWith(
  blue: Record<Role, number>,
  red: Record<Role, number>,
): MatchAbilities {
  const side = (overalls: Record<Role, number>) =>
    Object.fromEntries(roles.map((role) => [role, ability(overalls[role])])) as Record<
      Role,
      MatchPlayerAbility
    >;

  return { blue: side(blue), red: side(red) };
}

const evenOveralls = { top: 72, jungle: 72, mid: 72, bot: 72, support: 72 };

describe("match ability bias", () => {
  const options = { aggressiveSupportSides: [] as never[] };

  it("falls back to the role baseline when abilities are absent", () => {
    const weights = killerWeightsForSide("blue", undefined, options);
    expect(weights).toEqual({ top: 1, jungle: 1, mid: 1, bot: 1, support: 0.35 });
  });

  it("gives a stronger player a larger share of the team's kills", () => {
    const abilities = abilitiesWith(
      { ...evenOveralls, mid: 90, top: 60 },
      evenOveralls,
    );
    const weights = killerWeightsForSide("blue", abilities, options);

    expect(weights.mid).toBeGreaterThan(weights.jungle);
    expect(weights.jungle).toBeGreaterThan(weights.top);
    // Support stays down-weighted even at equal ability (assists, not kills).
    expect(weights.support).toBeLessThan(weights.jungle);
  });

  it("keeps an aggressive support at a full kill baseline", () => {
    const abilities = abilitiesWith(evenOveralls, evenOveralls);
    const normal = killerWeightsForSide("blue", abilities, options);
    const aggressive = killerWeightsForSide("blue", abilities, {
      aggressiveSupportSides: ["blue"],
    });

    expect(normal.support).toBeLessThan(normal.jungle);
    expect(aggressive.support).toBeCloseTo(aggressive.jungle);
  });

  it("makes weaker players die more (inverse of kills)", () => {
    const abilities = abilitiesWith(
      { ...evenOveralls, mid: 90, top: 60 },
      evenOveralls,
    );
    const deaths = victimWeightsForSide("blue", abilities);

    expect(deaths.top).toBeGreaterThan(deaths.jungle);
    expect(deaths.jungle).toBeGreaterThan(deaths.mid);
  });

  it("points lane advantage toward the better laner, bounded to [-1, 1]", () => {
    const blueFavored = abilitiesWith({ ...evenOveralls, mid: 95 }, evenOveralls);
    const redFavored = abilitiesWith(evenOveralls, { ...evenOveralls, mid: 95 });

    expect(laneAdvantage("mid", blueFavored)).toBeGreaterThan(0);
    expect(laneAdvantage("mid", redFavored)).toBeLessThan(0);
    expect(laneAdvantage("mid", blueFavored)).toBeLessThanOrEqual(1);
    expect(laneAdvantage("mid", redFavored)).toBeGreaterThanOrEqual(-1);
    expect(laneAdvantage("mid", abilitiesWith(evenOveralls, evenOveralls))).toBe(0);
    expect(laneAdvantage("mid", undefined)).toBe(0);
  });

  it("scales gold rate by laning, gently bounded", () => {
    expect(goldRateMultiplier(ability(72))).toBeCloseTo(1);
    expect(goldRateMultiplier(ability(72, 95))).toBeGreaterThan(1);
    expect(goldRateMultiplier(ability(72, 50))).toBeLessThan(1);
    // Bounds: never below 0.9 or above 1.12 even at extremes.
    expect(goldRateMultiplier(ability(72, 200))).toBeLessThanOrEqual(1.12);
    expect(goldRateMultiplier(ability(72, 0))).toBeGreaterThanOrEqual(0.9);
    expect(goldRateMultiplier(undefined)).toBeCloseTo(1);
  });

  it("is pure/deterministic", () => {
    const abilities = abilitiesWith({ ...evenOveralls, bot: 88 }, evenOveralls);
    expect(killerWeightsForSide("blue", abilities, options)).toEqual(
      killerWeightsForSide("blue", abilities, options),
    );
  });
});
