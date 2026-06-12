import { lck2026Teams } from "../../data/lckTeams";
import type {
  CareerSave,
  OffseasonLogEntry,
  Player,
  PlayerContract,
  Role,
  Team,
} from "../../types/game";
import { createPlayerContract } from "../players";

type AutoAssignmentPlacement = "academy" | "emergency-main" | "main";

type AutoAssignment = {
  isUserTeamRelated?: boolean;
  placement: AutoAssignmentPlacement;
  playerName: string;
  role: Role;
  teamName: string;
};

const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];
const academyPromotionOverallThreshold = 70;
const minimumMainRosterPlayers = 5;
const minimumAcademyRosterPlayers = 5;

function getCurrentOffseasonDay(career: CareerSave) {
  return career.seasonState.offseason?.currentDay ?? 1;
}

function getCurrentOffseasonWeek(day: number) {
  return Math.min(4, Math.max(1, Math.ceil(day / 7)));
}

function removeValue(values: string[], value: string) {
  return values.filter((candidate) => candidate !== value);
}

function addUniqueValue(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function getPlayer(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId);
}

function getActiveContractedIds(team: Team, players: Player[]) {
  return new Set(
    team.contracts
      .filter((contract) => {
        const player = getPlayer(players, contract.playerId);

        return contract.remainingYears > 0 && player?.availableForRoster;
      })
      .map((contract) => contract.playerId),
  );
}

function getUserMainRosterPlayerIds(career: CareerSave) {
  const contractedIds = getActiveContractedIds(career.userTeam, career.lckPlayers);
  const starterPlayerIds = roleOrder
    .map((role) => career.userTeam.roster[role])
    .filter((playerId): playerId is string => Boolean(playerId));

  return [
    ...new Set([...career.userTeam.mainRosterPlayerIds, ...starterPlayerIds]),
  ].filter((playerId) => {
    const player = getPlayer(career.lckPlayers, playerId);

    return contractedIds.has(playerId) && Boolean(player?.availableForRoster);
  });
}

function getUserAcademyRosterPlayerIds(career: CareerSave) {
  const contractedIds = getActiveContractedIds(career.userTeam, career.lckPlayers);

  return career.userTeam.academyRosterPlayerIds.filter((playerId) => {
    const player = getPlayer(career.lckPlayers, playerId);

    return contractedIds.has(playerId) && Boolean(player?.availableForRoster);
  });
}

function getUserMissingStarterRoles(career: CareerSave) {
  const contractedIds = getActiveContractedIds(career.userTeam, career.lckPlayers);

  return roleOrder.filter((role) => {
    const starterId = career.userTeam.roster[role];
    const starter = starterId ? getPlayer(career.lckPlayers, starterId) : undefined;

    return (
      !starterId ||
      !starter ||
      !starter.availableForRoster ||
      !contractedIds.has(starterId) ||
      starter.role !== role
    );
  });
}

function replaceContract(team: Team, contract: PlayerContract): Team {
  const hasExistingContract = team.contracts.some(
    (candidate) => candidate.playerId === contract.playerId,
  );

  return {
    ...team,
    contracts: hasExistingContract
      ? team.contracts.map((candidate) =>
          candidate.playerId === contract.playerId ? contract : candidate,
        )
      : [...team.contracts, contract],
  };
}

function removePlayerFromUserPlacements(team: Team, playerId: string): Team {
  const nextRoster = { ...team.roster };

  Object.entries(nextRoster).forEach(([role, starterId]) => {
    if (starterId === playerId) {
      delete nextRoster[role as Role];
    }
  });

  return {
    ...team,
    roster: nextRoster,
    mainRosterPlayerIds: team.mainRosterPlayerIds.filter((id) => id !== playerId),
    academyRosterPlayerIds: team.academyRosterPlayerIds.filter(
      (id) => id !== playerId,
    ),
  };
}

