import type {
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  StandingEntry,
} from "../../types/game";
import { addDaysToDateKey } from "./seasonScheduleDates";

export const lckRounds34PostseasonStageNames = {
  seasonPlayInRound1: "Season Play-In Round 1",
  seasonPlayInQualifier: "Season Play-In Qualifier",
  playoffsRound1: "Playoffs Round 1",
  playoffsRound2: "Playoffs Round 2",
  lowerRound1: "Lower Round 1",
  playoffsRound3: "Playoffs Round 3",
  lowerRound2: "Lower Round 2",
  lowerFinal: "Lower Final",
  grandFinal: "Grand Final",
} as const;

export const lckRounds34PostseasonMatchIds = {
  playInFirstQualifier: "lck-r34-season-play-in-first-qualifier",
  playInElimination: "lck-r34-season-play-in-elimination",
  playInSecondQualifier: "lck-r34-season-play-in-second-qualifier",
  playoffsRound1Legend3VsPlayIn2:
    "lck-r34-playoffs-r1-legend-3-vs-play-in-2",
  playoffsRound1Legend4VsPlayIn1:
    "lck-r34-playoffs-r1-legend-4-vs-play-in-1",
  playoffsRound2Legend1VsRound1B:
    "lck-r34-playoffs-r2-legend-1-vs-r1-b-winner",
  playoffsRound2Legend2VsRound1A:
    "lck-r34-playoffs-r2-legend-2-vs-r1-a-winner",
  lowerRound1A: "lck-r34-lower-r1-r2-a-loser-vs-r1-a-loser",
  lowerRound1B: "lck-r34-lower-r1-r2-b-loser-vs-r1-b-loser",
  playoffsRound3: "lck-r34-playoffs-r3-upper-final",
  lowerRound2: "lck-r34-lower-r2",
  lowerFinal: "lck-r34-lower-final",
  grandFinal: "lck-r34-grand-final",
} as const;

type PostseasonScheduleOptions = {
  startDateKey: string;
};

export type LckRounds34PostseasonTeam = Pick<
  StandingEntry,
  "initialSeed" | "teamId" | "teamName"
> & {
  sourceDetail: string;
  sourceLabel: string;
};

const seedDefinitions = [
  {
    detail: "Legend Group 1위",
    group: "legend",
    index: 0,
    label: "Legend 1위",
  },
  {
    detail: "Legend Group 2위",
    group: "legend",
    index: 1,
    label: "Legend 2위",
  },
  {
    detail: "Legend Group 3위",
    group: "legend",
    index: 2,
    label: "Legend 3위",
  },
  {
    detail: "Legend Group 4위",
    group: "legend",
    index: 3,
    label: "Legend 4위",
  },
  {
    detail: "Legend Group 5위",
    group: "legend",
    index: 4,
    label: "Legend 5위",
  },
  {
    detail: "Rise Group 1위",
    group: "rise",
    index: 0,
    label: "Rise 1위",
  },
  {
    detail: "Rise Group 2위",
    group: "rise",
    index: 1,
    label: "Rise 2위",
  },
  {
    detail: "Rise Group 3위",
    group: "rise",
    index: 2,
    label: "Rise 3위",
  },
] as const;

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

function getGroupedPostseasonTable(competition: CompetitionState) {
  return {
    legend: competition.standings
      .filter((entry) => entry.lckRoundsGroup === "legend")
      .sort(compareStandingEntries),
    rise: competition.standings
      .filter((entry) => entry.lckRoundsGroup === "rise")
      .sort(compareStandingEntries),
  };
}

function toPostseasonTeam({
  detail,
  entry,
  fallbackName,
  label,
}: {
  detail: string;
  entry: Pick<StandingEntry, "initialSeed" | "teamId" | "teamName"> | undefined;
  fallbackName?: string;
  label: string;
}): LckRounds34PostseasonTeam | undefined {
  if (!entry) {
    return undefined;
  }

  return {
    initialSeed: entry.initialSeed,
    teamId: entry.teamId,
    teamName: entry.teamName ?? fallbackName ?? label,
    sourceDetail: detail,
    sourceLabel: label,
  };
}

