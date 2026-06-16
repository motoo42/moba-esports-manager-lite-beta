import { getPreviewMatches, getReviewRecords } from "../season/progressSeason";
import { championPool, isKillHungryChampion } from "../champions";
import { runSimpleDraft, type DraftTeam } from "../draft";
import { getLckOpponentStyle } from "../opponents/lckOpponentProfiles";
import type {
  CareerSave,
  MatchDraftSummary,
  MatchFormat,
  MatchSchedule,
  MatchSeriesReplay,
  Player,
  Role,
  StrategyId,
} from "../../types/game";
import {
  applyDraftToLiveMatchTeams,
  createLiveMatchDraftFromSummary,
  getDraftPickChampionIds,
} from "./draftAdapter";
import {
  createSetTimeline,
  liveMatchOutcomeFromRecord,
  standInOutcomeFromDraftPower,
  type LiveMatchOutcome,
} from "./liveSetTimeline";
import { mockLiveMatchDraft } from "./mockDraft";
import { liveMatchRoles } from "./mockDraft";
import { mockLiveMatchTimelineEvents } from "./mockTimeline";
import { createMockLiveMatchTeam } from "./mockTeams";
import {
  getLiveMatchPlayerForRole,
  getLiveMatchUserTeamId,
} from "./playerSelection";
import type {
  LiveMatchPresentation,
  LiveMatchSetPresentation,
  LiveMatchSide,
  LiveMatchTeamPresentation,
} from "./types";

function getPrimaryPreviewMatch(career: CareerSave | null) {
  if (!career) {
    return undefined;
  }

  const userTeamId = getLiveMatchUserTeamId(career);

  return getPreviewMatches(career.seasonState).find(
    (match) => match.blueTeamId === userTeamId || match.redTeamId === userTeamId,
  );
}

// The just-played user match, if any. Present once the match simulation has run
// (progress status "match-review"), and it is what step 7 replays.
function getPrimaryReviewResult(career: CareerSave | null) {
  if (!career || career.seasonState.progressStatus !== "match-review") {
    return undefined;
  }

  const userTeamId = getLiveMatchUserTeamId(career);

  for (const record of getReviewRecords(career.seasonState)) {
    const schedule = career.seasonState.scheduledMatches.find(
      (match) => match.id === record.scheduleId,
    );

    if (
      schedule &&
      (schedule.blueTeamId === userTeamId || schedule.redTeamId === userTeamId)
    ) {
      return { record, schedule };
    }
  }

  return undefined;
}

// Stable id for the current live-match set — the played record's id (frozen for
// the replay), else the upcoming match id, else the prototype key. Used to
// memoize the presentation so career changes mid-replay don't rebuild the
// timeline (which would reset playback).
export function getLiveMatchSetId(career: CareerSave | null): string {
  const reviewResult = getPrimaryReviewResult(career);

  if (reviewResult) {
    return reviewResult.record.id;
  }

  return getPrimaryPreviewMatch(career)?.id ?? "mock-live-match";
}

function getTeamNameForSide(match: MatchSchedule | undefined, side: "blue" | "red") {
  if (!match) {
    return side === "blue" ? "T1" : "Gen.G";
  }

  return side === "blue" ? match.blueTeamName : match.redTeamName;
}

function getTeamIdForSide(match: MatchSchedule | undefined, side: "blue" | "red") {
  if (!match) {
    return side === "blue" ? "t1" : "gen-g";
  }

  return side === "blue" ? match.blueTeamId : match.redTeamId;
}

function isUserTeam({
  career,
  match,
  side,
  userTeamId,
}: {
  career: CareerSave | null;
  match?: MatchSchedule;
  side: "blue" | "red";
  userTeamId: string;
}) {
  const teamId = getTeamIdForSide(match, side);
  const teamName = getTeamNameForSide(match, side);

  return teamId === userTeamId || Boolean(career && teamName === career.userTeam.name);
}

function getDraftStrategy({
  career,
  match,
  side,
  userTeamId,
}: {
  career: CareerSave | null;
  match?: MatchSchedule;
  side: "blue" | "red";
  userTeamId: string;
}): StrategyId {
  if (isUserTeam({ career, match, side, userTeamId })) {
    return career?.weeklyPlan.strategy ?? "balanced";
  }

  return getLckOpponentStyle(getTeamIdForSide(match, side));
}

function getDraftPlayersByRole({
  career,
  match,
  side,
  userTeamId,
}: {
  career: CareerSave | null;
  match?: MatchSchedule;
  side: "blue" | "red";
  userTeamId: string;
}) {
  const teamName = getTeamNameForSide(match, side);
  const userControlledTeam = isUserTeam({ career, match, side, userTeamId });
  const players: Partial<Record<Role, Player>> = {};

  for (const role of liveMatchRoles) {
    const player = getLiveMatchPlayerForRole({
      career,
      isUserTeam: userControlledTeam,
      role,
      teamName,
    });

    if (player) {
      players[role] = player;
    }
  }

  return players;
}

function createDraftTeamForSide({
  career,
  match,
  side,
  userTeamId,
}: {
  career: CareerSave | null;
  match?: MatchSchedule;
  side: "blue" | "red";
  userTeamId: string;
}): DraftTeam {
  return {
    name: getTeamNameForSide(match, side),
    players: getDraftPlayersByRole({ career, match, side, userTeamId }),
    strategy: getDraftStrategy({ career, match, side, userTeamId }),
  };
}

