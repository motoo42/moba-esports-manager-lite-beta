import type {
  CompetitionId,
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  SeasonProgressActionLabel,
  SeasonState,
  StandingEntry,
} from "../../types/game";
import {
  advanceAsianGamesAfterCompletedMatches,
  asianGamesKoreaTeamId,
  markAsianGamesDecisionPendingIfNeeded,
} from "./asianGamesFormat";
import {
  advanceFirstStandAfterCompletedMatches,
  isFirstStandGroupStageName,
} from "./firstStandFormat";
import {
  getLckCupFinalists,
  getNextLckCupKnockoutSchedule,
} from "./lckCupFormat";
import { lckRounds12RegularStageName } from "./lckRounds12Format";
import { isLckRounds34RegularStageName } from "./lckRounds34Format";
import { isLckRounds35RegularStageName } from "./lckRounds35Format";
import {
  createLckRounds34SeasonPlayInOpeningSchedule,
  getLckRounds34FinalPlacements,
  getLckRounds34PostseasonSeeds,
  getNextLckRounds34PostseasonSchedule,
  isLckRounds34PostseasonStageName,
  lckRounds34PostseasonMatchIds,
  lckRounds34PostseasonStageNames,
} from "./lckRounds34Postseason";
import {
  createLckRounds35SeasonPlayInOpeningSchedule,
  getLckRounds35FinalPlacements,
  getLckRounds35PostseasonSeeds,
  getNextLckRounds35PostseasonSchedule,
  isLckRounds35PostseasonStageName,
  lckRounds35PostseasonMatchIds,
  lckRounds35PostseasonStageNames,
} from "./lckRounds35Postseason";
import {
  createLckRounds12PlayoffOpeningSchedule,
  getLckRounds12Finalists,
  getNextLckRounds12PlayoffSchedule,
  isLckRounds12PlayoffStageName,
  lckRounds12PlayoffMatchIds,
  lckRounds12PlayoffStageNames,
} from "./lckRounds12Playoffs";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "./seasonScheduleDates";
import { applyRecordsToStandings } from "./standingsEngine";
import { applyLckWorldsQualification } from "./worldsQualification";

function createDateLabel(
  yearLabel: number,
  competitionName: string | undefined,
  week: number,
) {
  const activeCompetitionName = competitionName ?? "Season";

  return `${yearLabel} ${activeCompetitionName} Week ${week}`;
}

function findCompetition(
  competitions: CompetitionState[],
  competitionId: CompetitionId | null,
) {
  return competitions.find(
    (competition) => competition.competitionId === competitionId,
  );
}

function getUserTeamId(seasonState: SeasonState) {
  if (seasonState.currentCompetitionId === "asian-games") {
    return seasonState.asianGames?.playMode === "manual"
      ? asianGamesKoreaTeamId
      : undefined;
  }

  const activeCompetition = findCompetition(
    seasonState.competitions,
    seasonState.currentCompetitionId,
  );

  return activeCompetition?.standings.find((entry) => entry.isUserTeam)?.teamId;
}

function isUserMatch(match: MatchSchedule, userTeamId: string | undefined) {
  return match.blueTeamId === userTeamId || match.redTeamId === userTeamId;
}

function getScheduledMatchesForDate(
  seasonState: SeasonState,
  dateKey: string,
) {
  return seasonState.scheduledMatches.filter(
    (match) =>
      match.status === "scheduled" &&
      match.competitionId === seasonState.currentCompetitionId &&
      match.scheduledDate === dateKey,
  );
}