export function getLckRounds34PostseasonSeeds(
  competition: CompetitionState,
): LckRounds34PostseasonTeam[] {
  if (competition.qualifiedTeamIds.length >= seedDefinitions.length) {
    return seedDefinitions.flatMap((definition, index) => {
      const teamId = competition.qualifiedTeamIds[index];
      const tableEntry = competition.standings.find(
        (entry) => entry.teamId === teamId,
      );

      const entry = tableEntry
        ? {
            initialSeed: index + 1,
            teamId: tableEntry.teamId,
            teamName: tableEntry.teamName,
          }
        : teamId
          ? {
              initialSeed: index + 1,
              teamId,
              teamName: competition.qualifiedTeamNames[index] ?? definition.label,
            }
          : undefined;

      const team = toPostseasonTeam({
        detail: definition.detail,
        entry,
        fallbackName: competition.qualifiedTeamNames[index],
        label: definition.label,
      });

      return team ? [team] : [];
    });
  }

  const groupedTable = getGroupedPostseasonTable(competition);

  return seedDefinitions.flatMap((definition) => {
    const entry = groupedTable[definition.group][definition.index];
    const team = toPostseasonTeam({
      detail: definition.detail,
      entry,
      label: definition.label,
    });

    return team ? [team] : [];
  });
}

export function isLckRounds34PostseasonStageName(stageName: string) {
  return Object.values(lckRounds34PostseasonStageNames).includes(
    stageName as (typeof lckRounds34PostseasonStageNames)[keyof typeof lckRounds34PostseasonStageNames],
  );
}

function createPostseasonMatch({
  blue,
  id,
  red,
  scheduledDate,
  stageName,
  week,
}: {
  blue: LckRounds34PostseasonTeam;
  id: string;
  red: LckRounds34PostseasonTeam;
  scheduledDate: string;
  stageName: string;
  week: number;
}): MatchSchedule {
  return {
    id,
    competitionId: "lck-rounds-3-4",
    week,
    scheduledDate,
    stageName,
    blueTeamId: blue.teamId,
    blueTeamName: blue.teamName,
    redTeamId: red.teamId,
    redTeamName: red.teamName,
    format: "bo5",
    status: "scheduled",
    fearlessEnabled: true,
  };
}

function getMatch(competition: CompetitionState, scheduleId: string) {
  return competition.schedule.find((match) => match.id === scheduleId);
}

function hasMatch(competition: CompetitionState, scheduleId: string) {
  return Boolean(getMatch(competition, scheduleId));
}

function getRecordForMatch(records: MatchRecord[], scheduleId: string) {
  return records.find((record) => record.scheduleId === scheduleId);
}

function getTeamFromMatchSide(
  competition: CompetitionState,
  scheduleId: string,
  side: "blue" | "red",
): LckRounds34PostseasonTeam | undefined {
  const match = getMatch(competition, scheduleId);

  if (!match) {
    return undefined;
  }

  const teamId = side === "blue" ? match.blueTeamId : match.redTeamId;
  const teamName = side === "blue" ? match.blueTeamName : match.redTeamName;
  const standingsEntry = competition.standings.find(
    (entry) => entry.teamId === teamId,
  );

  return {
    initialSeed: standingsEntry?.initialSeed ?? 99,
    teamId,
    teamName,
    sourceDetail: "이전 라운드 결과",
    sourceLabel: "브래킷 슬롯",
  };
}

function getWinnerFromMatch(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
): LckRounds34PostseasonTeam | undefined {
  const record = getRecordForMatch(records, scheduleId);
  const match = getMatch(competition, scheduleId);

  if (!record || !match) {
    return undefined;
  }

  return getTeamFromMatchSide(
    competition,
    scheduleId,
    record.winnerTeamId === match.blueTeamId ? "blue" : "red",
  );
}

function getLoserFromMatch(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
): LckRounds34PostseasonTeam | undefined {
  const record = getRecordForMatch(records, scheduleId);
  const match = getMatch(competition, scheduleId);

  if (!record || !match) {
    return undefined;
  }

  return getTeamFromMatchSide(
    competition,
    scheduleId,
    record.winnerTeamId === match.blueTeamId ? "red" : "blue",
  );
}

function getLatestDateForMatchIds(
  competition: CompetitionState,
  matchIds: string[],
) {
  return matchIds
    .flatMap((matchId) => {
      const match = getMatch(competition, matchId);

      return match?.scheduledDate ? [match.scheduledDate] : [];
    })
    .sort((left, right) => right.localeCompare(left))[0];
}

export function createLckRounds34SeasonPlayInOpeningSchedule(
  competition: CompetitionState,
  options: PostseasonScheduleOptions,
): MatchSchedule[] {
  const seeds = getLckRounds34PostseasonSeeds(competition);
  const legend5 = seeds[4];
  const rise1 = seeds[5];
  const rise2 = seeds[6];
  const rise3 = seeds[7];

  if (!legend5 || !rise1 || !rise2 || !rise3) {
    return [];
  }

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playInFirstQualifier,
      week: 6,
      scheduledDate: options.startDateKey,
      stageName: lckRounds34PostseasonStageNames.seasonPlayInRound1,
      blue: legend5,
      red: rise1,
    }),
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playInElimination,
      week: 6,
      scheduledDate: addDaysToDateKey(options.startDateKey, 2),
      stageName: lckRounds34PostseasonStageNames.seasonPlayInRound1,
      blue: rise2,
      red: rise3,
    }),
  ];
}

function createSeasonPlayInSecondQualifierSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const loserFromFirstQualifier = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playInFirstQualifier,
  );
  const winnerFromElimination = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playInElimination,
  );
  const latestRound1Date = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.playInFirstQualifier,
    lckRounds34PostseasonMatchIds.playInElimination,
  ]);

  if (!loserFromFirstQualifier || !winnerFromElimination || !latestRound1Date) {
    return [];
  }

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playInSecondQualifier,
      week: 6,
      scheduledDate: addDaysToDateKey(latestRound1Date, 2),
      stageName: lckRounds34PostseasonStageNames.seasonPlayInQualifier,
      blue: loserFromFirstQualifier,
      red: winnerFromElimination,
    }),
  ];
}

function createPlayoffsRound1Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const seeds = getLckRounds34PostseasonSeeds(competition);
  const legend3 = seeds[2];
  const legend4 = seeds[3];
  const firstPlayInQualifier = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playInFirstQualifier,
  );
  const secondPlayInQualifier = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playInSecondQualifier,
  );
  const latestPlayInDate = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.playInSecondQualifier,
  ]);

  if (
    !legend3 ||
    !legend4 ||
    !firstPlayInQualifier ||
    !secondPlayInQualifier ||
    !latestPlayInDate
  ) {
    return [];
  }

  const startDateKey = addDaysToDateKey(latestPlayInDate, 2);

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playoffsRound1Legend3VsPlayIn2,
      week: 7,
      scheduledDate: startDateKey,
      stageName: lckRounds34PostseasonStageNames.playoffsRound1,
      blue: legend3,
      red: secondPlayInQualifier,
    }),
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playoffsRound1Legend4VsPlayIn1,
      week: 7,
      scheduledDate: addDaysToDateKey(startDateKey, 2),
      stageName: lckRounds34PostseasonStageNames.playoffsRound1,
      blue: legend4,
      red: firstPlayInQualifier,
    }),
  ];
}

function createPlayoffsRound2Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const seeds = getLckRounds34PostseasonSeeds(competition);
  const legend1 = seeds[0];
  const legend2 = seeds[1];
  const round1AWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound1Legend3VsPlayIn2,
  );
  const round1BWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound1Legend4VsPlayIn1,
  );
  const latestRound1Date = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.playoffsRound1Legend3VsPlayIn2,
    lckRounds34PostseasonMatchIds.playoffsRound1Legend4VsPlayIn1,
  ]);

  if (!legend1 || !legend2 || !round1AWinner || !round1BWinner || !latestRound1Date) {
    return [];
  }

  const startDateKey = addDaysToDateKey(latestRound1Date, 2);

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playoffsRound2Legend1VsRound1B,
      week: 8,
      scheduledDate: startDateKey,
      stageName: lckRounds34PostseasonStageNames.playoffsRound2,
      blue: legend1,
      red: round1BWinner,
    }),
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playoffsRound2Legend2VsRound1A,
      week: 8,
      scheduledDate: addDaysToDateKey(startDateKey, 2),
      stageName: lckRounds34PostseasonStageNames.playoffsRound2,
      blue: legend2,
      red: round1AWinner,
    }),
  ];
}

function createLowerRound1Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const round2ALoser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound2Legend1VsRound1B,
  );
  const round2BLoser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound2Legend2VsRound1A,
  );
  const round1ALoser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound1Legend3VsPlayIn2,
  );
  const round1BLoser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound1Legend4VsPlayIn1,
  );
  const latestRound2Date = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.playoffsRound2Legend1VsRound1B,
    lckRounds34PostseasonMatchIds.playoffsRound2Legend2VsRound1A,
  ]);

  if (
    !round2ALoser ||
    !round2BLoser ||
    !round1ALoser ||
    !round1BLoser ||
    !latestRound2Date
  ) {
    return [];
  }

  const startDateKey = addDaysToDateKey(latestRound2Date, 2);

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.lowerRound1A,
      week: 9,
      scheduledDate: startDateKey,
      stageName: lckRounds34PostseasonStageNames.lowerRound1,
      blue: round2ALoser,
      red: round1ALoser,
    }),
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.lowerRound1B,
      week: 9,
      scheduledDate: addDaysToDateKey(startDateKey, 2),
      stageName: lckRounds34PostseasonStageNames.lowerRound1,
      blue: round2BLoser,
      red: round1BLoser,
    }),
  ];
}

