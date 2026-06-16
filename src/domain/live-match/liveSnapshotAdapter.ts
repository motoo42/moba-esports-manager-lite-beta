import { getLiveMatchItemSlotsAt } from "./liveItemBuilds";
import type { MatchStatSnapshot, ObjectiveTally, TeamStatSnapshot } from "./matchStats";
import type {
  LiveNarrationContext,
  LiveNarrationTeamContext,
} from "./matchNarration";
import type {
  LiveMatchObjectiveSnapshot,
  LiveMatchSide,
  LiveMatchTeamPresentation,
} from "./types";

// Maps the engine's numeric stat snapshot onto the existing presentation shapes.
// Pure: identity (team/player names, champions, portraits) is carried over from the
// base presentation; only the live numbers are overwritten. Item slots fill over time
// from the build timeline when a side + final snapshot are supplied (progress =
// gold(t) / final gold); without them they are left as-is.

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
    dragonTypes: tally.dragonTypes,
    heralds: tally.heralds,
    towers: tally.towers,
  };
}

export function applyStatSnapshotToTeam({
  finalTeam,
  side,
  snapshot,
  team,
}: {
  // The team's FINAL snapshot — its players' end-game gold sets each build's 100%
  // mark, so item slots fill proportionally over the game. Omit to leave items as-is.
  finalTeam?: TeamStatSnapshot;
  side?: LiveMatchSide;
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

      const finalGold = finalTeam?.players[player.role]?.gold;
      const itemSlots =
        side && finalGold && finalGold > 0
          ? getLiveMatchItemSlotsAt(side, player.role, stat.gold / finalGold)
          : player.stats.itemSlots;

      return {
        ...player,
        stats: {
          ...player.stats,
          assists: stat.assists,
          deaths: stat.deaths,
          gold: formatLiveGold(stat.gold),
          itemSlots,
          kills: stat.kills,
          level: stat.level,
        },
      };
    }),
  };
}

export function applyStatSnapshotToTeams({
  blueTeam,
  finalSnapshot,
  redTeam,
  snapshot,
}: {
  blueTeam: LiveMatchTeamPresentation;
  // Final-frame snapshot; enables time-based item slots (see applyStatSnapshotToTeam).
  finalSnapshot?: MatchStatSnapshot;
  redTeam: LiveMatchTeamPresentation;
  snapshot: MatchStatSnapshot;
}) {
  return {
    blueTeam: applyStatSnapshotToTeam({
      finalTeam: finalSnapshot?.blue,
      side: "blue",
      snapshot: snapshot.blue,
      team: blueTeam,
    }),
    redTeam: applyStatSnapshotToTeam({
      finalTeam: finalSnapshot?.red,
      side: "red",
      snapshot: snapshot.red,
      team: redTeam,
    }),
  };
}

function toNarrationTeamContext(
  team: LiveMatchTeamPresentation,
): LiveNarrationTeamContext {
  const players = {} as LiveNarrationTeamContext["players"];

  for (const player of team.players) {
    players[player.role] = {
      championName: player.champion.name,
      name: player.name,
    };
  }

  return { name: team.name, players, shortName: team.shortName };
}

// Builds the name/champion lookup the commentary narrator needs from the same
// team presentations the screen already renders, so prose stays consistent with
// what is on screen.
export function buildNarrationContext({
  blueTeam,
  redTeam,
}: {
  blueTeam: LiveMatchTeamPresentation;
  redTeam: LiveMatchTeamPresentation;
}): LiveNarrationContext {
  return {
    blue: toNarrationTeamContext(blueTeam),
    red: toNarrationTeamContext(redTeam),
  };
}
