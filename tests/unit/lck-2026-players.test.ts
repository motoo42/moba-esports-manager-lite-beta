import { describe, expect, it } from "vitest";
import { lck2026Players } from "../../src/data/lck2026Players";
import { lck2026Teams } from "../../src/data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../src/data/offseasonFreeAgents";
import { samplePlayers } from "../../src/data/samplePlayers";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import type { Role } from "../../src/types/game";

const requiredRoles: Role[] = ["top", "jungle", "mid", "bot", "support"];

describe("lck2026Players", () => {
  it("covers every 2026 LCK team with a complete 1st+2nd roster shell", () => {
    for (const team of lck2026Teams) {
      const players = lck2026Players.filter(
        (player) => player.currentTeam === team.name,
      );

      expect(players.length, team.name).toBeGreaterThanOrEqual(10);

      const roles = new Set(players.map((player) => player.role));

      for (const role of requiredRoles) {
        expect(roles.has(role), `${team.name} missing ${role}`).toBe(true);
      }
    }
  });

  it("keeps player ids unique", () => {
    const ids = lck2026Players.map((player) => player.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves existing sample player ids while allowing rating overrides", () => {
    const sampleFaker = samplePlayers.find((player) => player.name === "Faker");
    const lckFaker = lck2026Players.find((player) => player.name === "Faker");

    expect(sampleFaker).toBeDefined();
    expect(lckFaker).toMatchObject({
      id: sampleFaker?.id,
      ability: 86,
      overall: 86,
      potential: 87,
      currentTeam: "T1",
      rosterTier: "main",
      source: "lck-2026-rounds-1-2",
      age: 30,
    });
  });

  it("uses rating overrides for user-adjustable balance entries", () => {
    const bdd = lck2026Players.find((player) => player.name === "Bdd");

    expect(bdd).toMatchObject({
      currentTeam: "KT Rolster",
      ability: 86,
      overall: 86,
      potential: 87,
      salaryExpectation: 128,
    });
  });

  it("deduplicates names that also exist in the offseason free agent seed", () => {
    const overlappingNames = offseasonFreeAgentSeeds
      .map((player) => player.name)
      .filter((name) => lck2026Players.some((player) => player.name === name));

    for (const name of overlappingNames) {
      expect(
        lck2026Players.filter((player) => player.name === name),
        name,
      ).toHaveLength(1);
    }
  });

  it("starts new careers with the 2026 LCK full player pool", () => {
    const career = createInitialCareer("T1");

    expect(career.lckPlayers).toBe(lck2026Players);
    expect(career.lckPlayers.length).toBeGreaterThan(100);
  });
});
