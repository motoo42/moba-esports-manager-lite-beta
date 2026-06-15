import { createSeededRandom } from "../rng/createSeededRandom";
import type { Role } from "../../types/game";
import type {
  LiveMatchEventAdvantage,
  LiveMatchImportance,
  LiveMatchSide,
} from "./types";

// Internal match timeline = the structural source of truth for the live-match
// presentation layer. It is generated procedurally from an already-decided
// match result (winning side + how dominant the win was) so the replay never
// contradicts the existing match simulation. Message prose that depends on team
// and player names is rendered in a later step; this module stays structural so
// it is deterministic and testable.

export const matchTimelineRoles: Role[] = [
  "top",
  "jungle",
  "mid",
  "bot",
  "support",
];

export type MatchTimelineEventType =
  | "kill"
  | "tower"
  | "inhibitor"
  | "dragon"
  | "soul"
  | "herald"
  | "baron"
  | "elder"
  | "nexus";

export type DragonType =
  | "infernal"
  | "mountain"
  | "ocean"
  | "cloud"
  | "hextech"
  | "chemtech";

export const dragonTypes: DragonType[] = [
  "infernal",
  "mountain",
  "ocean",
  "cloud",
  "hextech",
  "chemtech",
];

export type MatchTimelineKillInfo = {
  assistRoles: Role[];
  isLaningPhase: boolean;
  isSolo: boolean;
  killerRole: Role;
  victimRole: Role;
};

export type MatchTimelineEvent = {
  advantage: LiveMatchEventAdvantage;
  // Set on dragon/soul events: which elemental dragon it was.
  dragonType?: DragonType;
  id: string;
  importance: LiveMatchImportance;
  // Set on baron/elder events: true when the objective was stolen. Preserved so
  // the message-rendering step can phrase a steal differently from a clean take.
  isSteal?: boolean;
  kill?: MatchTimelineKillInfo;
  side: LiveMatchSide;
  timeSec: number;
  type: MatchTimelineEventType;
  visible: boolean;
};

export type GeneratedMatchTimeline = {
  durationSec: number;
  events: MatchTimelineEvent[];
  finalKills: Record<LiveMatchSide, number>;
  winningSide: LiveMatchSide;
};

export type GenerateMatchTimelineInput = {
  // 0 = coin-flip, 1 = total stomp. Drives game length and the winner's lead.
  // Required on purpose: tone depends entirely on this, so a forgotten value is
  // a compile error rather than a silent "medium game". Callers derive it via
  // dominanceFromWinnerWinProbability(winner's pre-game chance).
  dominance: number;
  seed: string;
  winningSide: LiveMatchSide;
};

type DraftEvent = Omit<MatchTimelineEvent, "id">;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function opposite(side: LiveMatchSide): LiveMatchSide {
  return side === "blue" ? "red" : "blue";
}

function pickRole(random: () => number) {
  return matchTimelineRoles[
    Math.floor(random() * matchTimelineRoles.length)
  ];
}

function sampleRoles(random: () => number, pool: Role[], count: number) {
  const available = [...pool];
  const picked: Role[] = [];

  for (let index = 0; index < count && available.length > 0; index += 1) {
    const choice = Math.floor(random() * available.length);
    picked.push(available.splice(choice, 1)[0]);
  }

  return picked;
}

function createSoloKill(
  random: () => number,
  isLaningPhase: boolean,
): MatchTimelineKillInfo {
  return {
    assistRoles: [],
    isLaningPhase,
    isSolo: true,
    killerRole: pickRole(random),
    victimRole: pickRole(random),
  };
}

function teamfightAssistCount(random: () => number, progress: number) {
  // Assist counts shift with game time. Early skirmishes are small (1-2 assists,
  // a 4-assist fight is very rare); late teamfights are full 5v5 brawls (3-4
  // assists, a 1-assist fight is rare). The full 1-4 range still occurs, and the
  // game-wide average lands in the ~2-3 band the spec asks for.
  const center = lerp(1.5, 3.5, clamp(progress, 0, 1));
  const noisy = center + (random() - 0.5) * 2.2;

  return clamp(Math.round(noisy), 1, 4);
}

