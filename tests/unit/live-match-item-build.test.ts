import { describe, expect, it } from "vitest";
import { getItemGoldTotal } from "../../src/domain/items";
import {
  getLiveMatchBuildOrder,
  getLiveMatchItemSlotsAt,
  getOwnedItemIdsAt,
} from "../../src/domain/live-match/liveItemBuilds";

describe("live match item build timeline", () => {
  // Controlled build with known Data Dragon costs: 3869=400, 3158=900, 3031=3500.
  // Cumulative: 400, 1300, 4800 (total 4800).
  const build = ["3869", "3158", "3031"];

  it("owns nothing at the start and the full build at the end", () => {
    expect(getOwnedItemIdsAt(build, 0)).toEqual([]);
    expect(getOwnedItemIdsAt(build, 1)).toEqual(["3869", "3158", "3031"]);
  });

  it("completes items in order as the gold fraction covers cumulative cost", () => {
    expect(getOwnedItemIdsAt(build, 0.1)).toEqual(["3869"]); // budget 480: ≥400, <1300
    expect(getOwnedItemIdsAt(build, 0.3)).toEqual(["3869", "3158"]); // 1440: ≥1300, <4800
    expect(getOwnedItemIdsAt(build, 0.99)).toEqual(["3869", "3158"]); // 4752: <4800
  });

  it("clamps out-of-range progress", () => {
    expect(getOwnedItemIdsAt(build, -0.5)).toEqual([]);
    expect(getOwnedItemIdsAt(build, 2)).toEqual(["3869", "3158", "3031"]);
  });

  it("is deterministic", () => {
    expect(getOwnedItemIdsAt(build, 0.42)).toEqual(getOwnedItemIdsAt(build, 0.42));
  });

  it("handles an empty build", () => {
    expect(getOwnedItemIdsAt([], 0.5)).toEqual([]);
  });

  it("grows the slot list with progress and completes the curated build", () => {
    const order = getLiveMatchBuildOrder("blue", "bot");
    const mid = getLiveMatchItemSlotsAt("blue", "bot", 0.5);
    const full = getLiveMatchItemSlotsAt("blue", "bot", 1);

    expect(full.map((item) => item?.id)).toEqual(order); // full build, purchase order
    expect(mid.length).toBeGreaterThan(0);
    expect(mid.length).toBeLessThan(full.length);
  });

  it("draws prices from the generated Data Dragon map", () => {
    expect(getItemGoldTotal("3031")).toBe(3500);
    expect(getItemGoldTotal("3006")).toBe(1100);
    expect(getItemGoldTotal("unknown-id")).toBe(3000); // default fallback
  });
});
