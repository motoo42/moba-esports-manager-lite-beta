import {
  createOpponentDraftPlayers,
  getRosterPlayersByRole,
  mapOpponentStyleToStrategy,
  runSimpleDraft,
} from "../draft";
import { championPool } from "../champions";
import { simulateMatch } from "../match-simulation";
import {
  createLckOpponentFromSchedule,
  getLckTeamStrength,
} from "../opponents";
import { applyWeeklyPlayerStatusChanges } from "../player-status";
import { createSeededRandom } from "../rng/createSeededRandom";
import {
  advanceAsianGamesAfterCompletedMatches,
  advanceWorldsAfterCompletedMatches,
  advanceToNextDay,
  advanceLckCupAfterCompletedWeek,
  activateWorlds,
  advanceFirstStandAfterCompletedMatches,
  advanceMsiAfterCompletedMatches,
  applyAsianGamesGoldRewardToPlayers,
  asianGamesKoreaTeamId,
  completeSeasonAfterWorlds,
  completeLckRounds12IfFinished,
  completeLckRounds34IfFinished,
  completeLckRounds35IfFinished,
  continueAfterMatchReview,
  createAsianGamesKoreaTeam,
  getCurrentDateScheduledMatches,
  getFirstStandTeamProfile,
  getAsianGamesTeamProfile,
  getMsiTeamProfile,
  getWorldsTeamProfile,
  progressOffseasonDay,
  getSeasonProfileForState,
  isAsianGamesDecisionPending,
  recordCompletedMatches,
  transitionFromFirstStandToLckRounds12,
  transitionFromLckCupToFirstStand,
  transitionFromLckRounds34ToAsianGames,
  transitionFromLckRounds12ToMsi,
  transitionFromMsiToLckRounds34,
  transitionFromMsiToLckRounds35,
} from "../season";
import { calculateTeamPower } from "../match-simulation";
import { simulateSeries, summarizeSeriesGames } from "../series";
import type {
  CareerSave,
  CompetitionId,
  MatchRecord,
  MatchResult,
  MatchSchedule,
  MatchSeriesGameSummary,
  MatchSeriesReplay,
  SeasonState,
  Team,
} from "../../types/game";

export type CareerProgressResult = {
  career: CareerSave;
  lastMatch: MatchResult | null;
  liveMatchSeries?: MatchSeriesReplay | null;
  trace?: CareerProgressTrace;
};

export type CareerProgressAction =
  | "advance-idle-day"
  | "blocked"
  | "continue-match-review"
  | "play-current-date"
  | "progress-offseason-day"
  | "simulate-practice-match"
  | "transition-completed-competition";

export type CareerProgressBlockReason =
  | "asian-games-decision-pending"
  | "career-completed"
  | "no-transition-available"
  | "offseason-inactive"
  | "stove-league";

export type CareerProgressTraceSnapshot = {
  seasonNumber: number;
  yearLabel: number;
  phase: SeasonState["phase"];
  currentCompetitionId: CompetitionId | null;
  currentDateKey: string;
  progressStatus: SeasonState["progressStatus"];
  currentStageName: string | null;
};

export type CareerProgressTrace = {
  before: CareerProgressTraceSnapshot;
  after: CareerProgressTraceSnapshot;
  action: CareerProgressAction;
  blockReason?: CareerProgressBlockReason;
  changed: boolean;
};

function getUserTeamId(seasonState: SeasonState) {
  if (seasonState.currentCompetitionId === "asian-games") {
    return seasonState.asianGames?.playMode === "manual"
      ? asianGamesKoreaTeamId
      : undefined;
  }

  const activeCompetition = seasonState.competitions.find(
    (competition) => competition.competitionId === seasonState.currentCompetitionId,
  );

  return (
    activeCompetition?.standings.find((entry) => entry.isUserTeam)?.teamId ??
    undefined
  );
}

function toWinProbability(blueStrength: number, redStrength: number) {
  const blueElo = 1200 + blueStrength * 7;
  const redElo = 1200 + redStrength * 7;

  return 1 / (1 + 10 ** ((redElo - blueElo) / 400));
}

