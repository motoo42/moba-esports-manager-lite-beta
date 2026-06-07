import type {
  CompetitionState,
  LeagueCode,
  MatchRecord,
  MatchSchedule,
  Opponent,
  SeasonCalendarType,
  SeasonState,
  StandingEntry,
  StrategyId,
} from "../../types/game";
import {
  getCompetitionStartDate,
  toDateKey,
} from "../season-calendar/seasonCalendarDates";
import { getLckRounds12Finalists } from "./lckRounds12Playoffs";
import { addDaysToDateKey } from "./seasonScheduleDates";
import { sortStandings } from "./standingsEngine";
import {
  getFirstStandFinalists,
  getFirstStandTeamProfile,
} from "./firstStandFormat";
import {
  applyMsiWorldsQualification,
  normalizeLeagueCode,
} from "./worldsQualification";

type MsiSeed = 1 | 2;
type MsiEntrantStage = "bracket" | "play-in";

export type MsiEntrant = {
  teamId: string;
  teamName: string;
  leagueLabel: LeagueCode;
  seed: MsiSeed;
  initialSeed: number;
  strength: number;
  style: StrategyId;
  isUserTeam: boolean;
  entryStage: MsiEntrantStage;
};

type MsiScheduleOptions = {
  calendarType: SeasonCalendarType;
  year: number;
};

type MsiTeam = Pick<
  MsiEntrant,
  "initialSeed" | "isUserTeam" | "leagueLabel" | "teamId" | "teamName"
>;

export const msiStageNames = {
  playInSemifinals: "Play-In Semifinals",
  playInFinal: "Play-In Final",
  upperRound1: "Upper Round 1",
  lowerRound1: "Lower Round 1",
  upperRound2: "Upper Round 2",
  lowerRound2: "Lower Round 2",
  upperFinal: "Upper Final",
  lowerRound3: "Lower Round 3",
  lowerFinal: "Lower Final",
  grandFinal: "Grand Finals",
} as const;

export const msiMatchIds = {
  playInSemifinal1: "msi-play-in-semifinal-1",
  playInSemifinal2: "msi-play-in-semifinal-2",
  playInFinal: "msi-play-in-final",
  upperRound1A: "msi-upper-round-1-a",
  upperRound1B: "msi-upper-round-1-b",
  upperRound1C: "msi-upper-round-1-c",
  upperRound1D: "msi-upper-round-1-d",
  lowerRound1A: "msi-lower-round-1-a",
  lowerRound1B: "msi-lower-round-1-b",
  upperRound2A: "msi-upper-round-2-a",
  upperRound2B: "msi-upper-round-2-b",
  lowerRound2A: "msi-lower-round-2-a",
  lowerRound2B: "msi-lower-round-2-b",
  upperFinal: "msi-upper-final",
  lowerRound3: "msi-lower-round-3",
  lowerFinal: "msi-lower-final",
  grandFinal: "msi-grand-final",
} as const;

const msiInternationalEntrants: Array<
  Omit<MsiEntrant, "entryStage" | "isUserTeam">
