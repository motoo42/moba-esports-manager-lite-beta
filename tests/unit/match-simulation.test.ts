import { describe, expect, it } from "vitest";
import { sampleOpponents } from "../../src/data/sampleOpponents";
import { samplePlayers } from "../../src/data/samplePlayers";
import { calculateTeamPower, simulateMatch } from "../../src/domain/match-simulation";
import type { Team } from "../../src/types/game";

const completeTeam: Team = {
  name: "Test Team",
  region: "lck",
  budget: 650,
  rosterSettings: {
    minPlayers: 10,
    maxPlayers: 15,
    freeMovementBetweenMainAndAcademy: true,
  },
  roster: {
    top: "lck-top-01",
    jungle: "lck-jungle-01",
    mid: "lck-mid-01",
    bot: "lck-bot-01",
    support: "lck-support-01",
  },
  mainRosterPlayerIds: [],
  academyRosterPlayerIds: [],
  contracts: [],
  wins: 0,
  losses: 0,
  elo: 1500,
};

describe("simulateMatch", () => {
  it("is deterministic for the same seed", () => {
    const first = simulateMatch({
      team: completeTeam,
      players: samplePlayers,
      opponent: sampleOpponents[0],
      strategy: "balanced",
      trainingIntensity: "normal",
      seed: "fixed-seed",
    });

    const second = simulateMatch({
      team: completeTeam,
      players: samplePlayers,
      opponent: sampleOpponents[0],
      strategy: "balanced",
      trainingIntensity: "normal",
      seed: "fixed-seed",
    });

    expect(second).toEqual(first);
    expect(first.draftPower).toBe(0);
  });

  it("adds draft power to the final team power", () => {
    const neutral = simulateMatch({
      team: completeTeam,
      players: samplePlayers,
      opponent: sampleOpponents[0],
      strategy: "balanced",
      trainingIntensity: "normal",
      seed: "draft-seed",
    });

    const boosted = simulateMatch({
      team: completeTeam,
      players: samplePlayers,
      opponent: sampleOpponents[0],
      strategy: "balanced",
      trainingIntensity: "normal",
      seed: "draft-seed",
      draft: {
        bluePicks: {},
        redPicks: {},
        blueBans: [],
        redBans: [],
        blueDraftPower: 84,
        redDraftPower: 52,
        netDraftPower: 8,
        notes: [],
        usedChampionIds: [],
      },
    });

    expect(boosted.draftPower).toBe(8);
    expect(boosted.teamPower).toBe(neutral.teamPower + 8);
  });

  it("uses training intensity as a direct preparation bonus", () => {
    const rested = simulateMatch({
      team: completeTeam,
      players: samplePlayers,
      opponent: sampleOpponents[0],
      strategy: "balanced",
      trainingIntensity: "rest",
      seed: "training-seed",
    });

    const highIntensity = simulateMatch({
      team: completeTeam,
      players: samplePlayers,
      opponent: sampleOpponents[0],
      strategy: "balanced",
      trainingIntensity: "high",
      seed: "training-seed",
    });

    expect(highIntensity.teamPower).toBe(rested.teamPower + 3);
  });

  it("uses the selected strategy to change roster power through player fit", () => {
    const macroFocusedPlayers = samplePlayers.map((player) => {
      const isStarter = Object.values(completeTeam.roster).includes(player.id);

      if (!isStarter) {
        return player;
      }

      return {
        ...player,
        mechanics: 55,
        laning: 55,
        teamfight: 60,
        macro: 95,
        mental: 92,
        championPool: 91,
        mindset: {
          ...player.mindset,
          communication: 92,
          teamwork: 92,
        },
      };
    });

    const aggressivePower = calculateTeamPower(
      completeTeam,
      macroFocusedPlayers,
      "aggressive",
      "normal",
    );
    const macroPower = calculateTeamPower(
      completeTeam,
      macroFocusedPlayers,
      "macro",
      "normal",
    );

    expect(macroPower).toBeGreaterThan(aggressivePower);
  });
});
