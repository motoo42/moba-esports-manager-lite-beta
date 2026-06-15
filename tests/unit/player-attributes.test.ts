import { describe, expect, it } from "vitest";
import { lck2026Players } from "../../src/data/lck2026Players";
import {
  computeRoleOverall,
  getAttributeTier,
  getPlayerAttributes,
  playerAttributeDescriptions,
  playerAttributeGroups,
} from "../../src/domain/player-attributes";
import type { Player } from "../../src/types/game";

const base = lck2026Players[0];

type PlayerOverrides = Partial<Omit<Player, "mindset">> & {
  mindset?: Partial<Player["mindset"]>;
};

function makePlayer(overrides: PlayerOverrides = {}): Player {
  const { mindset, ...rest } = overrides;

  return {
    ...base,
    ...rest,
    mindset: { ...base.mindset, ...(mindset ?? {}) },
  };
}

const allKeys = playerAttributeGroups.flatMap((group) => group.attributes);

describe("player attributes", () => {
  it("derives all 16 attributes within 1..99", () => {
    for (const player of lck2026Players.slice(0, 12)) {
      const attributes = getPlayerAttributes(player);

      expect([...Object.keys(attributes)].sort()).toEqual([...allKeys].sort());

      for (const key of allKeys) {
        expect(attributes[key]).toBeGreaterThanOrEqual(1);
        expect(attributes[key]).toBeLessThanOrEqual(99);
      }
    }
  });

  it("is deterministic for the same player", () => {
    const player = lck2026Players[3];

    expect(getPlayerAttributes(player)).toEqual(getPlayerAttributes(player));
  });

  it("anchors skill attributes to the overall while preserving texture", () => {
    const low = getPlayerAttributes(
      makePlayer({ overall: 60, laning: 88, macro: 52 }),
    );
    const high = getPlayerAttributes(
      makePlayer({ overall: 90, laning: 88, macro: 52 }),
    );

    // Same texture inputs, higher overall -> higher anchored bars (growth follows).
    expect(high.laning).toBeGreaterThan(low.laning);
    expect(high.macro).toBeGreaterThan(low.macro);
    // Texture survives: the stronger raw stat still reads above the weaker one.
    expect(high.laning).toBeGreaterThan(high.macro);
    expect(low.laning).toBeGreaterThan(low.macro);
  });

  it("uses the authored overall as the position overall", () => {
    expect(computeRoleOverall(makePlayer({ overall: 83 }))).toBe(83);
    expect(computeRoleOverall(makePlayer({ overall: 67 }))).toBe(67);
  });

  it("reads an off-position overall below the primary role", () => {
    const player = makePlayer({
      role: "mid",
      secondaryRoles: ["bot"],
      overall: 80,
    });

    expect(computeRoleOverall(player, "mid")).toBe(80);
    expect(computeRoleOverall(player, "bot")).toBeLessThan(80);
    expect(computeRoleOverall(player, "support")).toBeLessThan(
      computeRoleOverall(player, "bot"),
    );
  });

  it("excludes the soft traits (ego/leadership) from the position overall", () => {
    const core: PlayerOverrides = {
      laning: 75,
      teamfight: 75,
      macro: 75,
      championPool: 75,
      mental: 75,
      mindset: { consistency: 75, clutch: 75 },
    };
    const a = makePlayer({ ...core, id: "trait-seed-alpha" });
    const b = makePlayer({ ...core, id: "trait-seed-omega" });
    const attributesA = getPlayerAttributes(a);
    const attributesB = getPlayerAttributes(b);

    // The wide-spread soft traits really do differ between the two ids...
    expect(
      attributesA.ego !== attributesB.ego ||
        attributesA.leadership !== attributesB.leadership,
    ).toBe(true);
    // ...yet the position overall is identical, proving they are excluded from it.
    expect(computeRoleOverall(a)).toBe(computeRoleOverall(b));
  });

  it("provides a short one-line description for every attribute", () => {
    for (const key of allKeys) {
      const description = playerAttributeDescriptions[key];

      expect(description).toBeTruthy();
      expect(description.length).toBeLessThan(40);
      expect(description.endsWith(".")).toBe(true);
    }
  });

  it("buckets values into six grade bands (90/80/70/60/50)", () => {
    expect(getAttributeTier(90)).toBe("worldclass");
    expect(getAttributeTier(89)).toBe("elite");
    expect(getAttributeTier(80)).toBe("elite");
    expect(getAttributeTier(79)).toBe("high");
    expect(getAttributeTier(70)).toBe("high");
    expect(getAttributeTier(69)).toBe("mid");
    expect(getAttributeTier(60)).toBe("mid");
    expect(getAttributeTier(59)).toBe("low");
    expect(getAttributeTier(50)).toBe("low");
    expect(getAttributeTier(49)).toBe("weak");
    expect(getAttributeTier(1)).toBe("weak");
  });
});
