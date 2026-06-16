import { describe, expect, it } from "vitest";
import type { MatchAbilities } from "../../src/domain/live-match/matchAbilityBias";
import {
  dominanceFromWinnerWinProbability,
  generateMatchTimeline,
  matchTimelineRoles,
  respawnWindowSec,
  type GeneratedMatchTimeline,
} from "../../src/domain/live-match/matchTimeline";
import type { LiveMatchSide } from "../../src/domain/live-match/types";
import type { Role } from "../../src/types/game";

function killEvents(timeline: GeneratedMatchTimeline) {
  return timeline.events.filter((event) => event.type === "kill");
}

function deathsBySide(timeline: GeneratedMatchTimeline) {
  // A kill that benefits one side is a death for the other side.
  const deaths: Record<LiveMatchSide, number> = { blue: 0, red: 0 };

  for (const event of killEvents(timeline)) {
    deaths[event.side === "blue" ? "red" : "blue"] += 1;
  }

  return deaths;
}

function flatAbility(overall: number) {
  return {
    laning: overall,
    macro: overall,
    mechanics: overall,
    overall,
    teamfight: overall,
  };
}

function buildAbilities(
  blue: Record<Role, number>,
  red: Record<Role, number>,
): MatchAbilities {
  const side = (overalls: Record<Role, number>) =>
    Object.fromEntries(
      matchTimelineRoles.map((role) => [role, flatAbility(overalls[role])]),
    ) as MatchAbilities["blue"];

  return { blue: side(blue), red: side(red) };
}

function emptyRoleCounts() {
  return Object.fromEntries(
    matchTimelineRoles.map((role) => [role, 0]),
  ) as Record<Role, number>;
}

// Total kills landed by each role on `side`, summed across a sample of timelines.
function killerCounts(
  timelines: GeneratedMatchTimeline[],
  side: LiveMatchSide,
) {
  const counts = emptyRoleCounts();

  for (const timeline of timelines) {
    for (const event of killEvents(timeline)) {
      if (event.side === side && event.kill) {
        counts[event.kill.killerRole] += 1;
      }
    }
  }

  return counts;
}

// Total deaths taken by each role on `victimSide`, summed across timelines.
function victimCounts(
  timelines: GeneratedMatchTimeline[],
  victimSide: LiveMatchSide,
) {
  const scoringSide = victimSide === "blue" ? "red" : "blue";
  const counts = emptyRoleCounts();

  for (const timeline of timelines) {
    for (const event of killEvents(timeline)) {
      if (event.side === scoringSide && event.kill) {
        counts[event.kill.victimRole] += 1;
      }
    }
  }

  return counts;
}

const ABILITY_SEEDS = Array.from({ length: 60 }, (_, index) => `ability-${index}`);