> = [
  {
    teamId: "msi-lpl-1",
    teamName: "Bilibili Gaming",
    leagueLabel: "LPL",
    seed: 1,
    initialSeed: 2,
    strength: 88,
    style: "aggressive",
  },
  {
    teamId: "msi-lpl-2",
    teamName: "Top Esports",
    leagueLabel: "LPL",
    seed: 2,
    initialSeed: 8,
    strength: 85,
    style: "tempo",
  },
  {
    teamId: "msi-lec-1",
    teamName: "G2 Esports",
    leagueLabel: "LEC",
    seed: 1,
    initialSeed: 3,
    strength: 82,
    style: "macro",
  },
  {
    teamId: "msi-lec-2",
    teamName: "Fnatic",
    leagueLabel: "LEC",
    seed: 2,
    initialSeed: 9,
    strength: 78,
    style: "balanced",
  },
  {
    teamId: "msi-lcs-1",
    teamName: "Cloud9",
    leagueLabel: "LCS",
    seed: 1,
    initialSeed: 4,
    strength: 76,
    style: "balanced",
  },
  {
    teamId: "msi-lcs-2",
    teamName: "FlyQuest",
    leagueLabel: "LCS",
    seed: 2,
    initialSeed: 10,
    strength: 74,
    style: "scaling",
  },
  {
    teamId: "msi-lcp-1",
    teamName: "PSG Talon",
    leagueLabel: "LCP",
    seed: 1,
    initialSeed: 5,
    strength: 74,
    style: "vision",
  },
  {
    teamId: "msi-lcp-2",
    teamName: "GAM Esports",
    leagueLabel: "LCP",
    seed: 2,
    initialSeed: 11,
    strength: 72,
    style: "aggressive",
  },
  {
    teamId: "msi-cblol-1",
    teamName: "LOUD",
    leagueLabel: "CBLOL",
    seed: 1,
    initialSeed: 6,
    strength: 70,
    style: "aggressive",
  },
];

const msiLeagueCodes: LeagueCode[] = ["LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL"];

function toMsiLeagueCode(leagueLabel: string | undefined) {
  if (!leagueLabel) {
    return undefined;
  }

  return msiLeagueCodes.find(
    (leagueCode) => leagueCode === normalizeLeagueCode(leagueLabel),
  );
}

function getMsiStartDateKey(options: MsiScheduleOptions) {
  return toDateKey(
    getCompetitionStartDate(options.year, "msi", options.calendarType),
  );
}

function createMatch({
  blue,
  format,
  id,
  red,
  scheduledDate,
  stageName,
  week,
}: {
  blue: MsiTeam;
  format: MatchSchedule["format"];
  id: string;
  red: MsiTeam;
  scheduledDate: string;
  stageName: string;
  week: number;
}): MatchSchedule {
  return {
    id,
    competitionId: "msi",
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

function toStandingEntry(entrant: MsiEntrant): StandingEntry {
  return {
    teamId: entrant.teamId,
    teamName: entrant.teamName,
    rank: entrant.initialSeed,
    initialSeed: entrant.initialSeed,
    wins: 0,
    losses: 0,
    matchWins: 0,
    matchLosses: 0,
    setWins: 0,
    setLosses: 0,
    winRate: 0,
    isUserTeam: entrant.isUserTeam,
  };
}

function toMsiTeam(entry: StandingEntry): MsiTeam {
  return {
    teamId: entry.teamId,
    teamName: entry.teamName,
    leagueLabel: getMsiLeagueForTeam(entry.teamId),
    initialSeed: entry.initialSeed,
    isUserTeam: entry.isUserTeam,
  };
}

function getLckRounds12Competition(seasonState: SeasonState) {
  return seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-1-2",
  );
}

function getStandingFromCompetition(
  competition: CompetitionState | undefined,
  teamId: string,
  teamName: string,
  initialSeed: number,
) {
  const standing = competition?.standings.find((entry) => entry.teamId === teamId);

  return (
    standing ?? {
      teamId,
      teamName,
      rank: initialSeed,
      initialSeed,
      wins: 0,
      losses: 0,
      matchWins: 0,
      matchLosses: 0,
      setWins: 0,
      setLosses: 0,
      winRate: 0,
      isUserTeam: false,
    }
  );
}

function getLckMsiRepresentatives(seasonState: SeasonState) {
  const lckRounds = getLckRounds12Competition(seasonState);
  const finalists = lckRounds
    ? getLckRounds12Finalists(lckRounds, seasonState.matchRecords)
    : [];

  if (finalists.length >= 2) {
    return finalists.slice(0, 2).map((team, index) =>
      getStandingFromCompetition(lckRounds, team.teamId, team.teamName, index + 1),
    );
  }

  if ((lckRounds?.qualifiedTeamIds.length ?? 0) >= 2) {
    return lckRounds!.qualifiedTeamIds.slice(0, 2).map((teamId, index) =>
      getStandingFromCompetition(
        lckRounds,
        teamId,
        lckRounds!.qualifiedTeamNames[index] ?? `LCK ${index + 1}`,
        index + 1,
      ),
    );
  }

  return [...(lckRounds?.standings ?? [])]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 2);
}

