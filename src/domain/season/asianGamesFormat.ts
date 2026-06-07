import type {
  AsianGamesCountryCode,
  AsianGamesPlayMode,
  AsianGamesRosterMember,
  AsianGamesState,
  MatchRecord,
  MatchSchedule,
  Player,
  Role,
  SeasonState,
  StandingEntry,
  StrategyId,
  Team,
} from "../../types/game";
import { getCompetitionStartDate, toDateKey } from "../season-calendar/seasonCalendarDates";
import { addDaysToDateKey, formatSeasonDateLabel } from "./seasonScheduleDates";

export type AsianGamesCountryProfile = {
  code: AsianGamesCountryCode;
  teamId: string;
  name: string;
  leagueLabel: string;
  strength: number;
  style: StrategyId;
};

export const asianGamesKoreaTeamId = "asian-games-kor";

export const asianGamesStageNames = {
  quarterfinals: "Quarterfinals",
  semifinals: "Semifinals",
  bronzeMedal: "Bronze Medal Match",
  final: "Final",
} as const;

export const asianGamesMatchIds = {
  quarterfinalA: "asian-games-qf-a",
  quarterfinalB: "asian-games-qf-b",
  quarterfinalC: "asian-games-qf-c",
  quarterfinalD: "asian-games-qf-d",
  semifinalA: "asian-games-sf-a",
  semifinalB: "asian-games-sf-b",
  bronzeMedal: "asian-games-bronze",
  final: "asian-games-final",
} as const;

export const asianGamesCountryProfiles: AsianGamesCountryProfile[] = [
  {
    code: "KOR",
    teamId: asianGamesKoreaTeamId,
    name: "대한민국",
    leagueLabel: "Korea",
    strength: 88,
    style: "balanced",
  },
  {
    code: "CHN",
    teamId: "asian-games-chn",
    name: "중국",
    leagueLabel: "China",
    strength: 86,
    style: "aggressive",
  },
  {
    code: "TPE",
    teamId: "asian-games-tpe",
    name: "대만",
    leagueLabel: "Chinese Taipei",
    strength: 79,
    style: "macro",
  },
  {
    code: "JPN",
    teamId: "asian-games-jpn",
    name: "일본",
    leagueLabel: "Japan",
    strength: 70,
    style: "balanced",
  },
  {
    code: "HKG",
    teamId: "asian-games-hkg",
    name: "홍콩",
    leagueLabel: "Hong Kong",
    strength: 67,
    style: "vision",
  },
  {
    code: "VIE",
    teamId: "asian-games-vie",
    name: "베트남",
    leagueLabel: "Vietnam",
    strength: 76,
    style: "tempo",
  },
  {
    code: "IND",
    teamId: "asian-games-ind",
    name: "인도",
    leagueLabel: "India",
    strength: 60,
    style: "scaling",
  },
  {
    code: "MAC",
    teamId: "asian-games-mac",
    name: "마카오",
    leagueLabel: "Macau",
    strength: 58,
    style: "balanced",
  },
];

const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];

const roleSelectionLabel: Record<Role, string> = {
  top: "TOP 최고 폼",
  jungle: "JGL 최고 폼",
  mid: "MID 최고 폼",
  bot: "BOT 최고 폼",
  support: "SUP 최고 폼",
};

function comparePlayersForSelection(left: Player, right: Player) {
  const formDiff = right.status.form - left.status.form;

  if (formDiff !== 0) {
    return formDiff;
  }

  const overallDiff = right.overall - left.overall;

  if (overallDiff !== 0) {
    return overallDiff;
  }

  const potentialDiff = right.potential - left.potential;

  if (potentialDiff !== 0) {
    return potentialDiff;
  }

  return left.id.localeCompare(right.id);
}

function toRosterMember({
  isStarter,
  player,
  selectionReason,
}: {
  isStarter: boolean;
  player: Player;
  selectionReason: AsianGamesRosterMember["selectionReason"];
}): AsianGamesRosterMember {
  return {
    playerId: player.id,
    playerName: player.name,
    role: player.role,
    isStarter,
    selectionReason,
    formAtSelection: player.status.form,
    overallAtSelection: player.overall,
  };
}

