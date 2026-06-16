import { findLckTeamSeed, getLckTeamDisplayName } from "../../data/lckTeams";
import type { CareerSave, MatchSchedule, Role } from "../../types/game";
import {
  getMockChampionForRole,
  liveMatchRoles,
} from "./mockDraft";
import {
  getMockLiveMatchPlayerBaseStats,
  getMockLiveMatchTeamStats,
} from "./mockStats";
import { getLiveMatchPlayerIdentity } from "./playerSelection";
import type {
  LiveMatchPlayerPresentation,
  LiveMatchSide,
  LiveMatchTeamPresentation,
} from "./types";

function createMockPlayer({
  career,
  isUserTeam,
  role,
  side,
  teamName,
}: {
  career: CareerSave | null;
  isUserTeam: boolean;
  role: Role;
  side: LiveMatchSide;
  teamName: string;
}): LiveMatchPlayerPresentation {
  const player = getLiveMatchPlayerIdentity({
    career,
    isUserTeam,
    role,
    teamName,
  });
  const baseStats = getMockLiveMatchPlayerBaseStats(side, role);

  return {
    champion: getMockChampionForRole(role, side),
    name: player.name,
    portraitUrl: player.portraitUrl,
    role,
    stats: {
      ...baseStats,
      // Items start empty; the live snapshot adapter fills the slots over time from
      // the build timeline (progress = gold(t) / final gold).
      itemSlots: [],
    },
  };
}

function getTeamNameForSide(match: MatchSchedule | undefined, side: LiveMatchSide) {
  if (!match) {
    return side === "blue" ? "T1" : "Gen.G";
  }

  return side === "blue" ? match.blueTeamName : match.redTeamName;
}

function getTeamIdForSide(match: MatchSchedule | undefined, side: LiveMatchSide) {
  if (!match) {
    return side === "blue" ? "t1" : "gen-g";
  }

  return side === "blue" ? match.blueTeamId : match.redTeamId;
}

export function createMockLiveMatchTeam({
  career,
  match,
  side,
  userTeamId,
}: {
  career: CareerSave | null;
  match?: MatchSchedule;
  side: LiveMatchSide;
  userTeamId: string;
}): LiveMatchTeamPresentation {
  const teamId = getTeamIdForSide(match, side);
  const teamName = getTeamNameForSide(match, side);
  const seed = findLckTeamSeed(teamId) ?? findLckTeamSeed(teamName);
  const teamStats = getMockLiveMatchTeamStats(side);
  const isUserTeam =
    teamId === userTeamId || Boolean(career && teamName === career.userTeam.name);

  return {
    gold: teamStats.gold,
    id: teamId,
    kills: teamStats.kills,
    name: getLckTeamDisplayName(seed ?? teamName),
    objectives: teamStats.objectives,
    players: liveMatchRoles.map((role) =>
      createMockPlayer({
        career,
        isUserTeam,
        role,
        side,
        teamName,
      }),
    ),
    shortName: seed?.shortName ?? teamName.slice(0, 3).toUpperCase(),
  };
}