function createMsiLckEntrants(seasonState: SeasonState): MsiEntrant[] {
  return getLckMsiRepresentatives(seasonState).map((entry, index) => ({
    teamId: entry.teamId,
    teamName: entry.teamName,
    leagueLabel: "LCK",
    seed: (index + 1) as MsiSeed,
    initialSeed: index === 0 ? 1 : 7,
    strength: 87 - index,
    style: "balanced",
    isUserTeam: entry.isUserTeam,
    entryStage: "play-in",
  }));
}

function createMsiInternationalEntrants(
  internationalOpponents: Opponent[],
): MsiEntrant[] {
  return msiInternationalEntrants.map((entrant) => {
    const matchingOpponent = internationalOpponents.find(
      (opponent) =>
        opponent.name === entrant.teamName ||
        (opponent.leagueLabel === entrant.leagueLabel &&
          opponent.appearsIn.includes("msi")),
    );

    return {
      ...entrant,
      strength: matchingOpponent?.strength ?? entrant.strength,
      style: matchingOpponent?.style ?? entrant.style,
      isUserTeam: false,
      entryStage: "play-in",
    };
  });
}

function getFirstStandLeagueForTeam(teamId: string | undefined): LeagueCode | undefined {
  if (!teamId) {
    return undefined;
  }

  return toMsiLeagueCode(getFirstStandTeamProfile(teamId)?.leagueLabel) ?? "LCK";
}

function getFirstStandDirectSecondSeedLeague(seasonState: SeasonState): LeagueCode {
  const firstStand = seasonState.competitions.find(
    (competition) => competition.competitionId === "first-stand",
  );
  const finalists = firstStand
    ? getFirstStandFinalists(firstStand, seasonState.matchRecords)
    : [];
  const winnerLeague =
    getFirstStandLeagueForTeam(firstStand?.winnerTeamId) ??
    getFirstStandLeagueForTeam(finalists[0]?.teamId) ??
    "LCK";

  if (winnerLeague !== "CBLOL") {
    return winnerLeague;
  }

  const runnerUpTeamId =
    finalists[1]?.teamId ??
    firstStand?.qualifiedTeamIds.find((teamId) => teamId !== firstStand.winnerTeamId) ??
    firstStand?.qualifiedTeamIds[1];

  return getFirstStandLeagueForTeam(runnerUpTeamId) ?? "LCK";
}

function markEntryStages(
  entrants: MsiEntrant[],
  directSecondSeedLeague: LeagueCode,
): MsiEntrant[] {
  return entrants.map((entrant): MsiEntrant => ({
    ...entrant,
    entryStage:
      entrant.seed === 1 || entrant.leagueLabel === directSecondSeedLeague
        ? "bracket"
        : "play-in",
  }));
}

export function createMsiEntrants({
  internationalOpponents,
  seasonState,
}: {
  internationalOpponents: Opponent[];
  seasonState: SeasonState;
}) {
  const directSecondSeedLeague =
    getFirstStandDirectSecondSeedLeague(seasonState);
  const entrants = [
    ...createMsiLckEntrants(seasonState),
    ...createMsiInternationalEntrants(internationalOpponents),
  ];

  return markEntryStages(entrants, directSecondSeedLeague).sort(
    (left, right) => left.initialSeed - right.initialSeed,
  );
}

function getPlayInEntrants(entrants: MsiEntrant[]) {
  return entrants
    .filter((entrant) => entrant.entryStage === "play-in")
    .sort((left, right) => left.initialSeed - right.initialSeed);
}

