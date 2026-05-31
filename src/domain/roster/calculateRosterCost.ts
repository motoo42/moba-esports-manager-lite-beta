import type { Player, Role, Team } from "../../types/game";

const roles: Role[] = ["top", "jungle", "mid", "bot", "support"];

export function calculateRosterCost(team: Team, players: Player[]) {
  return roles.reduce((total, role) => {
    const playerId = team.roster[role];
    const player = players.find((candidate) => candidate.id === playerId);
    return total + (player?.cost ?? 0);
  }, 0);
}
