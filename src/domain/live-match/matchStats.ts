import type { Role } from "../../types/game";
import {
  matchTimelineRoles,
  type DragonType,
  type GeneratedMatchTimeline,
  type MatchTimelineEvent,
} from "./matchTimeline";
import type { LiveMatchSide } from "./types";

// Stat fold for the live-match replay layer. Given an already-generated timeline
// (the structural source of truth) this folds events up to a point in time into
// cumulative per-player and per-team numbers. It is pure and deterministic: no
// RNG, only the timeline plus fixed economy/level constants. Gold stays a raw
// number here; the presentation adapter formats it ("55.1K") and maps the full
// objective tally onto whatever the on-screen objective bar shows.

export type PlayerStatSnapshot = {
  assists: number;
  deaths: number;
  gold: number;
  kills: number;
  level: number;
};

export type ObjectiveTally = {
  barons: number;
  dragons: number;
  // Elemental dragons taken, in the order they were taken.
  dragonTypes: DragonType[];
  elders: number;
  heralds: number;
  inhibitors: number;
  soulTaken: boolean;
  towers: number;
};

export type TeamStatSnapshot = {
  gold: number;
  kills: number;
  objectives: ObjectiveTally;
  players: Record<Role, PlayerStatSnapshot>;
};

export type MatchStatSnapshot = {
  blue: TeamStatSnapshot;
  red: TeamStatSnapshot;
  timeSec: number;
};

const STARTING_GOLD = 500;
const KILL_GOLD = 300;
const ASSIST_GOLD = 100;
const MAX_LEVEL = 18;
const LEVEL_COMBAT_BONUS = 0.06;

// Tuned so a 28-minute game lands carries near 11-13K / supports near 7-8K gold
// and carries near level 16 / supports near 12, matching the reference HUD tone.
const passiveGoldPerSecByRole: Record<Role, number> = {
  top: 6.2,
  jungle: 6.0,
  mid: 6.8,
  bot: 7.0,
  support: 4.2,
};

const levelRatePerSecByRole: Record<Role, number> = {
  top: 0.0083,
  jungle: 0.008,
  mid: 0.0089,
  bot: 0.0086,
  support: 0.0066,
};

const objectiveGold: Record<
  Exclude<MatchTimelineEvent["type"], "kill" | "nexus">,
  number
> = {
  tower: 90,
  dragon: 25,
  soul: 65,
  herald: 40,
  baron: 150,
  elder: 120,
  inhibitor: 120,
};

type PlayerAccumulator = {
  assists: number;
  bonusGold: number;
  deaths: number;
  kills: number;
  participations: number;
};