function getWinsNeeded(format: MatchSchedule["format"]) {
  if (format === "bo5") {
    return 3;
  }

  if (format === "bo3") {
    return 2;
  }

  return 1;
}

function getAsianGamesKoreaPower(career: CareerSave) {
  const team = createAsianGamesKoreaTeam(career.seasonState.asianGames);

  return calculateTeamPower(
    team,
    career.lckPlayers,
    career.weeklyPlan.strategy,
    career.weeklyPlan.trainingIntensity,
  );
}

function getTeamStrengthForSchedule(
  match: MatchSchedule,
  teamId: string,
  career: CareerSave,
) {
  if (match.competitionId === "asian-games") {
    if (teamId === asianGamesKoreaTeamId) {
      return getAsianGamesKoreaPower(career);
    }

    return getAsianGamesTeamProfile(teamId)?.strength ?? 70;
  }

  if (match.competitionId === "first-stand") {
    return (
      getFirstStandTeamProfile(teamId)?.strength ??
      getLckTeamStrength(teamId, career.seasonState.teamBalanceAdjustments)
    );
  }

  if (match.competitionId === "msi") {
    return (
      getMsiTeamProfile(teamId)?.strength ??
      getLckTeamStrength(teamId, career.seasonState.teamBalanceAdjustments)
    );
  }

  if (match.competitionId === "worlds") {
    return getWorldsTeamProfile(teamId, career.seasonState).strength;
  }

  return getLckTeamStrength(teamId, career.seasonState.teamBalanceAdjustments);
}

function createOpponentFromSchedule(
  match: MatchSchedule,
  userTeamId: string,
  seasonState: SeasonState,
) {
  if (match.competitionId === "asian-games") {
    const opponentTeamId =
      match.blueTeamId === userTeamId ? match.redTeamId : match.blueTeamId;
    const opponentTeamName =
      match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;
    const profile = getAsianGamesTeamProfile(opponentTeamId);

    return {
      id: opponentTeamId,
      name: opponentTeamName,
      region: "international" as const,
      leagueLabel: profile?.leagueLabel ?? "Asian Games",
      appearsIn: ["asian-games" as const],
      strength: profile?.strength ?? 70,
      style: profile?.style ?? "balanced",
    };
  }

  if (match.competitionId === "worlds") {
    const opponentTeamId =
      match.blueTeamId === userTeamId ? match.redTeamId : match.blueTeamId;
    const opponentTeamName =
      match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;
    const profile = getWorldsTeamProfile(opponentTeamId, seasonState);

    return {
      id: opponentTeamId,
      name: opponentTeamName,
      region: "international" as const,
      leagueLabel: profile.leagueLabel,
      appearsIn: ["worlds" as const],
      strength: profile.strength,
      style: profile.style,
    };
  }

  if (match.competitionId !== "first-stand" && match.competitionId !== "msi") {
    return createLckOpponentFromSchedule(
      match,
      userTeamId,
      seasonState.teamBalanceAdjustments,
    );
  }

  const opponentTeamId =
    match.blueTeamId === userTeamId ? match.redTeamId : match.blueTeamId;
  const opponentTeamName =
    match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;
  const internationalProfile =
    match.competitionId === "first-stand"
      ? getFirstStandTeamProfile(opponentTeamId)
      : getMsiTeamProfile(opponentTeamId);

  if (internationalProfile) {
    return {
      id: opponentTeamId,
      name: opponentTeamName,
      region: "international" as const,
      leagueLabel: internationalProfile.leagueLabel,
      appearsIn: [match.competitionId],
      strength: internationalProfile.strength,
      style: internationalProfile.style,
    };
  }

  return createLckOpponentFromSchedule(
    match,
    userTeamId,
    seasonState.teamBalanceAdjustments,
  );
}

function getUserSimulationTeam(career: CareerSave, match: MatchSchedule): Team {
  if (match.competitionId === "asian-games") {
    return createAsianGamesKoreaTeam(career.seasonState.asianGames);
  }

  return career.userTeam;
}

