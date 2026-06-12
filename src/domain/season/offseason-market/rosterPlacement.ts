import type {
  OffseasonRequestedRosterRole,
  Player,
  PlayerContract,
  Role,
  Team,
} from "../../../types/game";

export function replaceContract(team: Team, contract: PlayerContract): Team {
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

export function removePlayerFromRosterPlacement(team: Team, playerId: string): Team {
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

export function addUniqueValue(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

export function getRequestedRosterRole(
  requestedRosterRole?: OffseasonRequestedRosterRole,
) {
  return requestedRosterRole ?? "academy";
}

export function getRequestedRosterRoleLabel(
  requestedRosterRole?: OffseasonRequestedRosterRole,
) {
  const rosterRole = getRequestedRosterRole(requestedRosterRole);

  if (rosterRole === "starter") {
    return "1군 주전";
  }

  if (rosterRole === "sixth-man") {
    return "식스맨";
  }

  return "2군";
}

export function getRosterRoleForPlacement({
  player,
  requestedRosterRole,
  team,
}: {
  player: Player;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  team: Team;
}) {
  if (requestedRosterRole) {
    return requestedRosterRole;
  }

  if (team.roster[player.role] === player.id) {
    return "starter";
  }

  if (team.mainRosterPlayerIds.includes(player.id)) {
    return "sixth-man";
  }

  return "academy";
}

export function applyRequestedRosterRole({
  player,
  requestedRosterRole,
  team,
}: {
  player: Player;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  team: Team;
}): Team {
  const placement = getRosterRoleForPlacement({
    player,
    requestedRosterRole,
    team,
  });
  const previousStarterId = team.roster[player.role];
  const baseTeam = removePlayerFromRosterPlacement(team, player.id);

  if (placement === "starter") {
    return {
      ...baseTeam,
      roster: {
        ...baseTeam.roster,
        [player.role]: player.id,
      },
      mainRosterPlayerIds: addUniqueValue(
        previousStarterId && previousStarterId !== player.id
          ? addUniqueValue(baseTeam.mainRosterPlayerIds, previousStarterId)
          : baseTeam.mainRosterPlayerIds,
        player.id,
      ),
    };
  }

  if (placement === "sixth-man") {
    return {
      ...baseTeam,
      mainRosterPlayerIds: addUniqueValue(baseTeam.mainRosterPlayerIds, player.id),
    };
  }

  return {
    ...baseTeam,
    academyRosterPlayerIds: addUniqueValue(
      baseTeam.academyRosterPlayerIds,
      player.id,
    ),
  };
}

export function removePlayerFromUserTeam(team: Team, playerId: string): Team {
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
    contracts: team.contracts.filter((contract) => contract.playerId !== playerId),
  };
}

export function removePlayersFromUserTeam(team: Team, playerIds: string[]) {
  return playerIds.reduce(
    (currentTeam, playerId) => removePlayerFromUserTeam(currentTeam, playerId),
    team,
  );
}