function createMsiPlayInSchedule(
  entrants: MsiEntrant[],
  options: MsiScheduleOptions,
) {
  const playInEntrants = getPlayInEntrants(entrants);
  const startDateKey = getMsiStartDateKey(options);

  if (playInEntrants.length < 4) {
    return [];
  }

  return [
    createMatch({
      id: msiMatchIds.playInSemifinal1,
      week: 1,
      scheduledDate: startDateKey,
      stageName: msiStageNames.playInSemifinals,
      blue: playInEntrants[0],
      red: playInEntrants[3],
      format: "bo3",
    }),
    createMatch({
      id: msiMatchIds.playInSemifinal2,
      week: 1,
      scheduledDate: addDaysToDateKey(startDateKey, 1),
      stageName: msiStageNames.playInSemifinals,
      blue: playInEntrants[1],
      red: playInEntrants[2],
      format: "bo3",
    }),
  ];
}

export function createMsiSetup({
  internationalOpponents,
  options,
  seasonState,
}: {
  internationalOpponents: Opponent[];
  options: MsiScheduleOptions;
  seasonState: SeasonState;
}) {
  const entrants = createMsiEntrants({
    internationalOpponents,
    seasonState,
  });

  return {
    standings: sortStandings(entrants.map(toStandingEntry)),
    schedule: createMsiPlayInSchedule(entrants, options),
  };
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

function getRecordForMatch(records: MatchRecord[], scheduleId: string) {
  return records.find((record) => record.scheduleId === scheduleId);
}

function hasSchedule(competition: CompetitionState, scheduleId: string) {
  return competition.schedule.some((match) => match.id === scheduleId);
}

function hasCompletedSchedule(
  competition: CompetitionState,
  scheduleId: string,
) {
  return competition.schedule.some(
    (match) => match.id === scheduleId && match.status === "completed",
  );
}

function getTeamById(competition: CompetitionState, teamId: string) {
  const team = competition.standings.find((entry) => entry.teamId === teamId);

  if (!team) {
    throw new Error(`Unknown MSI team: ${teamId}`);
  }

  return toMsiTeam(team);
}

function getWinnerFromSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
) {
  const record = getRecordForMatch(records, scheduleId);

  if (!record) {
    return undefined;
  }

  return getTeamById(competition, record.winnerTeamId);
}

function getLoserFromSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
) {
  const record = getRecordForMatch(records, scheduleId);
  const match = competition.schedule.find((schedule) => schedule.id === scheduleId);

  if (!record || !match) {
    return undefined;
  }

  const loserTeamId =
    record.winnerTeamId === match.blueTeamId ? match.redTeamId : match.blueTeamId;

  return getTeamById(competition, loserTeamId);
}

function getLatestScheduledDateKey(
  competition: CompetitionState,
  scheduleIds: string[],
) {
  const ids = new Set(scheduleIds);

  return [...competition.schedule]
    .filter((match) => ids.has(match.id) && match.scheduledDate)
    .sort((left, right) =>
      (right.scheduledDate ?? "").localeCompare(left.scheduledDate ?? ""),
    )[0]?.scheduledDate;
}

function getPlayInTeamIds(competition: CompetitionState) {
  const playInMatches = competition.schedule.filter(
    (match) => match.stageName === msiStageNames.playInSemifinals,
  );

  return new Set(
    playInMatches.flatMap((match) => [match.blueTeamId, match.redTeamId]),
  );
}

function getBracketDirectTeams(competition: CompetitionState) {
  const playInTeamIds = getPlayInTeamIds(competition);

  return competition.standings
    .filter((entry) => !playInTeamIds.has(entry.teamId))
    .map(toMsiTeam)
    .sort((left, right) => left.initialSeed - right.initialSeed);
}

function isSameLeaguePair(left: MsiTeam, right: MsiTeam) {
  return left.leagueLabel === right.leagueLabel;
}