export function createMatchRecordFromSchedule({
  career,
  match,
  matchIndex,
}: {
  career: CareerSave;
  match: MatchSchedule;
  matchIndex: number;
}): {
  record: MatchRecord;
  lastMatchResult: MatchResult;
  seriesGames: MatchSeriesGameSummary[];
} {
  const userTeamId = getUserTeamId(career.seasonState);
  if (!userTeamId) {
    throw new Error("User match requested without an active user team.");
  }

  const userIsBlue = match.blueTeamId === userTeamId;
  const opponent = createOpponentFromSchedule(
    match,
    userTeamId,
    career.seasonState,
  );
  const userTeam = getUserSimulationTeam(career, match);
  const series = simulateSeries({
    team: userTeam,
    players: career.lckPlayers,
    opponent,
    strategy: career.weeklyPlan.strategy,
    trainingIntensity: career.weeklyPlan.trainingIntensity,
    seed: `season-${career.currentSeason}-${match.id}-${career.seasonState.currentTurn}`,
    format: match.format,
    fearlessEnabled: match.fearlessEnabled,
  });
  const winnerSide =
    series.winner === "user"
      ? userIsBlue
        ? "blue"
        : "red"
      : userIsBlue
        ? "red"
        : "blue";
  const score = userIsBlue
    ? {
        blueWins: series.userWins,
        redWins: series.opponentWins,
      }
    : {
        blueWins: series.opponentWins,
        redWins: series.userWins,
      };
  const lastGame = series.games[series.games.length - 1];
  const winProbability =
    series.games.reduce(
      (total, game) => total + game.result.winProbability,
      0,
    ) / series.games.length;

  return {
    lastMatchResult: lastGame.result,
    seriesGames: summarizeSeriesGames(series, userIsBlue),
    record: {
      id: `${match.id}-record-${career.seasonState.currentTurn + 1}-${matchIndex + 1}`,
      scheduleId: match.id,
      competitionId: match.competitionId,
      week: match.week,
      stageName: match.stageName,
      winnerSide,
      winnerTeamId: winnerSide === "blue" ? match.blueTeamId : match.redTeamId,
      winnerTeamName:
        winnerSide === "blue" ? match.blueTeamName : match.redTeamName,
      score,
      userResult: series.winner === "user" ? "win" : "loss",
      winProbability,
      draft: lastGame.result.draft,
      log: [
        `${match.blueTeamName} ${score.blueWins}-${score.redWins} ${match.redTeamName}`,
        ...series.games.flatMap((game) => [
          `Game ${game.gameNumber}: ${game.result.winner === "user" ? "Win" : "Loss"}`,
          ...game.result.log,
        ]),
      ],
      createdAtTurn: career.seasonState.currentTurn + 1,
    },
  };
}

export function createNeutralMatchRecordFromSchedule({
  career,
  match,
  matchIndex,
}: {
  career: CareerSave;
  match: MatchSchedule;
  matchIndex: number;
}): MatchRecord {
  const random = createSeededRandom(
    `season-${career.currentSeason}-${match.id}-${career.seasonState.currentTurn}`,
  );
  const winsNeeded = getWinsNeeded(match.format);
  const blueStrength = getTeamStrengthForSchedule(match, match.blueTeamId, career);
  const redStrength = getTeamStrengthForSchedule(match, match.redTeamId, career);
  const blueWinProbability = toWinProbability(blueStrength, redStrength);
  let blueWins = 0;
  let redWins = 0;

  while (blueWins < winsNeeded && redWins < winsNeeded) {
    if (random() <= blueWinProbability) {
      blueWins += 1;
    } else {
      redWins += 1;
    }
  }

  const winnerSide = blueWins > redWins ? "blue" : "red";

  return {
    id: `${match.id}-record-${career.seasonState.currentTurn + 1}-${matchIndex + 1}`,
    scheduleId: match.id,
    competitionId: match.competitionId,
    week: match.week,
    stageName: match.stageName,
    winnerSide,
    winnerTeamId: winnerSide === "blue" ? match.blueTeamId : match.redTeamId,
    winnerTeamName:
      winnerSide === "blue" ? match.blueTeamName : match.redTeamName,
    score: {
      blueWins,
      redWins,
    },
    userResult: "none",
    winProbability: blueWinProbability,
    log: [
      `${match.blueTeamName} ${blueWins}-${redWins} ${match.redTeamName}`,
      `Neutral simulation: ${match.format.toUpperCase()} ${match.stageName}.`,
      `Blue-side win chance: ${Math.round(blueWinProbability * 100)}%.`,
    ],
    createdAtTurn: career.seasonState.currentTurn + 1,
  };
}