function createAutoAssignmentContract(playerId: string) {
  return createPlayerContract({
    playerId,
    contractType: "one-year",
    salaryOffer: 0,
  });
}

function getConfirmationPendingPlayerIds(career: CareerSave) {
  return new Set(
    (career.seasonState.offseason?.resolvedOffers ?? [])
      .filter((offer) => offer.status === "confirmation-pending")
      .flatMap((offer) => offer.playerIds),
  );
}

function getAvailableMarketPlayers(career: CareerSave) {
  const freeAgentIds = new Set(
    career.seasonState.offseason?.freeAgentPlayerIds ?? [],
  );
  const confirmationPendingIds = getConfirmationPendingPlayerIds(career);

  return career.lckPlayers.filter(
    (player) =>
      freeAgentIds.has(player.id) &&
      player.availableForRoster &&
      !player.currentTeam &&
      !confirmationPendingIds.has(player.id),
  );
}

function getCandidateScore(player: Player) {
  return player.overall * 1.4 + player.potential * 0.45;
}

function sortCandidates(players: Player[]) {
  return [...players].sort((left, right) => {
    const scoreDiff = getCandidateScore(right) - getCandidateScore(left);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return left.id.localeCompare(right.id);
  });
}

function pickAvailablePlayer(
  career: CareerSave,
  predicate: (player: Player) => boolean,
) {
  return sortCandidates(getAvailableMarketPlayers(career).filter(predicate))[0];
}

export function isAcademyAutoAssignmentCandidate(player: Player) {
  return (
    player.rosterTier === "academy" ||
    player.overall < academyPromotionOverallThreshold
  );
}

export function isAiMainRosterCandidate(player: Player) {
  return (
    player.rosterTier !== "academy" ||
    player.overall >= academyPromotionOverallThreshold
  );
}

export function getAiMainRoleCount(
  players: Player[],
  teamName: string,
  role: Role,
) {
  return players.filter(
    (player) =>
      player.currentTeam === teamName &&
      player.role === role &&
      player.availableForRoster &&
      player.rosterTier !== "academy",
  ).length;
}

function getAiMainRosterCount(players: Player[], teamName: string) {
  return players.filter(
    (player) =>
      player.currentTeam === teamName &&
      player.availableForRoster &&
      player.rosterTier !== "academy",
  ).length;
}

function getAiAcademyRosterCount(players: Player[], teamName: string) {
  return players.filter(
    (player) =>
      player.currentTeam === teamName &&
      player.availableForRoster &&
      player.rosterTier === "academy",
  ).length;
}

function getAiAcademyRoleCount(
  players: Player[],
  teamName: string,
  role: Role,
) {
  return players.filter(
    (player) =>
      player.currentTeam === teamName &&
      player.role === role &&
      player.availableForRoster &&
      player.rosterTier === "academy",
  ).length;
}

function getUserAcademyRoleCount(career: CareerSave, role: Role) {
  const academyPlayerIds = new Set(getUserAcademyRosterPlayerIds(career));

  return career.lckPlayers.filter(
    (player) =>
      player.role === role &&
      player.availableForRoster &&
      academyPlayerIds.has(player.id),
  ).length;
}

function getNeededRoleForUserAcademy(career: CareerSave) {
  return roleOrder.find((role) => getUserAcademyRoleCount(career, role) === 0);
}

function getNeededMainRoleForAi(career: CareerSave, teamName: string) {
  return roleOrder.find(
    (role) => getAiMainRoleCount(career.lckPlayers, teamName, role) === 0,
  );
}

function getNeededAcademyRoleForAi(career: CareerSave, teamName: string) {
  return roleOrder.find(
    (role) => getAiAcademyRoleCount(career.lckPlayers, teamName, role) === 0,
  );
}