function createTeamfightKill(
  random: () => number,
  isLaningPhase: boolean,
  progress: number,
): MatchTimelineKillInfo {
  const killerRole = pickRole(random);
  const assistRoles = sampleRoles(
    random,
    matchTimelineRoles.filter((role) => role !== killerRole),
    teamfightAssistCount(random, progress),
  );

  return {
    assistRoles,
    isLaningPhase,
    isSolo: false,
    killerRole,
    victimRole: pickRole(random),
  };
}

function toGameDurationMinutes(random: () => number, dominance: number) {
  const roll = random();

  if (dominance >= 0.55) {
    return lerp(24, 29, roll);
  }

  if (dominance >= 0.3) {
    return lerp(30, 36, roll);
  }

  if (dominance >= 0.12) {
    return lerp(37, 44, roll);
  }

  return random() < 0.7 ? lerp(37, 44, roll) : lerp(45, 52, roll);
}

function countKillsBySide(
  events: Array<Pick<MatchTimelineEvent, "side" | "type">>,
): Record<LiveMatchSide, number> {
  const kills: Record<LiveMatchSide, number> = { blue: 0, red: 0 };

  for (const event of events) {
    if (event.type === "kill") {
      kills[event.side] += 1;
    }
  }

  return kills;
}

/**
 * Derive a 0..1 dominance value from the PRE-GAME win chance of the team that
 * actually won. Favored winners map toward a stomp (1); a coin-flip maps to 0.
 *
 * Only the upside is mapped, so an upset stays close: if the underdog won, pass
 * their (sub-0.5) win chance and dominance clamps to 0 — the replay reads as a
 * scrappy game, not a blowout. Callers must compute the winner's probability,
 * e.g. `winner === "user" ? result.winProbability : 1 - result.winProbability`.
 */
export function dominanceFromWinnerWinProbability(winnerWinProbability: number) {
  return clamp((winnerWinProbability - 0.5) * 2, 0, 1);
}

// Drakes 1-3 are three distinct elementals; from the 3rd onward they all repeat
// the 3rd one, so a soul (granted on a team's 4th dragon) is always that element.
function pickDragonRotation(random: () => number): DragonType[] {
  const pool = [...dragonTypes];
  const rotation: DragonType[] = [];

  for (let index = 0; index < 3; index += 1) {
    rotation.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }

  return rotation;
}