function isWeekFullyCompleted(
  seasonState: SeasonState,
  competitionId: CompetitionId,
  week: number,
) {
  const weekMatches = seasonState.scheduledMatches.filter(
    (match) => match.competitionId === competitionId && match.week === week,
  );

  return (
    weekMatches.length > 0 &&
    weekMatches.every((match) => match.status === "completed")
  );
}

export function advanceCompetitionsAfterCompletedRecords(
  seasonState: SeasonState,
  records: MatchRecord[],
) {
  const seasonStateAfterCupAdvance = [...new Set(records.map((record) => record.week))].reduce(
    (currentSeasonState, week) => {
      if (
        records.some((record) => record.competitionId === "lck-cup") &&
        isWeekFullyCompleted(currentSeasonState, "lck-cup", week)
      ) {
        return advanceLckCupAfterCompletedWeek(currentSeasonState, week);
      }

      return currentSeasonState;
    },
    seasonState,
  );

  if (records.some((record) => record.competitionId === "lck-rounds-1-2")) {
    return completeLckRounds12IfFinished(seasonStateAfterCupAdvance);
  }

  if (records.some((record) => record.competitionId === "lck-rounds-3-4")) {
    return completeLckRounds34IfFinished(seasonStateAfterCupAdvance);
  }

  if (records.some((record) => record.competitionId === "lck-rounds-3-5")) {
    return completeLckRounds35IfFinished(seasonStateAfterCupAdvance);
  }

  if (records.some((record) => record.competitionId === "first-stand")) {
    return advanceFirstStandAfterCompletedMatches(seasonStateAfterCupAdvance);
  }

  if (records.some((record) => record.competitionId === "msi")) {
    return advanceMsiAfterCompletedMatches(seasonStateAfterCupAdvance);
  }

  if (records.some((record) => record.competitionId === "asian-games")) {
    return advanceAsianGamesAfterCompletedMatches(seasonStateAfterCupAdvance);
  }

  if (records.some((record) => record.competitionId === "worlds")) {
    return advanceWorldsAfterCompletedMatches(seasonStateAfterCupAdvance);
  }

  return seasonStateAfterCupAdvance;
}

function getActiveCompetitionStageName(seasonState: SeasonState) {
  return (
    seasonState.competitions.find(
      (competition) =>
        competition.competitionId === seasonState.currentCompetitionId,
    )?.currentStageName ?? null
  );
}

function createProgressTraceSnapshot(
  career: CareerSave,
): CareerProgressTraceSnapshot {
  return {
    seasonNumber: career.seasonState.seasonNumber,
    yearLabel: career.seasonState.yearLabel,
    phase: career.seasonState.phase,
    currentCompetitionId: career.seasonState.currentCompetitionId,
    currentDateKey: career.seasonState.currentDateKey,
    progressStatus: career.seasonState.progressStatus,
    currentStageName: getActiveCompetitionStageName(career.seasonState),
  };
}