function assignPlayerToTeam({
  career,
  placement,
  player,
  teamName,
}: {
  career: CareerSave;
  placement: AutoAssignmentPlacement;
  player: Player;
  teamName: string;
}): CareerSave {
  const offseason = career.seasonState.offseason;
  const rosterTier: NonNullable<Player["rosterTier"]> =
    placement === "academy" ? "academy" : "main";
  const nextPlayers = career.lckPlayers.map((candidate) =>
    candidate.id === player.id
      ? {
          ...candidate,
          currentTeam: teamName,
          rosterTier,
        }
      : candidate,
  );
  let nextUserTeam = career.userTeam;

  if (teamName === career.userTeam.name) {
    const baseTeam = removePlayerFromUserPlacements(
      replaceContract(nextUserTeam, createAutoAssignmentContract(player.id)),
      player.id,
    );

    nextUserTeam =
      placement === "academy"
        ? {
            ...baseTeam,
            academyRosterPlayerIds: addUniqueValue(
              baseTeam.academyRosterPlayerIds,
              player.id,
            ),
          }
        : {
            ...baseTeam,
            roster: {
              ...baseTeam.roster,
              [player.role]: player.id,
            },
            mainRosterPlayerIds: addUniqueValue(
              baseTeam.mainRosterPlayerIds,
              player.id,
            ),
          };
  }

  return {
    ...career,
    lckPlayers: nextPlayers,
    userTeam: nextUserTeam,
    seasonState: {
      ...career.seasonState,
      offseason: offseason
        ? {
            ...offseason,
            freeAgentPlayerIds: removeValue(
              offseason.freeAgentPlayerIds ?? [],
              player.id,
            ),
          }
        : offseason,
    },
  };
}

function addAssignment(
  assignments: AutoAssignment[],
  assignment: AutoAssignment,
) {
  assignments.push(assignment);
}

function ensureUserMainFallback(
  career: CareerSave,
  assignments: AutoAssignment[],
) {
  let nextCareer = career;

  for (const role of getUserMissingStarterRoles(nextCareer)) {
    const player =
      pickAvailablePlayer(
        nextCareer,
        (candidate) =>
          candidate.role === role && isAcademyAutoAssignmentCandidate(candidate),
      ) ??
      pickAvailablePlayer(nextCareer, (candidate) => candidate.role === role);

    if (!player) {
      continue;
    }

    nextCareer = assignPlayerToTeam({
      career: nextCareer,
      placement: "emergency-main",
      player,
      teamName: nextCareer.userTeam.name,
    });
    addAssignment(assignments, {
      isUserTeamRelated: true,
      placement: "emergency-main",
      playerName: player.name,
      role,
      teamName: nextCareer.userTeam.name,
    });
  }

  return nextCareer;
}

function ensureUserAcademyMinimum(
  career: CareerSave,
  assignments: AutoAssignment[],
) {
  let nextCareer = career;

  while (
    getUserAcademyRosterPlayerIds(nextCareer).length <
    minimumAcademyRosterPlayers
  ) {
    const neededRole = getNeededRoleForUserAcademy(nextCareer);
    const player =
      pickAvailablePlayer(
        nextCareer,
        (candidate) =>
          isAcademyAutoAssignmentCandidate(candidate) &&
          (!neededRole || candidate.role === neededRole),
      ) ??
      pickAvailablePlayer(nextCareer, isAcademyAutoAssignmentCandidate);

    if (!player) {
      break;
    }

    nextCareer = assignPlayerToTeam({
      career: nextCareer,
      placement: "academy",
      player,
      teamName: nextCareer.userTeam.name,
    });
    addAssignment(assignments, {
      isUserTeamRelated: true,
      placement: "academy",
      playerName: player.name,
      role: player.role,
      teamName: nextCareer.userTeam.name,
    });
  }

  return nextCareer;
}

