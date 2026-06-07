import type {
  CompetitionState,
  LeagueCode,
  MatchRecord,
  MatchSchedule,
  SeasonState,
  StandingEntry,
  StrategyId,
  WorldsEntrant,
  WorldsGroupAssignment,
  WorldsGroupId,
  WorldsGroupStage,
} from "../../types/game";
import { getLckOpponentStyle, getLckTeamStrength } from "../opponents";
import { addDaysToDateKey, formatSeasonDateLabel } from "./seasonScheduleDates";
import { applyRecordsToStandings } from "./standingsEngine";

export type SeededWorldsEntrant = WorldsEntrant & {
  entryStage: "direct" | "play-in";
  initialSeed: number;
};

type WorldsSetup = {
  standings: StandingEntry[];
  schedule: MatchSchedule[];
  playInGroups: WorldsGroupAssignment[];
};

const majorLeagueCodes: LeagueCode[] = ["LCK", "LPL", "LCS", "LEC"];

const worldsGroupLabels: Record<WorldsGroupId, string> = {
  "play-in-a": "Play-In Group A",
  "play-in-b": "Play-In Group B",
  "group-a": "Group A",
  "group-b": "Group B",
  "group-c": "Group C",
  "group-d": "Group D",
};

const groupIdLetters: Record<WorldsGroupId, string> = {
  "play-in-a": "A",
  "play-in-b": "B",
  "group-a": "A",
  "group-b": "B",
  "group-c": "C",
  "group-d": "D",
};

const leagueStrengthBaseline: Record<LeagueCode | "LCQ", number> = {
  LCK: 86,
  LPL: 87,
  LEC: 80,
  LCS: 76,
  LCP: 73,
  CBLOL: 69,
  LCQ: 72,
};

const leagueStyleBaseline: Record<LeagueCode | "LCQ", StrategyId> = {
  LCK: "balanced",
  LPL: "aggressive",
  LEC: "macro",
  LCS: "balanced",
  LCP: "vision",
  CBLOL: "aggressive",
  LCQ: "tempo",
};

export const worldsStageNames = {
  playInGroupA: "Play-In Group A",
  playInGroupB: "Play-In Group B",
  groupStageA: "Group Stage Group A",
  groupStageB: "Group Stage Group B",
  groupStageC: "Group Stage Group C",
  groupStageD: "Group Stage Group D",
  quarterfinals: "Quarterfinals",
  semifinals: "Semifinals",
  final: "Final",
} as const;

export const worldsMatchIds = {
  quarterfinalA1VsB2: "worlds-quarterfinal-a1-b2",
  quarterfinalB1VsA2: "worlds-quarterfinal-b1-a2",
  quarterfinalC1VsD2: "worlds-quarterfinal-c1-d2",
  quarterfinalD1VsC2: "worlds-quarterfinal-d1-c2",
  semifinalTop: "worlds-semifinal-top",
  semifinalBottom: "worlds-semifinal-bottom",
  final: "worlds-final",
} as const;

const playInGroupIds: WorldsGroupId[] = ["play-in-a", "play-in-b"];
const groupStageGroupIds: WorldsGroupId[] = [
  "group-a",
  "group-b",
  "group-c",
  "group-d",
];
const roundRobinRounds = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 3],
    [1, 2],
  ],
] as const;

function sourceRank(source: WorldsEntrant["source"]) {
  if (source === "regional-base") {
    return 0;
  }

  if (source === "msi-bonus") {
    return 1;
  }

  return 2;
}

function leagueRank(leagueLabel: LeagueCode | "LCQ") {
  const order: Array<LeagueCode | "LCQ"> = [
    "LCK",
    "LPL",
    "LEC",
    "LCS",
    "LCP",
    "CBLOL",
    "LCQ",
  ];

  return order.indexOf(leagueLabel);
}

export function getWorldsEntryStage(entrant: WorldsEntrant): SeededWorldsEntrant["entryStage"] {
  return majorLeagueCodes.includes(entrant.leagueLabel as LeagueCode) &&
    entrant.seed <= 3 &&
    entrant.source === "regional-base"
    ? "direct"
    : "play-in";
}

