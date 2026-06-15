import { describe, expect, it } from "vitest";
import {
  generateMatchTimeline,
  matchTimelineRoles,
} from "../../src/domain/live-match/matchTimeline";
import {
  getFinalMatchSnapshot,
  getMatchSnapshotAt,
  type MatchStatSnapshot,
  type TeamStatSnapshot,
} from "../../src/domain/live-match/matchStats";
import type { LiveMatchSide } from "../../src/domain/live-match/types";

function teamTotals(team: TeamStatSnapshot) {
  return matchTimelineRoles.reduce(
    (totals, role) => {
      const player = team.players[role];
      return {
        assists: totals.assists + player.assists,
        deaths: totals.deaths + player.deaths,
        kills: totals.kills + player.kills,
      };
    },
    { assists: 0, deaths: 0, kills: 0 },
  );
}

describe("match stat snapshot fold", () => {
  it("matches the timeline's final kill totals", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      const timeline = generateMatchTimeline({
        seed,
        winningSide: "blue",
        dominance: 0.4,
      });
      const snapshot = getFinalMatchSnapshot(timeline);

      expect(snapshot.blue.kills).toBe(timeline.finalKills.blue);
      expect(snapshot.red.kills).toBe(timeline.finalKills.red);
    }
  });

  it("keeps the kills = deaths invariant across the team totals", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const timeline = generateMatchTimeline({
        seed,
        winningSide: "red",
        dominance: 0.3,
      });
      const snapshot = getFinalMatchSnapshot(timeline);
      const blue = teamTotals(snapshot.blue);
      const red = teamTotals(snapshot.red);

      expect(blue.kills).toBe(red.deaths);
      expect(red.kills).toBe(blue.deaths);
    }
  });

  it("counts every assist from the kill events exactly once", () => {
    const timeline = generateMatchTimeline({
      seed: "assists",
      winningSide: "blue",
      dominance: 0.3,
    });
    const snapshot = getFinalMatchSnapshot(timeline);
    const totalAssists =
      teamTotals(snapshot.blue).assists + teamTotals(snapshot.red).assists;
    const expectedAssists = timeline.events.reduce(
      (total, event) =>
        total + (event.type === "kill" ? event.kill?.assistRoles.length ?? 0 : 0),
      0,
    );

    expect(totalAssists).toBe(expectedAssists);
  });

  it("starts every player at the baseline at time zero", () => {
    const timeline = generateMatchTimeline({
      seed: "baseline",
      winningSide: "blue",
      dominance: 0.4,
    });
    const snapshot = getMatchSnapshotAt(timeline, 0);

    for (const side of ["blue", "red"] as LiveMatchSide[]) {
      for (const role of matchTimelineRoles) {
        const player = snapshot[side].players[role];
        expect(player.kills).toBe(0);
        expect(player.deaths).toBe(0);
        expect(player.assists).toBe(0);
        expect(player.level).toBe(1);
        expect(player.gold).toBe(500);
      }
    }
  });

  it("never decreases any cumulative stat as time advances", () => {
    const timeline = generateMatchTimeline({
      seed: "monotonic",
      winningSide: "red",
      dominance: 0.2,
    });
    const checkpoints = [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
      getMatchSnapshotAt(timeline, Math.round(timeline.durationSec * fraction)),
    );

    for (let index = 1; index < checkpoints.length; index += 1) {
      const previous = checkpoints[index - 1];
      const current = checkpoints[index];

      for (const side of ["blue", "red"] as LiveMatchSide[]) {
        expect(current[side].kills).toBeGreaterThanOrEqual(previous[side].kills);
        expect(current[side].gold).toBeGreaterThanOrEqual(previous[side].gold);
        expect(current[side].objectives.towers).toBeGreaterThanOrEqual(
          previous[side].objectives.towers,
        );
        expect(current[side].objectives.dragons).toBeGreaterThanOrEqual(
          previous[side].objectives.dragons,
        );

        for (const role of matchTimelineRoles) {
          expect(current[side].players[role].level).toBeGreaterThanOrEqual(
            previous[side].players[role].level,
          );
          expect(current[side].players[role].deaths).toBeGreaterThanOrEqual(
            previous[side].players[role].deaths,
          );
        }
      }
    }
  });

  it("keeps every player's level within 1..18", () => {
    for (const seed of ["x", "y", "z"]) {
      const timeline = generateMatchTimeline({
        seed,
        winningSide: "blue",
        dominance: 0.4,
      });
      const snapshot = getFinalMatchSnapshot(timeline);

      for (const side of ["blue", "red"] as LiveMatchSide[]) {
        for (const role of matchTimelineRoles) {
          const level = snapshot[side].players[role].level;
          expect(level).toBeGreaterThanOrEqual(1);
          expect(level).toBeLessThanOrEqual(18);
        }
      }
    }
  });

  it("gives a dominant winner a clear team gold lead", () => {
    // Passive income is identical on both sides, so a close game can leave the
    // loser ahead on gold. This only holds once the win is dominant enough that
    // the kill/objective advantage clearly outweighs that shared passive income.
    for (const seed of ["x", "y", "z", "w", "v"]) {
      const timeline = generateMatchTimeline({
        seed,
        winningSide: "blue",
        dominance: 0.85,
      });
      const snapshot = getFinalMatchSnapshot(timeline);
      const loser = timeline.winningSide === "blue" ? "red" : "blue";

      expect(snapshot[timeline.winningSide].gold).toBeGreaterThan(
        snapshot[loser].gold,
      );
    }
  });

  it("folds objective counts to match the timeline events", () => {
    const timeline = generateMatchTimeline({
      seed: "objectives",
      winningSide: "red",
      dominance: 0.1,
    });
    const snapshot = getFinalMatchSnapshot(timeline);

    const countFor = (side: LiveMatchSide, types: string[]) =>
      timeline.events.filter(
        (event) => event.side === side && types.includes(event.type),
      ).length;

    for (const side of ["blue", "red"] as LiveMatchSide[]) {
      expect(snapshot[side].objectives.dragons).toBe(
        countFor(side, ["dragon", "soul"]),
      );
      expect(snapshot[side].objectives.barons).toBe(countFor(side, ["baron"]));
      expect(snapshot[side].objectives.towers).toBe(countFor(side, ["tower"]));
      expect(snapshot[side].objectives.heralds).toBe(countFor(side, ["herald"]));
      expect(snapshot[side].objectives.elders).toBe(countFor(side, ["elder"]));
      expect(snapshot[side].objectives.inhibitors).toBe(
        countFor(side, ["inhibitor"]),
      );
      expect(snapshot[side].objectives.soulTaken).toBe(
        countFor(side, ["soul"]) > 0,
      );
    }
  });

  it("tracks each side's dragons in order with their elemental type", () => {
    const timeline = generateMatchTimeline({
      seed: "dragon-seq",
      winningSide: "blue",
      dominance: 0.1,
    });
    const snapshot = getFinalMatchSnapshot(timeline);

    for (const side of ["blue", "red"] as LiveMatchSide[]) {
      const expected = timeline.events
        .filter(
          (event) =>
            (event.type === "dragon" || event.type === "soul") &&
            event.side === side,
        )
        .map((event) => event.dragonType);

      expect(snapshot[side].objectives.dragonTypes).toEqual(expected);
      expect(snapshot[side].objectives.dragonTypes).toHaveLength(
        snapshot[side].objectives.dragons,
      );
    }
  });

  it("clamps requests past the final whistle to the final snapshot", () => {
    const timeline = generateMatchTimeline({
      seed: "clamp",
      winningSide: "blue",
      dominance: 0.4,
    });
    const final = getFinalMatchSnapshot(timeline);
    const beyond = getMatchSnapshotAt(timeline, timeline.durationSec + 10_000);

    expect(beyond).toEqual<MatchStatSnapshot>(final);
  });
});