function createRound1Pairings(bracketTeams: MsiTeam[]) {
  const seeded = [...bracketTeams].sort(
    (left, right) => left.initialSeed - right.initialSeed,
  );
  const pairings: Array<[MsiTeam, MsiTeam]> = [
    [seeded[0], seeded[7]],
    [seeded[3], seeded[4]],
    [seeded[1], seeded[6]],
    [seeded[2], seeded[5]],
  ].filter((pairing): pairing is [MsiTeam, MsiTeam] =>
    pairing.every(Boolean),
  );

  for (let index = 0; index < pairings.length; index += 1) {
    if (!isSameLeaguePair(pairings[index][0], pairings[index][1])) {
      continue;
    }

    const swapIndex = pairings.findIndex(
      (pairing, candidateIndex) =>
        candidateIndex > index &&
        !isSameLeaguePair(pairings[index][0], pairing[1]) &&
        !isSameLeaguePair(pairing[0], pairings[index][1]),
    );

    if (swapIndex >= 0) {
      const currentRed = pairings[index][1];
      pairings[index][1] = pairings[swapIndex][1];
      pairings[swapIndex][1] = currentRed;
    }
  }

  return pairings;
}

export function createMsiPlayInFinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const semifinal1Winner = getWinnerFromSchedule(
    competition,
    records,
    msiMatchIds.playInSemifinal1,
  );
  const semifinal2Winner = getWinnerFromSchedule(
    competition,
    records,
    msiMatchIds.playInSemifinal2,
  );
  const lastSemifinalDate = getLatestScheduledDateKey(competition, [
    msiMatchIds.playInSemifinal1,
    msiMatchIds.playInSemifinal2,
  ]);

  if (!semifinal1Winner || !semifinal2Winner || !lastSemifinalDate) {
    return [];
  }

  return [
    createMatch({
      id: msiMatchIds.playInFinal,
      week: 1,
      scheduledDate: addDaysToDateKey(lastSemifinalDate, 2),
      stageName: msiStageNames.playInFinal,
      blue: semifinal1Winner,
      red: semifinal2Winner,
      format: "bo5",
    }),
  ];
}

export function createMsiUpperRound1Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const playInWinner = getWinnerFromSchedule(
    competition,
    records,
    msiMatchIds.playInFinal,
  );
  const playInFinalDate = getLatestScheduledDateKey(competition, [
    msiMatchIds.playInFinal,
  ]);

  if (!playInWinner || !playInFinalDate) {
    return [];
  }

  const bracketTeams = [...getBracketDirectTeams(competition), playInWinner];
  const pairings = createRound1Pairings(bracketTeams);
  const round1Date = addDaysToDateKey(playInFinalDate, 2);
  const matchIds = [
    msiMatchIds.upperRound1A,
    msiMatchIds.upperRound1B,
    msiMatchIds.upperRound1C,
    msiMatchIds.upperRound1D,
  ];

  return pairings.map(([blue, red], index) =>
    createMatch({
      id: matchIds[index],
      week: 2,
      scheduledDate: addDaysToDateKey(round1Date, Math.floor(index / 2)),
      stageName: msiStageNames.upperRound1,
      blue,
      red,
      format: "bo3",
    }),
  );
}