export function generateMatchTimeline(
  input: GenerateMatchTimelineInput,
): GeneratedMatchTimeline {
  const random = createSeededRandom(input.seed);
  const winningSide = input.winningSide;
  const losingSide = opposite(winningSide);
  const dominance = clamp(input.dominance, 0, 1);
  const durationMin = toGameDurationMinutes(random, dominance);
  const durationSec = Math.round(durationMin * 60);
  const events: DraftEvent[] = [];

  const winnerWeighted = (lead: number) =>
    random() < clamp(0.5 + dominance * lead, 0.5, 0.85)
      ? winningSide
      : losingSide;

  // 1. Dragons & soul. A team earns the soul on ITS 4th dragon, so up to 7
  //    dragons can spawn (a 3-3 split, then the 7th grants someone the soul).
  //    Only the first dragon and the soul itself surface in the commentary feed.
  const dragonCountBySide: Record<LiveMatchSide, number> = { blue: 0, red: 0 };
  const dragonRotation = pickDragonRotation(random);
  let soulSecured = false;
  let soulTimeSec = 0;

  for (let index = 0; index < 7; index += 1) {
    const timeSec = Math.round((6 + index * 5 + (random() - 0.5) * 1.5) * 60);

    if (timeSec > durationSec - 80) {
      break;
    }

    const side = winnerWeighted(0.18);
    dragonCountBySide[side] += 1;
    const isSoul = dragonCountBySide[side] === 4;

    events.push({
      advantage: side,
      dragonType: dragonRotation[Math.min(index, 2)],
      importance: isSoul ? "high" : index === 0 ? "medium" : "low",
      side,
      timeSec,
      type: isSoul ? "soul" : "dragon",
      visible: isSoul || index === 0,
    });

    if (isSoul) {
      soulSecured = true;
      soulTimeSec = timeSec;
      break;
    }
  }

  // 2. Rift Herald (early, usually internal-only).
  if (durationMin >= 9) {
    const side = winnerWeighted(0.1);

    events.push({
      advantage: dominance < 0.2 && random() < 0.5 ? "neutral" : side,
      importance: "low",
      side,
      timeSec: clamp(
        Math.round((9 + random() * 5) * 60),
        8 * 60,
        durationSec - 120,
      ),
      type: "herald",
      visible: false,
    });
  }

  // 3. Baron(s) — strongly winner-weighted, occasionally a steal (critical).
  if (durationMin >= 22) {
    const baronCount = random() < 0.45 ? 2 : 1;

    for (let index = 0; index < baronCount; index += 1) {
      const side = winnerWeighted(0.2);
      const isSteal = random() < 0.12;

      events.push({
        advantage: side,
        importance: isSteal ? "critical" : "high",
        isSteal,
        side,
        timeSec: clamp(
          Math.round((22 + index * 7 + random() * 4) * 60),
          20 * 60,
          durationSec - 90,
        ),
        type: "baron",
        visible: true,
      });
    }
  }

  // 4. Elder dragon — only spawns once a soul has been secured, then re-spawns on
  //    a timer. Either side can take it, occasionally as a steal.
  if (soulSecured) {
    for (let index = 0; index < 3; index += 1) {
      const timeSec = Math.round(
        (soulTimeSec / 60 + 6 + index * 6 + random() * 1.5) * 60,
      );

      if (timeSec > durationSec - 70) {
        break;
      }

      const side = winnerWeighted(0.2);
      const isSteal = random() < 0.1;

      events.push({
        advantage: side,
        importance: "critical",
        isSteal,
        side,
        timeSec,
        type: "elder",
        visible: true,
      });
    }
  }

  // 5. Laning-phase solo kills — rare but always surfaced as key moments.
  const laningKills = Math.floor(random() * 2);

  for (let index = 0; index < laningKills; index += 1) {
    const side = winnerWeighted(0.15);

    events.push({
      advantage: side,
      importance: "high",
      kill: createSoloKill(random, true),
      side,
      timeSec: clamp(Math.round((3 + random() * 10) * 60), 2 * 60, 14 * 60),
      type: "kill",
      visible: true,
    });
  }

  // 6. Mid/late skirmishes and teamfights. Even trades produce neutral-colored
  //    kills for both sides; one-sided fights lean toward the winner. A per-game
  //    kill pace (randomized) scales how many fights spawn: a bloodbath produces
  //    both more kills (>1 combined kill/min) and a denser commentary feed, while
  //    a slow game grinds out ~0.4/min. More fights also means more big (visible)
  //    ones, so feed density tracks the kill pace.
  const killPace = lerp(0.55, 2, random());
  const skirmishCount = Math.max(
    3,
    Math.round((3 + durationMin / 4) * killPace),
  );

  for (let index = 0; index < skirmishCount; index += 1) {
    const timeSec = clamp(
      Math.round((14 + random() * (durationMin - 16)) * 60),
      12 * 60,
      durationSec - 150,
    );
    const progress = timeSec / durationSec;
    const isEvenTrade = random() < 0.3;

    if (isEvenTrade) {
      // A mutual trade: one side's kill surfaces as a neutral-toned message so
      // the feed carries a healthy share of neutral moments; the other stays
      // internal (it still folds into the stats / keeps kills == deaths).
      events.push({
        advantage: "neutral",
        importance: "medium",
        kill: createTeamfightKill(random, false, progress),
        side: winningSide,
        timeSec,
        type: "kill",
        visible: true,
      });
      events.push({
        advantage: "neutral",
        importance: "low",
        kill: createTeamfightKill(random, false, progress),
        side: losingSide,
        timeSec: timeSec + 8,
        type: "kill",
        visible: false,
      });
      continue;
    }

    const side = winnerWeighted(0.22);
    const isBigFight = random() < 0.3;

    events.push({
      advantage: side,
      importance: isBigFight ? "high" : "medium",
      kill: createTeamfightKill(random, false, progress),
      side,
      timeSec,
      type: "kill",
      visible: isBigFight,
    });

    if (isBigFight && random() < 0.5) {
      events.push({
        advantage: side,
        importance: "high",
        kill: createTeamfightKill(random, false, progress),
        side,
        timeSec: timeSec + 10,
        type: "kill",
        visible: false,
      });
    }
  }

  // 7. Towers — winner takes the majority, almost all internal-only.
  const winnerTowers = 5 + Math.floor(random() * 5);
  const loserTowers = 1 + Math.floor(random() * 4);

  for (let index = 0; index < winnerTowers; index += 1) {
    events.push({
      advantage: winningSide,
      importance: "low",
      side: winningSide,
      timeSec: clamp(
        Math.round((10 + random() * (durationMin - 10)) * 60),
        9 * 60,
        durationSec - 40,
      ),
      type: "tower",
      visible: false,
    });
  }

  for (let index = 0; index < loserTowers; index += 1) {
    events.push({
      advantage: losingSide,
      importance: "low",
      side: losingSide,
      timeSec: clamp(
        Math.round((12 + random() * (durationMin - 12)) * 60),
        10 * 60,
        durationSec - 90,
      ),
      type: "tower",
      visible: false,
    });
  }

  // 8. Closing sequence in the final 2-3 minutes — always present and visible.
  const closingFightStart =
    durationSec - clamp(Math.round(90 + random() * 60), 90, 170);
  const closingKills = 2 + Math.floor(random() * 3);

  for (let index = 0; index < closingKills; index += 1) {
    const timeSec = closingFightStart + index * 12;

    events.push({
      advantage: winningSide,
      importance: index === closingKills - 1 ? "critical" : "high",
      kill: createTeamfightKill(random, false, timeSec / durationSec),
      side: winningSide,
      timeSec,
      type: "kill",
      visible: true,
    });
  }

  events.push({
    advantage: winningSide,
    importance: "high",
    side: winningSide,
    timeSec: durationSec - 50,
    type: "inhibitor",
    visible: true,
  });
  events.push({
    advantage: winningSide,
    importance: "critical",
    side: winningSide,
    timeSec: durationSec,
    type: "nexus",
    visible: true,
  });

  const ordered = events
    .filter((event) => event.timeSec <= durationSec)
    .sort((left, right) => left.timeSec - right.timeSec)
    .map((event, index) => ({ ...event, id: `evt-${index}` }));

  // Guarantee the winning side finishes ahead on kills. Even-trade kills are
  // left untouched so the trade pairing (and kills = deaths) stays intact.
  let kills = countKillsBySide(ordered);

  for (const event of ordered) {
    if (kills[winningSide] > kills[losingSide]) {
      break;
    }

    if (
      event.type === "kill" &&
      event.side === losingSide &&
      event.advantage !== "neutral"
    ) {
      event.side = winningSide;
      event.advantage = winningSide;
      kills = countKillsBySide(ordered);
    }
  }

  return {
    durationSec,
    events: ordered,
    finalKills: countKillsBySide(ordered),
    winningSide,
  };
}
