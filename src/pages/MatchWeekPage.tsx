import { MatchWeek } from "../features/match-week";
import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import type { AppRoute, RouteSubPage, TrainingSubPage } from "../app/routes";
import { gameActions } from "../app/state";
import { analyzeOpponent } from "../domain/opponent-analysis";
import { createLckOpponentFromSchedule } from "../domain/opponents";
import {
  getNextScheduledMatches,
  getPreviewMatches,
} from "../domain/season";
import { getStrategyLabel } from "../domain/weekly-plan";
import { CareerRequiredFallback } from "./CareerRequiredFallback";
import type { CareerSave, CompetitionId, MatchSchedule } from "../types/game";

function getCurrentCompetition(career: CareerSave) {
  return career.seasonState.competitions.find(
    (competition) =>
      competition.competitionId === career.seasonState.currentCompetitionId,
  );
}

function getUserTeamId(career: CareerSave) {
  return getCurrentCompetition(career)?.standings.find((entry) => entry.isUserTeam)
    ?.teamId;
}

function isUserMatch(match: MatchSchedule, userTeamId: string | undefined) {
  return match.blueTeamId === userTeamId || match.redTeamId === userTeamId;
}

function getPrimaryMatch(
  matches: MatchSchedule[],
  userTeamId: string | undefined,
) {
  return (
    matches.find((match) => isUserMatch(match, userTeamId)) ?? matches[0]
  );
}

function getOpponentName(match: MatchSchedule | undefined, userTeamId: string | undefined) {
  if (!match || !userTeamId) {
    return "다음 상대 미정";
  }

  return match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;
}

function getFormatLabel(match: MatchSchedule | undefined) {
  if (!match) {
    return "일정 대기";
  }

  return `${match.format.toUpperCase()}${match.fearlessEnabled ? " · Fearless" : ""}`;
}

type MatchWeekPageProps = {
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
  subPage?: TrainingSubPage | null;
};

export function MatchWeekPage({ onGoTo, subPage }: MatchWeekPageProps) {
  const career = useGameSelector((state) => state.career);
  const lastMatch = useGameSelector((state) => state.lastMatch);
  const dispatch = useGameDispatch();

  if (!career) {
    return <CareerRequiredFallback title="전략/훈련 화면을 열 수 없습니다" />;
  }

  const currentCompetition = getCurrentCompetition(career);
  const userTeamId = getUserTeamId(career);
  const previewMatch = getPrimaryMatch(
    getPreviewMatches(career.seasonState),
    userTeamId,
  );
  const nextMatch = getPrimaryMatch(
    getNextScheduledMatches(career.seasonState),
    userTeamId,
  );
  const targetMatch = previewMatch ?? nextMatch;
  const opponent =
    targetMatch && userTeamId
      ? createLckOpponentFromSchedule(targetMatch, userTeamId)
      : null;
  const analysis =
    targetMatch && opponent && userTeamId
      ? analyzeOpponent({
          match: targetMatch,
          opponent,
          players: career.lckPlayers,
          team: career.userTeam,
          trainingIntensity: career.weeklyPlan.trainingIntensity,
          userStrategy: career.weeklyPlan.strategy,
          userTeamId,
        })
      : null;

  return (
    <MatchWeek
      opponentReport={{
        opponentTeamName: getOpponentName(targetMatch, userTeamId),
        competitionName: currentCompetition?.name ?? "대회 대기",
        stageName: targetMatch?.stageName ?? "일정 대기",
        formatLabel: getFormatLabel(targetMatch),
        styleLabel: opponent ? getStrategyLabel(opponent.style) : "균형",
        strength: opponent?.strength ?? 0,
        outlookGrade: analysis?.outlookGrade,
        keyLaneLabel: analysis
          ? `${analysis.keyLane.roleLabel} · ${analysis.keyLane.playerName}`
          : undefined,
        statusSummary: analysis?.statusSummary,
      }}
      result={lastMatch}
      weeklyPlan={career.weeklyPlan}
      subPage={subPage}
      onStrategyChange={(strategy) =>
        dispatch(gameActions.setStrategy(strategy))
      }
      onTrainingIntensityChange={(trainingIntensity) =>
        dispatch(gameActions.setTrainingIntensity(trainingIntensity))
      }
      onViewCalendar={() => onGoTo("season-calendar")}
    />
  );
}
