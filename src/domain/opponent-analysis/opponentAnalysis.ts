import { calculateTeamPower } from "../match-simulation/calculateTeamPower";
import { getStrategyLabel } from "../weekly-plan";
import type {
  MatchSchedule,
  Opponent,
  Player,
  Role,
  StrategyId,
  Team,
  TrainingIntensity,
} from "../../types/game";

export type MatchOutlookGrade =
  | "강한 우세"
  | "우세"
  | "백중세"
  | "열세"
  | "강한 열세";

export type OpponentAnalysis = {
  opponent: Opponent;
  opponentTeamName: string;
  opponentStyleLabel: string;
  keyLane: {
    role: Role;
    roleLabel: string;
    playerName: string;
    form: number;
    overall: number;
  };
  outlookGrade: MatchOutlookGrade;
  statusSummary: string;
  styleMatchupScore: number;
  favorableStyles: StrategyId[];
  unfavorableStyles: StrategyId[];
};

type AnalyzeOpponentInput = {
  match: MatchSchedule;
  opponent: Opponent;
  players: Player[];
  team: Team;
  trainingIntensity: TrainingIntensity;
  userStrategy: StrategyId;
  userTeamId: string | undefined;
};

const roleLabels: Record<Role, string> = {
  top: "탑",
  jungle: "정글",
  mid: "미드",
  bot: "원딜",
  support: "서폿",
};

const fallbackKeyLaneByStyle: Record<StrategyId, Role> = {
  aggressive: "jungle",
  tempo: "jungle",
  macro: "mid",
  vision: "support",
  scaling: "bot",
  balanced: "mid",
};

export const styleMatchupMatrix: Record<StrategyId, Record<StrategyId, number>> = {
  aggressive: {
    aggressive: 0,
    tempo: 1,
    macro: -1,
    vision: -2,
    scaling: 3,
    balanced: 1,
  },
  tempo: {
    aggressive: 0,
    tempo: 0,
    macro: 3,
    vision: 1,
    scaling: -2,
    balanced: 1,
  },
  macro: {
    aggressive: 2,
    tempo: -3,
    macro: 0,
    vision: 1,
    scaling: 1,
    balanced: 1,
  },
  vision: {
    aggressive: 3,
    tempo: 1,
    macro: 0,
    vision: 0,
    scaling: -2,
    balanced: 0,
  },
  scaling: {
    aggressive: -3,
    tempo: 2,
    macro: -1,
    vision: 2,
    scaling: 0,
    balanced: 0,
  },
  balanced: {
    aggressive: 0,
    tempo: 0,
    macro: 0,
    vision: 0,
    scaling: 0,
    balanced: 0,
  },
};

function getOpponentTeamName(
  match: MatchSchedule,
  userTeamId: string | undefined,
) {
  return match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;
}

function getOpponentRosterPlayers({
  opponentTeamName,
  players,
  team,
}: {
  opponentTeamName: string;
  players: Player[];
  team: Team;
}) {
  const signedPlayerIds = new Set(team.contracts.map((contract) => contract.playerId));

  return players.filter(
    (player) =>
      player.currentTeam === opponentTeamName && !signedPlayerIds.has(player.id),
  );
}

function getFallbackKeyLane(opponent: Opponent) {
  const role = fallbackKeyLaneByStyle[opponent.style];

  return {
    role,
    roleLabel: roleLabels[role],
    playerName: `${opponent.name} ${roleLabels[role]}`,
    form: 70,
    overall: opponent.strength,
  };
}

export function getStyleMatchupScore(
  userStyle: StrategyId,
  opponentStyle: StrategyId,
) {
  return styleMatchupMatrix[userStyle][opponentStyle];
}

export function getFavorableStylesAgainst(opponentStyle: StrategyId) {
  return Object.entries(styleMatchupMatrix)
    .filter(([, matchup]) => matchup[opponentStyle] > 0)
    .map(([style]) => style as StrategyId);
}

export function getUnfavorableStylesAgainst(opponentStyle: StrategyId) {
  return Object.entries(styleMatchupMatrix)
    .filter(([, matchup]) => matchup[opponentStyle] < 0)
    .map(([style]) => style as StrategyId);
}

export function getOutlookGrade(powerGap: number): MatchOutlookGrade {
  if (powerGap >= 8) {
    return "강한 우세";
  }

  if (powerGap >= 3) {
    return "우세";
  }

  if (powerGap <= -8) {
    return "강한 열세";
  }

  if (powerGap <= -3) {
    return "열세";
  }

  return "백중세";
}

export function getKeyLaneFromOpponentRoster({
  opponent,
  opponentTeamName,
  players,
  team,
}: {
  opponent: Opponent;
  opponentTeamName: string;
  players: Player[];
  team: Team;
}) {
  const candidates = getOpponentRosterPlayers({ opponentTeamName, players, team }).sort(
    (left, right) =>
      right.status.form - left.status.form || right.overall - left.overall,
  );
  const keyPlayer = candidates[0];

  if (!keyPlayer) {
    return getFallbackKeyLane(opponent);
  }

  return {
    role: keyPlayer.role,
    roleLabel: roleLabels[keyPlayer.role],
    playerName: keyPlayer.name,
    form: keyPlayer.status.form,
    overall: keyPlayer.overall,
  };
}

export function analyzeOpponent({
  match,
  opponent,
  players,
  team,
  trainingIntensity,
  userStrategy,
  userTeamId,
}: AnalyzeOpponentInput): OpponentAnalysis {
  const opponentTeamName = getOpponentTeamName(match, userTeamId);
  const styleMatchupScore = getStyleMatchupScore(userStrategy, opponent.style);
  const teamPower = calculateTeamPower(
    team,
    players,
    userStrategy,
    trainingIntensity,
  );
  const powerGap = teamPower + styleMatchupScore - opponent.strength;
  const starterPlayers = Object.values(team.roster)
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter((player): player is Player => Boolean(player));
  const averageForm =
    starterPlayers.reduce((total, player) => total + player.status.form, 0) /
    Math.max(1, starterPlayers.length);
  const averageFatigue =
    starterPlayers.reduce((total, player) => total + player.status.fatigue, 0) /
    Math.max(1, starterPlayers.length);

  return {
    opponent,
    opponentTeamName,
    opponentStyleLabel: getStrategyLabel(opponent.style),
    keyLane: getKeyLaneFromOpponentRoster({
      opponent,
      opponentTeamName,
      players,
      team,
    }),
    outlookGrade: getOutlookGrade(powerGap),
    statusSummary: `선발 평균 폼 ${Math.round(averageForm)} · 피로 ${Math.round(
      averageFatigue,
    )}`,
    styleMatchupScore,
    favorableStyles: getFavorableStylesAgainst(opponent.style),
    unfavorableStyles: getUnfavorableStylesAgainst(opponent.style),
  };
}