function toSeededEntrants(entrants: WorldsEntrant[]): SeededWorldsEntrant[] {
  return entrants
    .map((entrant) => ({
      ...entrant,
      entryStage: getWorldsEntryStage(entrant),
      initialSeed:
        leagueRank(entrant.leagueLabel) * 10 +
        sourceRank(entrant.source) * 4 +
        entrant.seed,
    }))
    .sort((left, right) => {
      const stageDiff =
        left.entryStage === right.entryStage
          ? 0
          : left.entryStage === "direct"
            ? -1
            : 1;

      if (stageDiff !== 0) {
        return stageDiff;
      }

      const seedDiff = left.seed - right.seed;

      if (seedDiff !== 0) {
        return seedDiff;
      }

      const leagueDiff = leagueRank(left.leagueLabel) - leagueRank(right.leagueLabel);

      if (leagueDiff !== 0) {
        return leagueDiff;
      }

      return left.teamId.localeCompare(right.teamId);
    });
}

export function splitWorldsEntrants(entrants: WorldsEntrant[]) {
  const seededEntrants = toSeededEntrants(entrants);

  return {
    directEntrants: seededEntrants.filter((entrant) => entrant.entryStage === "direct"),
    playInEntrants: seededEntrants.filter(
      (entrant) => entrant.entryStage === "play-in",
    ),
  };
}

function getUserTeamId(seasonState: SeasonState) {
  return seasonState.competitions
    .flatMap((competition) => competition.standings)
    .find((entry) => entry.isUserTeam)?.teamId;
}

function countLeagueDuplicates(group: WorldsGroupAssignment[]) {
  const counts = group.reduce<Map<LeagueCode | "LCQ", number>>((result, entry) => {
    result.set(entry.leagueLabel, (result.get(entry.leagueLabel) ?? 0) + 1);
    return result;
  }, new Map());

  return [...counts.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) {
    return [items];
  }

  return items.flatMap((item, index) =>
    permutations(items.filter((_, candidateIndex) => candidateIndex !== index)).map(
      (tail) => [item, ...tail],
    ),
  );
}

function stageNameForGroup(groupId: WorldsGroupId) {
  if (groupId === "play-in-a") {
    return worldsStageNames.playInGroupA;
  }

  if (groupId === "play-in-b") {
    return worldsStageNames.playInGroupB;
  }

  if (groupId === "group-a") {
    return worldsStageNames.groupStageA;
  }

  if (groupId === "group-b") {
    return worldsStageNames.groupStageB;
  }

  if (groupId === "group-c") {
    return worldsStageNames.groupStageC;
  }

  return worldsStageNames.groupStageD;
}

export function assignWorldsGroups({
  entrants,
  groupIds,
  stage,
}: {
  entrants: SeededWorldsEntrant[];
  groupIds: WorldsGroupId[];
  stage: WorldsGroupStage;
}): WorldsGroupAssignment[] {
  const groups = new Map<WorldsGroupId, WorldsGroupAssignment[]>(
    groupIds.map((groupId) => [groupId, []]),
  );
  const groupCount = groupIds.length;
  const groupSize = Math.ceil(entrants.length / groupCount);

  for (let poolIndex = 0; poolIndex < groupSize; poolIndex += 1) {
    const pool = entrants.slice(poolIndex * groupCount, (poolIndex + 1) * groupCount);
    let bestPermutation = pool;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const permutation of permutations(pool)) {
      const score = permutation.reduce((total, entrant, index) => {
        const groupId = groupIds[index];
        const group = groups.get(groupId) ?? [];

        return total + countLeagueDuplicates([
          ...group,
          {
            stage,
            groupId,
            teamId: entrant.teamId,
            teamName: entrant.teamName,
            leagueLabel: entrant.leagueLabel,
            initialSeed: entrant.initialSeed,
          },
        ]);
      }, 0);

      if (score < bestScore) {
        bestScore = score;
        bestPermutation = permutation;
      }
    }

    bestPermutation.forEach((entrant, index) => {
      const groupId = groupIds[index];
      const group = groups.get(groupId);

      group?.push({
        stage,
        groupId,
        teamId: entrant.teamId,
        teamName: entrant.teamName,
        leagueLabel: entrant.leagueLabel,
        initialSeed: entrant.initialSeed,
      });
    });
  }

  return groupIds.flatMap((groupId) => groups.get(groupId) ?? []);
}