function createLiveMatchDraftSummary({
  career,
  format,
  match,
  userTeamId,
}: {
  career: CareerSave | null;
  format: MatchFormat;
  match?: MatchSchedule;
  userTeamId: string;
}) {
  return runSimpleDraft({
    blueTeam: createDraftTeamForSide({
      career,
      match,
      side: "blue",
      userTeamId,
    }),
    champions: championPool,
    context: {
      banCount: 5,
      fearlessEnabled: match?.fearlessEnabled ?? format !== "bo1",
      format,
      gameNumber: 1,
      unavailableChampionIds: [],
    },
    redTeam: createDraftTeamForSide({
      career,
      match,
      side: "red",
      userTeamId,
    }),
  });
}

// Which sides field a kill-hungry support champion (e.g. Pyke); their support
// keeps a normal share of kills while every other support is down-weighted.
function getAggressiveSupportSides(
  blueTeam: LiveMatchTeamPresentation,
  redTeam: LiveMatchTeamPresentation,
): LiveMatchSide[] {
  const sides: LiveMatchSide[] = [];
  const blueSupport = blueTeam.players.find((player) => player.role === "support");
  const redSupport = redTeam.players.find((player) => player.role === "support");

  if (blueSupport && isKillHungryChampion(blueSupport.champion.id)) {
    sides.push("blue");
  }

  if (redSupport && isKillHungryChampion(redSupport.champion.id)) {
    sides.push("red");
  }

  return sides;
}

function buildLiveMatchSet({
  baseBlueTeam,
  baseRedTeam,
  draftSummary,
  format,
  gameNumber,
  outcome,
  stageName,
}: {
  baseBlueTeam: LiveMatchTeamPresentation;
  baseRedTeam: LiveMatchTeamPresentation;
  draftSummary?: MatchDraftSummary;
  format: MatchFormat;
  gameNumber: number;
  outcome: LiveMatchOutcome;
  stageName: string;
}): LiveMatchSetPresentation {
  let blueTeam = baseBlueTeam;
  let redTeam = baseRedTeam;
  let draft = mockLiveMatchDraft;

  if (draftSummary) {
    const draftedTeams = applyDraftToLiveMatchTeams({
      blueTeam,
      draft: draftSummary,
      redTeam,
    });

    blueTeam = draftedTeams.blueTeam;
    redTeam = draftedTeams.redTeam;
    draft = createLiveMatchDraftFromSummary({
      draft: draftSummary,
      format,
      usedChampionIdsByGame: [getDraftPickChampionIds(draftSummary)],
    });
  }

  return {
    blueTeam,
    draft,
    gameNumber,
    gameTime: "00:00",
    redTeam,
    stageName,
    timeline: createSetTimeline(outcome, {
      aggressiveSupportSides: getAggressiveSupportSides(blueTeam, redTeam),
    }),
    timelineEvents: mockLiveMatchTimelineEvents,
  };
}

export function createLiveMatchPresentationFromCareer(
  career: CareerSave | null,
  series?: MatchSeriesReplay | null,
): LiveMatchPresentation {
  const reviewResult = getPrimaryReviewResult(career);
  const match = reviewResult?.schedule ?? getPrimaryPreviewMatch(career);
  const userTeamId = getLiveMatchUserTeamId(career);
  const format = match?.format ?? "bo3";
  const baseBlueTeam = createMockLiveMatchTeam({
    career,
    match,
    side: "blue",
    userTeamId,
  });
  const baseRedTeam = createMockLiveMatchTeam({
    career,
    match,
    side: "red",
    userTeamId,
  });
  const stageName = match?.stageName ?? "LCK Cup Group Battle";
  const buildSet = (config: {
    draftSummary?: MatchDraftSummary;
    gameNumber: number;
    outcome: LiveMatchOutcome;
  }) =>
    buildLiveMatchSet({ baseBlueTeam, baseRedTeam, format, stageName, ...config });

  let id: string;
  let sets: LiveMatchSetPresentation[];

  if (
    reviewResult &&
    series &&
    series.recordId === reviewResult.record.id &&
    series.games.length > 0
  ) {
    // Faithful per-set replay from the played series (each set's real banpick).
    id = reviewResult.record.id;
    sets = series.games.map((game) =>
      buildSet({
        draftSummary: game.draft,
        gameNumber: game.gameNumber,
        outcome: {
          seed: `${reviewResult.record.id}-g${game.gameNumber}`,
          winnerWinProbability: game.winnerWinProbability,
          winningSide: game.winnerSide,
        },
      }),
    );
  } else if (reviewResult) {
    // Played match without per-set detail (e.g. a loaded save): single
    // representative game from the record.
    id = reviewResult.record.id;
    sets = [
      buildSet({
        draftSummary: reviewResult.record.draft,
        gameNumber: 1,
        outcome: liveMatchOutcomeFromRecord(reviewResult.record),
      }),
    ];
  } else {
    // Standalone prototype: draft-power stand-in.
    const generatedDraft = createLiveMatchDraftSummary({
      career,
      format,
      match,
      userTeamId,
    });
    id = match?.id ?? "mock-live-match";
    sets = [
      buildSet({
        draftSummary: generatedDraft,
        gameNumber: 1,
        outcome: standInOutcomeFromDraftPower({
          netDraftPower: generatedDraft.netDraftPower,
          seed: id,
        }),
      }),
    ];
  }

  return {
    currentSet: sets[0],
    formatLabel: format.toUpperCase(),
    id,
    sets,
    stageName,
  };
}