export function createMsiUpperRound2AndLowerRound1Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const upperA = getWinnerFromSchedule(competition, records, msiMatchIds.upperRound1A);
  const upperB = getWinnerFromSchedule(competition, records, msiMatchIds.upperRound1B);
  const upperC = getWinnerFromSchedule(competition, records, msiMatchIds.upperRound1C);
  const upperD = getWinnerFromSchedule(competition, records, msiMatchIds.upperRound1D);
  const lowerA = getLoserFromSchedule(competition, records, msiMatchIds.upperRound1A);
  const lowerB = getLoserFromSchedule(competition, records, msiMatchIds.upperRound1B);
  const lowerC = getLoserFromSchedule(competition, records, msiMatchIds.upperRound1C);
  const lowerD = getLoserFromSchedule(competition, records, msiMatchIds.upperRound1D);
  const lastRound1Date = getLatestScheduledDateKey(competition, [
    msiMatchIds.upperRound1A,
    msiMatchIds.upperRound1B,
    msiMatchIds.upperRound1C,
    msiMatchIds.upperRound1D,
  ]);

  if (
    !upperA ||
    !upperB ||
    !upperC ||
    !upperD ||
    !lowerA ||
    !lowerB ||
    !lowerC ||
    !lowerD ||
    !lastRound1Date
  ) {
    return [];
  }

  const nextDate = addDaysToDateKey(lastRound1Date, 1);

  return [
    createMatch({
      id: msiMatchIds.upperRound2A,
      week: 2,
      scheduledDate: nextDate,
      stageName: msiStageNames.upperRound2,
      blue: upperA,
      red: upperB,
      format: "bo3",
    }),
    createMatch({
      id: msiMatchIds.upperRound2B,
      week: 2,
      scheduledDate: addDaysToDateKey(nextDate, 1),
      stageName: msiStageNames.upperRound2,
      blue: upperC,
      red: upperD,
      format: "bo3",
    }),
    createMatch({
      id: msiMatchIds.lowerRound1A,
      week: 2,
      scheduledDate: addDaysToDateKey(nextDate, 2),
      stageName: msiStageNames.lowerRound1,
      blue: lowerA,
      red: lowerB,
      format: "bo3",
    }),
    createMatch({
      id: msiMatchIds.lowerRound1B,
      week: 2,
      scheduledDate: addDaysToDateKey(nextDate, 3),
      stageName: msiStageNames.lowerRound1,
      blue: lowerC,
      red: lowerD,
      format: "bo3",
    }),
  ];
}

export function createMsiUpperFinalAndLowerRound2Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const upperA = getWinnerFromSchedule(competition, records, msiMatchIds.upperRound2A);
  const upperB = getWinnerFromSchedule(competition, records, msiMatchIds.upperRound2B);
  const lowerA = getWinnerFromSchedule(competition, records, msiMatchIds.lowerRound1A);
  const lowerB = getWinnerFromSchedule(competition, records, msiMatchIds.lowerRound1B);
  const upperDropA = getLoserFromSchedule(
    competition,
    records,
    msiMatchIds.upperRound2A,
  );
  const upperDropB = getLoserFromSchedule(
    competition,
    records,
    msiMatchIds.upperRound2B,
  );
  const lastDependencyDate = getLatestScheduledDateKey(competition, [
    msiMatchIds.upperRound2A,
    msiMatchIds.upperRound2B,
    msiMatchIds.lowerRound1A,
    msiMatchIds.lowerRound1B,
  ]);

  if (
    !upperA ||
    !upperB ||
    !lowerA ||
    !lowerB ||
    !upperDropA ||
    !upperDropB ||
    !lastDependencyDate
  ) {
    return [];
  }

  const nextDate = addDaysToDateKey(lastDependencyDate, 1);

  return [
    createMatch({
      id: msiMatchIds.upperFinal,
      week: 3,
      scheduledDate: nextDate,
      stageName: msiStageNames.upperFinal,
      blue: upperA,
      red: upperB,
      format: "bo5",
    }),
    createMatch({
      id: msiMatchIds.lowerRound2A,
      week: 3,
      scheduledDate: addDaysToDateKey(nextDate, 1),
      stageName: msiStageNames.lowerRound2,
      blue: lowerA,
      red: upperDropA,
      format: "bo3",
    }),
    createMatch({
      id: msiMatchIds.lowerRound2B,
      week: 3,
      scheduledDate: addDaysToDateKey(nextDate, 2),
      stageName: msiStageNames.lowerRound2,
      blue: lowerB,
      red: upperDropB,
      format: "bo3",
    }),
  ];
}