function createStandingEntry(
  profile: AsianGamesCountryProfile,
  index: number,
): StandingEntry {
  return {
    teamId: profile.teamId,
    teamName: profile.name,
    rank: index + 1,
    initialSeed: index + 1,
    wins: 0,
    losses: 0,
    matchWins: 0,
    matchLosses: 0,
    setWins: 0,
    setLosses: 0,
    winRate: 0,
    isUserTeam: profile.teamId === asianGamesKoreaTeamId,
  };
}

function getCountryByCode(code: AsianGamesCountryCode) {
  const profile = asianGamesCountryProfiles.find((country) => country.code === code);

  if (!profile) {
    throw new Error(`Asian Games country profile is missing: ${code}`);
  }

  return profile;
}

function getTeamName(teamId: string) {
  return getAsianGamesTeamProfile(teamId)?.name ?? teamId;
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
  blue: AsianGamesCountryProfile;
  format: MatchSchedule["format"];
  id: string;
  red: AsianGamesCountryProfile;
  scheduledDate: string;
  stageName: string;
  week: number;
}): MatchSchedule {
  return {
    id,
    competitionId: "asian-games",
    week,
    scheduledDate,
    stageName,
    blueTeamId: blue.teamId,
    blueTeamName: blue.name,
    redTeamId: red.teamId,
    redTeamName: red.name,
    format,
    status: "scheduled",
    fearlessEnabled: false,
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

function getRecordByScheduleId(records: MatchRecord[], scheduleId: string) {
  return records.find((record) => record.scheduleId === scheduleId);
}

function getCompletedRecord(seasonState: SeasonState, scheduleId: string) {
  return getRecordByScheduleId(seasonState.matchRecords, scheduleId);
}

function getWinnerProfile(record: MatchRecord) {
  const profile = getAsianGamesTeamProfile(record.winnerTeamId);

  if (!profile) {
    throw new Error(`Asian Games winner profile is missing: ${record.winnerTeamId}`);
  }

  return profile;
}

function getLoserProfile(record: MatchRecord, schedule: MatchSchedule[]) {
  const loserTeamId =
    record.winnerSide === "blue"
      ? getRecordMatchSide(record, "red", schedule)
      : getRecordMatchSide(record, "blue", schedule);
  const profile = getAsianGamesTeamProfile(loserTeamId);

  if (!profile) {
    throw new Error(`Asian Games loser profile is missing: ${loserTeamId}`);
  }

  return profile;
}

function getRecordMatchSide(
  record: MatchRecord,
  side: "blue" | "red",
  schedule: MatchSchedule[],
) {
  const match = schedule.find((candidate) => candidate.id === record.scheduleId);

  if (!match) {
    throw new Error(`Asian Games schedule lookup is missing: ${record.scheduleId}`);
  }

  return side === "blue" ? match.blueTeamId : match.redTeamId;
}

export function getAsianGamesTeamProfile(teamId: string) {
  return asianGamesCountryProfiles.find((country) => country.teamId === teamId);
}

export function getAsianGamesRoleSelectionLabel(member: AsianGamesRosterMember) {
  return member.selectionReason === "sixth-best-form"
    ? "6번째 최고 폼"
    : roleSelectionLabel[member.role];
}

export function selectAsianGamesRoster(players: Player[]): AsianGamesRosterMember[] {
  const candidates = players
    .filter((player) => player.region === "lck" && player.league === "LCK")
    .sort(comparePlayersForSelection);
  const selectedPlayerIds = new Set<string>();
  const starters = roleOrder
    .map((role) => {
      const player = candidates
        .filter((candidate) => candidate.role === role)
        .find((candidate) => !selectedPlayerIds.has(candidate.id));

      if (!player) {
        return null;
      }

      selectedPlayerIds.add(player.id);
      return toRosterMember({
        isStarter: true,
        player,
        selectionReason: "role-best-form",
      });
    })
    .filter((member): member is AsianGamesRosterMember => Boolean(member));
  const sixthPlayer = candidates.find(
    (candidate) => !selectedPlayerIds.has(candidate.id),
  );

  if (!sixthPlayer) {
    return starters;
  }

  return [
    ...starters,
    toRosterMember({
      isStarter: false,
      player: sixthPlayer,
      selectionReason: "sixth-best-form",
    }),
  ];
}

export function createAsianGamesKoreaTeam(
  asianGamesState: AsianGamesState | undefined,
): Team {
  const starterRoster = asianGamesState?.roster
    .filter((member) => member.isStarter)
    .reduce<Partial<Record<Role, string>>>((roster, member) => {
      return {
        ...roster,
        [member.role]: member.playerId,
      };
    }, {});
  const mainRosterPlayerIds =
    asianGamesState?.roster
      .filter((member) => member.isStarter)
      .map((member) => member.playerId) ?? [];
  const academyRosterPlayerIds =
    asianGamesState?.roster
      .filter((member) => !member.isStarter)
      .map((member) => member.playerId) ?? [];

  return {
    name: "대한민국",
    region: "lck",
    budget: 0,
    rosterSettings: {
      minPlayers: 10,
      maxPlayers: 15,
      freeMovementBetweenMainAndAcademy: true,
    },
    roster: starterRoster ?? {},
    mainRosterPlayerIds,
    academyRosterPlayerIds,
    contracts: [],
    wins: 0,
    losses: 0,
    elo: 1600,
  };
}

export function createAsianGamesStandings() {
  return asianGamesCountryProfiles.map(createStandingEntry);
}

export function createAsianGamesOpeningSchedule(startDateKey: string) {
  return [
    createMatch({
      id: asianGamesMatchIds.quarterfinalA,
      stageName: asianGamesStageNames.quarterfinals,
      blue: getCountryByCode("KOR"),
      red: getCountryByCode("MAC"),
      format: "bo3",
      week: 1,
      scheduledDate: startDateKey,
    }),
    createMatch({
      id: asianGamesMatchIds.quarterfinalB,
      stageName: asianGamesStageNames.quarterfinals,
      blue: getCountryByCode("JPN"),
      red: getCountryByCode("HKG"),
      format: "bo3",
      week: 1,
      scheduledDate: startDateKey,
    }),
    createMatch({
      id: asianGamesMatchIds.quarterfinalC,
      stageName: asianGamesStageNames.quarterfinals,
      blue: getCountryByCode("CHN"),
      red: getCountryByCode("IND"),
      format: "bo3",
      week: 1,
      scheduledDate: addDaysToDateKey(startDateKey, 1),
    }),
    createMatch({
      id: asianGamesMatchIds.quarterfinalD,
      stageName: asianGamesStageNames.quarterfinals,
      blue: getCountryByCode("TPE"),
      red: getCountryByCode("VIE"),
      format: "bo3",
      week: 1,
      scheduledDate: addDaysToDateKey(startDateKey, 1),
    }),
  ];
}

export function createAsianGamesSemifinalSchedule({
  startDateKey,
  semifinalARecord,
  semifinalBRecord,
}: {
  startDateKey: string;
  semifinalARecord: MatchRecord;
  semifinalBRecord: MatchRecord;
}) {
  return [
    createMatch({
      id: asianGamesMatchIds.semifinalA,
      stageName: asianGamesStageNames.semifinals,
      blue: getWinnerProfile(semifinalARecord),
      red: getWinnerProfile(semifinalBRecord),
      format: "bo3",
      week: 2,
      scheduledDate: addDaysToDateKey(startDateKey, 4),
    }),
  ];
}

export function createAsianGamesSemifinalsFromQuarterfinals({
  qfA,
  qfB,
  qfC,
  qfD,
  startDateKey,
}: {
  qfA: MatchRecord;
  qfB: MatchRecord;
  qfC: MatchRecord;
  qfD: MatchRecord;
  startDateKey: string;
}) {
  return [
    createMatch({
      id: asianGamesMatchIds.semifinalA,
      stageName: asianGamesStageNames.semifinals,
      blue: getWinnerProfile(qfA),
      red: getWinnerProfile(qfB),
      format: "bo3",
      week: 2,
      scheduledDate: addDaysToDateKey(startDateKey, 4),
    }),
    createMatch({
      id: asianGamesMatchIds.semifinalB,
      stageName: asianGamesStageNames.semifinals,
      blue: getWinnerProfile(qfC),
      red: getWinnerProfile(qfD),
      format: "bo3",
      week: 2,
      scheduledDate: addDaysToDateKey(startDateKey, 5),
    }),
  ];
}

export function createAsianGamesMedalSchedule({
  schedule,
  semifinalA,
  semifinalB,
  startDateKey,
}: {
  schedule: MatchSchedule[];
  semifinalA: MatchRecord;
  semifinalB: MatchRecord;
  startDateKey: string;
}) {
  return [
    createMatch({
      id: asianGamesMatchIds.bronzeMedal,
      stageName: asianGamesStageNames.bronzeMedal,
      blue: getLoserProfile(semifinalA, schedule),
      red: getLoserProfile(semifinalB, schedule),
      format: "bo3",
      week: 3,
      scheduledDate: addDaysToDateKey(startDateKey, 8),
    }),
    createMatch({
      id: asianGamesMatchIds.final,
      stageName: asianGamesStageNames.final,
      blue: getWinnerProfile(semifinalA),
      red: getWinnerProfile(semifinalB),
      format: "bo5",
      week: 3,
      scheduledDate: addDaysToDateKey(startDateKey, 9),
    }),
  ];
}

function getAsianGamesStartDateKey(year: number) {
  return toDateKey(getCompetitionStartDate(year, "asian-games", "asian-games"));
}

function getSetupDates(seasonState: SeasonState) {
  const fixedTournamentStartDateKey = getAsianGamesStartDateKey(
    seasonState.yearLabel,
  );
  const fixedRosterSelectedDateKey = addDaysToDateKey(
    fixedTournamentStartDateKey,
    -7,
  );
  const isLateTransition =
    seasonState.currentDateKey > fixedRosterSelectedDateKey;
  const rosterSelectedDateKey = isLateTransition
    ? seasonState.currentDateKey
    : fixedRosterSelectedDateKey;
  const playChoiceDateKey = isLateTransition
    ? addDaysToDateKey(seasonState.currentDateKey, 1)
    : addDaysToDateKey(fixedTournamentStartDateKey, -6);
  const firstPlayableDateAfterPrompt = addDaysToDateKey(playChoiceDateKey, 1);
  const tournamentStartDateKey =
    fixedTournamentStartDateKey >= firstPlayableDateAfterPrompt
      ? fixedTournamentStartDateKey
      : firstPlayableDateAfterPrompt;

  return {
    rosterSelectedDateKey,
    playChoiceDateKey,
    tournamentStartDateKey,
  };
}

export function createAsianGamesSetup({
  players,
  seasonState,
}: {
  players: Player[];
  seasonState: SeasonState;
}) {
  const setupDates = getSetupDates(seasonState);
  const asianGamesState: AsianGamesState = {
    status: "roster-selected",
    playMode: "undecided",
    rosterSelectedDateKey: setupDates.rosterSelectedDateKey,
    playChoiceDateKey: setupDates.playChoiceDateKey,
    tournamentStartDateKey: setupDates.tournamentStartDateKey,
    roster: selectAsianGamesRoster(players),
  };

  return {
    asianGamesState,
    standings: createAsianGamesStandings(),
    schedule: createAsianGamesOpeningSchedule(setupDates.tournamentStartDateKey),
  };
}

export function setAsianGamesPlayMode(
  seasonState: SeasonState,
  playMode: Exclude<AsianGamesPlayMode, "undecided">,
): SeasonState {
  if (!seasonState.asianGames) {
    return seasonState;
  }

  return {
    ...seasonState,
    asianGames: {
      ...seasonState.asianGames,
      playMode,
      status: "active",
      playChoiceDateKey:
        seasonState.asianGames.playChoiceDateKey ?? seasonState.currentDateKey,
    },
  };
}

export function markAsianGamesDecisionPendingIfNeeded(
  seasonState: SeasonState,
): SeasonState {
  const asianGamesState = seasonState.asianGames;

  if (
    seasonState.currentCompetitionId !== "asian-games" ||
    !asianGamesState ||
    asianGamesState.playMode !== "undecided" ||
    !asianGamesState.playChoiceDateKey ||
    seasonState.currentDateKey < asianGamesState.playChoiceDateKey
  ) {
    return seasonState;
  }

  return {
    ...seasonState,
    progressStatus: "idle",
    nextMatchIds: [],
    asianGames: {
      ...asianGamesState,
      status: "decision-pending",
    },
  };
}

export function isAsianGamesDecisionPending(seasonState: SeasonState) {
  return (
    seasonState.currentCompetitionId === "asian-games" &&
    seasonState.asianGames?.status === "decision-pending" &&
    seasonState.asianGames.playMode === "undecided"
  );
}

export function shouldPlayAsianGamesMatchManually(
  seasonState: SeasonState,
  match: MatchSchedule,
) {
  return (
    match.competitionId === "asian-games" &&
    seasonState.asianGames?.playMode === "manual" &&
    (match.blueTeamId === asianGamesKoreaTeamId ||
      match.redTeamId === asianGamesKoreaTeamId)
  );
}

export function applyAsianGamesGoldRewardToPlayers({
  players,
  seasonState,
}: {
  players: Player[];
  seasonState: SeasonState;
}) {
  const asianGamesState = seasonState.asianGames;

  if (
    seasonState.currentCompetitionId !== "asian-games" ||
    asianGamesState?.status !== "completed" ||
    asianGamesState.medals?.goldTeamId !== asianGamesKoreaTeamId
  ) {
    return players;
  }

  const exemptPlayerIds = new Set(
    asianGamesState.roster.map((member) => member.playerId),
  );

  return players.map((player) =>
    exemptPlayerIds.has(player.id)
      ? {
          ...player,
          militaryServiceStatus: "completed" as const,
        }
      : player,
  );
}

export function getNextAsianGamesSchedule(seasonState: SeasonState) {
  const startDateKey =
    seasonState.asianGames?.tournamentStartDateKey ??
    getAsianGamesStartDateKey(seasonState.yearLabel);
  const qfA = getCompletedRecord(seasonState, asianGamesMatchIds.quarterfinalA);
  const qfB = getCompletedRecord(seasonState, asianGamesMatchIds.quarterfinalB);
  const qfC = getCompletedRecord(seasonState, asianGamesMatchIds.quarterfinalC);
  const qfD = getCompletedRecord(seasonState, asianGamesMatchIds.quarterfinalD);
  const hasSemifinals = seasonState.scheduledMatches.some(
    (match) =>
      match.id === asianGamesMatchIds.semifinalA ||
      match.id === asianGamesMatchIds.semifinalB,
  );

  if (qfA && qfB && qfC && qfD && !hasSemifinals) {
    return createAsianGamesSemifinalsFromQuarterfinals({
      qfA,
      qfB,
      qfC,
      qfD,
      startDateKey,
    });
  }

  const semifinalA = getCompletedRecord(seasonState, asianGamesMatchIds.semifinalA);
  const semifinalB = getCompletedRecord(seasonState, asianGamesMatchIds.semifinalB);
  const hasMedalSchedule = seasonState.scheduledMatches.some(
    (match) =>
      match.id === asianGamesMatchIds.bronzeMedal ||
      match.id === asianGamesMatchIds.final,
  );

  if (semifinalA && semifinalB && !hasMedalSchedule) {
    return createAsianGamesMedalSchedule({
      schedule: seasonState.scheduledMatches,
      semifinalA,
      semifinalB,
      startDateKey,
    });
  }

  return [];
}

export function advanceAsianGamesAfterCompletedMatches(
  seasonState: SeasonState,
): SeasonState {
  if (seasonState.currentCompetitionId !== "asian-games") {
    return seasonState;
  }

  const competition = seasonState.competitions.find(
    (candidate) => candidate.competitionId === "asian-games",
  );

  if (!competition || competition.completed) {
    return seasonState;
  }

  const finalRecord = getCompletedRecord(seasonState, asianGamesMatchIds.final);
  const bronzeRecord = getCompletedRecord(
    seasonState,
    asianGamesMatchIds.bronzeMedal,
  );

  if (finalRecord && bronzeRecord) {
    const finalLoserId =
      finalRecord.winnerSide === "blue"
        ? getRecordMatchSide(finalRecord, "red", seasonState.scheduledMatches)
        : getRecordMatchSide(finalRecord, "blue", seasonState.scheduledMatches);
    const medals = {
      goldTeamId: finalRecord.winnerTeamId,
      goldTeamName: finalRecord.winnerTeamName,
      silverTeamId: finalLoserId,
      silverTeamName: getTeamName(finalLoserId),
      bronzeTeamId: bronzeRecord.winnerTeamId,
      bronzeTeamName: bronzeRecord.winnerTeamName,
    };

    return {
      ...seasonState,
      nextMatchIds: [],
      asianGames: {
        ...seasonState.asianGames,
        status: "completed",
        playMode: seasonState.asianGames?.playMode ?? "auto",
        roster: seasonState.asianGames?.roster ?? [],
        medals,
      },
      competitions: seasonState.competitions.map((candidate) => {
        if (candidate.competitionId === "asian-games") {
          return {
            ...candidate,
            status: "completed",
            currentStageName: "Completed",
            qualifiedTeamIds: [
              medals.goldTeamId,
              medals.silverTeamId,
              medals.bronzeTeamId,
            ],
            qualifiedTeamNames: [
              medals.goldTeamName,
              medals.silverTeamName,
              medals.bronzeTeamName,
            ],
            winnerTeamId: medals.goldTeamId,
            winnerTeamName: medals.goldTeamName,
            completed: true,
          };
        }

        if (candidate.competitionId === "worlds") {
          return {
            ...candidate,
            status: candidate.status === "locked" ? "available" : candidate.status,
          };
        }

        return candidate;
      }),
    };
  }

  const nextSchedule = getNextAsianGamesSchedule(seasonState);

  if (nextSchedule.length === 0) {
    return seasonState;
  }

  return {
    ...seasonState,
    nextMatchIds: [],
    scheduledMatches: appendUniqueSchedules(
      seasonState.scheduledMatches,
      nextSchedule,
    ),
    competitions: seasonState.competitions.map((candidate) =>
      candidate.competitionId === "asian-games"
        ? {
            ...candidate,
            currentStageName: nextSchedule[0].stageName,
            currentWeek: nextSchedule[0].week,
            schedule: appendUniqueSchedules(candidate.schedule, nextSchedule),
          }
        : candidate,
    ),
  };
}

export function getAsianGamesModeLabel(playMode: AsianGamesPlayMode) {
  if (playMode === "manual") {
    return "직접 플레이";
  }

  if (playMode === "auto") {
    return "자동 진행";
  }

  return "선택 대기";
}

export function getAsianGamesTimelineLabel(asianGamesState: AsianGamesState) {
  return [
    asianGamesState.rosterSelectedDateKey
      ? `대표 선발 ${formatSeasonDateLabel(asianGamesState.rosterSelectedDateKey)}`
      : "대표 선발 대기",
    asianGamesState.playChoiceDateKey
      ? `진행 방식 선택 ${formatSeasonDateLabel(asianGamesState.playChoiceDateKey)}`
      : "진행 방식 선택 대기",
    asianGamesState.tournamentStartDateKey
      ? `개막 ${formatSeasonDateLabel(asianGamesState.tournamentStartDateKey)}`
      : "개막 대기",
  ];
}