function createProgressFingerprint(career: CareerSave) {
  const seasonState = career.seasonState;
  const activeCompetition = seasonState.competitions.find(
    (competition) =>
      competition.competitionId === seasonState.currentCompetitionId,
  );

  return [
    career.currentSeason,
    career.seasonHistory.length,
    seasonState.seasonNumber,
    seasonState.yearLabel,
    seasonState.phase,
    seasonState.currentCompetitionId ?? "no-competition",
    seasonState.currentDateKey,
    seasonState.currentTurn,
    seasonState.progressStatus,
    seasonState.currentWeek,
    activeCompetition?.status ?? "no-status",
    activeCompetition?.currentStageName ?? "no-stage",
    activeCompetition?.completed ? "completed" : "not-completed",
    seasonState.matchRecords.length,
    seasonState.nextMatchIds.join(","),
    seasonState.lastMatchRecordIds.join(","),
    seasonState.offseason?.status ?? "no-offseason",
    seasonState.offseason?.currentDay ?? "no-offseason-day",
    seasonState.offseason?.currentWeek ?? "no-offseason-week",
    seasonState.worlds?.status ?? "no-worlds",
    career.userTeam.wins,
    career.userTeam.losses,
  ].join("|");
}

function withProgressTrace({
  action,
  before,
  blockReason,
  result,
}: {
  action: CareerProgressAction;
  before: CareerSave;
  blockReason?: CareerProgressBlockReason;
  result: Omit<CareerProgressResult, "trace">;
}): CareerProgressResult {
  return {
    ...result,
    trace: {
      before: createProgressTraceSnapshot(before),
      after: createProgressTraceSnapshot(result.career),
      action,
      blockReason,
      changed:
        createProgressFingerprint(before) !==
        createProgressFingerprint(result.career),
    },
  };
}

function isLckCupCompletedAndWaitingForFirstStand(seasonState: SeasonState) {
  const lckCup = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-cup",
  );
  const firstStand = seasonState.competitions.find(
    (competition) => competition.competitionId === "first-stand",
  );

  return (
    seasonState.currentCompetitionId === "lck-cup" &&
    Boolean(lckCup?.completed) &&
    firstStand?.status !== "active" &&
    !firstStand?.completed
  );
}

function isFirstStandCompletedAndWaitingForLckRounds12(seasonState: SeasonState) {
  const firstStand = seasonState.competitions.find(
    (competition) => competition.competitionId === "first-stand",
  );
  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-1-2",
  );

  return (
    seasonState.currentCompetitionId === "first-stand" &&
    Boolean(firstStand?.completed) &&
    lckRounds?.status !== "active" &&
    !lckRounds?.completed
  );
}

function isLckRounds12CompletedAndWaitingForMsi(seasonState: SeasonState) {
  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-1-2",
  );
  const msi = seasonState.competitions.find(
    (competition) => competition.competitionId === "msi",
  );

  return (
    seasonState.currentCompetitionId === "lck-rounds-1-2" &&
    Boolean(lckRounds?.completed) &&
    msi?.status !== "active" &&
    !msi?.completed
  );
}

function isMsiCompletedAndWaitingForLateSeason(seasonState: SeasonState) {
  const profile = getSeasonProfileForState(seasonState);
  const msi = seasonState.competitions.find(
    (competition) => competition.competitionId === "msi",
  );
  const lateSeasonCompetition = seasonState.competitions.find(
    (competition) =>
      competition.competitionId === profile.postMsiCompetitionId,
  );

  return (
    seasonState.currentCompetitionId === "msi" &&
    Boolean(msi?.completed) &&
    lateSeasonCompetition?.status !== "active" &&
    !lateSeasonCompetition?.completed
  );
}

function isLckRounds34CompletedAndWaitingForAsianGames(seasonState: SeasonState) {
  const profile = getSeasonProfileForState(seasonState);
  const lckRounds = seasonState.competitions.find(
    (competition) => competition.competitionId === "lck-rounds-3-4",
  );
  const asianGames = seasonState.competitions.find(
    (competition) => competition.competitionId === "asian-games",
  );

  return (
    profile.hasAsianGames &&
    seasonState.currentCompetitionId === "lck-rounds-3-4" &&
    Boolean(lckRounds?.completed) &&
    asianGames?.status !== "active" &&
    !asianGames?.completed
  );
}

