import type {
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  StandingEntry,
} from "../../types/game";
import { addDaysToDateKey } from "./seasonScheduleDates";

export const lckRounds12PlayoffStageNames = {
  round1: "Playoffs Round 1",
  semifinals: "Playoffs Semifinals",
  final: "Playoffs Final",
} as const;

export const lckRounds12PlayoffMatchIds = {
  round1Seed3VsSeed6: "lck-r12-playoffs-r1-seed-3-vs-seed-6",
  round1Seed4VsSeed5: "lck-r12-playoffs-r1-seed-4-vs-seed-5",
  semifinalSeed1VsSeed45: "lck-r12-playoffs-sf-seed-1-vs-seed-4-5",
  semifinalSeed2VsSeed36: "lck-r12-playoffs-sf-seed-2-vs-seed-3-6",
  final: "lck-r12-playoffs-final",
} as const;

type PlayoffTeam = Pick<StandingEntry, "initialSeed" | "teamId" | "teamName">;

type PlayoffScheduleOptions = {
  startDateKey: string;
};

export function getLckRounds12PlayoffStageNames() {
  return lckRounds12PlayoffStageNames;
}

export function isLckRounds12PlayoffStageName(stageName: string) {
  return Object.values(lckRounds12PlayoffStageNames).includes(
    stageName as (typeof lckRounds12PlayoffStageNames)[keyof typeof lckRounds12PlayoffStageNames],
  );
}

function sortByRank(standings: StandingEntry[]) {
  return [...standings].sort((left, right) => left.rank - right.rank);
}

export function getLckRounds12PlayoffSeeds(
  competition: CompetitionState,
): PlayoffTeam[] {
  if (competition.qualifiedTeamIds.length >= 6) {
    return competition.qualifiedTeamIds.slice(0, 6).flatMap((teamId, index) => {
      const entry = competition.standings.find((standing) => standing.teamId === teamId);
      const teamName =
        entry?.teamName ?? competition.qualifiedTeamNames[index] ?? `LCK ${index + 1}`;

      return [
        {
          initialSeed: index + 1,
          teamId,
          teamName,
        },
      ];
    });
  }

  return sortByRank(competition.standings)
    .slice(0, 6)
    .map((entry, index) => ({
      initialSeed: index + 1,
      teamId: entry.teamId,
      teamName: entry.teamName,
    }));
}

function createPlayoffMatch({
  blue,
  format = "bo5",
  id,
  red,
  scheduledDate,
  stageName,
  week,
}: {
  blue: PlayoffTeam;
  format?: MatchSchedule["format"];
  id: string;
  red: PlayoffTeam;
  scheduledDate: string;
  stageName: string;
  week: number;
}): MatchSchedule {
  return {
    id,
    competitionId: "lck-rounds-1-2",
    week,
    scheduledDate,
    stageName,
    blueTeamId: blue.teamId,
    blueTeamName: blue.teamName,
    redTeamId: red.teamId,
    redTeamName: red.teamName,
    format,
    status: "scheduled",
    fearlessEnabled: false,
  };
}

function getRecordForMatch(records: MatchRecord[], scheduleId: string) {
  return records.find((record) => record.scheduleId === scheduleId);
}

function getWinnerFromMatch(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
): PlayoffTeam | undefined {
  const record = getRecordForMatch(records, scheduleId);
  const match = competition.schedule.find((schedule) => schedule.id === scheduleId);

  if (!record || !match) {
    return undefined;
  }

  const winnerIsBlue = record.winnerTeamId === match.blueTeamId;

  return {
    initialSeed: winnerIsBlue
      ? getSeedForTeam(competition, match.blueTeamId)
      : getSeedForTeam(competition, match.redTeamId),
    teamId: record.winnerTeamId,
    teamName: record.winnerTeamName,
  };
}

function getSeedForTeam(competition: CompetitionState, teamId: string) {
  const seedIndex = getLckRounds12PlayoffSeeds(competition).findIndex(
    (team) => team.teamId === teamId,
  );

  return seedIndex >= 0 ? seedIndex + 1 : 99;
}

function hasMatch(competition: CompetitionState, scheduleId: string) {
  return competition.schedule.some((match) => match.id === scheduleId);
}

function getLatestStageDate(
  competition: CompetitionState,
  stageName: string,
): string | undefined {
  return [...competition.schedule]
    .filter((match) => match.stageName === stageName && match.scheduledDate)
    .sort((left, right) =>
      (right.scheduledDate ?? "").localeCompare(left.scheduledDate ?? ""),
    )[0]?.scheduledDate;
}

