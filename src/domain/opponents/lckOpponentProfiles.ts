import { lck2026Teams } from "../../data/lckTeams";
import type { MatchSchedule, Opponent, StrategyId } from "../../types/game";

export const lckOpponentStyles: Record<string, StrategyId> = {
  "gen-g": "macro",
  "hanwha-life-esports": "aggressive",
  t1: "balanced",
  "kt-rolster": "tempo",
  "dplus-kia": "macro",
  "hanjin-brion": "scaling",
  "bnk-fearx": "aggressive",
  "nongshim-redforce": "vision",
  "kiwoom-drx": "scaling",
  "dn-soopers": "balanced",
};

export function getLckTeamStrength(teamId: string) {
  return lck2026Teams.find((team) => team.id === teamId)?.strength ?? 76;
}

export function getLckOpponentStyle(teamId: string): StrategyId {
  return lckOpponentStyles[teamId] ?? "balanced";
}

export function createLckOpponentFromSchedule(
  match: MatchSchedule,
  userTeamId: string,
): Opponent {
  const opponentTeamId =
    match.blueTeamId === userTeamId ? match.redTeamId : match.blueTeamId;
  const opponentTeamName =
    match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;

  return {
    id: opponentTeamId,
    name: opponentTeamName,
    region: "lck",
    leagueLabel: "LCK",
    appearsIn: [match.competitionId],
    strength: getLckTeamStrength(opponentTeamId),
    style: getLckOpponentStyle(opponentTeamId),
  };
}
