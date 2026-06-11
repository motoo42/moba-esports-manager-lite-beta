import { describe, expect, it } from "vitest";
import { lck2026Players } from "../../src/data/lck2026Players";
import {
  getPlayerCareerEntries,
  getPlayerProfileSummary,
} from "../../src/domain/players";

describe("player profile helpers", () => {
  it("returns curated profile and career entries for famous players", () => {
    const faker = lck2026Players.find((player) => player.name === "Faker");

    expect(faker).toBeDefined();
    expect(getPlayerProfileSummary(faker!)).toMatch(/국제대회/);
    expect(getPlayerCareerEntries(faker!)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamName: "SK Telecom T1 / T1",
        }),
      ]),
    );
  });

  it("falls back to the current team when curated data is missing", () => {
    const bdd = lck2026Players.find((player) => player.name === "Bdd");

    expect(bdd).toBeDefined();
    expect(getPlayerProfileSummary(bdd!)).toMatch(/세부 능력치/);
    expect(getPlayerCareerEntries(bdd!)[0]).toEqual(
      expect.objectContaining({
        teamName: "KT Rolster",
      }),
    );
  });
});