export function createLckRounds12PlayoffOpeningSchedule(
  competition: CompetitionState,
  options: PlayoffScheduleOptions,
): MatchSchedule[] {
  const seeded = getLckRounds12PlayoffSeeds(competition);

  if (seeded.length < 6) {
    return [];
  }

  return [
    createPlayoffMatch({
      id: lckRounds12PlayoffMatchIds.round1Seed3VsSeed6,
      week: 10,
      scheduledDate: options.startDateKey,
      stageName: lckRounds12PlayoffStageNames.round1,
      blue: seeded[2],
      red: seeded[5],
    }),
    createPlayoffMatch({
      id: lckRounds12PlayoffMatchIds.round1Seed4VsSeed5,
      week: 10,
      scheduledDate: addDaysToDateKey(options.startDateKey, 2),
      stageName: lckRounds12PlayoffStageNames.round1,
      blue: seeded[3],
      red: seeded[4],
    }),
  ];
}

export function getNextLckRounds12PlayoffSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const seeded = getLckRounds12PlayoffSeeds(competition);

  if (seeded.length < 6) {
    return [];
  }

  if (
    !hasMatch(competition, lckRounds12PlayoffMatchIds.semifinalSeed1VsSeed45)
  ) {
    const winner36 = getWinnerFromMatch(
      competition,
      records,
      lckRounds12PlayoffMatchIds.round1Seed3VsSeed6,
    );
    const winner45 = getWinnerFromMatch(
      competition,
      records,
      lckRounds12PlayoffMatchIds.round1Seed4VsSeed5,
    );
    const latestRound1Date = getLatestStageDate(
      competition,
      lckRounds12PlayoffStageNames.round1,
    );

    if (!winner36 || !winner45 || !latestRound1Date) {
      return [];
    }

    const firstSemifinalDate = addDaysToDateKey(latestRound1Date, 2);

    return [
      createPlayoffMatch({
        id: lckRounds12PlayoffMatchIds.semifinalSeed1VsSeed45,
        week: 11,
        scheduledDate: firstSemifinalDate,
        stageName: lckRounds12PlayoffStageNames.semifinals,
        blue: seeded[0],
        red: winner45,
      }),
      createPlayoffMatch({
        id: lckRounds12PlayoffMatchIds.semifinalSeed2VsSeed36,
        week: 11,
        scheduledDate: addDaysToDateKey(firstSemifinalDate, 2),
        stageName: lckRounds12PlayoffStageNames.semifinals,
        blue: seeded[1],
        red: winner36,
      }),
    ];
  }

  if (!hasMatch(competition, lckRounds12PlayoffMatchIds.final)) {
    const semifinal1Winner = getWinnerFromMatch(
      competition,
      records,
      lckRounds12PlayoffMatchIds.semifinalSeed1VsSeed45,
    );
    const semifinal2Winner = getWinnerFromMatch(
      competition,
      records,
      lckRounds12PlayoffMatchIds.semifinalSeed2VsSeed36,
    );
    const latestSemifinalDate = getLatestStageDate(
      competition,
      lckRounds12PlayoffStageNames.semifinals,
    );

    if (!semifinal1Winner || !semifinal2Winner || !latestSemifinalDate) {
      return [];
    }

    return [
      createPlayoffMatch({
        id: lckRounds12PlayoffMatchIds.final,
        week: 12,
        scheduledDate: addDaysToDateKey(latestSemifinalDate, 2),
        stageName: lckRounds12PlayoffStageNames.final,
        blue: semifinal1Winner,
        red: semifinal2Winner,
      }),
    ];
  }

  return [];
}

export function getLckRounds12Finalists(
  competition: CompetitionState,
  records: MatchRecord[],
): PlayoffTeam[] {
  const finalMatch = competition.schedule.find(
    (match) => match.id === lckRounds12PlayoffMatchIds.final,
  );
  const finalRecord = getRecordForMatch(records, lckRounds12PlayoffMatchIds.final);

  if (!finalMatch || !finalRecord) {
    return [];
  }

  const loserTeamId =
    finalRecord.winnerTeamId === finalMatch.blueTeamId
      ? finalMatch.redTeamId
      : finalMatch.blueTeamId;
  const loserTeamName =
    finalRecord.winnerTeamId === finalMatch.blueTeamId
      ? finalMatch.redTeamName
      : finalMatch.blueTeamName;

  return [
    {
      initialSeed: getSeedForTeam(competition, finalRecord.winnerTeamId),
      teamId: finalRecord.winnerTeamId,
      teamName: finalRecord.winnerTeamName,
    },
    {
      initialSeed: getSeedForTeam(competition, loserTeamId),
      teamId: loserTeamId,
      teamName: loserTeamName,
    },
  ];
}