function createPlayoffsRound3Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const round2AWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound2Legend1VsRound1B,
  );
  const round2BWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound2Legend2VsRound1A,
  );
  const latestLowerRound1Date = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.lowerRound1A,
    lckRounds34PostseasonMatchIds.lowerRound1B,
  ]);

  if (!round2AWinner || !round2BWinner || !latestLowerRound1Date) {
    return [];
  }

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.playoffsRound3,
      week: 10,
      scheduledDate: addDaysToDateKey(latestLowerRound1Date, 2),
      stageName: lckRounds34PostseasonStageNames.playoffsRound3,
      blue: round2AWinner,
      red: round2BWinner,
    }),
  ];
}

function createLowerRound2Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const lowerRound1AWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.lowerRound1A,
  );
  const lowerRound1BWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.lowerRound1B,
  );
  const upperFinalDate = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.playoffsRound3,
  ]);

  if (!lowerRound1AWinner || !lowerRound1BWinner || !upperFinalDate) {
    return [];
  }

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.lowerRound2,
      week: 10,
      scheduledDate: addDaysToDateKey(upperFinalDate, 2),
      stageName: lckRounds34PostseasonStageNames.lowerRound2,
      blue: lowerRound1AWinner,
      red: lowerRound1BWinner,
    }),
  ];
}

function createLowerFinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const playoffsRound3Loser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound3,
  );
  const lowerRound2Winner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.lowerRound2,
  );
  const latestLowerRound2Date = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.lowerRound2,
  ]);

  if (!playoffsRound3Loser || !lowerRound2Winner || !latestLowerRound2Date) {
    return [];
  }

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.lowerFinal,
      week: 11,
      scheduledDate: addDaysToDateKey(latestLowerRound2Date, 2),
      stageName: lckRounds34PostseasonStageNames.lowerFinal,
      blue: playoffsRound3Loser,
      red: lowerRound2Winner,
    }),
  ];
}

function createGrandFinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const playoffsRound3Winner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.playoffsRound3,
  );
  const lowerFinalWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.lowerFinal,
  );
  const latestLowerFinalDate = getLatestDateForMatchIds(competition, [
    lckRounds34PostseasonMatchIds.lowerFinal,
  ]);

  if (!playoffsRound3Winner || !lowerFinalWinner || !latestLowerFinalDate) {
    return [];
  }

  return [
    createPostseasonMatch({
      id: lckRounds34PostseasonMatchIds.grandFinal,
      week: 12,
      scheduledDate: addDaysToDateKey(latestLowerFinalDate, 2),
      stageName: lckRounds34PostseasonStageNames.grandFinal,
      blue: playoffsRound3Winner,
      red: lowerFinalWinner,
    }),
  ];
}

export function getNextLckRounds34PostseasonSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  if (!hasMatch(competition, lckRounds34PostseasonMatchIds.playInSecondQualifier)) {
    return createSeasonPlayInSecondQualifierSchedule(competition, records);
  }

  if (
    !hasMatch(
      competition,
      lckRounds34PostseasonMatchIds.playoffsRound1Legend3VsPlayIn2,
    )
  ) {
    return createPlayoffsRound1Schedule(competition, records);
  }

  if (
    !hasMatch(
      competition,
      lckRounds34PostseasonMatchIds.playoffsRound2Legend1VsRound1B,
    )
  ) {
    return createPlayoffsRound2Schedule(competition, records);
  }

  if (!hasMatch(competition, lckRounds34PostseasonMatchIds.lowerRound1A)) {
    return createLowerRound1Schedule(competition, records);
  }

  if (!hasMatch(competition, lckRounds34PostseasonMatchIds.playoffsRound3)) {
    return createPlayoffsRound3Schedule(competition, records);
  }

  if (!hasMatch(competition, lckRounds34PostseasonMatchIds.lowerRound2)) {
    return createLowerRound2Schedule(competition, records);
  }

  if (!hasMatch(competition, lckRounds34PostseasonMatchIds.lowerFinal)) {
    return createLowerFinalSchedule(competition, records);
  }

  if (!hasMatch(competition, lckRounds34PostseasonMatchIds.grandFinal)) {
    return createGrandFinalSchedule(competition, records);
  }

  return [];
}

export function getLckRounds34FinalPlacements(
  competition: CompetitionState,
  records: MatchRecord[],
): LckRounds34PostseasonTeam[] {
  const finalWinner = getWinnerFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.grandFinal,
  );
  const finalLoser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.grandFinal,
  );
  const lowerFinalLoser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.lowerFinal,
  );
  const lowerRound2Loser = getLoserFromMatch(
    competition,
    records,
    lckRounds34PostseasonMatchIds.lowerRound2,
  );

  return [finalWinner, finalLoser, lowerFinalLoser, lowerRound2Loser].flatMap(
    (team) => (team ? [team] : []),
  );
}