function findNextScheduledDate(
  seasonState: SeasonState,
  {
    includeCurrent = false,
    userOnly = false,
  }: { includeCurrent?: boolean; userOnly?: boolean } = {},
) {
  const userTeamId = getUserTeamId(seasonState);

  return seasonState.scheduledMatches
    .filter(
      (match) =>
        match.status === "scheduled" &&
        match.competitionId === seasonState.currentCompetitionId &&
        match.scheduledDate &&
        (includeCurrent
          ? match.scheduledDate >= seasonState.currentDateKey
          : match.scheduledDate > seasonState.currentDateKey) &&
        (!userOnly || isUserMatch(match, userTeamId)),
    )
    .sort((left, right) => {
      const dateDiff = (left.scheduledDate ?? "").localeCompare(
        right.scheduledDate ?? "",
      );

      return dateDiff !== 0 ? dateDiff : left.id.localeCompare(right.id);
    })[0]?.scheduledDate;
}

function findNextScheduledWeek(seasonState: SeasonState) {
  return seasonState.scheduledMatches
    .filter(
      (match) =>
        match.status === "scheduled" &&
        match.competitionId === seasonState.currentCompetitionId &&
        match.week >= seasonState.currentWeek,
    )
    .sort((left, right) => left.week - right.week)[0]?.week;
}

function getScheduledMatchIdsForWeek(
  seasonState: SeasonState,
  week: number,
) {
  return seasonState.scheduledMatches
    .filter(
      (match) =>
        match.status === "scheduled" &&
        match.competitionId === seasonState.currentCompetitionId &&
        match.week === week,
    )
    .map((match) => match.id);
}

function getScheduledMatchIdsForDate(seasonState: SeasonState, dateKey: string) {
  return getScheduledMatchesForDate(seasonState, dateKey).map((match) => match.id);
}

function updateCompetitionWeek(
  competition: CompetitionState,
  currentCompetitionId: CompetitionId | null,
  week: number,
) {
  if (competition.competitionId !== currentCompetitionId) {
    return competition;
  }

  return {
    ...competition,
    currentWeek: week,
  };
}

function applyScheduleRecords(
  schedule: MatchSchedule[],
  records: MatchRecord[],
) {
  const recordsByScheduleId = new Map(
    records.map((record) => [record.scheduleId, record]),
  );

  return schedule.map((match) => {
    const record = recordsByScheduleId.get(match.id);

    if (!record) {
      return match;
    }

    return {
      ...match,
      status: "completed" as const,
      recordId: record.id,
    };
  });
}

function appendUniqueSchedules(
  schedule: MatchSchedule[],
  additions: MatchSchedule[],
) {
  const existingIds = new Set(schedule.map((match) => match.id));

  return [
    ...schedule,
    ...additions.filter((match) => !existingIds.has(match.id)),
  ];
}

function getLastScheduledDateKey(schedule: MatchSchedule[]) {
  return [...schedule]
    .filter((match) => match.scheduledDate)
    .sort((left, right) =>
      (right.scheduledDate ?? "").localeCompare(left.scheduledDate ?? ""),
    )[0]?.scheduledDate;
}

function compareStandingEntries(left: StandingEntry, right: StandingEntry) {
  const winDiff = right.wins - left.wins;

  if (winDiff !== 0) {
    return winDiff;
  }

  const leftSetDiff = left.setWins - left.setLosses;
  const rightSetDiff = right.setWins - right.setLosses;
  const setDiff = rightSetDiff - leftSetDiff;

  if (setDiff !== 0) {
    return setDiff;
  }

  const setWinsDiff = right.setWins - left.setWins;

  if (setWinsDiff !== 0) {
    return setWinsDiff;
  }

  return left.initialSeed - right.initialSeed;
}

