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
    expect(getPlayerProfileSummary(faker!)).toMatch(/T1의 상징/);
    expect(getPlayerCareerEntries(faker!)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamName: "SK Telecom T1",
        }),
        expect.objectContaining({
          teamName: "T1",
        }),
      ]),
    );
    expect(
      getPlayerCareerEntries(faker!).every((entry) => !("note" in entry)),
    ).toBe(true);
  });

  it("keeps transferred teams as separate career entries", () => {
    const doran = lck2026Players.find((player) => player.name === "Doran");

    expect(doran).toBeDefined();
    expect(getPlayerCareerEntries(doran!).map((entry) => entry.teamName)).toEqual([
      "Griffin",
      "DRX",
      "KT Rolster",
      "Gen.G",
      "Hanwha Life Esports",
      "T1",
    ]);
  });

  it("falls back to the current team when curated data is missing", () => {
    const ghost = lck2026Players.find((player) => player.name === "Ghost");

    expect(ghost).toBeDefined();
    expect(getPlayerProfileSummary(ghost!)).toMatch(/세부 능력치/);
    expect(getPlayerCareerEntries(ghost!)[0]).toEqual(
      expect.objectContaining({
        teamName: "KT Rolster",
      }),
    );
  });
});