function createStandingFromAssignment(
  assignment: WorldsGroupAssignment,
  userTeamId: string | undefined,
  index: number,
): StandingEntry {
  return {
    teamId: assignment.teamId,
    teamName: assignment.teamName,
    rank: index + 1,
    initialSeed: assignment.initialSeed,
    wins: 0,
    losses: 0,
    matchWins: 0,
    matchLosses: 0,
    setWins: 0,
    setLosses: 0,
    winRate: 0,
    isUserTeam: assignment.teamId === userTeamId,
    worldsGroup: assignment.groupId,
    worldsStage: assignment.stage,
  };
}

function createStandingsFromAssignments(
  assignments: WorldsGroupAssignment[],
  userTeamId: string | undefined,
) {
  return assignments.map((assignment, index) =>
    createStandingFromAssignment(assignment, userTeamId, index),
  );
}

function createRoundRobinSchedule({
  assignments,
  doubleRoundRobin,
  prefix,
  startDateKey,
  weekOffset,
}: {
  assignments: WorldsGroupAssignment[];
  doubleRoundRobin: boolean;
  prefix: string;
  startDateKey: string;
  weekOffset: number;
}) {
  const groups = assignments.reduce<Map<WorldsGroupId, WorldsGroupAssignment[]>>(
    (result, assignment) => {
      const group = result.get(assignment.groupId) ?? [];

      result.set(assignment.groupId, [...group, assignment]);
      return result;
    },
    new Map(),
  );
  const rounds = doubleRoundRobin
    ? [
        ...roundRobinRounds,
        ...roundRobinRounds.map((round) =>
          round.map(([left, right]) => [right, left] as const),
        ),
      ]
    : roundRobinRounds;

  return [...groups.entries()].flatMap(([groupId, teams]) =>
    rounds.flatMap((round, roundIndex) =>
      round.map(([blueIndex, redIndex], matchIndex) => {
        const blue = teams[blueIndex];
        const red = teams[redIndex];

        return {
          id: `${prefix}-${groupId}-${roundIndex + 1}-${matchIndex + 1}`,
          competitionId: "worlds" as const,
          week: weekOffset + roundIndex + 1,
          scheduledDate: addDaysToDateKey(startDateKey, roundIndex),
          stageName: stageNameForGroup(groupId),
          blueTeamId: blue.teamId,
          blueTeamName: blue.teamName,
          redTeamId: red.teamId,
          redTeamName: red.teamName,
          format: "bo1" as const,
          status: "scheduled" as const,
          fearlessEnabled: false,
        };
      }),
    ),
  );
}

function getCompletedRecord(seasonState: SeasonState, scheduleId: string) {
  return seasonState.matchRecords.find((record) => record.scheduleId === scheduleId);
}

function getRecordMatchSide(
  record: MatchRecord,
  side: "blue" | "red",
  schedule: MatchSchedule[],
) {
  const match = schedule.find((candidate) => candidate.id === record.scheduleId);

  return side === "blue" ? match?.blueTeamId ?? "" : match?.redTeamId ?? "";
}

function getTeamNameFromSchedule(teamId: string, schedule: MatchSchedule[]) {
  return (
    schedule.find((match) => match.blueTeamId === teamId)?.blueTeamName ??
    schedule.find((match) => match.redTeamId === teamId)?.redTeamName ??
    teamId
  );
}

function getLoser(record: MatchRecord, schedule: MatchSchedule[]) {
  const loserTeamId =
    record.winnerSide === "blue"
      ? getRecordMatchSide(record, "red", schedule)
      : getRecordMatchSide(record, "blue", schedule);

  return {
    teamId: loserTeamId,
    teamName: getTeamNameFromSchedule(loserTeamId, schedule),
  };
}