function updateSeasonDateState(
  seasonState: SeasonState,
  dateKey: string,
): SeasonState {
  const scheduledMatches = getScheduledMatchesForDate(seasonState, dateKey);
  const userTeamId = getUserTeamId(seasonState);
  const hasUserMatch = scheduledMatches.some((match) =>
    isUserMatch(match, userTeamId),
  );
  const nextMatchIds = hasUserMatch
    ? getScheduledMatchIdsForDate(seasonState, dateKey)
    : [];
  const currentWeek = scheduledMatches[0]?.week ?? seasonState.currentWeek;

  return markAsianGamesDecisionPendingIfNeeded({
    ...seasonState,
    currentDateKey: dateKey,
    currentDateLabel: formatSeasonDateLabel(dateKey),
    currentWeek,
    progressStatus: hasUserMatch ? "match-preview" : "idle",
    nextMatchIds,
    lastMatchRecordIds: [],
    competitions: seasonState.competitions.map((competition) =>
      updateCompetitionWeek(
        competition,
        seasonState.currentCompetitionId,
        currentWeek,
      ),
    ),
  });
}

export function getSeasonProgressActionLabel(
  seasonState: SeasonState,
): SeasonProgressActionLabel {
  if (
    seasonState.phase === "offseason" &&
    seasonState.offseason?.status === "active"
  ) {
    return "다음날";
  }

  if (seasonState.progressStatus === "match-preview") {
    return "플레이";
  }

  return "진행";
}

export function getCurrentWeekScheduledMatches(
  seasonState: SeasonState,
): MatchSchedule[] {
  return seasonState.scheduledMatches.filter(
    (match) =>
      match.status === "scheduled" &&
      match.competitionId === seasonState.currentCompetitionId &&
      match.week === seasonState.currentWeek,
  );
}

export function getCurrentDateScheduledMatches(
  seasonState: SeasonState,
): MatchSchedule[] {
  return getScheduledMatchesForDate(seasonState, seasonState.currentDateKey);
}

export function getPreviewMatches(seasonState: SeasonState): MatchSchedule[] {
  const nextMatchIds = new Set(seasonState.nextMatchIds);

  return seasonState.scheduledMatches.filter((match) => nextMatchIds.has(match.id));
}

export function getReviewRecords(seasonState: SeasonState): MatchRecord[] {
  const recordIds = new Set(seasonState.lastMatchRecordIds);

  return seasonState.matchRecords.filter((record) => recordIds.has(record.id));
}

export function getNextScheduledMatches(
  seasonState: SeasonState,
): MatchSchedule[] {
  const nextDate =
    findNextScheduledDate(seasonState, { userOnly: true }) ??
    findNextScheduledDate(seasonState);

  if (nextDate) {
    return getScheduledMatchesForDate(seasonState, nextDate);
  }

  const nextWeek = findNextScheduledWeek(seasonState);

  if (!nextWeek) {
    return [];
  }

  return seasonState.scheduledMatches.filter(
    (match) =>
      match.status === "scheduled" &&
      match.competitionId === seasonState.currentCompetitionId &&
      match.week === nextWeek,
  );
}

export function advanceToNextMatchWeek(seasonState: SeasonState): SeasonState {
  if (seasonState.progressStatus !== "idle") {
    return seasonState;
  }

  const nextDate =
    findNextScheduledDate(seasonState, {
      includeCurrent: true,
      userOnly: true,
    }) ??
    findNextScheduledDate(seasonState, { includeCurrent: true });

  if (nextDate) {
    return markAsianGamesDecisionPendingIfNeeded({
      ...updateSeasonDateState(seasonState, nextDate),
      currentTurn: seasonState.currentTurn + 1,
    });
  }

  const nextWeek = findNextScheduledWeek(seasonState);

  if (!nextWeek) {
    return {
      ...seasonState,
      currentTurn: seasonState.currentTurn + 1,
    };
  }

  const activeCompetition = findCompetition(
    seasonState.competitions,
    seasonState.currentCompetitionId,
  );
  const nextMatchIds = getScheduledMatchIdsForWeek(seasonState, nextWeek);

  return {
    ...seasonState,
    currentWeek: nextWeek,
    currentTurn: seasonState.currentTurn + 1,
    currentDateLabel: createDateLabel(
      seasonState.yearLabel,
      activeCompetition?.name,
      nextWeek,
    ),
    progressStatus: "match-preview",
    nextMatchIds,
    lastMatchRecordIds: [],
    competitions: seasonState.competitions.map((competition) =>
      updateCompetitionWeek(
        competition,
        seasonState.currentCompetitionId,
        nextWeek,
      ),
    ),
  };
}

