import type {
  ContractType,
  Player,
  PlayerContract,
  Role,
  Team,
} from "../../types/game";

const requiredRoles: Role[] = ["top", "jungle", "mid", "bot", "support"];

export type ContractTypeSelections = Record<string, ContractType>;

export type FullRosterValidation = {
  isValid: boolean;
  errors: string[];
  selectedPlayerIds: string[];
  yearlySalary: number;
};

export function getSelectedRosterPlayerIds(team: Team) {
  const selectedIds = [
    ...Object.values(team.roster),
    ...team.mainRosterPlayerIds,
    ...team.academyRosterPlayerIds,
  ].filter((playerId): playerId is string => Boolean(playerId));

  return [...new Set(selectedIds)];
}

export function calculateRosterSalary(playerIds: string[], players: Player[]) {
  return playerIds.reduce((total, playerId) => {
    const player = players.find((candidate) => candidate.id === playerId);
    return total + (player?.salaryExpectation ?? 0);
  }, 0);
}

function getContractYears(type: ContractType): Pick<
  PlayerContract,
  "guaranteedYears" | "optionYear" | "remainingYears"
> {
  if (type === "two-year") {
    return {
      guaranteedYears: 2,
      remainingYears: 2,
    };
  }

  if (type === "one-plus-one") {
    return {
      guaranteedYears: 1,
      optionYear: true,
      remainingYears: 2,
    };
  }

  return {
    guaranteedYears: 1,
    remainingYears: 1,
  };
}

export function createContractsForRoster({
  playerIds,
  players,
  contractTypes,
}: {
  playerIds: string[];
  players: Player[];
  contractTypes: ContractTypeSelections;
}): PlayerContract[] {
  return playerIds.map((playerId) => {
    const player = players.find((candidate) => candidate.id === playerId);
    const type = contractTypes[playerId] ?? "one-year";

    return {
      playerId,
      salary: player?.salaryExpectation ?? 0,
      type,
      ...getContractYears(type),
    };
  });
}

export function splitRosterByStarter(team: Team, selectedPlayerIds: string[]) {
  const starterIds = Object.values(team.roster).filter((playerId): playerId is string =>
    Boolean(playerId),
  );
  const starterSet = new Set(starterIds);

  return {
    mainRosterPlayerIds: starterIds,
    academyRosterPlayerIds: selectedPlayerIds.filter(
      (playerId) => !starterSet.has(playerId),
    ),
  };
}

export function validateFullRoster({
  team,
  players,
  contractTypes,
}: {
  team: Team;
  players: Player[];
  contractTypes: ContractTypeSelections;
}): FullRosterValidation {
  const errors: string[] = [];
  const selectedPlayerIds = getSelectedRosterPlayerIds(team);
  const selectedPlayerSet = new Set(selectedPlayerIds);
  const yearlySalary = calculateRosterSalary(selectedPlayerIds, players);

  if (selectedPlayerIds.length < team.rosterSettings.minPlayers) {
    errors.push(`Roster must include at least ${team.rosterSettings.minPlayers} players.`);
  }

  if (selectedPlayerIds.length > team.rosterSettings.maxPlayers) {
    errors.push(`Roster cannot exceed ${team.rosterSettings.maxPlayers} players.`);
  }

  for (const role of requiredRoles) {
    const playerId = team.roster[role];
    const player = playerId
      ? players.find((candidate) => candidate.id === playerId)
      : undefined;

    if (!player) {
      errors.push(`Missing ${role} starter.`);
      continue;
    }

    if (player.role !== role) {
      errors.push(`${player.name} cannot start at ${role}.`);
    }

    if (!selectedPlayerSet.has(player.id)) {
      errors.push(`${player.name} must be signed before starting.`);
    }
  }

  for (const playerId of selectedPlayerIds) {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      errors.push(`Unknown player ${playerId}.`);
      continue;
    }

    if (!player.availableForRoster || player.region !== "lck" || player.league !== "LCK") {
      errors.push(`${player.name} is not available for the LCK roster.`);
    }

    if (!contractTypes[playerId]) {
      errors.push(`${player.name} needs a contract type.`);
    }
  }

  if (yearlySalary > team.budget) {
    errors.push("Roster yearly salary exceeds team budget.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    selectedPlayerIds,
    yearlySalary,
  };
}
