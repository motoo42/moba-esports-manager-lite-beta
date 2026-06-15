import type { MatchStatSnapshot, ObjectiveTally, TeamStatSnapshot } from "./matchStats";
import type {
  LiveMatchObjectiveSnapshot,
  LiveMatchTeamPresentation,
} from "./types";

// Maps the engine's numeric stat snapshot onto the existing presentation shapes.
// Pure: identity (team/player names, champions, portraits, item slots) is carried
// over from the base presentation; only the live numbers are overwritten. Item
// slots stay as-is because the v1 engine does not generate items.

export function formatLiveGold(gold: number): string {
  if (gold >= 1000) {
    return `${(gold / 1000).toFixed(1)}K`;
  }

  return String(Math.round(gold));
}

// The on-screen objective bar only shows four counters. Soul is already folded
// into the dragon count; elder / inhibitor are surfaced via commentary instead.
export function toLiveObjectiveSnapshot(
  tally: ObjectiveTally,
): LiveMatchObjectiveSnapshot {
  return {
    barons: tally.barons,
    dragons: tally.dragons,
    heralds: tally.heralds,
    towers: tally.towers,
  };
}

export function applyStatSnapshotToTeam({
  snapshot,
  team,
}: {
  snapshot: TeamStatSnapshot;
  team: LiveMatchTeamPresentation;
}): LiveMatchTeamPresentation {
  return {
    ...team,
    gold: formatLiveGold(snapshot.gold),
    kills: snapshot.kills,
    objectives: toLiveObjectiveSnapshot(snapshot.objectives),
    players: team.players.map((player) => {
      const stat = snapshot.players[player.role];

      if (!stat) {
        return player;
      }

      return {
        ...player,
        stats: {
          ...player.stats,
          assists: stat.assists,
          deaths: stat.deaths,
          gold: formatLiveGold(stat.gold),
          kills: stat.kills,
          level: stat.level,
        },
      };
    }),
  };
}

export function applyStatSnapshotToTeams({
  blueTeam,
  redTeam,
  snapshot,
}: {
  blueTeam: LiveMatchTeamPresentation;
  redTeam: LiveMatchTeamPresentation;
  snapshot: MatchStatSnapshot;
}) {
  return {
    blueTeam: applyStatSnapshotToTeam({ snapshot: snapshot.blue, team: blueTeam }),
    redTeam: applyStatSnapshotToTeam({ snapshot: snapshot.red, team: redTeam }),
  };
}