export function advanceToNextDay(seasonState: SeasonState): SeasonState {
  if (seasonState.progressStatus === "match-preview") {
    return seasonState;
  }

  const nextDateKey = addDaysToDateKey(seasonState.currentDateKey, 1);

  return markAsianGamesDecisionPendingIfNeeded({
    ...updateSeasonDateState(seasonState, nextDateKey),
    currentTurn: seasonState.currentTurn + 1,
  });
}

export function continueAfterMatchReview(seasonState: SeasonState): SeasonState {
  if (seasonState.progressStatus !== "match-review") {
    return seasonState;
  }

  return advanceToNextDay(seasonState);
}

export function recordCompletedMatches(
  seasonState: SeasonState,
  records: MatchRecord[],
): SeasonState {
  if (records.length === 0) {
    return seasonState;
  }

  const scheduledMatches = applyScheduleRecords(
    seasonState.scheduledMatches,
    records,
  );
  const hasUserRecord = records.some((record) => record.userResult !== "none");

  return {
    ...seasonState,
    currentTurn: seasonState.currentTurn + 1,
    progressStatus: hasUserRecord ? "match-review" : "idle",
    scheduledMatches,
    matchRecords: [...seasonState.matchRecords, ...records],
    nextMatchIds: [],
    lastMatchRecordIds: hasUserRecord ? records.map((record) => record.id) : [],
    competitions: seasonState.competitions.map((competition) => {
      if (competition.competitionId !== seasonState.currentCompetitionId) {
        return competition;
      }

      const competitionSchedule = applyScheduleRecords(
        competition.schedule,
        records,
      );
      const standingsRecords =
        competition.competitionId === "lck-rounds-1-2"
          ? records.filter((record) => {
              const match = competition.schedule.find(
                (scheduledMatch) => scheduledMatch.id === record.scheduleId,
              );

              return match?.stageName === lckRounds12RegularStageName;
            })
          : competition.competitionId === "lck-rounds-3-4"
            ? records.filter((record) => {
                const match = competition.schedule.find(
                  (scheduledMatch) => scheduledMatch.id === record.scheduleId,
                );

                return Boolean(
                  match && isLckRounds34RegularStageName(match.stageName),
                );
              })
          : competition.competitionId === "lck-rounds-3-5"
            ? records.filter((record) => {
                const match = competition.schedule.find(
                  (scheduledMatch) => scheduledMatch.id === record.scheduleId,
                );

                return Boolean(
                  match && isLckRounds35RegularStageName(match.stageName),
                );
              })
          : competition.competitionId === "first-stand"
            ? records.filter((record) => {
                const match = competition.schedule.find(
                  (scheduledMatch) => scheduledMatch.id === record.scheduleId,
                );

                return Boolean(match && isFirstStandGroupStageName(match.stageName));
              })
          : records;

      return {
        ...competition,
        schedule: competitionSchedule,
        standings: applyRecordsToStandings({
          records: standingsRecords,
          schedule: competition.schedule,
          standings: competition.standings,
        }),
      };
    }),
  };
}

export { advanceAsianGamesAfterCompletedMatches };