export function createMsiLowerRound3Schedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const lowerA = getWinnerFromSchedule(competition, records, msiMatchIds.lowerRound2A);
  const lowerB = getWinnerFromSchedule(competition, records, msiMatchIds.lowerRound2B);
  const lastLowerRound2Date = getLatestScheduledDateKey(competition, [
    msiMatchIds.lowerRound2A,
    msiMatchIds.lowerRound2B,
  ]);

  if (!lowerA || !lowerB || !lastLowerRound2Date) {
    return [];
  }

  return [
    createMatch({
      id: msiMatchIds.lowerRound3,
      week: 3,
      scheduledDate: addDaysToDateKey(lastLowerRound2Date, 1),
      stageName: msiStageNames.lowerRound3,
      blue: lowerA,
      red: lowerB,
      format: "bo3",
    }),
  ];
}

export function createMsiLowerFinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const lowerWinner = getWinnerFromSchedule(
    competition,
    records,
    msiMatchIds.lowerRound3,
  );
  const upperFinalLoser = getLoserFromSchedule(
    competition,
    records,
    msiMatchIds.upperFinal,
  );
  const lastDependencyDate = getLatestScheduledDateKey(competition, [
    msiMatchIds.upperFinal,
    msiMatchIds.lowerRound3,
  ]);

  if (!lowerWinner || !upperFinalLoser || !lastDependencyDate) {
    return [];
  }

  return [
    createMatch({
      id: msiMatchIds.lowerFinal,
      week: 3,
      scheduledDate: addDaysToDateKey(lastDependencyDate, 1),
      stageName: msiStageNames.lowerFinal,
      blue: upperFinalLoser,
      red: lowerWinner,
      format: "bo5",
    }),
  ];
}

export function createMsiGrandFinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const upperWinner = getWinnerFromSchedule(
    competition,
    records,
    msiMatchIds.upperFinal,
  );
  const lowerWinner = getWinnerFromSchedule(
    competition,
    records,
    msiMatchIds.lowerFinal,
  );
  const lowerFinalDate = getLatestScheduledDateKey(competition, [
    msiMatchIds.lowerFinal,
  ]);

  if (!upperWinner || !lowerWinner || !lowerFinalDate) {
    return [];
  }

  return [
    createMatch({
      id: msiMatchIds.grandFinal,
      week: 4,
      scheduledDate: addDaysToDateKey(lowerFinalDate, 1),
      stageName: msiStageNames.grandFinal,
      blue: upperWinner,
      red: lowerWinner,
      format: "bo5",
    }),
  ];
}

function withMsiSchedules(
  seasonState: SeasonState,
  additions: MatchSchedule[],
  nextStageName: string,
) {
  if (additions.length === 0) {
    return seasonState;
  }

  return {
    ...seasonState,
    scheduledMatches: appendUniqueSchedules(
      seasonState.scheduledMatches,
      additions,
    ),
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "msi"
        ? {
            ...competition,
            currentStageName: nextStageName,
            currentWeek: additions[0]?.week ?? competition.currentWeek,
            schedule: appendUniqueSchedules(competition.schedule, additions),
          }
        : competition,
    ),
  };
}

export function getMsiFinalists(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const finalMatch = competition.schedule.find(
    (match) => match.id === msiMatchIds.grandFinal,
  );
  const finalRecord = getRecordForMatch(records, msiMatchIds.grandFinal);

  if (!finalMatch || !finalRecord) {
    return [];
  }

  const loserTeamId =
    finalRecord.winnerTeamId === finalMatch.blueTeamId
      ? finalMatch.redTeamId
      : finalMatch.blueTeamId;

  return [
    getTeamById(competition, finalRecord.winnerTeamId),
    getTeamById(competition, loserTeamId),
  ];
}

