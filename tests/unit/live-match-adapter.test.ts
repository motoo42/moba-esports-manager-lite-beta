import { describe, expect, it } from "vitest";
import {
  applyStatSnapshotToTeam,
  formatLiveGold,
  toLiveObjectiveSnapshot,
} from "../../src/domain/live-match/liveSnapshotAdapter";
import { createSetTimeline } from "../../src/domain/live-match/liveSetTimeline";
import { getFinalMatchSnapshot } from "../../src/domain/live-match/matchStats";
import type { ObjectiveTally, TeamStatSnapshot } from "../../src/domain/live-match/matchStats";
import type { Role } from "../../src/types/game";
import type { LiveMatchTeamPresentation } from "../../src/domain/live-match/types";

const roles: Role[] = ["top", "jungle", "mid", "bot", "support"];

function createTeam(): LiveMatchTeamPresentation {
  return {
    gold: "0",
    id: "t1",
    kills: 0,
    name: "T1",
    objectives: { barons: 0, dragons: 0, heralds: 0, towers: 0 },
    shortName: "T1",
    players: roles.map((role) => ({
      champion: { dataDragonId: "Aatrox", iconUrl: "icon", id: "aatrox", name: "Aatrox" },
      name: `T1 ${role}`,
      role,
      stats: {
        assists: 0,
        deaths: 0,
        gold: "0",
        itemSlots: [null, null],
        kills: 0,
        level: 1,
      },
    })),
  };
}

function createTeamSnapshot(): TeamStatSnapshot {
  const players = {} as TeamStatSnapshot["players"];

  for (const role of roles) {
    players[role] = { assists: 1, deaths: 0, gold: 12345, kills: 2, level: 14 };
  }

  return {
    gold: 61725,
    kills: 10,
    objectives: {
      barons: 1,
      dragons: 4,
      elders: 1,
      heralds: 2,
      inhibitors: 1,
      soulTaken: true,
      towers: 8,
    },
    players,
  };
}

describe("live snapshot adapter", () => {
  it("formats gold as compact K above 1000 and plain below", () => {
    expect(formatLiveGold(500)).toBe("500");
    expect(formatLiveGold(7556)).toBe("7.6K");
    expect(formatLiveGold(15283)).toBe("15.3K");
    expect(formatLiveGold(0)).toBe("0");
  });

  it("maps the rich tally onto the four-field objective bar", () => {
    const tally: ObjectiveTally = {
      barons: 1,
      dragons: 4,
      elders: 1,
      heralds: 2,
      inhibitors: 1,
      soulTaken: true,
      towers: 8,
    };

    expect(toLiveObjectiveSnapshot(tally)).toEqual({
      barons: 1,
      dragons: 4,
      heralds: 2,
      towers: 8,
    });
  });

  it("overwrites live numbers while keeping team and player identity", () => {
    const team = createTeam();
    const updated = applyStatSnapshotToTeam({
      snapshot: createTeamSnapshot(),
      team,
    });

    expect(updated.kills).toBe(10);
    expect(updated.gold).toBe("61.7K");
    expect(updated.objectives).toEqual({ barons: 1, dragons: 4, heralds: 2, towers: 8 });
    expect(updated.name).toBe("T1");

    for (const player of updated.players) {
      expect(player.stats.kills).toBe(2);
      expect(player.stats.assists).toBe(1);
      expect(player.stats.level).toBe(14);
      expect(player.stats.gold).toBe("12.3K");
      // Identity and item slots are preserved from the base presentation.
      expect(player.name).toBe(`T1 ${player.role}`);
      expect(player.stats.itemSlots).toHaveLength(2);
    }
  });
});

describe("live set timeline seam", () => {
  it("builds a timeline whose result matches the supplied outcome", () => {
    const timeline = createSetTimeline({
      seed: "set-1",
      winningSide: "red",
      winnerWinProbability: 0.7,
    });
    const snapshot = getFinalMatchSnapshot(timeline);

    expect(timeline.winningSide).toBe("red");
    expect(snapshot.red.kills).toBeGreaterThan(snapshot.blue.kills);
  });

  it("is deterministic for the same outcome", () => {
    const outcome = {
      seed: "set-2",
      winningSide: "blue" as const,
      winnerWinProbability: 0.6,
    };

    expect(createSetTimeline(outcome)).toEqual(createSetTimeline(outcome));
  });
});
