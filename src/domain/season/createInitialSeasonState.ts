import {
  asianGamesSeasonCompetitions,
  normalSeasonCompetitions,
} from "../../data/competitions";
import { createPlayableLckTeams } from "../../data/lckTeams";
import type {
  Competition,
  CompetitionId,
  CompetitionState,
  SeasonCalendarType,
  SeasonState,
  StandingEntry,
} from "../../types/game";
import { createLckCupSchedule } from "./lckCupFormat";
import {
  lckRounds12RegularStageName,
  createLckRounds12Schedule,
} from "./lckRounds12Format";
import {
  formatSeasonDateLabel,
  getFirstScheduledDateKey,
} from "./seasonScheduleDates";

const firstSeasonYear = 2026;
const stoveLeagueWeeks = 4;

function isAsianGamesSeason(yearLabel: number) {
  return (yearLabel - firstSeasonYear) % 4 === 0;
}

function getSeasonCompetitions(calendarType: SeasonCalendarType) {
  return calendarType === "asian-games"
    ? asianGamesSeasonCompetitions
    : normalSeasonCompetitions;
}

function findUserTeamId(userTeamName: string) {
  const normalizedUserTeamName = userTeamName.trim().toLowerCase();
  const teams = createPlayableLckTeams(userTeamName);

  return (
    teams.find(
      (team) =>
        team.name.toLowerCase() === normalizedUserTeamName ||
        team.shortName.toLowerCase() === normalizedUserTeamName,
    )?.id ?? "user-team"
  );
}

export function createInitialLckStandings(userTeamName: string): StandingEntry[] {
  const teams = createPlayableLckTeams(userTeamName);
  const userTeamId = findUserTeamId(userTeamName);

  return teams.map((team, index) => ({
    teamId: team.id,
    teamName: team.name,
    rank: index + 1,
    initialSeed: team.previousSeasonRank,
    wins: 0,
    losses: 0,
    matchWins: 0,
    matchLosses: 0,
    setWins: 0,
    setLosses: 0,
    winRate: 0,
    isUserTeam: team.id === userTeamId,
  }));
}

function createCompetitionState(
  competition: Competition,
  userTeamName: string,
): CompetitionState {
  return {
    competitionId: competition.id,
    name: competition.name,
    status: "locked",
    currentStageName: competition.stages[0]?.name ?? "Not started",
    currentWeek: 0,
    standings: competition.scope === "lck" ? createInitialLckStandings(userTeamName) : [],
    schedule: [],
    qualifiedTeamIds: [],
    qualifiedTeamNames: [],
    completed: false,
  };
}

export function createInitialSeasonState({
  seasonNumber,
  userTeamName,
}: {
  seasonNumber: number;
  userTeamName: string;
}): SeasonState {
  const yearLabel = firstSeasonYear + seasonNumber - 1;
  const calendarType: SeasonCalendarType = isAsianGamesSeason(yearLabel)
    ? "asian-games"
    : "normal";
  const competitions = getSeasonCompetitions(calendarType).map((competition) =>
    createCompetitionState(competition, userTeamName),
  );

  return {
    seasonNumber,
    yearLabel,
    calendarType,
    phase: "stove-league",
    currentCompetitionId: null,
    currentWeek: 0,
    currentTurn: 0,
    currentDateKey: `${yearLabel}-01-01`,
    currentDateLabel: `${yearLabel} Stove League Week 1`,
    progressStatus: "idle",
    stoveLeague: {
      status: "active",
      currentWeek: 1,
      totalWeeks: stoveLeagueWeeks,
      completed: false,
    },
    competitions,
    scheduledMatches: [],
    matchRecords: [],
    nextMatchIds: [],
    lastMatchRecordIds: [],
  };
}

function getUserTeamIdFromStandings(standings: StandingEntry[]) {
  return standings.find((entry) => entry.isUserTeam)?.teamId ?? "user-team";
}

function getMatchIdsForDate(
  schedule: { scheduledDate?: string; id: string }[],
  dateKey: string,
) {
  return schedule
    .filter((match) => match.scheduledDate === dateKey)
    .map((match) => match.id);
}

function hasUserMatchOnDate(
  schedule: {
    scheduledDate?: string;
    blueTeamId: string;
    redTeamId: string;
  }[],
  dateKey: string,
  userTeamId: string,
) {
  return schedule.some(
    (match) =>
      match.scheduledDate === dateKey &&
      (match.blueTeamId === userTeamId || match.redTeamId === userTeamId),
  );
}

