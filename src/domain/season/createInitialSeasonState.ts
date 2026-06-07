import { createPlayableLckTeams } from "../../data/lckTeams";
import type {
  Competition,
  CompetitionId,
  CompetitionState,
  Opponent,
  Player,
  SeasonState,
  StandingEntry,
} from "../../types/game";
import { createAsianGamesSetup } from "./asianGamesFormat";
import { createFirstStandSetup } from "./firstStandFormat";
import { createLckCupSchedule } from "./lckCupFormat";
import {
  lckRounds12RegularStageName,
  createLckRounds12Schedule,
} from "./lckRounds12Format";
import {
  createLckRounds34Setup,
  lckRounds34CurrentStageName,
} from "./lckRounds34Format";
import {
  createLckRounds35Setup,
  lckRounds35CurrentStageName,
} from "./lckRounds35Format";
import { createMsiSetup, msiStageNames } from "./msiFormat";
import {
  formatSeasonDateLabel,
  getFirstScheduledDateKey,
} from "./seasonScheduleDates";
import {
  getSeasonCompetitionsForProfile,
  getSeasonProfile,
  getSeasonProfileForState,
} from "./seasonProfile";

const stoveLeagueWeeks = 4;

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
  const profile = getSeasonProfile(seasonNumber);
  const competitions = getSeasonCompetitionsForProfile(profile).map((competition) =>
    createCompetitionState(competition, userTeamName),
  );

  return {
    seasonNumber,
    yearLabel: profile.yearLabel,
    calendarType: profile.calendarType,
    phase: "stove-league",
    currentCompetitionId: null,
    currentWeek: 0,
    currentTurn: 0,
    currentDateKey: `${profile.yearLabel}-01-01`,
    currentDateLabel: `${profile.yearLabel} Stove League Week 1`,
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

export function activateFirstStand(
  seasonState: SeasonState,
  internationalOpponents: Opponent[],
): SeasonState {
  const competitionId: CompetitionId = "first-stand";
  const firstStandSetup = createFirstStandSetup({
    internationalOpponents,
    options: {
      calendarType: seasonState.calendarType,
      year: seasonState.yearLabel,
    },
    seasonState,
  });
  const openingDateKey =
    getFirstScheduledDateKey(firstStandSetup.schedule) ??
    `${seasonState.yearLabel}-03-10`;
  const userTeamId = getUserTeamIdFromStandings(firstStandSetup.standings);
  const openingMatchIds = hasUserMatchOnDate(
    firstStandSetup.schedule,
    openingDateKey,
    userTeamId,
  )
    ? getMatchIdsForDate(firstStandSetup.schedule, openingDateKey)
    : [];
  const openingWeek =
    firstStandSetup.schedule.find((match) => match.scheduledDate === openingDateKey)
      ?.week ?? 1;
  const existingScheduleIds = new Set(
    seasonState.scheduledMatches.map((match) => match.id),
  );
  const newSchedules = firstStandSetup.schedule.filter(
    (match) => !existingScheduleIds.has(match.id),
  );

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
            currentStageName: "Group Stage",
            currentWeek: openingWeek,
            standings: firstStandSetup.standings,
            schedule: firstStandSetup.schedule,
            qualifiedTeamIds: [],
            qualifiedTeamNames: [],
            winnerTeamId: undefined,
            winnerTeamName: undefined,
            completed: false,
          }
        : competition,
    ),
  };
}

export function activateMsi(
  seasonState: SeasonState,
  internationalOpponents: Opponent[],
): SeasonState {
  const competitionId: CompetitionId = "msi";
  const msiSetup = createMsiSetup({
    internationalOpponents,
    options: {
      calendarType: seasonState.calendarType,
      year: seasonState.yearLabel,
    },
    seasonState,
  });
  const openingDateKey =
    getFirstScheduledDateKey(msiSetup.schedule) ??
    `${seasonState.yearLabel}-06-08`;
  const userTeamId = getUserTeamIdFromStandings(msiSetup.standings);
  const openingMatchIds = hasUserMatchOnDate(
    msiSetup.schedule,
    openingDateKey,
    userTeamId,
  )
    ? getMatchIdsForDate(msiSetup.schedule, openingDateKey)
    : [];
  const openingWeek =
    msiSetup.schedule.find((match) => match.scheduledDate === openingDateKey)
      ?.week ?? 1;
  const existingScheduleIds = new Set(
    seasonState.scheduledMatches.map((match) => match.id),
  );
  const newSchedules = msiSetup.schedule.filter(
    (match) => !existingScheduleIds.has(match.id),
  );

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
            currentStageName: msiStageNames.playInSemifinals,
            currentWeek: openingWeek,
            standings: msiSetup.standings,
            schedule: msiSetup.schedule,
            qualifiedTeamIds: [],
            qualifiedTeamNames: [],
            winnerTeamId: undefined,
            winnerTeamName: undefined,
            completed: false,
          }
        : competition,
    ),
  };
}