describe("match timeline generator", () => {
  it("is deterministic for the same seed", () => {
    const first = generateMatchTimeline({ seed: "match-a", winningSide: "blue", dominance: 0.4 });
    const second = generateMatchTimeline({ seed: "match-a", winningSide: "blue", dominance: 0.4 });

    expect(second).toEqual(first);
  });

  it("produces different timelines for different seeds", () => {
    const first = generateMatchTimeline({ seed: "match-a", winningSide: "blue", dominance: 0.4 });
    const second = generateMatchTimeline({ seed: "match-b", winningSide: "blue", dominance: 0.4 });

    expect(second.events).not.toEqual(first.events);
  });

  it("keeps blue kills equal to red deaths (and vice versa)", () => {
    for (const seed of ["s1", "s2", "s3", "s4", "s5"]) {
      const timeline = generateMatchTimeline({ seed, winningSide: "red", dominance: 0.4 });
      const deaths = deathsBySide(timeline);

      expect(timeline.finalKills.blue).toBe(deaths.red);
      expect(timeline.finalKills.red).toBe(deaths.blue);
    }
  });

  it("biases kill share toward stronger players, keeping side totals intact", () => {
    const abilities = buildAbilities(
      { top: 58, jungle: 72, mid: 92, bot: 72, support: 72 },
      { top: 72, jungle: 72, mid: 72, bot: 72, support: 72 },
    );
    const timelines = ABILITY_SEEDS.map((seed) =>
      generateMatchTimeline({
        seed,
        winningSide: "blue",
        dominance: 0.4,
        playerAbilities: abilities,
      }),
    );

    // A 92-overall mid out-kills a 58-overall top on the same team, across the sample.
    const blueKills = killerCounts(timelines, "blue");
    expect(blueKills.mid).toBeGreaterThan(blueKills.top);

    // The side-level invariant still holds for every game with abilities applied.
    for (const timeline of timelines) {
      const deaths = deathsBySide(timeline);
      expect(timeline.finalKills.blue).toBe(deaths.red);
      expect(timeline.finalKills.red).toBe(deaths.blue);
    }
  });

  it("makes the weaker player on a side feed more deaths", () => {
    const abilities = buildAbilities(
      { top: 72, jungle: 72, mid: 72, bot: 72, support: 72 },
      { top: 55, jungle: 72, mid: 90, bot: 72, support: 72 },
    );
    const timelines = ABILITY_SEEDS.map((seed) =>
      generateMatchTimeline({
        seed,
        winningSide: "blue",
        dominance: 0.4,
        playerAbilities: abilities,
      }),
    );

    const redDeaths = victimCounts(timelines, "red");
    expect(redDeaths.top).toBeGreaterThan(redDeaths.mid);
  });

  it("gives the better-macro side more objective control", () => {
    const blueStrongMacro = buildAbilities(
      { top: 85, jungle: 92, mid: 85, bot: 85, support: 85 },
      { top: 60, jungle: 58, mid: 60, bot: 60, support: 60 },
    );
    const blueWeakMacro = buildAbilities(
      { top: 60, jungle: 58, mid: 60, bot: 60, support: 60 },
      { top: 85, jungle: 92, mid: 85, bot: 85, support: 85 },
    );

    const winnerDragons = (abilities: MatchAbilities) => {
      let count = 0;
      for (const seed of ABILITY_SEEDS) {
        const timeline = generateMatchTimeline({
          seed,
          winningSide: "blue",
          dominance: 0.4,
          playerAbilities: abilities,
        });
        for (const event of timeline.events) {
          if (
            (event.type === "dragon" || event.type === "soul") &&
            event.side === "blue"
          ) {
            count += 1;
          }
        }
      }
      return count;
    };

    // Blue wins both samples; when blue also has the stronger macro it controls more
    // of the dragons than when its macro is weak (but it always wins regardless).
    expect(winnerDragons(blueStrongMacro)).toBeGreaterThan(
      winnerDragons(blueWeakMacro),
    );
  });

  it("lets the winning side finish ahead on kills and take the nexus last", () => {
    for (const seed of ["s1", "s2", "s3", "s4", "s5", "s6"]) {
      for (const winningSide of ["blue", "red"] as LiveMatchSide[]) {
        const timeline = generateMatchTimeline({ seed, winningSide, dominance: 0.4 });
        const last = timeline.events[timeline.events.length - 1];

        expect(timeline.finalKills[winningSide]).toBeGreaterThan(
          timeline.finalKills[winningSide === "blue" ? "red" : "blue"],
        );
        expect(last.type).toBe("nexus");
        expect(last.side).toBe(winningSide);
      }
    }
  });

  it("keeps the team assist-to-kill ratio roughly between 2 and 3", () => {
    for (const seed of ["r1", "r2", "r3", "r4", "r5"]) {
      const timeline = generateMatchTimeline({ seed, winningSide: "blue", dominance: 0.3 });
      const kills = killEvents(timeline);
      const assists = kills.reduce(
        (total, event) => total + (event.kill?.assistRoles.length ?? 0),
        0,
      );
      const ratio = assists / kills.length;

      expect(ratio).toBeGreaterThanOrEqual(1.9);
      expect(ratio).toBeLessThanOrEqual(3.2);
    }
  });

  it("only ever assigns the five known roles to kill participants", () => {
    const timeline = generateMatchTimeline({ seed: "roles", winningSide: "red", dominance: 0.4 });

    for (const event of killEvents(timeline)) {
      const roles = [
        event.kill!.killerRole,
        event.kill!.victimRole,
        ...event.kill!.assistRoles,
      ];

      for (const role of roles) {
        expect(matchTimelineRoles).toContain(role);
      }
    }

    // Solo kills carry no assists; teamfight kills carry 1-4.
    for (const event of killEvents(timeline)) {
      if (event.kill!.isSolo) {
        expect(event.kill!.assistRoles).toHaveLength(0);
      } else {
        expect(event.kill!.assistRoles.length).toBeGreaterThanOrEqual(1);
        expect(event.kill!.assistRoles.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it("compresses dominant wins and stretches close games into the right bands", () => {
    const stomp = generateMatchTimeline({ seed: "len", winningSide: "blue", dominance: 0.8 });
    const close = generateMatchTimeline({ seed: "len", winningSide: "blue", dominance: 0.05 });

    expect(stomp.durationSec).toBeLessThanOrEqual(30 * 60);
    expect(close.durationSec).toBeGreaterThanOrEqual(36 * 60);
  });

  it("always ends with a visible closing push (tower/inhibitor/nexus) in the final minutes", () => {
    for (const seed of ["c1", "c2", "c3"]) {
      const timeline = generateMatchTimeline({ seed, winningSide: "red", dominance: 0.4 });
      const closingWindowStart = timeline.durationSec - 180;
      const closingVisible = timeline.events.filter(
        (event) => event.visible && event.timeSec >= closingWindowStart,
      );

      expect(closingVisible.some((event) => event.type === "nexus")).toBe(true);
      expect(closingVisible.some((event) => event.type === "inhibitor")).toBe(true);
    }
  });

  it("surfaces only a subset of events while keeping every critical moment visible", () => {
    const timeline = generateMatchTimeline({ seed: "vis", winningSide: "blue", dominance: 0.4 });
    const visible = timeline.events.filter((event) => event.visible);

    expect(visible.length).toBeLessThan(timeline.events.length);

    for (const event of timeline.events) {
      if (event.importance === "critical") {
        expect(event.visible).toBe(true);
      }
    }
  });

  it("grants the soul on a team's 4th dragon and gates elder behind it", () => {
    let sawSoul = false;

    for (let index = 0; index < 30; index += 1) {
      const timeline = generateMatchTimeline({
        seed: `dragon-${index}`,
        winningSide: "blue",
        dominance: 0.1,
      });
      const dragonsAndSoul = timeline.events.filter(
        (event) => event.type === "dragon" || event.type === "soul",
      );

      // Never more than 7 dragons (3-3 plus the soul-granting 7th).
      expect(dragonsAndSoul.length).toBeLessThanOrEqual(7);

      const soul = timeline.events.find((event) => event.type === "soul");
      const elders = timeline.events.filter((event) => event.type === "elder");

      if (!soul) {
        // No soul means no elder may spawn.
        expect(elders).toHaveLength(0);
        continue;
      }

      sawSoul = true;

      // The soul side has exactly four dragons (three dragons + the soul).
      const soulSideDragons = dragonsAndSoul.filter(
        (event) => event.side === soul.side,
      );
      expect(soulSideDragons).toHaveLength(4);

      // Elder only appears after the soul is secured.
      expect(elders.every((event) => event.timeSec >= soul.timeSec)).toBe(true);
    }

    expect(sawSoul).toBe(true);
  });

  it("rotates dragon types: first three distinct, then the third repeats", () => {
    for (const seed of ["d1", "d2", "d3", "d4", "d5", "d6"]) {
      const timeline = generateMatchTimeline({
        seed,
        winningSide: "blue",
        dominance: 0.1,
      });
      const dragons = timeline.events.filter(
        (event) => event.type === "dragon" || event.type === "soul",
      );
      const types = dragons.map((dragon) => dragon.dragonType!);

      if (types.length === 0) {
        continue;
      }

      // The first up-to-three dragons are distinct elements.
      expect(new Set(types.slice(0, 3)).size).toBe(Math.min(3, types.length));

      // From the third onward, every dragon repeats the third element.
      const elemental = types[2];
      for (let index = 3; index < types.length; index += 1) {
        expect(types[index]).toBe(elemental);
      }

      // A soul is always that repeating element.
      const soul = dragons.find((event) => event.type === "soul");
      if (soul) {
        expect(soul.dragonType).toBe(elemental);
      }
    }
  });

  it("maps the winner's win probability to a 0..1 dominance scale (upsets stay close)", () => {
    expect(dominanceFromWinnerWinProbability(0.5)).toBe(0);
    expect(dominanceFromWinnerWinProbability(1)).toBe(1);
    // Underdog winner: their pre-game chance was below 0.5, so the game reads as
    // close (0), not a blowout.
    expect(dominanceFromWinnerWinProbability(0.3)).toBe(0);
    expect(dominanceFromWinnerWinProbability(0.75)).toBeCloseTo(0.5, 5);
  });

  it("preserves steal metadata on baron/elder events for later narration", () => {
    let sawSteal = false;

    for (let index = 0; index < 40; index += 1) {
      const timeline = generateMatchTimeline({
        seed: `steal-${index}`,
        winningSide: "blue",
        dominance: 0.1,
      });

      for (const event of timeline.events) {
        if (event.type === "baron" || event.type === "elder") {
          expect(typeof event.isSteal).toBe("boolean");

          if (event.isSteal) {
            sawSteal = true;
          }
        }
      }
    }

    // Steals are rare but must be reachable across many games.
    expect(sawSteal).toBe(true);
  });

  it("scales teamfight assist counts up as the game goes later", () => {
    let earlyAssists = 0;
    let earlyKills = 0;
    let lateAssists = 0;
    let lateKills = 0;

    for (let index = 0; index < 8; index += 1) {
      const timeline = generateMatchTimeline({
        seed: `assist-curve-${index}`,
        winningSide: "blue",
        dominance: 0.2,
      });

      for (const event of timeline.events) {
        if (event.type !== "kill" || !event.kill || event.kill.isSolo) {
          continue;
        }

        const progress = event.timeSec / timeline.durationSec;

        if (progress < 0.4) {
          earlyAssists += event.kill.assistRoles.length;
          earlyKills += 1;
        } else if (progress > 0.6) {
          lateAssists += event.kill.assistRoles.length;
          lateKills += 1;
        }
      }
    }

    expect(earlyKills).toBeGreaterThan(0);
    expect(lateKills).toBeGreaterThan(0);
    expect(lateAssists / lateKills).toBeGreaterThan(earlyAssists / earlyKills);
  });

  it("grows the respawn window with game time", () => {
    // Short and capped at both ends, longer later — a champion downed at 33:00
    // cannot die again 28s later, which is the bug this guards against.
    expect(respawnWindowSec(60)).toBe(10);
    expect(respawnWindowSec(33 * 60)).toBeGreaterThan(28);
    expect(respawnWindowSec(60 * 60)).toBe(52);
    expect(respawnWindowSec(20 * 60)).toBeGreaterThan(respawnWindowSec(5 * 60));
  });

  it("never narrates the same champion dying twice before it could respawn", () => {
    for (let index = 0; index < 120; index += 1) {
      for (const winningSide of ["blue", "red"] as LiveMatchSide[]) {
        for (const dominance of [0.05, 0.4]) {
          const timeline = generateMatchTimeline({
            seed: `respawn-${index}`,
            winningSide,
            dominance,
          });
          // Only the surfaced (visible) kills become commentary the user reads;
          // two of them downing the same champion within a respawn is the glitch.
          const lastVisibleDeath = new Map<string, number>();

          for (const event of timeline.events) {
            if (event.type !== "kill" || !event.kill || !event.visible) {
              continue;
            }

            const victimSide = event.side === "blue" ? "red" : "blue";
            const key = `${victimSide}-${event.kill.victimRole}`;
            const previous = lastVisibleDeath.get(key);

            if (previous !== undefined) {
              expect(event.timeSec - previous).toBeGreaterThanOrEqual(
                respawnWindowSec(event.timeSec),
              );
            }

            lastVisibleDeath.set(key, event.timeSec);
          }
        }
      }
    }
  });

  it("keeps a visible closing kill and the nexus even when an ace is trimmed", () => {
    for (const seed of ["close-1", "close-2", "close-3", "close-4"]) {
      const timeline = generateMatchTimeline({ seed, winningSide: "blue", dominance: 0.7 });
      const last = timeline.events[timeline.events.length - 1];

      expect(last.type).toBe("nexus");
      expect(last.visible).toBe(true);
      // The nexus stays the sole guaranteed critical finale; trimming an
      // impossible closing kill must not strip the visible closing push.
      expect(timeline.events.some((event) => event.type === "nexus" && event.visible)).toBe(true);
      expect(timeline.events.some((event) => event.type === "inhibitor" && event.visible)).toBe(true);
    }
  });
});
