import type {
  CompetitionId,
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  SeasonProgressActionLabel,
  SeasonState,
  SeriesScore,
  StandingEntry,
} from "../../types/game";
import {
  getLckCupFinalists,
  getNextLckCupKnockoutSchedule,
} from "./lckCupFormat";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "./seasonScheduleDates";

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

function updateEntryWithScore(
  entry: StandingEntry,
  score: SeriesScore,
  side: "blue" | "red",
  wonMatch: boolean,
) {
  const setWins = side === "blue" ? score.blueWins : score.redWins;
  const setLosses = side === "blue" ? score.redWins : score.blueWins;
  const wins = entry.wins + (wonMatch ? 1 : 0);
  const losses = entry.losses + (wonMatch ? 0 : 1);
  const totalMatches = wins + losses;

  return {
    ...entry,
    wins,
    losses,
    matchWins: wins,
    matchLosses: losses,
    setWins: entry.setWins + setWins,
    setLosses: entry.setLosses + setLosses,
    winRate: totalMatches > 0 ? wins / totalMatches : 0,
  };
}

function sortStandings(standings: StandingEntry[]) {
  return [...standings]
    .sort((left, right) => {
      const winDiff = right.wins - left.wins;

      if (winDiff !== 0) {
        return winDiff;
      }

      const setDiffLeft = left.setWins - left.setLosses;
      const setDiffRight = right.setWins - right.setLosses;
      const setDiff = setDiffRight - setDiffLeft;

      if (setDiff !== 0) {
        return setDiff;
      }

      const setWinsDiff = right.setWins - left.setWins;

      if (setWinsDiff !== 0) {
        return setWinsDiff;
      }

      return left.initialSeed - right.initialSeed;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
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

  return {
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
  };
}

function applyRecordsToStandings(
  standings: StandingEntry[],
  records: MatchRecord[],
  schedule: MatchSchedule[],
) {
  if (standings.length === 0 || records.length === 0) {
    return standings;
  }

  const scheduleById = new Map(schedule.map((match) => [match.id, match]));

  const nextStandings = records.reduce<StandingEntry[]>((currentStandings, record) => {
    const match = scheduleById.get(record.scheduleId);

    if (!match) {
      return currentStandings;
    }

    return currentStandings.map((entry) => {
      if (entry.teamId === match.blueTeamId) {
        return updateEntryWithScore(
          entry,
          record.score,
          "blue",
          record.winnerSide === "blue",
        );
      }

      if (entry.teamId === match.redTeamId) {
        return updateEntryWithScore(
          entry,
          record.score,
          "red",
          record.winnerSide === "red",
        );
      }

      return entry;
    });
  }, standings);

  return sortStandings(nextStandings);
}

export function getSeasonProgressActionLabel(
  seasonState: SeasonState,
): SeasonProgressActionLabel {
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
    return {
      ...updateSeasonDateState(seasonState, nextDate),
      currentTurn: seasonState.currentTurn + 1,
    };
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

  return {
    ...updateSeasonDateState(seasonState, nextDateKey),
    currentTurn: seasonState.currentTurn + 1,
  };
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

      return {
        ...competition,
        schedule: competitionSchedule,
        standings: applyRecordsToStandings(
          competition.standings,
          records,
          competition.schedule,
        ),
      };
    }),
  };
}

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

  const allRegularMatchesCompleted = lckRounds.schedule.every(
    (match) => match.status === "completed",
  );

  if (!allRegularMatchesCompleted) {
    return seasonState;
  }

  const playoffQualifiers = [...lckRounds.standings]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 6);

  return {
    ...seasonState,
    nextMatchIds: [],
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "lck-rounds-1-2"
        ? {
            ...competition,
            status: "completed",
            currentStageName: "Regular Season Completed",
            qualifiedTeamIds: playoffQualifiers.map((entry) => entry.teamId),
            qualifiedTeamNames: playoffQualifiers.map((entry) => entry.teamName),
            completed: true,
          }
        : competition,
    ),
  };
}
