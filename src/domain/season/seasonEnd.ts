import {
  createContractsForRoster,
  type ContractTypeSelections,
} from "../roster";
import type {
  CareerSave,
  CompetitionId,
  CompetitionState,
  Player,
  SeasonCompetitionSummary,
  SeasonState,
  SeasonSummary,
} from "../../types/game";
import {
  completeStoveLeague,
  createInitialSeasonState,
} from "./createInitialSeasonState";

const endOfSeasonCompetitionIds: CompetitionId[] = [
  "lck-cup",
  "first-stand",
  "lck-rounds-1-2",
  "msi",
  "lck-rounds-3-4",
  "lck-rounds-3-5",
  "asian-games",
  "worlds",
];

function findCompetition(
  seasonState: SeasonState,
  competitionId: CompetitionId,
) {
  return seasonState.competitions.find(
    (competition) => competition.competitionId === competitionId,
  );
}

function getUserTeamId(competition: CompetitionState | undefined) {
  return competition?.standings.find((entry) => entry.isUserTeam)?.teamId;
}

function countUserRecords(competition: CompetitionState, seasonState: SeasonState) {
  const competitionScheduleIds = new Set(
    competition.schedule.map((match) => match.id),
  );
  const records = seasonState.matchRecords.filter((record) =>
    competitionScheduleIds.has(record.scheduleId),
  );
  const wins = records.filter((record) => record.userResult === "win").length;
  const losses = records.filter((record) => record.userResult === "loss").length;

  return { wins, losses };
}

function getUserResultLabel(
  competition: CompetitionState,
  seasonState: SeasonState,
) {
  const userTeamId = getUserTeamId(competition);
  const userEntry = competition.standings.find((entry) => entry.isUserTeam);

  if (userTeamId && competition.winnerTeamId === userTeamId) {
    return "우승";
  }

  if (userEntry?.rank) {
    return `${userEntry.rank}위`;
  }

  if (userTeamId && competition.qualifiedTeamIds.includes(userTeamId)) {
    return "진출";
  }

  const userRecord = countUserRecords(competition, seasonState);

  if (userRecord.wins + userRecord.losses > 0) {
    return `${userRecord.wins}승 ${userRecord.losses}패`;
  }

  return undefined;
}

function getCompetitionResultLabel(competition: CompetitionState) {
  if (competition.completed) {
    return competition.winnerTeamName
      ? `${competition.winnerTeamName} 우승`
      : "완료";
  }

  if (competition.status === "active") {
    return "진행 중";
  }

  if (competition.status === "available") {
    return "대기";
  }

  return "미진행";
}

export function createSeasonSummaryFromCareer(career: CareerSave): SeasonSummary {
  const seasonState = career.seasonState;
  const competitionResults: SeasonCompetitionSummary[] =
    endOfSeasonCompetitionIds
      .map((competitionId) => findCompetition(seasonState, competitionId))
      .filter(
        (competition): competition is CompetitionState =>
          competition !== undefined && competition.status !== "locked",
      )
      .map((competition) => ({
        competitionId: competition.competitionId,
        competitionName: competition.name,
        resultLabel: getCompetitionResultLabel(competition),
        winnerTeamName: competition.winnerTeamName,
        userResultLabel: getUserResultLabel(competition, seasonState),
      }));
  const lckCompetition = ([
    "lck-rounds-3-5",
    "lck-rounds-3-4",
    "lck-rounds-1-2",
    "lck-cup",
  ] as CompetitionId[])
    .map((competitionId) => findCompetition(seasonState, competitionId))
    .find(
      (competition): competition is CompetitionState =>
        competition !== undefined && competition.status !== "locked",
    );
  const worlds = findCompetition(seasonState, "worlds");
  const msi = findCompetition(seasonState, "msi");
  const asianGames = findCompetition(seasonState, "asian-games");

  return {
    seasonNumber: career.currentSeason,
    yearLabel: seasonState.yearLabel,
    calendarType: seasonState.calendarType,
    lckResult: lckCompetition
      ? getUserResultLabel(lckCompetition, seasonState) ??
        getCompetitionResultLabel(lckCompetition)
      : "미진행",
    internationalResult: worlds?.winnerTeamName
      ? `Worlds Champion: ${worlds.winnerTeamName}`
      : msi
        ? getCompetitionResultLabel(msi)
        : undefined,
    asianGamesResult: asianGames
      ? getCompetitionResultLabel(asianGames)
      : undefined,
    finalElo: career.userTeam.elo,
    completedDateKey: seasonState.currentDateKey,
    finalRecord: {
      wins: career.userTeam.wins,
      losses: career.userTeam.losses,
    },
    competitionResults,
    worldsChampionTeamName: worlds?.winnerTeamName,
    nextSeasonNumber:
      career.currentSeason < career.maxSeason ? career.currentSeason + 1 : undefined,
  };
}

function replaceSeasonSummary(
  history: SeasonSummary[],
  summary: SeasonSummary,
) {
  return [
    ...history.filter((entry) => entry.seasonNumber !== summary.seasonNumber),
    summary,
  ].sort((left, right) => left.seasonNumber - right.seasonNumber);
}

