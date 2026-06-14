import type { CompetitionState, MatchRecord, MatchSchedule } from "../../types/game";
import type {
  CompetitionBracketMatch,
  CompetitionBracketSlot,
} from "./competitionBracket";
import { getDateLabel, getFormatLabel } from "./competitionDashboardShared";

export type LckPlayoffSlot = {
  label: string;
  teamId?: string;
  teamName: string;
  detail: string;
  isPlaceholder: boolean;
  isWinner?: boolean;
  score?: number;
};

export type LckPlayoffMatch = {
  id: string;
  stageName: string;
  title: string;
  subtitle: string;
  slots: LckPlayoffSlot[];
};

export function createWinnerSlot(label: string): LckPlayoffSlot {
  return {
    label,
    teamName: label,
    detail: "이전 라운드 승자",
    isPlaceholder: true,
  };
}

export function getPlayoffMatch(
  competition: CompetitionState,
  scheduleId: string,
): MatchSchedule | undefined {
  return competition.schedule.find((match) => match.id === scheduleId);
}

export function createSlotFromMatchSide({
  label,
  match,
  record,
  side,
}: {
  label: string;
  match: MatchSchedule | undefined;
  record: MatchRecord | undefined;
  side: "blue" | "red";
}): LckPlayoffSlot {
  if (!match) {
    return createWinnerSlot(label);
  }

  const teamId = side === "blue" ? match.blueTeamId : match.redTeamId;
  const teamName = side === "blue" ? match.blueTeamName : match.redTeamName;
  const score = record
    ? side === "blue"
      ? record.score.blueWins
      : record.score.redWins
    : undefined;
  const isWinner = record?.winnerTeamId === teamId;

  return {
    label,
    teamId,
    teamName,
    detail: record
      ? `${score}-${side === "blue" ? record.score.redWins : record.score.blueWins} ${
          isWinner ? "승리" : "패배"
        }`
      : `${getDateLabel(match.scheduledDate)} · ${getFormatLabel(match)}`,
    isPlaceholder: false,
    isWinner,
    score,
  };
}

export function toCompetitionBracketSlot(
  slot: LckPlayoffSlot,
): CompetitionBracketSlot {
  return {
    detail: slot.detail,
    isPlaceholder: slot.isPlaceholder,
    isWinner: slot.isWinner,
    label: slot.label,
    teamId: slot.teamId,
    teamName: slot.teamName,
  };
}

export function toCompetitionBracketMatch({
  flowHint,
  isCurrent,
  match,
  meta = "BO5",
}: {
  flowHint?: string;
  isCurrent: boolean;
  match: LckPlayoffMatch;
  meta?: string;
}): CompetitionBracketMatch {
  return {
    flowHint,
    id: match.id,
    isCurrent,
    meta,
    slots: match.slots.map(toCompetitionBracketSlot),
    subtitle: match.subtitle,
    title: match.title,
  };
}