type TeamAccumulator = {
  objectives: ObjectiveTally;
  players: Record<Role, PlayerAccumulator>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function opposite(side: LiveMatchSide): LiveMatchSide {
  return side === "blue" ? "red" : "blue";
}

function createObjectiveTally(): ObjectiveTally {
  return {
    barons: 0,
    dragons: 0,
    dragonTypes: [],
    elders: 0,
    heralds: 0,
    inhibitors: 0,
    soulTaken: false,
    towers: 0,
  };
}

function createPlayerAccumulators(): Record<Role, PlayerAccumulator> {
  const players = {} as Record<Role, PlayerAccumulator>;

  for (const role of matchTimelineRoles) {
    players[role] = {
      assists: 0,
      bonusGold: 0,
      deaths: 0,
      kills: 0,
      participations: 0,
    };
  }

  return players;
}

function createTeamAccumulator(): TeamAccumulator {
  return {
    objectives: createObjectiveTally(),
    players: createPlayerAccumulators(),
  };
}

function applyKillEvent(
  teams: Record<LiveMatchSide, TeamAccumulator>,
  event: MatchTimelineEvent,
) {
  if (!event.kill) {
    return;
  }

  const scoring = teams[event.side];
  const conceding = teams[opposite(event.side)];
  const killer = scoring.players[event.kill.killerRole];

  killer.kills += 1;
  killer.participations += 1;
  killer.bonusGold += KILL_GOLD;

  for (const assistRole of event.kill.assistRoles) {
    const assister = scoring.players[assistRole];
    assister.assists += 1;
    assister.participations += 1;
    assister.bonusGold += ASSIST_GOLD;
  }

  conceding.players[event.kill.victimRole].deaths += 1;
}

function applyObjectiveEvent(
  teams: Record<LiveMatchSide, TeamAccumulator>,
  event: MatchTimelineEvent,
) {
  const team = teams[event.side];
  const { objectives } = team;

  switch (event.type) {
    case "dragon":
      objectives.dragons += 1;
      if (event.dragonType) {
        objectives.dragonTypes.push(event.dragonType);
      }
      break;
    case "soul":
      objectives.dragons += 1;
      objectives.soulTaken = true;
      if (event.dragonType) {
        objectives.dragonTypes.push(event.dragonType);
      }
      break;
    case "herald":
      objectives.heralds += 1;
      break;
    case "baron":
      objectives.barons += 1;
      break;
    case "elder":
      objectives.elders += 1;
      break;
    case "tower":
      objectives.towers += 1;
      break;
    case "inhibitor":
      objectives.inhibitors += 1;
      break;
    default:
      return;
  }

  const reward = objectiveGold[event.type as keyof typeof objectiveGold];

  for (const role of matchTimelineRoles) {
    team.players[role].bonusGold += reward;
  }
}

function finalizePlayer(
  accumulator: PlayerAccumulator,
  role: Role,
  timeSec: number,
  goldRateMultiplier = 1,
): PlayerStatSnapshot {
  const gold = Math.round(
    STARTING_GOLD +
      passiveGoldPerSecByRole[role] * timeSec * goldRateMultiplier +
      accumulator.bonusGold,
  );
  const level = clamp(
    Math.round(
      1 +
        levelRatePerSecByRole[role] * timeSec +
        LEVEL_COMBAT_BONUS * accumulator.participations,
    ),
    1,
    MAX_LEVEL,
  );

  return {
    assists: accumulator.assists,
    deaths: accumulator.deaths,
    gold,
    kills: accumulator.kills,
    level,
  };
}

function finalizeTeam(
  team: TeamAccumulator,
  timeSec: number,
  goldRateMultipliers?: Record<Role, number>,
): TeamStatSnapshot {
  const players = {} as Record<Role, PlayerStatSnapshot>;
  let kills = 0;
  let gold = 0;

  for (const role of matchTimelineRoles) {
    const player = finalizePlayer(
      team.players[role],
      role,
      timeSec,
      goldRateMultipliers?.[role] ?? 1,
    );
    players[role] = player;
    kills += player.kills;
    gold += player.gold;
  }

  return { gold, kills, objectives: team.objectives, players };
}

/**
 * Fold the timeline into a cumulative stat snapshot at `timeSec`. Only events at
 * or before that time count. Times past the game's end clamp to the final state.
 */
export function getMatchSnapshotAt(
  timeline: GeneratedMatchTimeline,
  timeSec: number,
): MatchStatSnapshot {
  const cappedTime = clamp(timeSec, 0, timeline.durationSec);
  const teams: Record<LiveMatchSide, TeamAccumulator> = {
    blue: createTeamAccumulator(),
    red: createTeamAccumulator(),
  };

  for (const event of timeline.events) {
    if (event.timeSec > cappedTime) {
      continue;
    }

    if (event.type === "kill") {
      applyKillEvent(teams, event);
    } else if (event.type !== "nexus") {
      applyObjectiveEvent(teams, event);
    }
  }

  return {
    blue: finalizeTeam(teams.blue, cappedTime, timeline.goldRateMultipliers?.blue),
    red: finalizeTeam(teams.red, cappedTime, timeline.goldRateMultipliers?.red),
    timeSec: cappedTime,
  };
}

export function getFinalMatchSnapshot(
  timeline: GeneratedMatchTimeline,
): MatchStatSnapshot {
  return getMatchSnapshotAt(timeline, timeline.durationSec);
}
