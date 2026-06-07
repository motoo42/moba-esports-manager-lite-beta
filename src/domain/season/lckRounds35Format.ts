import type {
  LckRoundsGroupName,
  MatchSchedule,
  SeasonCalendarType,
  StandingEntry,
} from "../../types/game";
import { getDomesticMatchDateKey } from "./seasonScheduleDates";

export const lckRounds35RegularWeeks = 8;
export const lckRounds35MatchesPerTeam = 12;
export const lckRounds35TotalMatches = 60;
export const lckRounds35StageNames = {
  legend: "Legend Group",
  rise: "Rise Group",
} as const;
export const lckRounds35CurrentStageName = "Legend / Rise Groups";

type RoundRobinEntrant = StandingEntry | null;

type RoundRobinPair = {
  blue: StandingEntry;
  red: StandingEntry;
};

type ScheduleOptions = {
  year: number;
  calendarType: SeasonCalendarType;
};

function sortByRank(standings: StandingEntry[]) {
  return [...standings].sort((left, right) => left.rank - right.rank);
}

function sortByInitialSeed(standings: StandingEntry[]) {
  return [...standings].sort((left, right) => left.initialSeed - right.initialSeed);
}

function rotateRoundRobinTeams(teams: RoundRobinEntrant[]) {
  return [teams[0], teams[teams.length - 1], ...teams.slice(1, -1)];
}

function createSingleRoundRobinRounds(standings: StandingEntry[]) {
  let rotation: RoundRobinEntrant[] = [...sortByInitialSeed(standings), null];
  const roundCount = rotation.length - 1;
  const matchesPerRound = rotation.length / 2;
  const rounds: RoundRobinPair[][] = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const round: RoundRobinPair[] = [];

    for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex += 1) {
      const left = rotation[matchIndex];
      const right = rotation[rotation.length - 1 - matchIndex];

      if (!left || !right) {
        continue;
      }

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

function createTripleRoundRobinRounds(standings: StandingEntry[]) {
  const firstRound = createSingleRoundRobinRounds(standings);
  const secondRound = firstRound.map((round) =>
    round.map((match) => ({
      blue: match.red,
      red: match.blue,
    })),
  );
  const thirdRound = firstRound.map((round, roundIndex) =>
    round.map((match, matchIndex) => {
      const shouldSwapSide = (roundIndex + matchIndex) % 2 === 0;

      return {
        blue: shouldSwapSide ? match.red : match.blue,
        red: shouldSwapSide ? match.blue : match.red,
      };
    }),
  );

  return [...firstRound, ...secondRound, ...thirdRound];
}

function createScheduleId({
  blueTeamId,
  group,
  redTeamId,
  roundNumber,
}: {
  blueTeamId: string;
  group: LckRoundsGroupName;
  redTeamId: string;
  roundNumber: number;
}) {
  return `lck-r35-${group}-round-${roundNumber}-${blueTeamId}-vs-${redTeamId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}

function createMatch({
  group,
  match,
  matchIndex,
  options,
  roundNumber,
}: {
  group: LckRoundsGroupName;
  match: RoundRobinPair;
  matchIndex: number;
  options: ScheduleOptions;
  roundNumber: number;
}): MatchSchedule {
  const matchDayIndex = roundNumber - 1;
  const week = Math.floor(matchDayIndex / 2) + 1;
  const matchDayOffset = matchDayIndex % 2 === 0 ? 0 : 3;
  const matchIndexInWeek = matchDayOffset + matchIndex;

  return {
    id: createScheduleId({
      blueTeamId: match.blue.teamId,
      group,
      redTeamId: match.red.teamId,
      roundNumber,
    }),
    competitionId: "lck-rounds-3-5",
    week,
    scheduledDate: getDomesticMatchDateKey({
      calendarType: options.calendarType,
      competitionId: "lck-rounds-3-5",
      matchIndexInWeek,
      week,
      year: options.year,
    }),
    stageName: lckRounds35StageNames[group],
    blueTeamId: match.blue.teamId,
    blueTeamName: match.blue.teamName,
    redTeamId: match.red.teamId,
    redTeamName: match.red.teamName,
    format: "bo3",
    status: "scheduled",
    fearlessEnabled: true,
  };
}

function createGroupSchedule({
  group,
  options,
  standings,
}: {
  group: LckRoundsGroupName;
  options: ScheduleOptions;
  standings: StandingEntry[];
}) {
  return createTripleRoundRobinRounds(standings).flatMap((round, roundIndex) =>
    round.map((match, matchIndex) =>
      createMatch({
        group,
        match,
        matchIndex,
        options,
        roundNumber: roundIndex + 1,
      }),
    ),
  );
}

function assignLckRounds35Group(
  entry: StandingEntry,
  index: number,
): StandingEntry {
  return {
    ...entry,
    rank: index + 1,
    initialSeed: index + 1,
    lckRoundsGroup: index < 5 ? "legend" : "rise",
  };
}

export function isLckRounds35RegularStageName(stageName: string) {
  return Object.values(lckRounds35StageNames).includes(
    stageName as (typeof lckRounds35StageNames)[keyof typeof lckRounds35StageNames],
  );
}

export function createLckRounds35Setup(
  rounds12Standings: StandingEntry[],
  options: ScheduleOptions,
) {
  const standings = sortByRank(rounds12Standings).map(assignLckRounds35Group);
  const legendGroup = standings.filter((entry) => entry.lckRoundsGroup === "legend");
  const riseGroup = standings.filter((entry) => entry.lckRoundsGroup === "rise");
  const schedule = [
    ...createGroupSchedule({
      group: "legend",
      options,
      standings: legendGroup,
    }),
    ...createGroupSchedule({
      group: "rise",
      options,
      standings: riseGroup,
    }),
  ].sort((left, right) => {
    const dateDiff = (left.scheduledDate ?? "").localeCompare(
      right.scheduledDate ?? "",
    );

    return dateDiff !== 0 ? dateDiff : left.id.localeCompare(right.id);
  });

  return {
    legendGroup,
    riseGroup,
    schedule,
    standings,
  };
}
