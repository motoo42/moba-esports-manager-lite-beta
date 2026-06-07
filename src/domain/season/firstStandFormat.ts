import type {
  CompetitionState,
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
import { addDaysToDateKey } from "./seasonScheduleDates";
import { applyRecordsToStandings, sortStandings } from "./standingsEngine";
import { normalizeLeagueCode } from "./worldsQualification";

export type FirstStandGroupId = "A" | "B";

export const firstStandStageNames = {
  groupA: "Group A",
  groupB: "Group B",
  semifinals: "Semifinals",
  final: "Final",
} as const;

export const firstStandMatchIds = {
  semifinalA1VsB2: "first-stand-semifinal-a1-vs-b2",
  semifinalB1VsA2: "first-stand-semifinal-b1-vs-a2",
  final: "first-stand-final",
} as const;

type FirstStandEntrant = {
  teamId: string;
  teamName: string;
  leagueLabel: string;
  group: FirstStandGroupId;
  initialSeed: number;
  strength: number;
  style: StrategyId;
  isUserTeam: boolean;
};

type FirstStandScheduleOptions = {
  calendarType: SeasonCalendarType;
  year: number;
};

const firstStandInternationalEntrants: Array<
  Omit<FirstStandEntrant, "isUserTeam">
> = [
  {
    teamId: "first-stand-lpl-1",
    teamName: "Bilibili Gaming",
    leagueLabel: "LPL",
    group: "B",
    initialSeed: 3,
    strength: 86,
    style: "aggressive",
  },
  {
    teamId: "first-stand-lpl-2",
    teamName: "Top Esports",
    leagueLabel: "LPL",
    group: "A",
    initialSeed: 4,
    strength: 84,
    style: "tempo",
  },
  {
    teamId: "first-stand-lec-1",
    teamName: "G2 Esports",
    leagueLabel: "LEC",
    group: "A",
    initialSeed: 5,
    strength: 82,
    style: "macro",
  },
  {
    teamId: "first-stand-lcs-1",
    teamName: "Cloud9",
    leagueLabel: "LCS",
    group: "B",
    initialSeed: 6,
    strength: 76,
    style: "balanced",
  },
  {
    teamId: "first-stand-lcp-1",
    teamName: "PSG Talon",
    leagueLabel: "LCP",
    group: "B",
    initialSeed: 7,
    strength: 74,
    style: "vision",
  },
  {
    teamId: "first-stand-cblol-1",
    teamName: "LOUD",
    leagueLabel: "CBLOL",
    group: "A",
    initialSeed: 8,
    strength: 70,
    style: "aggressive",
  },
];

function getGroupStageName(group: FirstStandGroupId) {
  return group === "A" ? firstStandStageNames.groupA : firstStandStageNames.groupB;
}

function createScheduleId(
  stageName: string,
  blueTeamId: string,
  redTeamId: string,
) {
  return `first-stand-${stageName}-${blueTeamId}-vs-${redTeamId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
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
  blue: Pick<FirstStandEntrant, "teamId" | "teamName">;
  format: MatchSchedule["format"];
  id?: string;
  red: Pick<FirstStandEntrant, "teamId" | "teamName">;
  scheduledDate: string;
  stageName: string;
  week: number;
}): MatchSchedule {
  return {
    id: id ?? createScheduleId(stageName, blue.teamId, red.teamId),
    competitionId: "first-stand",
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

function getFirstStandStartDateKey(options: FirstStandScheduleOptions) {
  return toDateKey(
    getCompetitionStartDate(options.year, "first-stand", options.calendarType),
  );
}

function getFirstStandGroupMatchDateKey(
  options: FirstStandScheduleOptions,
  matchIndex: number,
) {
  const startDateKey = getFirstStandStartDateKey(options);

  return addDaysToDateKey(startDateKey, Math.floor(matchIndex / 2));
}

function getTeamById(standings: StandingEntry[], teamId: string) {
  const team = standings.find((entry) => entry.teamId === teamId);

  if (!team) {
    throw new Error(`Unknown First Stand team: ${teamId}`);
  }

  return team;
}

function resetStandingRows(standings: StandingEntry[]) {
  return standings.map((entry) => ({
    ...entry,
    wins: 0,
    losses: 0,
    matchWins: 0,
    matchLosses: 0,
    setWins: 0,
    setLosses: 0,
    winRate: 0,
  }));
}

function toStandingEntry(entrant: FirstStandEntrant): StandingEntry {
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

function getLckCupRepresentatives(seasonState: SeasonState) {
  const lckCup = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-cup",
  );

  if (lckCup?.qualifiedTeamIds.length && lckCup.winnerTeamId) {
    const runnerUpTeamId = lckCup.qualifiedTeamIds.find(
      (teamId) => teamId !== lckCup.winnerTeamId,
    );
    const runnerUpIndex = runnerUpTeamId
      ? lckCup.qualifiedTeamIds.indexOf(runnerUpTeamId)
      : -1;

    return [
      getStandingFromCompetition(
        lckCup,
        lckCup.winnerTeamId,
        lckCup.winnerTeamName ?? "LCK 1",
        1,
      ),
      runnerUpTeamId
        ? getStandingFromCompetition(
            lckCup,
            runnerUpTeamId,
            lckCup.qualifiedTeamNames[runnerUpIndex] ?? "LCK 2",
            2,
          )
        : undefined,
    ].filter((entry): entry is StandingEntry => Boolean(entry));
  }

  if ((lckCup?.qualifiedTeamIds.length ?? 0) >= 2) {
    return lckCup!.qualifiedTeamIds.slice(0, 2).map((teamId, index) =>
      getStandingFromCompetition(
        lckCup,
        teamId,
        lckCup!.qualifiedTeamNames[index] ?? `LCK ${index + 1}`,
        index + 1,
      ),
    );
  }

  return [...(lckCup?.standings ?? [])]
    .sort((left, right) => left.initialSeed - right.initialSeed)
    .slice(0, 2);
}

function createFirstStandLckEntrants(seasonState: SeasonState) {
  const groups: FirstStandGroupId[] = ["A", "B"];

  return getLckCupRepresentatives(seasonState).map((entry, index) => ({
    teamId: entry.teamId,
    teamName: entry.teamName,
    leagueLabel: "LCK",
    group: groups[index] ?? "A",
    initialSeed: index + 1,
    strength: 86 - index,
    style: "balanced" as const,
    isUserTeam: entry.isUserTeam,
  }));
}

function createFirstStandInternationalEntrants(
  internationalOpponents: Opponent[],
) {
  return firstStandInternationalEntrants.map((entrant) => {
    const matchingOpponent = internationalOpponents.find(
      (opponent) =>
        opponent.name === entrant.teamName ||
        (opponent.leagueLabel === entrant.leagueLabel &&
          opponent.appearsIn.includes("first-stand")),
    );

    return {
      ...entrant,
      strength: matchingOpponent?.strength ?? entrant.strength,
      style: matchingOpponent?.style ?? entrant.style,
      isUserTeam: false,
    };
  });
}

function createFirstStandEntrants({
  internationalOpponents,
  seasonState,
}: {
  internationalOpponents: Opponent[];
  seasonState: SeasonState;
}) {
  return [
    ...createFirstStandLckEntrants(seasonState),
    ...createFirstStandInternationalEntrants(internationalOpponents),
  ].sort((left, right) => left.initialSeed - right.initialSeed);
}

function getFirstStandGroupEntrants(
  entrants: FirstStandEntrant[],
  group: FirstStandGroupId,
) {
  return entrants
    .filter((entrant) => entrant.group === group)
    .sort((left, right) => left.initialSeed - right.initialSeed);
}

function createGroupStagePairings(entrants: FirstStandEntrant[]) {
  return [
    [entrants[0], entrants[1]],
    [entrants[2], entrants[3]],
    [entrants[0], entrants[2]],
    [entrants[1], entrants[3]],
    [entrants[0], entrants[3]],
    [entrants[1], entrants[2]],
  ].filter((pairing): pairing is [FirstStandEntrant, FirstStandEntrant] =>
    pairing.every(Boolean),
  );
}

function createFirstStandGroupStageSchedule(
  entrants: FirstStandEntrant[],
  options: FirstStandScheduleOptions,
) {
  const schedule: MatchSchedule[] = [];
  const groupPairings = {
    A: createGroupStagePairings(getFirstStandGroupEntrants(entrants, "A")),
    B: createGroupStagePairings(getFirstStandGroupEntrants(entrants, "B")),
  };

  for (let pairingIndex = 0; pairingIndex < 6; pairingIndex += 1) {
    (["A", "B"] as FirstStandGroupId[]).forEach((group) => {
      const pairing = groupPairings[group][pairingIndex];

      if (!pairing) {
        return;
      }

      const [blue, red] = pairing;

      schedule.push(
        createMatch({
          blue,
          red,
          format: "bo1",
          scheduledDate: getFirstStandGroupMatchDateKey(options, schedule.length),
          stageName: getGroupStageName(group),
          week: 1,
        }),
      );
    });
  }

  return schedule;
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

function getWinnerFromSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
) {
  const record = getRecordForMatch(records, scheduleId);

  if (!record) {
    return undefined;
  }

  const standing = getTeamById(competition.standings, record.winnerTeamId);

  return {
    teamId: standing.teamId,
    teamName: standing.teamName,
    leagueLabel: "TBD",
    group: "A" as const,
    initialSeed: standing.initialSeed,
    strength: 76,
    style: "balanced" as const,
    isUserTeam: standing.isUserTeam,
  };
}

export function isFirstStandGroupStageName(stageName: string) {
  return (
    stageName === firstStandStageNames.groupA ||
    stageName === firstStandStageNames.groupB
  );
}

export function getFirstStandStageNames() {
  return firstStandStageNames;
}

export function getFirstStandTeamProfile(teamId: string) {
  const normalizedTeamId = teamId.replace("first-stand-lta", "first-stand-lcs");
  const entrant = firstStandInternationalEntrants.find(
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

export function createFirstStandSetup({
  internationalOpponents,
  options,
  seasonState,
}: {
  internationalOpponents: Opponent[];
  options: FirstStandScheduleOptions;
  seasonState: SeasonState;
}) {
  const entrants = createFirstStandEntrants({
    internationalOpponents,
    seasonState,
  });

  return {
    standings: sortStandings(entrants.map(toStandingEntry)),
    schedule: createFirstStandGroupStageSchedule(entrants, options),
  };
}

export function getFirstStandGroupStandings(
  competition: CompetitionState,
  records: MatchRecord[],
  group: FirstStandGroupId,
) {
  const stageName = getGroupStageName(group);
  const groupSchedule = competition.schedule.filter(
    (match) => match.stageName === stageName,
  );
  const groupScheduleIds = new Set(groupSchedule.map((match) => match.id));
  const groupTeamIds = new Set(
    groupSchedule.flatMap((match) => [match.blueTeamId, match.redTeamId]),
  );
  const baseStandings = sortStandings(
    resetStandingRows(
      competition.standings.filter((entry) => groupTeamIds.has(entry.teamId)),
    ),
  );

  return applyRecordsToStandings({
    records: records.filter((record) => groupScheduleIds.has(record.scheduleId)),
    schedule: groupSchedule,
    standings: baseStandings,
  });
}

export function createFirstStandSemifinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const groupA = getFirstStandGroupStandings(competition, records, "A");
  const groupB = getFirstStandGroupStandings(competition, records, "B");
  const lastGroupDate = getLastScheduledDateKey(
    competition.schedule.filter((match) =>
      isFirstStandGroupStageName(match.stageName),
    ),
  );

  if (groupA.length < 2 || groupB.length < 2 || !lastGroupDate) {
    return [];
  }

  const firstSemifinalDate = addDaysToDateKey(lastGroupDate, 2);

  return [
    createMatch({
      id: firstStandMatchIds.semifinalA1VsB2,
      week: 2,
      scheduledDate: firstSemifinalDate,
      stageName: firstStandStageNames.semifinals,
      blue: {
        teamId: groupA[0].teamId,
        teamName: groupA[0].teamName,
      },
      red: {
        teamId: groupB[1].teamId,
        teamName: groupB[1].teamName,
      },
      format: "bo5",
    }),
    createMatch({
      id: firstStandMatchIds.semifinalB1VsA2,
      week: 2,
      scheduledDate: addDaysToDateKey(firstSemifinalDate, 1),
      stageName: firstStandStageNames.semifinals,
      blue: {
        teamId: groupB[0].teamId,
        teamName: groupB[0].teamName,
      },
      red: {
        teamId: groupA[1].teamId,
        teamName: groupA[1].teamName,
      },
      format: "bo5",
    }),
  ];
}

export function createFirstStandFinalSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  const semifinalA = getWinnerFromSchedule(
    competition,
    records,
    firstStandMatchIds.semifinalA1VsB2,
  );
  const semifinalB = getWinnerFromSchedule(
    competition,
    records,
    firstStandMatchIds.semifinalB1VsA2,
  );
  const lastSemifinalDate = getLastScheduledDateKey(
    competition.schedule.filter(
      (match) => match.stageName === firstStandStageNames.semifinals,
    ),
  );

  if (!semifinalA || !semifinalB || !lastSemifinalDate) {
    return [];
  }

  return [
    createMatch({
      id: firstStandMatchIds.final,
      week: 3,
      scheduledDate: addDaysToDateKey(lastSemifinalDate, 2),
      stageName: firstStandStageNames.final,
      blue: semifinalA,
      red: semifinalB,
      format: "bo5",
    }),
  ];
}

export function getFirstStandFinalists(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const finalMatch = competition.schedule.find(
    (match) => match.id === firstStandMatchIds.final,
  );
  const finalRecord = getRecordForMatch(records, firstStandMatchIds.final);

  if (!finalMatch || !finalRecord) {
    return [];
  }

  const loserTeamId =
    finalRecord.winnerTeamId === finalMatch.blueTeamId
      ? finalMatch.redTeamId
      : finalMatch.blueTeamId;

  return [
    getTeamById(competition.standings, finalRecord.winnerTeamId),
    getTeamById(competition.standings, loserTeamId),
  ];
}

export function advanceFirstStandAfterCompletedMatches(
  seasonState: SeasonState,
): SeasonState {
  if (seasonState.currentCompetitionId !== "first-stand") {
    return seasonState;
  }

  const firstStand = seasonState.competitions.find(
    (competition) => competition.competitionId === "first-stand",
  );

  if (!firstStand || firstStand.completed) {
    return seasonState;
  }

  const groupSchedule = firstStand.schedule.filter((match) =>
    isFirstStandGroupStageName(match.stageName),
  );
  const allGroupMatchesCompleted =
    groupSchedule.length > 0 &&
    groupSchedule.every((match) => match.status === "completed");

  if (
    allGroupMatchesCompleted &&
    !hasSchedule(firstStand, firstStandMatchIds.semifinalA1VsB2)
  ) {
    const semifinalSchedule = createFirstStandSemifinalSchedule(
      firstStand,
      seasonState.matchRecords,
    );

    return {
      ...seasonState,
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        semifinalSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "first-stand"
          ? {
              ...competition,
              currentStageName: firstStandStageNames.semifinals,
              currentWeek: semifinalSchedule[0]?.week ?? competition.currentWeek,
              schedule: appendUniqueSchedules(competition.schedule, semifinalSchedule),
            }
          : competition,
      ),
    };
  }

  if (
    hasCompletedSchedule(firstStand, firstStandMatchIds.semifinalA1VsB2) &&
    hasCompletedSchedule(firstStand, firstStandMatchIds.semifinalB1VsA2) &&
    !hasSchedule(firstStand, firstStandMatchIds.final)
  ) {
    const finalSchedule = createFirstStandFinalSchedule(
      firstStand,
      seasonState.matchRecords,
    );

    return {
      ...seasonState,
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        finalSchedule,
      ),
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "first-stand"
          ? {
              ...competition,
              currentStageName: firstStandStageNames.final,
              currentWeek: finalSchedule[0]?.week ?? competition.currentWeek,
              schedule: appendUniqueSchedules(competition.schedule, finalSchedule),
            }
          : competition,
      ),
    };
  }

  if (hasCompletedSchedule(firstStand, firstStandMatchIds.final)) {
    const finalRecord = getRecordForMatch(
      seasonState.matchRecords,
      firstStandMatchIds.final,
    );
    const finalists = getFirstStandFinalists(firstStand, seasonState.matchRecords);

    return {
      ...seasonState,
      nextMatchIds: [],
      competitions: seasonState.competitions.map((competition) =>
        competition.competitionId === "first-stand"
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
  }

  return seasonState;
}