export function advanceMsiAfterCompletedMatches(seasonState: SeasonState): SeasonState {
  if (seasonState.currentCompetitionId !== "msi") {
    return seasonState;
  }

  const msi = seasonState.competitions.find(
    (competition) => competition.competitionId === "msi",
  );

  if (!msi || msi.completed) {
    return seasonState;
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.playInSemifinal1) &&
    hasCompletedSchedule(msi, msiMatchIds.playInSemifinal2) &&
    !hasSchedule(msi, msiMatchIds.playInFinal)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiPlayInFinalSchedule(msi, seasonState.matchRecords),
      msiStageNames.playInFinal,
    );
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.playInFinal) &&
    !hasSchedule(msi, msiMatchIds.upperRound1A)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiUpperRound1Schedule(msi, seasonState.matchRecords),
      msiStageNames.upperRound1,
    );
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.upperRound1A) &&
    hasCompletedSchedule(msi, msiMatchIds.upperRound1B) &&
    hasCompletedSchedule(msi, msiMatchIds.upperRound1C) &&
    hasCompletedSchedule(msi, msiMatchIds.upperRound1D) &&
    !hasSchedule(msi, msiMatchIds.upperRound2A)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiUpperRound2AndLowerRound1Schedule(
        msi,
        seasonState.matchRecords,
      ),
      msiStageNames.upperRound2,
    );
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.upperRound2A) &&
    hasCompletedSchedule(msi, msiMatchIds.upperRound2B) &&
    hasCompletedSchedule(msi, msiMatchIds.lowerRound1A) &&
    hasCompletedSchedule(msi, msiMatchIds.lowerRound1B) &&
    !hasSchedule(msi, msiMatchIds.upperFinal)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiUpperFinalAndLowerRound2Schedule(
        msi,
        seasonState.matchRecords,
      ),
      msiStageNames.upperFinal,
    );
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.lowerRound2A) &&
    hasCompletedSchedule(msi, msiMatchIds.lowerRound2B) &&
    !hasSchedule(msi, msiMatchIds.lowerRound3)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiLowerRound3Schedule(msi, seasonState.matchRecords),
      msiStageNames.lowerRound3,
    );
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.upperFinal) &&
    hasCompletedSchedule(msi, msiMatchIds.lowerRound3) &&
    !hasSchedule(msi, msiMatchIds.lowerFinal)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiLowerFinalSchedule(msi, seasonState.matchRecords),
      msiStageNames.lowerFinal,
    );
  }

  if (
    hasCompletedSchedule(msi, msiMatchIds.upperFinal) &&
    hasCompletedSchedule(msi, msiMatchIds.lowerFinal) &&
    !hasSchedule(msi, msiMatchIds.grandFinal)
  ) {
    return withMsiSchedules(
      seasonState,
      createMsiGrandFinalSchedule(msi, seasonState.matchRecords),
      msiStageNames.grandFinal,
    );
  }

  if (hasCompletedSchedule(msi, msiMatchIds.grandFinal)) {
    const finalRecord = getRecordForMatch(
      seasonState.matchRecords,
      msiMatchIds.grandFinal,
    );
    const finalists = getMsiFinalists(msi, seasonState.matchRecords);

    const completedSeasonState: SeasonState = {
      ...seasonState,
      nextMatchIds: [],
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "msi"
          ? {
              ...competition,
              status: "completed",
              currentStageName: "Completed",
              qualifiedTeamIds: finalists.map((team) => team.teamId),
              qualifiedTeamNames: finalists.map((team) => team.teamName),
              winnerTeamId: finalRecord?.winnerTeamId,
              winnerTeamName: finalRecord?.winnerTeamName,
              completed: true,
            }
          : competition,
      ),
    };

    const completedMsi = completedSeasonState.competitions.find(
      (competition) => competition.competitionId === "msi",
    );

    return completedMsi
      ? applyMsiWorldsQualification(completedSeasonState, completedMsi)
      : completedSeasonState;
  }

  return seasonState;
}

export function getMsiTeamProfile(teamId: string) {
  const normalizedTeamId = teamId.replace("msi-lta", "msi-lcs");
  const entrant = msiInternationalEntrants.find(
    (candidate) => candidate.teamId === normalizedTeamId,
  );

  return entrant
    ? {
        leagueLabel: normalizeLeagueCode(entrant.leagueLabel),
        strength: entrant.strength,
        style: entrant.style,
      }
    : undefined;
}

export function getMsiLeagueForTeam(teamId: string): LeagueCode {
  return getMsiTeamProfile(teamId)?.leagueLabel ?? "LCK";
}
