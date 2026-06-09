import { describe, expect, it } from "vitest";
import { samplePlayers } from "../../src/data/samplePlayers";
import { rollPlayerIntoNextSeason } from "../../src/domain/players";

describe("player lifecycle", () => {
  it("grows young prospects toward potential during next-season rollover", () => {
    const prospect = {
      ...samplePlayers[0],
      age: 18,
      overall: 70,
      ability: 69,
      potential: 86,
      salaryExpectation: 70,
      cost: 70,
      development: {
        ...samplePlayers[0].development,
        growthRate: 80,
        peakAgeStart: 22,
        peakAgeEnd: 27,
      },
    };
    const nextPlayer = rollPlayerIntoNextSeason(prospect);

    expect(nextPlayer.age).toBe(19);
    expect(nextPlayer.overall).toBeGreaterThan(prospect.overall);
    expect(nextPlayer.ability).toBeGreaterThan(prospect.ability);
    expect(nextPlayer.overall).toBeLessThanOrEqual(prospect.potential);
    expect(nextPlayer.salaryExpectation).not.toBe(prospect.salaryExpectation);
    expect(nextPlayer.cost).toBe(nextPlayer.salaryExpectation);
  });

  it("declines veterans after peak age without removing them from rosters", () => {
    const veteran = {
      ...samplePlayers[1],
      age: 29,
      retirementAge: 30,
      overall: 84,
      ability: 84,
      potential: 85,
      development: {
        ...samplePlayers[1].development,
        peakAgeStart: 22,
        peakAgeEnd: 27,
        declineRate: 9,
      },
    };
    const nextPlayer = rollPlayerIntoNextSeason(veteran);

    expect(nextPlayer.age).toBe(30);
    expect(nextPlayer.overall).toBeLessThan(veteran.overall);
    expect(nextPlayer.ability).toBeLessThan(veteran.ability);
    expect(nextPlayer.retirementCandidate).toBe(true);
    expect(nextPlayer.availableForRoster).toBe(veteran.availableForRoster);
  });

  it("keeps academy salary expectations near the intended CL scale", () => {
    const academyProspect = {
      ...samplePlayers[0],
      rosterTier: "academy" as const,
      age: 18,
      overall: 72,
      ability: 72,
      potential: 84,
      salaryExpectation: 14,
      cost: 14,
      marketProfile: {
        ...samplePlayers[0].marketProfile,
        marketability: 55,
        fanbase: 45,
        brandRisk: 5,
      },
      development: {
        ...samplePlayers[0].development,
        growthRate: 80,
        peakAgeStart: 22,
        peakAgeEnd: 27,
      },
    };
    const nextPlayer = rollPlayerIntoNextSeason(academyProspect);

    expect(nextPlayer.salaryExpectation).toBeGreaterThanOrEqual(6);
    expect(nextPlayer.salaryExpectation).toBeLessThanOrEqual(24);
    expect(nextPlayer.cost).toBe(nextPlayer.salaryExpectation);
  });
});