function isAsianGamesCompletedAndWaitingForWorlds(seasonState: SeasonState) {
  const profile = getSeasonProfileForState(seasonState);
  const asianGames = seasonState.competitions.find(
    (competition) => competition.competitionId === "asian-games",
  );
  const worlds = seasonState.competitions.find(
    (competition) => competition.competitionId === "worlds",
  );

  return (
    profile.hasAsianGames &&
    seasonState.currentCompetitionId === "asian-games" &&
    Boolean(asianGames?.completed) &&
    worlds?.status !== "active" &&
    !worlds?.completed &&
    Boolean(seasonState.worldsQualification?.entrants.length)
  );
}

function isLateSeasonCompletedAndWaitingForWorlds(seasonState: SeasonState) {
  const profile = getSeasonProfileForState(seasonState);
  const lateSeasonCompetition = seasonState.competitions.find(
    (competition) =>
      competition.competitionId === profile.lateSeasonCompetitionId,
  );
  const worlds = seasonState.competitions.find(
    (competition) => competition.competitionId === "worlds",
  );

  return (
    !profile.hasAsianGames &&
    seasonState.currentCompetitionId === profile.lateSeasonCompetitionId &&
    Boolean(lateSeasonCompetition?.completed) &&
    worlds?.status !== "active" &&
    !worlds?.completed &&
    Boolean(seasonState.worldsQualification?.entrants.length)
  );
}

function isWorldsCompletedAndWaitingForSeasonEnd(seasonState: SeasonState) {
  const worlds = seasonState.competitions.find(
    (competition) => competition.competitionId === "worlds",
  );

  return (
    seasonState.currentCompetitionId === "worlds" &&
    Boolean(worlds?.completed) &&
    seasonState.worlds?.status === "completed" &&
    !seasonState.offseason
  );
}

function transitionAfterCompletedCompetition(career: CareerSave): CareerSave | null {
  if (isLckCupCompletedAndWaitingForFirstStand(career.seasonState)) {
    return {
      ...career,
      seasonState: transitionFromLckCupToFirstStand(
        career.seasonState,
        career.internationalOpponents,
      ),
    };
  }

  if (isFirstStandCompletedAndWaitingForLckRounds12(career.seasonState)) {
    return {
      ...career,
      seasonState: transitionFromFirstStandToLckRounds12(career.seasonState),
    };
  }

  if (isLckRounds12CompletedAndWaitingForMsi(career.seasonState)) {
    return {
      ...career,
      seasonState: transitionFromLckRounds12ToMsi(
        career.seasonState,
        career.internationalOpponents,
      ),
    };
  }

  if (isMsiCompletedAndWaitingForLateSeason(career.seasonState)) {
    const profile = getSeasonProfileForState(career.seasonState);
    const seasonState =
      profile.postMsiCompetitionId === "lck-rounds-3-4"
        ? transitionFromMsiToLckRounds34(career.seasonState)
        : transitionFromMsiToLckRounds35(career.seasonState);

    return {
      ...career,
      seasonState,
    };
  }

  if (isLckRounds34CompletedAndWaitingForAsianGames(career.seasonState)) {
    return {
      ...career,
      seasonState: transitionFromLckRounds34ToAsianGames(
        career.seasonState,
        career.lckPlayers,
      ),
    };
  }

  if (isAsianGamesCompletedAndWaitingForWorlds(career.seasonState)) {
    return {
      ...career,
      seasonState: activateWorlds(career.seasonState),
    };
  }

  if (isLateSeasonCompletedAndWaitingForWorlds(career.seasonState)) {
    return {
      ...career,
      seasonState: activateWorlds(career.seasonState),
    };
  }

  if (isWorldsCompletedAndWaitingForSeasonEnd(career.seasonState)) {
    return completeSeasonAfterWorlds(career);
  }

  return null;
}