export function activateLckRounds34(seasonState: SeasonState): SeasonState {
  const competitionId: CompetitionId = "lck-rounds-3-4";
  const lckRounds12 = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-1-2",
  );
  const baseStandings = lckRounds12?.standings.length
    ? lckRounds12.standings
    : createInitialLckStandings("T1");
  const lckRounds34Setup = createLckRounds34Setup(baseStandings, {
    calendarType: seasonState.calendarType,
    year: seasonState.yearLabel,
  });
  const openingDateKey =
    getFirstScheduledDateKey(lckRounds34Setup.schedule) ??
    `${seasonState.yearLabel}-07-08`;
  const userTeamId = getUserTeamIdFromStandings(lckRounds34Setup.standings);
  const openingMatchIds = hasUserMatchOnDate(
    lckRounds34Setup.schedule,
    openingDateKey,
    userTeamId,
  )
    ? getMatchIdsForDate(lckRounds34Setup.schedule, openingDateKey)
    : [];
  const openingWeek =
    lckRounds34Setup.schedule.find((match) => match.scheduledDate === openingDateKey)
      ?.week ?? 1;
  const existingScheduleIds = new Set(
    seasonState.scheduledMatches.map((match) => match.id),
  );
  const newSchedules = lckRounds34Setup.schedule.filter(
    (match) => !existingScheduleIds.has(match.id),
  );

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
            currentStageName: lckRounds34CurrentStageName,
            currentWeek: openingWeek,
            schedule: lckRounds34Setup.schedule,
            standings: lckRounds34Setup.standings,
            qualifiedTeamIds: [],
            qualifiedTeamNames: [],
            winnerTeamId: undefined,
            winnerTeamName: undefined,
            completed: false,
          }
        : competition,
    ),
  };
}

export function activateLckRounds35(seasonState: SeasonState): SeasonState {
  const profile = getSeasonProfileForState(seasonState);
  const competitionId: CompetitionId = "lck-rounds-3-5";

  if (profile.postMsiCompetitionId !== competitionId) {
    return seasonState;
  }

  const lckRounds35 = seasonState.competitions.find(
    (competition) => competition.competitionId === competitionId,
  );
  const lckRounds12 = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-1-2",
  );
  const baseStandings =
    lckRounds12?.standings.length ? lckRounds12.standings : createInitialLckStandings("T1");
  const lckRounds35Setup = createLckRounds35Setup(baseStandings, {
    calendarType: seasonState.calendarType,
    year: seasonState.yearLabel,
  });
  const openingDateKey =
    getFirstScheduledDateKey(lckRounds35Setup.schedule) ??
    `${seasonState.yearLabel}-07-03`;
  const userTeamId = getUserTeamIdFromStandings(lckRounds35Setup.standings);
  const openingMatchIds = hasUserMatchOnDate(
    lckRounds35Setup.schedule,
    openingDateKey,
    userTeamId,
  )
    ? getMatchIdsForDate(lckRounds35Setup.schedule, openingDateKey)
    : [];
  const openingWeek =
    lckRounds35Setup.schedule.find((match) => match.scheduledDate === openingDateKey)
      ?.week ?? 1;
  const existingScheduleIds = new Set(
    seasonState.scheduledMatches.map((match) => match.id),
  );
  const newSchedules = lckRounds35Setup.schedule.filter(
    (match) => !existingScheduleIds.has(match.id),
  );

  if (!lckRounds35) {
    return seasonState;
  }

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
            currentStageName: lckRounds35CurrentStageName,
            currentWeek: openingWeek,
            standings: lckRounds35Setup.standings,
            schedule: lckRounds35Setup.schedule,
            qualifiedTeamIds: [],
            qualifiedTeamNames: [],
            winnerTeamId: undefined,
            winnerTeamName: undefined,
            completed: false,
          }
        : competition,
    ),
  };
}

export function activateAsianGames(
  seasonState: SeasonState,
  players: Player[],
): SeasonState {
  const competitionId: CompetitionId = "asian-games";
  const setup = createAsianGamesSetup({
    players,
    seasonState,
  });
  const openingDateKey =
    setup.asianGamesState.rosterSelectedDateKey ??
    `${seasonState.yearLabel}-09-01`;
  const openingWeek = 1;
  const existingScheduleIds = new Set(
    seasonState.scheduledMatches.map((match) => match.id),
  );
  const newSchedules = setup.schedule.filter(
    (match) => !existingScheduleIds.has(match.id),
  );

  return {
    ...seasonState,
    phase: "competition",
    currentCompetitionId: competitionId,
    currentWeek: openingWeek,
    currentDateKey: openingDateKey,
    currentDateLabel: formatSeasonDateLabel(openingDateKey),
    progressStatus: "idle",
    asianGames: setup.asianGamesState,
    nextMatchIds: [],
    lastMatchRecordIds: [],
    scheduledMatches: [...seasonState.scheduledMatches, ...newSchedules],
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === competitionId
        ? {
            ...competition,
            status: "active",
            currentStageName: "National Team Selection",
            currentWeek: openingWeek,
            standings: setup.standings,
            schedule: setup.schedule,
            qualifiedTeamIds: [],
            qualifiedTeamNames: [],
            winnerTeamId: undefined,
            winnerTeamName: undefined,
            completed: false,
          }
        : competition,
    ),
  };
}

export function transitionFromLckCupToFirstStand(
  seasonState: SeasonState,
  internationalOpponents: Opponent[],
): SeasonState {
  return activateFirstStand(seasonState, internationalOpponents);
}

export function transitionFromFirstStandToLckRounds12(
  seasonState: SeasonState,
): SeasonState {
  return activateLckRounds12(seasonState);
}

export function transitionFromLckRounds12ToMsi(
  seasonState: SeasonState,
  internationalOpponents: Opponent[],
): SeasonState {
  return activateMsi(seasonState, internationalOpponents);
}

export function transitionFromMsiToLckRounds34(
  seasonState: SeasonState,
): SeasonState {
  return activateLckRounds34(seasonState);
}

export function transitionFromMsiToLckRounds35(
  seasonState: SeasonState,
): SeasonState {
  return activateLckRounds35(seasonState);
}

export function transitionFromLckRounds34ToAsianGames(
  seasonState: SeasonState,
  players: Player[],
): SeasonState {
  return activateAsianGames(seasonState, players);
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
