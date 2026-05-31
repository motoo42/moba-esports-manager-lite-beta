import { calculateRosterCost } from "./calculateRosterCost";
import type { Player, Role, Team } from "../../types/game";

const requiredRoles: Role[] = ["top", "jungle", "mid", "bot", "support"];

export type RosterValidation = {
  isValid: boolean;
  errors: string[];
};

export function validateRoster(team: Team, players: Player[]): RosterValidation {
  const errors: string[] = [];
  const selectedIds = Object.values(team.roster);
  const uniqueIds = new Set(selectedIds);

  requiredRoles.forEach((role) => {
    const playerId = team.roster[role];
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      errors.push(`Missing ${role} player.`);
      return;
    }

    if (player.role !== role) {
      errors.push(`${player.name} cannot fill ${role}.`);
    }

    if (!player.availableForRoster || player.region !== "lck") {
      errors.push(`${player.name} is not available for the LCK roster.`);
    }
  });

  if (uniqueIds.size !== selectedIds.length) {
    errors.push("A player cannot occupy multiple roles.");
  }

  if (calculateRosterCost(team, players) > team.budget) {
    errors.push("Roster exceeds team budget.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