function ensureAiMainMinimum(
  career: CareerSave,
  assignments: AutoAssignment[],
  teamName: string,
) {
  let nextCareer = career;

  while (
    getAiMainRosterCount(nextCareer.lckPlayers, teamName) <
    minimumMainRosterPlayers
  ) {
    const neededRole = getNeededMainRoleForAi(nextCareer, teamName);
    const player =
      pickAvailablePlayer(
        nextCareer,
        (candidate) =>
          isAiMainRosterCandidate(candidate) &&
          (!neededRole || candidate.role === neededRole),
      ) ?? pickAvailablePlayer(nextCareer, isAiMainRosterCandidate);

    if (!player) {
      break;
    }

    nextCareer = assignPlayerToTeam({
      career: nextCareer,
      placement: "main",
      player,
      teamName,
    });
    addAssignment(assignments, {
      placement: "main",
      playerName: player.name,
      role: player.role,
      teamName,
    });
  }

  return nextCareer;
}

function ensureAiAcademyMinimum(
  career: CareerSave,
  assignments: AutoAssignment[],
  teamName: string,
) {
  let nextCareer = career;

  while (
    getAiAcademyRosterCount(nextCareer.lckPlayers, teamName) <
    minimumAcademyRosterPlayers
  ) {
    const neededRole = getNeededAcademyRoleForAi(nextCareer, teamName);
    const player =
      pickAvailablePlayer(
        nextCareer,
        (candidate) =>
          isAcademyAutoAssignmentCandidate(candidate) &&
          (!neededRole || candidate.role === neededRole),
      ) ??
      pickAvailablePlayer(nextCareer, isAcademyAutoAssignmentCandidate);

    if (!player) {
      break;
    }

    nextCareer = assignPlayerToTeam({
      career: nextCareer,
      placement: "academy",
      player,
      teamName,
    });
    addAssignment(assignments, {
      placement: "academy",
      playerName: player.name,
      role: player.role,
      teamName,
    });
  }

  return nextCareer;
}

function formatRole(role: Role) {
  return role.toUpperCase();
}

function formatAutoAssignmentMessage(assignment: AutoAssignment) {
  if (assignment.placement === "emergency-main") {
    return `긴급 등록: ${assignment.teamName} 1군 ${formatRole(
      assignment.role,
    )} 공백에 ${assignment.playerName}을 자동 등록했습니다.`;
  }

  if (assignment.placement === "main") {
    return `자동 배치: ${assignment.teamName} 1군 최소 인원 보정을 위해 ${assignment.playerName}을 등록했습니다.`;
  }

  return `자동 배치: ${assignment.teamName} 2군에 ${assignment.playerName}을 등록했습니다.`;
}

function appendAutoAssignmentLogs(
  career: CareerSave,
  assignments: AutoAssignment[],
) {
  const offseason = career.seasonState.offseason;

  if (!offseason || assignments.length === 0) {
    return career;
  }

  const day = getCurrentOffseasonDay(career);
  const week = getCurrentOffseasonWeek(day);
  const baseCount = offseason.logEntries?.length ?? 0;
  const logs: OffseasonLogEntry[] = assignments.map((assignment, index) => ({
    id: `offseason-log-${day}-${baseCount + index + 1}`,
    day,
    week,
    type: "system",
    message: formatAutoAssignmentMessage(assignment),
    isUserTeamRelated: assignment.isUserTeamRelated,
    relatedTeamNames: [assignment.teamName],
  }));

  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        logEntries: [...(offseason.logEntries ?? []), ...logs],
      },
    },
  };
}

export function autoAssignOffseasonRosters(career: CareerSave) {
  const assignments: AutoAssignment[] = [];
  let nextCareer = ensureUserMainFallback(career, assignments);
  nextCareer = ensureUserAcademyMinimum(nextCareer, assignments);

  for (const team of [...lck2026Teams].sort(
    (left, right) => left.previousSeasonRank - right.previousSeasonRank,
  )) {
    if (team.name === nextCareer.userTeam.name) {
      continue;
    }

    nextCareer = ensureAiMainMinimum(nextCareer, assignments, team.name);
    nextCareer = ensureAiAcademyMinimum(nextCareer, assignments, team.name);
  }

  return appendAutoAssignmentLogs(nextCareer, assignments);
}