function decrementContractYears(career: CareerSave) {
  const contracts = career.userTeam.contracts.map((contract) => ({
    ...contract,
    remainingYears: Math.max(0, contract.remainingYears - 1),
  }));
  const expiredContractPlayerIds = contracts
    .filter((contract) => contract.remainingYears === 0)
    .map((contract) => contract.playerId);

  return { contracts, expiredContractPlayerIds };
}

function isWorldsCompleted(seasonState: SeasonState) {
  const worlds = findCompetition(seasonState, "worlds");

  return Boolean(worlds?.completed && seasonState.worlds?.status === "completed");
}

export function completeSeasonAfterWorlds(career: CareerSave): CareerSave {
  if (
    career.seasonState.phase === "offseason" ||
    career.seasonState.phase === "completed" ||
    career.seasonState.offseason?.completedSeasonNumber === career.currentSeason ||
    !isWorldsCompleted(career.seasonState)
  ) {
    return career;
  }

  const summary = createSeasonSummaryFromCareer(career);
  const { contracts, expiredContractPlayerIds } = decrementContractYears(career);
  const isCareerComplete = career.currentSeason >= career.maxSeason;
  const offseasonStatus = isCareerComplete ? "career-completed" : "summary";
  const completedDateLabel = isCareerComplete
    ? `${career.seasonState.yearLabel} Career Complete`
    : `${career.seasonState.yearLabel} Offseason`;
  const summaryWithContracts: SeasonSummary = {
    ...summary,
    expiredContractPlayerIds,
  };

  return {
    ...career,
    seasonHistory: replaceSeasonSummary(career.seasonHistory, summaryWithContracts),
    userTeam: {
      ...career.userTeam,
      contracts,
    },
    seasonState: {
      ...career.seasonState,
      phase: isCareerComplete ? "completed" : "offseason",
      currentDateLabel: completedDateLabel,
      progressStatus: "idle",
      nextMatchIds: [],
      lastMatchRecordIds: [],
      offseason: {
        status: offseasonStatus,
        completedSeasonNumber: career.currentSeason,
        nextSeasonNumber: isCareerComplete ? undefined : career.currentSeason + 1,
        startedDateKey: career.seasonState.currentDateKey,
        expiredContractPlayerIds,
        renewedPlayerIds: [],
        summarySeasonNumber: career.currentSeason,
        bridgeNote:
          "Season summary is ready. Enter the stove league to resolve contracts and free agency.",
      },
    },
  };
}

export function renewExpiredContractsForOffseason({
  career,
  contractTypes,
}: {
  career: CareerSave;
  contractTypes: ContractTypeSelections;
}): CareerSave {
  const offseason = career.seasonState.offseason;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status === "ready-for-next-season" ||
    offseason.expiredContractPlayerIds.some((playerId) => !contractTypes[playerId])
  ) {
    return career;
  }

  const renewedContracts = createContractsForRoster({
    playerIds: offseason.expiredContractPlayerIds,
    players: career.lckPlayers,
    contractTypes,
  });
  const renewedByPlayerId = new Map(
    renewedContracts.map((contract) => [contract.playerId, contract]),
  );

  return {
    ...career,
    userTeam: {
      ...career.userTeam,
      contracts: career.userTeam.contracts.map(
        (contract) => renewedByPlayerId.get(contract.playerId) ?? contract,
      ),
    },
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        status: "ready-for-next-season",
        renewedPlayerIds: offseason.expiredContractPlayerIds,
      },
    },
  };
}

function clampStatusValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function rollPlayerIntoNextSeason(player: Player): Player {
  return {
    ...player,
    age: player.age + 1,
    status: {
      ...player.status,
      form: clampStatusValue((player.status.form + 50) / 2),
      fatigue: 0,
      morale: "neutral",
      condition: 100,
      injuryRisk: clampStatusValue(Math.min(10, player.status.injuryRisk / 2)),
    },
  };
}

function hasUnresolvedExpiredContracts(career: CareerSave) {
  const expiredIds = new Set(
    career.seasonState.offseason?.expiredContractPlayerIds ?? [],
  );
  const resolvedIds = new Set([
    ...(career.seasonState.offseason?.renewedPlayerIds ?? []),
    ...(career.seasonState.offseason?.releasedPlayerIds ?? []),
    ...(career.seasonState.offseason?.resolvedExpiredPlayerIds ?? []),
  ]);

  return [...expiredIds].some((playerId) => !resolvedIds.has(playerId));
}

export function startNextSeasonFromOffseason(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "ready-for-next-season" ||
    hasUnresolvedExpiredContracts(career) ||
    career.currentSeason >= career.maxSeason
  ) {
    return career;
  }

  const nextSeasonNumber = career.currentSeason + 1;
  const nextSeasonState = completeStoveLeague(
    createInitialSeasonState({
      seasonNumber: nextSeasonNumber,
      userTeamName: career.userTeam.name,
    }),
  );

  return {
    ...career,
    currentSeason: nextSeasonNumber,
    lckPlayers: career.lckPlayers.map(rollPlayerIntoNextSeason),
    weeklyPlan: {
      strategy: "balanced",
      trainingIntensity: "normal",
    },
    userTeam: {
      ...career.userTeam,
      wins: 0,
      losses: 0,
    },
    seasonState: nextSeasonState,
  };
}