function getLastDateKey(schedule: MatchSchedule[], fallbackDateKey: string) {
  return (
    [...schedule]
      .filter((match) => match.scheduledDate)
      .sort((left, right) =>
        (right.scheduledDate ?? "").localeCompare(left.scheduledDate ?? ""),
      )[0]?.scheduledDate ?? fallbackDateKey
  );
}

function groupAssignmentsById(assignments: WorldsGroupAssignment[]) {
  return assignments.reduce<Map<WorldsGroupId, WorldsGroupAssignment[]>>(
    (result, assignment) => {
      const group = result.get(assignment.groupId) ?? [];

      result.set(assignment.groupId, [...group, assignment]);
      return result;
    },
    new Map(),
  );
}

export function getWorldsGroupStandings({
  assignments,
  competition,
  groupId,
  records,
}: {
  assignments: WorldsGroupAssignment[];
  competition: CompetitionState;
  groupId: WorldsGroupId;
  records: MatchRecord[];
}) {
  const groupAssignments = assignments.filter(
    (assignment) => assignment.groupId === groupId,
  );

  if (groupAssignments.length === 0) {
    return [];
  }

  const baseStandings = createStandingsFromAssignments(groupAssignments, undefined);
  const groupSchedule = competition.schedule.filter(
    (match) => match.stageName === stageNameForGroup(groupId),
  );
  const groupRecords = records.filter((record) =>
    groupSchedule.some((match) => match.id === record.scheduleId),
  );

  return applyRecordsToStandings({
    records: groupRecords,
    schedule: groupSchedule,
    standings: baseStandings,
  });
}

function getAdvancingTeams({
  assignments,
  competition,
  groupIds,
  records,
  teamsPerGroup,
}: {
  assignments: WorldsGroupAssignment[];
  competition: CompetitionState;
  groupIds: WorldsGroupId[];
  records: MatchRecord[];
  teamsPerGroup: number;
}) {
  return groupIds.flatMap((groupId) =>
    getWorldsGroupStandings({
      assignments,
      competition,
      groupId,
      records,
    }).slice(0, teamsPerGroup),
  );
}

function createGroupStageSchedule({
  competition,
  directEntrants,
  playInQualifiers,
  seasonState,
}: {
  competition: CompetitionState;
  directEntrants: SeededWorldsEntrant[];
  playInQualifiers: StandingEntry[];
  seasonState: SeasonState;
}) {
  const qualifierEntrants: SeededWorldsEntrant[] = playInQualifiers.map(
    (qualifier, index) => {
      const sourceEntrant = seasonState.worldsQualification?.entrants.find(
        (entrant) => entrant.teamId === qualifier.teamId,
      );

      return {
        ...(sourceEntrant ?? {
          teamId: qualifier.teamId,
          teamName: qualifier.teamName,
          leagueLabel: "LCQ" as const,
          seed: index + 1,
          slotLabel: qualifier.teamName,
          source: "lcq-placeholder" as const,
          isPlaceholder: true,
        }),
        entryStage: "play-in" as const,
        initialSeed: 100 + qualifier.rank + index,
      };
    },
  );
  const groupAssignments = assignWorldsGroups({
    entrants: [...directEntrants, ...qualifierEntrants],
    groupIds: groupStageGroupIds,
    stage: "group-stage",
  });
  const startDateKey = addDaysToDateKey(
    getLastDateKey(competition.schedule, seasonState.currentDateKey),
    2,
  );
  const schedule = createRoundRobinSchedule({
    assignments: groupAssignments,
    doubleRoundRobin: true,
    prefix: "worlds-group-stage",
    startDateKey,
    weekOffset: 10,
  });

  return {
    groupAssignments,
    schedule,
  };
}