export function completeStoveLeague(seasonState: SeasonState): SeasonState {
  const firstCompetitionId: CompetitionId = "lck-cup";
  const lckCup = seasonState.competitions.find(
    (competition) => competition.competitionId === firstCompetitionId,
  );
  const lckCupSetup = createLckCupSchedule(lckCup?.standings ?? [], {
    calendarType: seasonState.calendarType,
    year: seasonState.yearLabel,
  });
  const openingDateKey =
    getFirstScheduledDateKey(lckCupSetup.schedule) ??
    `${seasonState.yearLabel}-01-14`;
  const userTeamId = getUserTeamIdFromStandings(lckCupSetup.standings);
  const openingMatchIds = hasUserMatchOnDate(
    lckCupSetup.schedule,
    openingDateKey,
    userTeamId,
  )
    ? getMatchIdsForDate(lckCupSetup.schedule, openingDateKey)
    : [];
  const openingWeek =
    lckCupSetup.schedule.find((match) => match.scheduledDate === openingDateKey)
      ?.week ?? 1;

  return {
    ...seasonState,
    phase: "competition",
    currentCompetitionId: firstCompetitionId,
    currentWeek: openingWeek,
    currentTurn: seasonState.currentTurn + 1,
    currentDateKey: openingDateKey,
    currentDateLabel: formatSeasonDateLabel(openingDateKey),
    progressStatus: openingMatchIds.length > 0 ? "match-preview" : "idle",
    stoveLeague: {
      ...seasonState.stoveLeague,
      status: "completed",
      currentWeek: seasonState.stoveLeague.totalWeeks,
      completed: true,
    },
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === firstCompetitionId
        ? {
            ...competition,
            status: "active",
            currentWeek: openingWeek,
            currentStageName: "Group Battle",
            standings: lckCupSetup.standings,
            schedule: lckCupSetup.schedule,
          }
        : competition,
    ),
    scheduledMatches: lckCupSetup.schedule,
    nextMatchIds: openingMatchIds,
    lastMatchRecordIds: [],
  };
}

export function activateLckRounds12(seasonState: SeasonState): SeasonState {
  const competitionId: CompetitionId = "lck-rounds-1-2";
  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === competitionId,
  );
  const baseStandings =
    lckRounds?.standings.length ? lckRounds.standings : createInitialLckStandings("T1");
  const schedule = createLckRounds12Schedule(baseStandings, {
    calendarType: seasonState.calendarType,
    year: seasonState.yearLabel,
  });
  const openingDateKey =
    getFirstScheduledDateKey(schedule) ?? `${seasonState.yearLabel}-04-01`;
  const userTeamId = getUserTeamIdFromStandings(baseStandings);
  const openingMatchIds = hasUserMatchOnDate(
    schedule,
    openingDateKey,
    userTeamId,
  )
    ? getMatchIdsForDate(schedule, openingDateKey)
    : [];
  const openingWeek =
    schedule.find((match) => match.scheduledDate === openingDateKey)?.week ?? 1;
  const existingScheduleIds = new Set(
    seasonState.scheduledMatches.map((match) => match.id),
  );
  const newSchedules = schedule.filter((match) => !existingScheduleIds.has(match.id));

  return {
    ...seasonState,
    phase: "competition",
    currentCompetitionId: competitionId,
    currentWeek: openingWeek,
    currentDateKey: openingDateKey,
    currentDateLabel: formatSeasonDateLabel(openingDateKey),
    progressStatus: openingMatchIds.length > 0 ? "match-preview" : "idle",
    nextMatchIds: openingMatchIds,
    lastMatchRecordIds: [],
    scheduledMatches: [...seasonState.scheduledMatches, ...newSchedules],
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === competitionId
        ? {
            ...competition,
            status: "active",
            currentStageName: lckRounds12RegularStageName,
            currentWeek: openingWeek,
            schedule,
            standings: baseStandings.map((entry, index) => ({
              ...entry,
              rank: index + 1,
              wins: 0,
              losses: 0,
              matchWins: 0,
              matchLosses: 0,
              setWins: 0,
              setLosses: 0,
              winRate: 0,
            })),
          }
        : competition,
    ),
  };
}

export function completeFirstStandPlaceholder(seasonState: SeasonState): SeasonState {
  const lckCup = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-cup",
  );

  return {
    ...seasonState,
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "first-stand"
        ? {
            ...competition,
            status: "completed",
            currentStageName: "Placeholder Completed - implement in 12-B",
            qualifiedTeamIds: lckCup?.qualifiedTeamIds ?? [],
            qualifiedTeamNames: lckCup?.qualifiedTeamNames ?? [],
            completed: true,
          }
        : competition,
    ),
  };
}

export function transitionFromLckCupToLckRounds12(
  seasonState: SeasonState,
): SeasonState {
  return activateLckRounds12(completeFirstStandPlaceholder(seasonState));
}