export function advanceLckCupAfterCompletedWeek(
  seasonState: SeasonState,
  completedWeek: number,
): SeasonState {
  if (seasonState.currentCompetitionId !== "lck-cup") {
    return seasonState;
  }

  const lckCup = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-cup",
  );

  if (!lckCup) {
    return seasonState;
  }

  if (completedWeek === 10) {
    const finalRecord = seasonState.matchRecords.find(
      (record) =>
        record.competitionId === "lck-cup" &&
        record.week === 10 &&
        record.stageName === "Finals",
    );
    const finalists = getLckCupFinalists(lckCup, seasonState.matchRecords);

    return {
      ...seasonState,
      competitions: seasonState.competitions.map((competition) => {
        if (competition.competitionId === "lck-cup") {
          return {
            ...competition,
            status: "completed",
            currentStageName: "Completed",
            qualifiedTeamIds: finalists.map((team) => team.teamId),
            qualifiedTeamNames: finalists.map((team) => team.teamName),
            winnerTeamId: finalRecord?.winnerTeamId,
            winnerTeamName: finalRecord?.winnerTeamName,
            completed: true,
          };
        }

        if (competition.competitionId === "first-stand") {
          return {
            ...competition,
            status: competition.status === "locked" ? "available" : competition.status,
          };
        }

        return competition;
      }),
    };
  }

  const nextSchedule = getNextLckCupKnockoutSchedule(
    lckCup,
    seasonState.matchRecords,
    completedWeek,
    {
      calendarType: seasonState.calendarType,
      year: seasonState.yearLabel,
    },
  );

  if (nextSchedule.length === 0) {
    return seasonState;
  }

  const nextStageName = nextSchedule[0].stageName;

  return {
    ...seasonState,
    scheduledMatches: appendUniqueSchedules(
      seasonState.scheduledMatches,
      nextSchedule,
    ),
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "lck-cup"
        ? {
            ...competition,
            currentStageName: nextStageName,
            schedule: appendUniqueSchedules(competition.schedule, nextSchedule),
          }
        : competition,
    ),
  };
}

export function completeLckRounds12IfFinished(
  seasonState: SeasonState,
): SeasonState {
  if (seasonState.currentCompetitionId !== "lck-rounds-1-2") {
    return seasonState;
  }

  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-1-2",
  );

  if (!lckRounds || lckRounds.completed || lckRounds.schedule.length === 0) {
    return seasonState;
  }

  const finalRecord = seasonState.matchRecords.find(
    (record) =>
      record.competitionId === "lck-rounds-1-2" &&
      record.scheduleId === lckRounds12PlayoffMatchIds.final,
  );

  if (finalRecord) {
    const finalists = getLckRounds12Finalists(lckRounds, seasonState.matchRecords);

    return {
      ...seasonState,
      nextMatchIds: [],
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-1-2"
          ? {
              ...competition,
              status: "completed",
              currentStageName: "Playoffs Completed",
              qualifiedTeamIds: finalists.map((team) => team.teamId),
              qualifiedTeamNames: finalists.map((team) => team.teamName),
              winnerTeamId: finalRecord.winnerTeamId,
              winnerTeamName: finalRecord.winnerTeamName,
              completed: true,
            }
          : competition,
      ),
    };
  }

  const regularSchedule = lckRounds.schedule.filter(
    (match) => match.stageName === lckRounds12RegularStageName,
  );
  const allRegularMatchesCompleted =
    regularSchedule.length > 0 &&
    regularSchedule.every((match) => match.status === "completed");

  if (!allRegularMatchesCompleted) {
    return seasonState;
  }

  const hasPlayoffSchedule = lckRounds.schedule.some((match) =>
    isLckRounds12PlayoffStageName(match.stageName),
  );
  const playoffQualifiers = [...lckRounds.standings]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 6);

  if (!hasPlayoffSchedule) {
    const lastRegularDate =
      getLastScheduledDateKey(regularSchedule) ?? seasonState.currentDateKey;
    const openingSchedule = createLckRounds12PlayoffOpeningSchedule(
      {
        ...lckRounds,
        qualifiedTeamIds: playoffQualifiers.map((entry) => entry.teamId),
        qualifiedTeamNames: playoffQualifiers.map((entry) => entry.teamName),
      },
      {
        startDateKey: addDaysToDateKey(lastRegularDate, 3),
      },
    );

    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        openingSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-1-2"
          ? {
              ...competition,
              status: "active",
              currentStageName:
                openingSchedule[0]?.stageName ?? lckRounds12PlayoffStageNames.round1,
              currentWeek: openingSchedule[0]?.week ?? competition.currentWeek,
              schedule: appendUniqueSchedules(competition.schedule, openingSchedule),
              qualifiedTeamIds: playoffQualifiers.map((entry) => entry.teamId),
              qualifiedTeamNames: playoffQualifiers.map((entry) => entry.teamName),
              completed: false,
            }
          : competition,
      ),
    };
  }

  const nextPlayoffSchedule = getNextLckRounds12PlayoffSchedule(
    lckRounds,
    seasonState.matchRecords,
  );

  if (nextPlayoffSchedule.length > 0) {
    return {
      ...seasonState,
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        nextPlayoffSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-1-2"
          ? {
              ...competition,
              currentStageName: nextPlayoffSchedule[0].stageName,
              currentWeek: nextPlayoffSchedule[0].week,
              schedule: appendUniqueSchedules(
                competition.schedule,
                nextPlayoffSchedule,
              ),
            }
          : competition,
      ),
    };
  }

  return seasonState;
}