function createQuarterfinalSchedule({
  competition,
  knockoutTeams,
  seasonState,
}: {
  competition: CompetitionState;
  knockoutTeams: StandingEntry[];
  seasonState: SeasonState;
}) {
  const byGroup = new Map(
    groupStageGroupIds.map((groupId) => [
      groupId,
      knockoutTeams.filter((team) => team.worldsGroup === groupId),
    ]),
  );
  const qfPairs = [
    {
      id: worldsMatchIds.quarterfinalA1VsB2,
      blue: byGroup.get("group-a")?.[0],
      red: byGroup.get("group-b")?.[1],
    },
    {
      id: worldsMatchIds.quarterfinalB1VsA2,
      blue: byGroup.get("group-b")?.[0],
      red: byGroup.get("group-a")?.[1],
    },
    {
      id: worldsMatchIds.quarterfinalC1VsD2,
      blue: byGroup.get("group-c")?.[0],
      red: byGroup.get("group-d")?.[1],
    },
    {
      id: worldsMatchIds.quarterfinalD1VsC2,
      blue: byGroup.get("group-d")?.[0],
      red: byGroup.get("group-c")?.[1],
    },
  ];
  const startDateKey = addDaysToDateKey(
    getLastDateKey(competition.schedule, seasonState.currentDateKey),
    3,
  );

  return qfPairs.flatMap((pair, index) =>
    pair.blue && pair.red
      ? [
          {
            id: pair.id,
            competitionId: "worlds" as const,
            week: 20 + index,
            scheduledDate: addDaysToDateKey(startDateKey, index),
            stageName: worldsStageNames.quarterfinals,
            blueTeamId: pair.blue.teamId,
            blueTeamName: pair.blue.teamName,
            redTeamId: pair.red.teamId,
            redTeamName: pair.red.teamName,
            format: "bo5" as const,
            status: "scheduled" as const,
            fearlessEnabled: false,
          },
        ]
      : [],
  );
}

function createSemifinalSchedule({
  competition,
  seasonState,
}: {
  competition: CompetitionState;
  seasonState: SeasonState;
}) {
  const quarterfinalIds = [
    worldsMatchIds.quarterfinalA1VsB2,
    worldsMatchIds.quarterfinalB1VsA2,
    worldsMatchIds.quarterfinalC1VsD2,
    worldsMatchIds.quarterfinalD1VsC2,
  ];
  const quarterfinalWinners = quarterfinalIds.flatMap((scheduleId) => {
    const record = getCompletedRecord(seasonState, scheduleId);

    return record
      ? [{ teamId: record.winnerTeamId, teamName: record.winnerTeamName }]
      : [];
  });
  const startDateKey = addDaysToDateKey(
    getLastDateKey(competition.schedule, seasonState.currentDateKey),
    2,
  );

  if (quarterfinalWinners.length < 4) {
    return [];
  }

  return [
    {
      id: worldsMatchIds.semifinalTop,
      competitionId: "worlds" as const,
      week: 30,
      scheduledDate: startDateKey,
      stageName: worldsStageNames.semifinals,
      blueTeamId: quarterfinalWinners[0].teamId,
      blueTeamName: quarterfinalWinners[0].teamName,
      redTeamId: quarterfinalWinners[1].teamId,
      redTeamName: quarterfinalWinners[1].teamName,
      format: "bo5" as const,
      status: "scheduled" as const,
      fearlessEnabled: false,
    },
    {
      id: worldsMatchIds.semifinalBottom,
      competitionId: "worlds" as const,
      week: 31,
      scheduledDate: addDaysToDateKey(startDateKey, 1),
      stageName: worldsStageNames.semifinals,
      blueTeamId: quarterfinalWinners[2].teamId,
      blueTeamName: quarterfinalWinners[2].teamName,
      redTeamId: quarterfinalWinners[3].teamId,
      redTeamName: quarterfinalWinners[3].teamName,
      format: "bo5" as const,
      status: "scheduled" as const,
      fearlessEnabled: false,
    },
  ];
}

