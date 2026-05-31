import type {
  MatchSchedule,
  SeasonCalendarType,
  StandingEntry,
} from "../../types/game";
import { getDomesticMatchDateKey } from "./seasonScheduleDates";

export const lckRounds12RegularWeeks = 9;
export const lckRounds12MatchesPerTeam = 18;
export const lckRounds12RegularStageName = "Rounds 1-2 Regular Season";

type RoundRobinPair = {
  blue: StandingEntry;
  red: StandingEntry;
};

type ScheduleOptions = {
  year: number;
  calendarType: SeasonCalendarType;
};

function sortByInitialSeed(standings: StandingEntry[]) {
  return [...standings].sort((left, right) => left.initialSeed - right.initialSeed);
}

function rotateRoundRobinTeams(teams: StandingEntry[]) {
  return [teams[0], teams[teams.length - 1], ...teams.slice(1, -1)];
}

function createSingleRoundRobinRounds(standings: StandingEntry[]) {
  let rotation = sortByInitialSeed(standings);
  const roundCount = rotation.length - 1;
  const matchesPerRound = rotation.length / 2;
  const rounds: RoundRobinPair[][] = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const round: RoundRobinPair[] = [];

    for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex += 1) {
      const left = rotation[matchIndex];
      const right = rotation[rotation.length - 1 - matchIndex];
      const shouldSwapSide = (roundIndex + matchIndex) % 2 === 1;

      round.push({
        blue: shouldSwapSide ? right : left,
        red: shouldSwapSide ? left : right,
      });
    }

    rounds.push(round);
    rotation = rotateRoundRobinTeams(rotation);
  }

  return rounds;
}

function createDoubleRoundRobinRounds(standings: StandingEntry[]) {
  const firstRound = createSingleRoundRobinRounds(standings);
  const secondRound = firstRound.map((round) =>
    round.map((match) => ({
      blue: match.red,
      red: match.blue,
    })),
  );

  return [...firstRound, ...secondRound];
}

function sharesTeam(left: RoundRobinPair, right: RoundRobinPair) {
  return [left.blue.teamId, left.red.teamId].some((teamId) =>
    [right.blue.teamId, right.red.teamId].includes(teamId),
  );
}

function pairRoundMatchesByDay(
  firstRoundMatches: RoundRobinPair[],
  secondRoundMatches: RoundRobinPair[],
) {
  const remainingSecondRound = [...secondRoundMatches];

  return firstRoundMatches.map((firstMatch) => {
    const compatibleIndex = remainingSecondRound.findIndex(
      (secondMatch) => !sharesTeam(firstMatch, secondMatch),
    );
    const pickedIndex = compatibleIndex >= 0 ? compatibleIndex : 0;
    const [secondMatch] = remainingSecondRound.splice(pickedIndex, 1);

    return [firstMatch, secondMatch] as const;
  });
}

function createScheduleId({
  blueTeamId,
  redTeamId,
  roundNumber,
  week,
}: {
  blueTeamId: string;
  redTeamId: string;
  roundNumber: number;
  week: number;
}) {
  return `lck-r12-week-${week}-round-${roundNumber}-${blueTeamId}-vs-${redTeamId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}

function createMatch({
  match,
  matchIndexInWeek,
  options,
  roundNumber,
  week,
}: {
  match: RoundRobinPair;
  matchIndexInWeek: number;
  options: ScheduleOptions;
  roundNumber: number;
  week: number;
}): MatchSchedule {
  return {
    id: createScheduleId({
      blueTeamId: match.blue.teamId,
      redTeamId: match.red.teamId,
      roundNumber,
      week,
    }),
    competitionId: "lck-rounds-1-2",
    week,
    scheduledDate: getDomesticMatchDateKey({
      calendarType: options.calendarType,
      competitionId: "lck-rounds-1-2",
      matchIndexInWeek,
      week,
      year: options.year,
    }),
    stageName: lckRounds12RegularStageName,
    blueTeamId: match.blue.teamId,
    blueTeamName: match.blue.teamName,
    redTeamId: match.red.teamId,
    redTeamName: match.red.teamName,
    format: "bo3",
    status: "scheduled",
    fearlessEnabled: false,
  };
}

export function createLckRounds12Schedule(
  standings: StandingEntry[],
  options: ScheduleOptions,
) {
  const rounds = createDoubleRoundRobinRounds(standings);
  const schedule: MatchSchedule[] = [];

  for (let week = 1; week <= lckRounds12RegularWeeks; week += 1) {
    const firstRoundIndex = (week - 1) * 2;
    const pairedMatches = pairRoundMatchesByDay(
      rounds[firstRoundIndex],
      rounds[firstRoundIndex + 1],
    );

    pairedMatches.forEach(([firstMatch, secondMatch], dayIndex) => {
      schedule.push(
        createMatch({
          match: firstMatch,
          matchIndexInWeek: dayIndex,
          options,
          roundNumber: firstRoundIndex + 1,
          week,
        }),
      );
      schedule.push(
        createMatch({
          match: secondMatch,
          matchIndexInWeek: dayIndex,
          options,
          roundNumber: firstRoundIndex + 2,
          week,
        }),
      );
    });
  }

  return schedule;
}