export function completeLckRounds34IfFinished(
  seasonState: SeasonState,
): SeasonState {
  if (seasonState.currentCompetitionId !== "lck-rounds-3-4") {
    return seasonState;
  }

  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-3-4",
  );

  if (!lckRounds || lckRounds.completed || lckRounds.schedule.length === 0) {
    return seasonState;
  }

  const regularSchedule = lckRounds.schedule.filter((match) =>
    isLckRounds34RegularStageName(match.stageName),
  );
  const finalRecord = seasonState.matchRecords.find(
    (record) =>
      record.competitionId === "lck-rounds-3-4" &&
      record.scheduleId === lckRounds34PostseasonMatchIds.grandFinal,
  );

  if (finalRecord) {
    const finalPlacements = getLckRounds34FinalPlacements(
      lckRounds,
      seasonState.matchRecords,
    );

    if (finalPlacements.length >= 4) {
      const completedSeasonState: SeasonState = {
        ...seasonState,
        nextMatchIds: [],
        competitions: seasonState.competitions.map((competition) =>
          competition.competitionId === "lck-rounds-3-4"
            ? {
                ...competition,
                status: "completed",
                currentStageName: "Playoffs Completed",
                qualifiedTeamIds: finalPlacements
                  .slice(0, 4)
                  .map((team) => team.teamId),
                qualifiedTeamNames: finalPlacements
                  .slice(0, 4)
                  .map((team) => team.teamName),
                winnerTeamId: finalRecord.winnerTeamId,
                winnerTeamName: finalRecord.winnerTeamName,
                completed: true,
              }
            : competition.competitionId === "asian-games"
              ? {
                  ...competition,
                  status:
                    competition.status === "locked"
                      ? "available"
                      : competition.status,
                }
              : competition,
        ),
      };

      return applyLckWorldsQualification(
        completedSeasonState,
        finalPlacements.slice(0, 4),
      );
    }
  }

  const allRegularMatchesCompleted =
    regularSchedule.length > 0 &&
    regularSchedule.every((match) => match.status === "completed");

  if (!allRegularMatchesCompleted) {
    return seasonState;
  }

  const legendStandings = lckRounds.standings
    .filter((entry) => entry.lckRoundsGroup === "legend")
    .sort((left, right) => left.rank - right.rank);
  const riseStandings = lckRounds.standings
    .filter((entry) => entry.lckRoundsGroup === "rise")
    .sort((left, right) => left.rank - right.rank);
  const postseasonTeams = [
    ...legendStandings.slice(0, 5),
    ...riseStandings.slice(0, 3),
  ];
  const hasPostseasonSchedule = lckRounds.schedule.some((match) =>
    isLckRounds34PostseasonStageName(match.stageName),
  );

  if (!hasPostseasonSchedule) {
    const postseasonSeededCompetition = {
      ...lckRounds,
      qualifiedTeamIds: postseasonTeams.map((entry) => entry.teamId),
      qualifiedTeamNames: postseasonTeams.map((entry) => entry.teamName),
    };
    const lastRegularDate =
      getLastScheduledDateKey(regularSchedule) ?? seasonState.currentDateKey;
    const openingSchedule = createLckRounds34SeasonPlayInOpeningSchedule(
      postseasonSeededCompetition,
      {
        startDateKey: addDaysToDateKey(lastRegularDate, 3),
      },
    );

    if (openingSchedule.length === 0) {
      return seasonState;
    }

    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        openingSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-3-4"
          ? {
              ...competition,
              status: "active",
              currentStageName:
                openingSchedule[0]?.stageName ??
                lckRounds34PostseasonStageNames.seasonPlayInRound1,
              currentWeek: openingSchedule[0]?.week ?? competition.currentWeek,
              qualifiedTeamIds: getLckRounds34PostseasonSeeds(
                postseasonSeededCompetition,
              ).map((team) => team.teamId),
              qualifiedTeamNames: getLckRounds34PostseasonSeeds(
                postseasonSeededCompetition,
              ).map((team) => team.teamName),
              schedule: appendUniqueSchedules(
                competition.schedule,
                openingSchedule,
              ),
              completed: false,
            }
          : competition,
      ),
    };
  }

  const nextPostseasonSchedule = getNextLckRounds34PostseasonSchedule(
    lckRounds,
    seasonState.matchRecords,
  );

  if (nextPostseasonSchedule.length > 0) {
    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        nextPostseasonSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-3-4"
          ? {
              ...competition,
              currentStageName: nextPostseasonSchedule[0].stageName,
              currentWeek: nextPostseasonSchedule[0].week,
              schedule: appendUniqueSchedules(
                competition.schedule,
                nextPostseasonSchedule,
              ),
            }
          : competition,
      ),
    };
  }

  return {
    ...seasonState,
    nextMatchIds: [],
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "lck-rounds-3-4"
        ? {
            ...competition,
            status: "active",
            currentStageName:
              lckRounds.currentStageName || "Postseason Standby",
            qualifiedTeamIds: postseasonTeams.map((entry) => entry.teamId),
            qualifiedTeamNames: postseasonTeams.map((entry) => entry.teamName),
            completed: false,
          }
        : competition,
    ),
  };
}