function createFinalSchedule({
  competition,
  seasonState,
}: {
  competition: CompetitionState;
  seasonState: SeasonState;
}) {
  const semifinalRecords = [
    getCompletedRecord(seasonState, worldsMatchIds.semifinalTop),
    getCompletedRecord(seasonState, worldsMatchIds.semifinalBottom),
  ];

  if (!semifinalRecords[0] || !semifinalRecords[1]) {
    return [];
  }

  const startDateKey = addDaysToDateKey(
    getLastDateKey(competition.schedule, seasonState.currentDateKey),
    3,
  );

  return [
    {
      id: worldsMatchIds.final,
      competitionId: "worlds" as const,
      week: 40,
      scheduledDate: startDateKey,
      stageName: worldsStageNames.final,
      blueTeamId: semifinalRecords[0].winnerTeamId,
      blueTeamName: semifinalRecords[0].winnerTeamName,
      redTeamId: semifinalRecords[1].winnerTeamId,
      redTeamName: semifinalRecords[1].winnerTeamName,
      format: "bo5" as const,
      status: "scheduled" as const,
      fearlessEnabled: false,
    },
  ];
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

export function createWorldsSetup({
  seasonState,
  startDateKey,
}: {
  seasonState: SeasonState;
  startDateKey: string;
}): WorldsSetup {
  const entrants = seasonState.worldsQualification?.entrants ?? [];
  const { playInEntrants } = splitWorldsEntrants(entrants);
  const userTeamId = getUserTeamId(seasonState);
  const playInGroups = assignWorldsGroups({
    entrants: playInEntrants,
    groupIds: playInGroupIds,
    stage: "play-in",
  });
  const schedule = createRoundRobinSchedule({
    assignments: playInGroups,
    doubleRoundRobin: false,
    prefix: "worlds-play-in",
    startDateKey,
    weekOffset: 1,
  });

  return {
    playInGroups,
    schedule,
    standings: createStandingsFromAssignments(playInGroups, userTeamId),
  };
}

export function activateWorlds(seasonState: SeasonState): SeasonState {
  const competitionId = "worlds";
  const defaultStartDateKey = `${seasonState.yearLabel}-10-01`;
  const startDateKey =
    seasonState.currentDateKey >= defaultStartDateKey
      ? addDaysToDateKey(seasonState.currentDateKey, 1)
      : defaultStartDateKey;
  const setup = createWorldsSetup({ seasonState, startDateKey });
  const openingMatchIds = setup.schedule
    .filter((match) => match.scheduledDate === startDateKey)
    .filter((match) =>
      setup.standings
        .filter((entry) => entry.isUserTeam)
        .some(
          (entry) =>
            entry.teamId === match.blueTeamId || entry.teamId === match.redTeamId,
        ),
    )
    .map((match) => match.id);
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
    currentWeek: setup.schedule[0]?.week ?? 1,
    currentDateKey: startDateKey,
    currentDateLabel: formatSeasonDateLabel(startDateKey),
    progressStatus: openingMatchIds.length > 0 ? "match-preview" : "idle",
    worlds: {
      status: "play-in",
      startDateKey,
      playInGroups: setup.playInGroups,
      groupStageGroups: [],
      knockoutTeamIds: [],
      knockoutTeamNames: [],
    },
    nextMatchIds: openingMatchIds,
    lastMatchRecordIds: [],
    scheduledMatches: [...seasonState.scheduledMatches, ...newSchedules],
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === competitionId
        ? {
            ...competition,
            status: "active",
            currentStageName: worldsStageNames.playInGroupA,
            currentWeek: setup.schedule[0]?.week ?? 1,
            standings: setup.standings,
            schedule: setup.schedule,
            winnerTeamId: undefined,
            winnerTeamName: undefined,
            completed: false,
          }
        : competition,
    ),
  };
}

function hasSchedule(competition: CompetitionState, stageName: string) {
  return competition.schedule.some((match) => match.stageName === stageName);
}

function allStageMatchesCompleted(competition: CompetitionState, stageNames: string[]) {
  const stageSchedule = competition.schedule.filter((match) =>
    stageNames.includes(match.stageName),
  );

  return (
    stageSchedule.length > 0 &&
    stageSchedule.every((match) => match.status === "completed")
  );
}