function playCurrentDate(career: CareerSave): CareerProgressResult {
  const matches = getCurrentDateScheduledMatches(career.seasonState);

  if (matches.length === 0) {
    return { career, lastMatch: null };
  }

  const userTeamId = getUserTeamId(career.seasonState);
  const results = matches.map((match, index) => {
    const isUserMatch =
      match.blueTeamId === userTeamId || match.redTeamId === userTeamId;

    if (isUserMatch) {
      return createMatchRecordFromSchedule({
        career,
        match,
        matchIndex: index,
      });
    }

    return {
      record: createNeutralMatchRecordFromSchedule({
        career,
        match,
        matchIndex: index,
      }),
      lastMatchResult: null,
      seriesGames: [] as MatchSeriesGameSummary[],
    };
  });
  const records = results.map((result) => result.record);
  const userSeriesResult = results.find(
    (result) => result.record.userResult !== "none",
  );
  const lastResult = userSeriesResult?.lastMatchResult ?? null;
  const liveMatchSeries: MatchSeriesReplay | null =
    userSeriesResult && userSeriesResult.seriesGames.length > 0
      ? {
          games: userSeriesResult.seriesGames,
          recordId: userSeriesResult.record.id,
        }
      : null;
  const userWins = records.filter((record) => record.userResult === "win").length;
  const userLosses = records.filter((record) => record.userResult === "loss").length;
  const userResult = userWins > 0 ? "win" : userLosses > 0 ? "loss" : "none";
  const seasonStateWithRecords = recordCompletedMatches(
    career.seasonState,
    records,
  );
  const nextSeasonState = advanceCompetitionsAfterCompletedRecords(
    seasonStateWithRecords,
    records,
  );
  const nextPlayers =
    userResult === "none"
      ? career.lckPlayers
      : applyWeeklyPlayerStatusChanges({
          players: career.lckPlayers,
          roster: career.userTeam.roster,
          contractedPlayerIds: career.userTeam.contracts.map(
            (contract) => contract.playerId,
          ),
          trainingIntensity: career.weeklyPlan.trainingIntensity,
          userResult,
        });
  const rewardedPlayers = applyAsianGamesGoldRewardToPlayers({
    players: nextPlayers,
    seasonState: nextSeasonState,
  });

  return {
    career: {
      ...career,
      lckPlayers: rewardedPlayers,
      seasonState: nextSeasonState,
      userTeam: {
        ...career.userTeam,
        wins: career.userTeam.wins + userWins,
        losses: career.userTeam.losses + userLosses,
      },
    },
    lastMatch: lastResult,
    liveMatchSeries,
  };
}

function advanceIdleDay(career: CareerSave): CareerSave {
  if (isAsianGamesDecisionPending(career.seasonState)) {
    return career;
  }

  const todaysMatches = getCurrentDateScheduledMatches(career.seasonState);
  const userTeamId = getUserTeamId(career.seasonState);
  const hasUserMatch = todaysMatches.some(
    (match) =>
      Boolean(userTeamId) &&
      (match.blueTeamId === userTeamId || match.redTeamId === userTeamId),
  );

  if (todaysMatches.length === 0 || hasUserMatch) {
    return {
      ...career,
      seasonState: advanceToNextDay(career.seasonState),
    };
  }

  const records = todaysMatches.map((match, index) =>
    createNeutralMatchRecordFromSchedule({
      career,
      match,
      matchIndex: index,
    }),
  );
  const seasonStateWithRecords = recordCompletedMatches(
    career.seasonState,
    records,
  );
  const advancedSeasonState = advanceCompetitionsAfterCompletedRecords(
    seasonStateWithRecords,
    records,
  );
  const transitionedCareer = transitionAfterCompletedCompetition({
    ...career,
    seasonState: advancedSeasonState,
  });
  const baseCareer = transitionedCareer ?? {
    ...career,
    seasonState: advanceToNextDay(advancedSeasonState),
  };
  const rewardedPlayers = applyAsianGamesGoldRewardToPlayers({
    players: baseCareer.lckPlayers,
    seasonState: baseCareer.seasonState,
  });

  return {
    ...baseCareer,
    lckPlayers: rewardedPlayers,
  };
}