export function completeLckRounds35IfFinished(
  seasonState: SeasonState,
): SeasonState {
  if (seasonState.currentCompetitionId !== "lck-rounds-3-5") {
    return seasonState;
  }

  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-3-5",
  );

  if (!lckRounds || lckRounds.completed || lckRounds.schedule.length === 0) {
    return seasonState;
  }

  const regularSchedule = lckRounds.schedule.filter((match) =>
    isLckRounds35RegularStageName(match.stageName),
  );
  const finalRecord = seasonState.matchRecords.find(
    (record) =>
      record.competitionId === "lck-rounds-3-5" &&
      record.scheduleId === lckRounds35PostseasonMatchIds.grandFinal,
  );

  if (finalRecord) {
    const finalPlacements = getLckRounds35FinalPlacements(
      lckRounds,
      seasonState.matchRecords,
    );

    if (finalPlacements.length >= 4) {
      const completedSeasonState: SeasonState = {
        ...seasonState,
        nextMatchIds: [],
        competitions: seasonState.competitions.map((competition) =>
          competition.competitionId === "lck-rounds-3-5"
            ? {
                ...competition,
                status: "completed",
                currentStageName: "Playoffs Completed",
                qualifiedTeamIds: finalPlacements
                  .slice(0, 4)
                  .map((team) => team.teamId),
                qualifiedTeamNames: finalPlacements
                  .slice(0, 4)
                  .map((team) => team.teamName),
                winnerTeamId: finalRecord.winnerTeamId,
                winnerTeamName: finalRecord.winnerTeamName,
                completed: true,
              }
            : competition.competitionId === "worlds"
              ? {
                  ...competition,
                  status:
                    competition.status === "locked"
                      ? "available"
                      : competition.status,
                }
              : competition,
        ),
      };

      return applyLckWorldsQualification(
        completedSeasonState,
        finalPlacements.slice(0, 4),
      );
    }
  }

  const allRegularMatchesCompleted =
    regularSchedule.length > 0 &&
    regularSchedule.every((match) => match.status === "completed");

  if (!allRegularMatchesCompleted) {
    return seasonState;
  }

  const legendStandings = lckRounds.standings
    .filter((entry) => entry.lckRoundsGroup === "legend")
    .sort(compareStandingEntries);
  const riseStandings = lckRounds.standings
    .filter((entry) => entry.lckRoundsGroup === "rise")
    .sort(compareStandingEntries);
  const postseasonTeams = [
    ...legendStandings.slice(0, 5),
    ...riseStandings.slice(0, 3),
  ];
  const hasPostseasonSchedule = lckRounds.schedule.some((match) =>
    isLckRounds35PostseasonStageName(match.stageName),
  );

  if (!hasPostseasonSchedule) {
    const postseasonSeededCompetition = {
      ...lckRounds,
      qualifiedTeamIds: postseasonTeams.map((entry) => entry.teamId),
      qualifiedTeamNames: postseasonTeams.map((entry) => entry.teamName),
    };
    const lastRegularDate =
      getLastScheduledDateKey(regularSchedule) ?? seasonState.currentDateKey;
    const openingSchedule = createLckRounds35SeasonPlayInOpeningSchedule(
      postseasonSeededCompetition,
      {
        startDateKey: addDaysToDateKey(lastRegularDate, 3),
      },
    );

    if (openingSchedule.length === 0) {
      return seasonState;
    }

    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        openingSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-3-5"
          ? {
              ...competition,
              status: "active",
              currentStageName:
                openingSchedule[0]?.stageName ??
                lckRounds35PostseasonStageNames.seasonPlayInRound1,
              currentWeek: openingSchedule[0]?.week ?? competition.currentWeek,
              qualifiedTeamIds: getLckRounds35PostseasonSeeds(
                postseasonSeededCompetition,
              ).map((team) => team.teamId),
              qualifiedTeamNames: getLckRounds35PostseasonSeeds(
                postseasonSeededCompetition,
              ).map((team) => team.teamName),
              schedule: appendUniqueSchedules(
                competition.schedule,
                openingSchedule,
              ),
              completed: false,
            }
          : competition,
      ),
    };
  }

  const nextPostseasonSchedule = getNextLckRounds35PostseasonSchedule(
    lckRounds,
    seasonState.matchRecords,
  );

  if (nextPostseasonSchedule.length > 0) {
    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        nextPostseasonSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "lck-rounds-3-5"
          ? {
              ...competition,
              currentStageName: nextPostseasonSchedule[0].stageName,
              currentWeek: nextPostseasonSchedule[0].week,
              schedule: appendUniqueSchedules(
                competition.schedule,
                nextPostseasonSchedule,
              ),
            }
          : competition,
      ),
    };
  }

  return {
    ...seasonState,
    nextMatchIds: [],
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "lck-rounds-3-5"
        ? {
            ...competition,
            status: "active",
            currentStageName:
              lckRounds.currentStageName || "Postseason Standby",
            qualifiedTeamIds: postseasonTeams.map((entry) => entry.teamId),
            qualifiedTeamNames: postseasonTeams.map((entry) => entry.teamName),
            completed: false,
          }
        : competition,
    ),
  };
}


export { advanceFirstStandAfterCompletedMatches };