export function advanceWorldsAfterCompletedMatches(
  seasonState: SeasonState,
): SeasonState {
  if (seasonState.currentCompetitionId !== "worlds") {
    return seasonState;
  }

  const competition = seasonState.competitions.find(
    (candidate) => candidate.competitionId === "worlds",
  );

  if (!competition || competition.completed) {
    return seasonState;
  }

  const finalRecord = getCompletedRecord(seasonState, worldsMatchIds.final);

  if (finalRecord) {
    const runnerUp = getLoser(finalRecord, seasonState.scheduledMatches);
    const semifinalLosers = [
      getCompletedRecord(seasonState, worldsMatchIds.semifinalTop),
      getCompletedRecord(seasonState, worldsMatchIds.semifinalBottom),
    ].flatMap((record) =>
      record ? [getLoser(record, seasonState.scheduledMatches)] : [],
    );

    return {
      ...seasonState,
      nextMatchIds: [],
      worlds: {
        status: "completed",
        startDateKey: seasonState.worlds?.startDateKey,
        playInGroups: seasonState.worlds?.playInGroups ?? [],
        groupStageGroups: seasonState.worlds?.groupStageGroups ?? [],
        knockoutTeamIds: seasonState.worlds?.knockoutTeamIds ?? [],
        knockoutTeamNames: seasonState.worlds?.knockoutTeamNames ?? [],
        finalistTeamIds: [finalRecord.winnerTeamId, runnerUp.teamId],
        finalistTeamNames: [finalRecord.winnerTeamName, runnerUp.teamName],
        championTeamId: finalRecord.winnerTeamId,
        championTeamName: finalRecord.winnerTeamName,
        runnerUpTeamId: runnerUp.teamId,
        runnerUpTeamName: runnerUp.teamName,
        semifinalistTeamIds: semifinalLosers.map((team) => team.teamId),
        semifinalistTeamNames: semifinalLosers.map((team) => team.teamName),
      },
      competitions: seasonState.competitions.map((candidate) =>
        candidate.competitionId === "worlds"
          ? {
              ...candidate,
              status: "completed",
              currentStageName: "Completed",
              qualifiedTeamIds: [
                finalRecord.winnerTeamId,
                runnerUp.teamId,
                ...semifinalLosers.map((team) => team.teamId),
              ],
              qualifiedTeamNames: [
                finalRecord.winnerTeamName,
                runnerUp.teamName,
                ...semifinalLosers.map((team) => team.teamName),
              ],
              winnerTeamId: finalRecord.winnerTeamId,
              winnerTeamName: finalRecord.winnerTeamName,
              completed: true,
            }
          : candidate,
      ),
    };
  }

  if (
    seasonState.worlds?.status === "play-in" &&
    allStageMatchesCompleted(competition, [
      worldsStageNames.playInGroupA,
      worldsStageNames.playInGroupB,
    ]) &&
    !hasSchedule(competition, worldsStageNames.groupStageA)
  ) {
    const { directEntrants } = splitWorldsEntrants(
      seasonState.worldsQualification?.entrants ?? [],
    );
    const playInQualifiers = getAdvancingTeams({
      assignments: seasonState.worlds.playInGroups,
      competition,
      groupIds: playInGroupIds,
      records: seasonState.matchRecords,
      teamsPerGroup: 2,
    });
    const groupStage = createGroupStageSchedule({
      competition,
      directEntrants,
      playInQualifiers,
      seasonState,
    });

    return {
      ...seasonState,
      nextMatchIds: [],
      worlds: {
        ...seasonState.worlds,
        status: "group-stage",
        groupStageGroups: groupStage.groupAssignments,
      },
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        groupStage.schedule,
      ),
      competitions: seasonState.competitions.map((candidate) =>
        candidate.competitionId === "worlds"
          ? {
              ...candidate,
              currentStageName: groupStage.schedule[0]?.stageName ?? worldsStageNames.groupStageA,
              currentWeek: groupStage.schedule[0]?.week ?? candidate.currentWeek,
              schedule: appendUniqueSchedules(candidate.schedule, groupStage.schedule),
              standings: createStandingsFromAssignments(
                groupStage.groupAssignments,
                getUserTeamId(seasonState),
              ),
            }
          : candidate,
      ),
    };
  }

  if (
    seasonState.worlds?.status === "group-stage" &&
    allStageMatchesCompleted(competition, [
      worldsStageNames.groupStageA,
      worldsStageNames.groupStageB,
      worldsStageNames.groupStageC,
      worldsStageNames.groupStageD,
    ]) &&
    !hasSchedule(competition, worldsStageNames.quarterfinals)
  ) {
    const knockoutTeams = getAdvancingTeams({
      assignments: seasonState.worlds.groupStageGroups,
      competition,
      groupIds: groupStageGroupIds,
      records: seasonState.matchRecords,
      teamsPerGroup: 2,
    });
    const quarterfinals = createQuarterfinalSchedule({
      competition,
      knockoutTeams,
      seasonState,
    });

    return {
      ...seasonState,
      nextMatchIds: [],
      worlds: {
        ...seasonState.worlds,
        status: "knockout",
        knockoutTeamIds: knockoutTeams.map((team) => team.teamId),
        knockoutTeamNames: knockoutTeams.map((team) => team.teamName),
      },
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        quarterfinals,
      ),
      competitions: seasonState.competitions.map((candidate) =>
        candidate.competitionId === "worlds"
          ? {
              ...candidate,
              currentStageName: quarterfinals[0]?.stageName ?? worldsStageNames.quarterfinals,
              currentWeek: quarterfinals[0]?.week ?? candidate.currentWeek,
              schedule: appendUniqueSchedules(candidate.schedule, quarterfinals),
              qualifiedTeamIds: knockoutTeams.map((team) => team.teamId),
              qualifiedTeamNames: knockoutTeams.map((team) => team.teamName),
            }
          : candidate,
      ),
    };
  }

  if (
    seasonState.worlds?.status === "knockout" &&
    allStageMatchesCompleted(competition, [worldsStageNames.quarterfinals]) &&
    !hasSchedule(competition, worldsStageNames.semifinals)
  ) {
    const semifinals = createSemifinalSchedule({ competition, seasonState });

    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(
        seasonState.scheduledMatches,
        semifinals,
      ),
      competitions: seasonState.competitions.map((candidate) =>
        candidate.competitionId === "worlds"
          ? {
              ...candidate,
              currentStageName: semifinals[0]?.stageName ?? worldsStageNames.semifinals,
              currentWeek: semifinals[0]?.week ?? candidate.currentWeek,
              schedule: appendUniqueSchedules(candidate.schedule, semifinals),
            }
          : candidate,
      ),
    };
  }

  if (
    seasonState.worlds?.status === "knockout" &&
    allStageMatchesCompleted(competition, [worldsStageNames.semifinals]) &&
    !hasSchedule(competition, worldsStageNames.final)
  ) {
    const final = createFinalSchedule({ competition, seasonState });

    return {
      ...seasonState,
      nextMatchIds: [],
      scheduledMatches: appendUniqueSchedules(seasonState.scheduledMatches, final),
      competitions: seasonState.competitions.map((candidate) =>
        candidate.competitionId === "worlds"
          ? {
              ...candidate,
              currentStageName: final[0]?.stageName ?? worldsStageNames.final,
              currentWeek: final[0]?.week ?? candidate.currentWeek,
              schedule: appendUniqueSchedules(candidate.schedule, final),
            }
          : candidate,
      ),
    };
  }

  return seasonState;
}

export function getWorldsTeamProfile(teamId: string, seasonState?: SeasonState) {
  const entrant = seasonState?.worldsQualification?.entrants.find(
    (candidate) => candidate.teamId === teamId,
  );
  const leagueLabel = entrant?.leagueLabel ?? "LCQ";

  if (leagueLabel === "LCK") {
    return {
      leagueLabel,
      strength: getLckTeamStrength(teamId),
      style: getLckOpponentStyle(teamId),
    };
  }

  const seedPenalty = entrant ? Math.max(0, entrant.seed - 1) * 2 : 0;

  return {
    leagueLabel,
    strength: leagueStrengthBaseline[leagueLabel] - seedPenalty,
    style: leagueStyleBaseline[leagueLabel],
  };
}

export function getWorldsGroupLabel(groupId: WorldsGroupId) {
  return groupIdLetters[groupId];
}

export function getWorldsGroupTitle(groupId: WorldsGroupId) {
  return worldsGroupLabels[groupId];
}