export function progressCareer(career: CareerSave): CareerProgressResult {
  if (career.seasonState.phase === "offseason") {
    const result = {
      career: progressOffseasonDay(career),
      lastMatch: null,
    };

    return withProgressTrace({
      action: "progress-offseason-day",
      before: career,
      blockReason:
        career.seasonState.offseason?.status === "active"
          ? undefined
          : "offseason-inactive",
      result,
    });
  }

  if (career.seasonState.phase === "stove-league") {
    return withProgressTrace({
      action: "blocked",
      before: career,
      blockReason: "stove-league",
      result: { career, lastMatch: null },
    });
  }

  if (career.seasonState.phase === "completed") {
    return withProgressTrace({
      action: "blocked",
      before: career,
      blockReason: "career-completed",
      result: { career, lastMatch: null },
    });
  }

  if (isAsianGamesDecisionPending(career.seasonState)) {
    return withProgressTrace({
      action: "blocked",
      before: career,
      blockReason: "asian-games-decision-pending",
      result: { career, lastMatch: null },
    });
  }

  if (career.seasonState.progressStatus === "idle") {
    return withProgressTrace({
      action: "advance-idle-day",
      before: career,
      result: {
        career: advanceIdleDay(career),
        lastMatch: null,
      },
    });
  }

  if (career.seasonState.progressStatus === "match-review") {
    const transitionedCareer = transitionAfterCompletedCompetition(career);
    if (transitionedCareer) {
      return withProgressTrace({
        action: "transition-completed-competition",
        before: career,
        result: {
          career: {
            ...transitionedCareer,
            seasonState: {
              ...transitionedCareer.seasonState,
              currentTurn: career.seasonState.currentTurn + 1,
            },
          },
          lastMatch: null,
        },
      });
    }

    const result = {
      career: {
        ...career,
        seasonState: continueAfterMatchReview(career.seasonState),
      },
      lastMatch: null,
    };

    return withProgressTrace({
      action: "continue-match-review",
      before: career,
      blockReason:
        createProgressFingerprint(career) ===
        createProgressFingerprint(result.career)
          ? "no-transition-available"
          : undefined,
      result,
    });
  }

  return withProgressTrace({
    action: "play-current-date",
    before: career,
    result: playCurrentDate(career),
  });
}

export function simulatePracticeMatch(career: CareerSave): CareerProgressResult {
  const opponent = career.internationalOpponents[0];
  const { strategy, trainingIntensity } = career.weeklyPlan;
  const draft = runSimpleDraft({
    blueTeam: {
      name: career.userTeam.name,
      players: getRosterPlayersByRole(career.userTeam, career.lckPlayers),
      strategy,
    },
    redTeam: {
      name: opponent.name,
      players: createOpponentDraftPlayers(opponent),
      strategy: mapOpponentStyleToStrategy(opponent.style),
    },
    champions: championPool,
    context: {
      format: "bo1",
      gameNumber: 1,
      fearlessEnabled: false,
      unavailableChampionIds: [],
    },
  });
  const result = simulateMatch({
    team: career.userTeam,
    players: career.lckPlayers,
    opponent,
    strategy,
    trainingIntensity,
    seed: `season-${career.currentSeason}-match-1`,
    draft,
  });
  const nextPlayers = applyWeeklyPlayerStatusChanges({
    players: career.lckPlayers,
    roster: career.userTeam.roster,
    contractedPlayerIds: career.userTeam.contracts.map(
      (contract) => contract.playerId,
    ),
    trainingIntensity,
    userResult: result.winner === "user" ? "win" : "loss",
  });
  const nextCareer = {
    ...career,
    lckPlayers: nextPlayers,
    userTeam: {
      ...career.userTeam,
      wins: career.userTeam.wins + (result.winner === "user" ? 1 : 0),
      losses: career.userTeam.losses + (result.winner === "opponent" ? 1 : 0),
    },
  };

  return withProgressTrace({
    action: "simulate-practice-match",
    before: career,
    result: {
      lastMatch: result,
      career: nextCareer,
    },
  });
}
