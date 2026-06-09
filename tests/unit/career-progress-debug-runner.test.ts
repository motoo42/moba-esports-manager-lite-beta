import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { normalizeCareerSave } from "../../src/domain/career/normalizeCareerSave";
import {
  progressCareer,
  type CareerProgressTrace,
} from "../../src/domain/game-progress/progressCareer";
import { runCareerProgressDebugRunner } from "../../src/domain/game-progress/careerProgressDebugRunner";
import {
  completeStoveLeague,
  createInitialSeasonState,
} from "../../src/domain/season";
import type {
  CareerSave,
  PlayerContract,
  Role,
  Team,
} from "../../src/types/game";

const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];

function createPlayableCareerForSeason(seasonNumber: number): CareerSave {
  const career = createInitialCareer("T1");
  const t1Players = career.lckPlayers.filter(
    (player) => player.currentTeam === "T1",
  );
  const mainRosterIds = roleOrder.map((role) => {
    const player = t1Players.find(
      (candidate) =>
        candidate.role === role && candidate.rosterTier === "main",
    );

    if (!player) {
      throw new Error(`Missing T1 main ${role} player.`);
    }

    return player.id;
  });
  const academyRosterIds = t1Players
    .filter((player) => player.rosterTier === "academy")
    .map((player) => player.id);
  const contractPlayerIds = [...mainRosterIds, ...academyRosterIds];
  const contracts: PlayerContract[] = contractPlayerIds.map(
    (playerId, index) => {
      const player = t1Players.find((candidate) => candidate.id === playerId);

      return {
        playerId,
        salary: player?.salaryExpectation ?? 0,
        type: index === 0 ? "one-year" : "two-year",
        guaranteedYears: index === 0 ? 1 : 2,
        remainingYears: index === 0 ? 1 : 2,
      };
    },
  );
  const roster = roleOrder.reduce<Team["roster"]>((nextRoster, role, index) => {
    return {
      ...nextRoster,
      [role]: mainRosterIds[index],
    };
  }, {});

  return {
    ...career,
    currentSeason: seasonNumber,
    userTeam: {
      ...career.userTeam,
      roster,
      mainRosterPlayerIds: mainRosterIds,
      academyRosterPlayerIds: academyRosterIds,
      contracts,
      wins: 0,
      losses: 0,
      elo: 1650,
    },
    seasonState: completeStoveLeague(
      createInitialSeasonState({
        seasonNumber,
        userTeamName: "T1",
      }),
    ),
  };
}

function createPlayable2026Career(): CareerSave {
  return createPlayableCareerForSeason(1);
}

function createPlayable2027Career(): CareerSave {
  return createPlayableCareerForSeason(2);
}

function getTraceActions(steps: Array<{ trace: CareerProgressTrace }>) {
  return steps.map((step) => step.trace.action);
}

function hasReached2029LckCupEntry(career: CareerSave) {
  return (
    career.currentSeason === 4 &&
    career.seasonState.yearLabel === 2029 &&
    career.seasonState.phase === "competition" &&
    career.seasonState.currentCompetitionId === "lck-cup"
  );
}

function getVisitedCompetitionIds(steps: Array<{ trace: CareerProgressTrace }>) {
  return new Set(
    steps.flatMap((step) => [
      step.trace.before.currentCompetitionId,
      step.trace.after.currentCompetitionId,
    ]),
  );
}

function getVisitedCompetitionIdsForYear(
  steps: Array<{ trace: CareerProgressTrace }>,
  yearLabel: number,
) {
  return new Set(
    steps.flatMap((step) => {
      const visitedIds = [];

      if (step.trace.before.yearLabel === yearLabel) {
        visitedIds.push(step.trace.before.currentCompetitionId);
      }

      if (step.trace.after.yearLabel === yearLabel) {
        visitedIds.push(step.trace.after.currentCompetitionId);
      }

      return visitedIds;
    }),
  );
}

function findDuplicateIds(ids: string[]) {
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  ids.forEach((id) => {
    if (seenIds.has(id)) {
      duplicateIds.add(id);
      return;
    }

    seenIds.add(id);
  });

  return [...duplicateIds];
}

describe("career progress trace", () => {
  it("returns a block reason when progress is requested during stove league", () => {
    const career = createInitialCareer("T1");
    const result = progressCareer({
      ...career,
      seasonState: createInitialSeasonState({
        seasonNumber: 1,
        userTeamName: "T1",
      }),
    });

    expect(result.trace?.action).toBe("blocked");
    expect(result.trace?.blockReason).toBe("stove-league");
    expect(result.trace?.changed).toBe(false);
  });

  it("returns a block reason for inactive offseason summary state", () => {
    const career = createInitialCareer("T1");
    const result = progressCareer({
      ...career,
      seasonState: {
        ...career.seasonState,
        phase: "offseason",
        offseason: {
          status: "summary",
          completedSeasonNumber: 1,
          nextSeasonNumber: 2,
          startedDateKey: "2026-11-08",
          expiredContractPlayerIds: [],
          renewedPlayerIds: [],
          summarySeasonNumber: 1,
        },
      },
    });

    expect(result.trace?.action).toBe("progress-offseason-day");
    expect(result.trace?.blockReason).toBe("offseason-inactive");
    expect(result.trace?.changed).toBe(false);
  });
});

describe("career progress debug runner", () => {
  it("runs the 2026, 2027, and 2028 seasons into the 2029 LCK Cup entry state", () => {
    const result = runCareerProgressDebugRunner(createPlayable2026Career(), {
      maxSteps: 8000,
      target: hasReached2029LckCupEntry,
    });
    const visited2026Competitions = getVisitedCompetitionIdsForYear(
      result.steps,
      2026,
    );
    const visited2027Competitions = getVisitedCompetitionIdsForYear(
      result.steps,
      2027,
    );
    const visited2028Competitions = getVisitedCompetitionIdsForYear(
      result.steps,
      2028,
    );
    const scheduledMatchIds = result.career.seasonState.scheduledMatches.map(
      (match) => match.id,
    );
    const competitionScheduleIds = result.career.seasonState.competitions.flatMap(
      (competition) => competition.schedule.map((match) => match.id),
    );
    const matchRecordIds = result.career.seasonState.matchRecords.map(
      (record) => record.id,
    );

    expect(result.status, result.failureMessage).toBe("completed");
    const normalizedCareer = normalizeCareerSave(
      JSON.parse(JSON.stringify(result.career)) as CareerSave,
    );

    expect(result.career.currentSeason).toBe(4);
    expect(result.career.seasonState.yearLabel).toBe(2029);
    expect(result.career.seasonState.phase).toBe("competition");
    expect(result.career.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(result.career.seasonHistory).toHaveLength(3);
    expect(result.career.seasonHistory.map((summary) => summary.yearLabel)).toEqual([
      2026,
      2027,
      2028,
    ]);
    expect(
      result.career.seasonHistory.every((summary) =>
        Boolean(summary.offseasonSummary),
      ),
    ).toBe(true);
    expect(
      result.career.seasonHistory.some(
        (summary) =>
          (summary.offseasonSummary?.notableLogEntries?.length ?? 0) > 0,
      ),
    ).toBe(true);
    expect(normalizedCareer.seasonHistory).toHaveLength(3);
    expect(
      normalizedCareer.seasonHistory.every((summary) =>
        Boolean(summary.offseasonSummary),
      ),
    ).toBe(true);
    expect(visited2026Competitions.has("asian-games")).toBe(true);
    expect(visited2026Competitions.has("lck-rounds-3-4")).toBe(true);
    expect(visited2026Competitions.has("worlds")).toBe(true);
    expect(visited2027Competitions.has("asian-games")).toBe(false);
    expect(visited2027Competitions.has("lck-rounds-3-5")).toBe(true);
    expect(visited2027Competitions.has("worlds")).toBe(true);
    expect(visited2028Competitions.has("asian-games")).toBe(false);
    expect(visited2028Competitions.has("lck-rounds-3-5")).toBe(true);
    expect(visited2028Competitions.has("worlds")).toBe(true);
    expect(result.career.seasonState.asianGames).toBeUndefined();
    expect(
      result.career.seasonState.competitions.some(
        (competition) => competition.competitionId === "asian-games",
      ),
    ).toBe(false);
    expect(result.career.seasonState.worlds).toBeUndefined();
    expect(result.career.seasonState.worldsQualification).toBeUndefined();
    expect(findDuplicateIds(scheduledMatchIds)).toEqual([]);
    expect(findDuplicateIds(competitionScheduleIds)).toEqual([]);
    expect(findDuplicateIds(matchRecordIds)).toEqual([]);
    expect(
      result.steps.some((step) =>
        step.autoActions.includes("set-asian-games-auto"),
      ),
    ).toBe(true);
    expect(
      result.steps.filter((step) => step.trace.after.phase === "offseason")
        .length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      result.steps.some((step) =>
        step.autoActions.includes("start-offseason-market"),
      ),
    ).toBe(true);
    expect(
      result.steps.some((step) =>
        step.autoActions.some((action) => action.startsWith("renew:")),
      ),
    ).toBe(true);
  });

  it("runs the 2027 season into the 2028 LCK Cup entry state", () => {
    const result = runCareerProgressDebugRunner(createPlayable2027Career());
    const visitedCompetitions = getVisitedCompetitionIds(result.steps);

    expect(result.status, result.failureMessage).toBe("completed");
    expect(result.career.currentSeason).toBe(3);
    expect(result.career.seasonState.yearLabel).toBe(2028);
    expect(result.career.seasonState.phase).toBe("competition");
    expect(result.career.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(result.career.seasonState.asianGames).toBeUndefined();
    expect(
      result.career.seasonState.competitions.some(
        (competition) => competition.competitionId === "asian-games",
      ),
    ).toBe(false);
    expect(result.career.seasonHistory).toHaveLength(1);
    expect(visitedCompetitions.has("lck-rounds-3-5")).toBe(true);
    expect(visitedCompetitions.has("worlds")).toBe(true);
    expect(result.steps.some((step) => step.trace.after.phase === "offseason")).toBe(
      true,
    );
    expect(visitedCompetitions.has("lck-cup")).toBe(true);
    expect(getTraceActions(result.steps)).toContain(
      "transition-completed-competition",
    );
    expect(
      result.steps.some((step) =>
        step.autoActions.includes("start-offseason-market"),
      ),
    ).toBe(true);
    expect(
      result.steps.some((step) =>
        step.autoActions.some((action) => action.startsWith("renew:")),
      ),
    ).toBe(true);
  });

  it("runs the 2028 season into the 2029 LCK Cup entry state", () => {
    const entry2028 = runCareerProgressDebugRunner(createPlayable2027Career());

    expect(entry2028.status, entry2028.failureMessage).toBe("completed");
    expect(entry2028.career.seasonState.worlds).toBeUndefined();
    expect(entry2028.career.seasonState.worldsQualification).toBeUndefined();

    const result = runCareerProgressDebugRunner(entry2028.career, {
      target: hasReached2029LckCupEntry,
    });
    const visitedCompetitions = getVisitedCompetitionIds(result.steps);
    const scheduledMatchIds = result.career.seasonState.scheduledMatches.map(
      (match) => match.id,
    );
    const competitionScheduleIds = result.career.seasonState.competitions.flatMap(
      (competition) => competition.schedule.map((match) => match.id),
    );
    const matchRecordIds = result.career.seasonState.matchRecords.map(
      (record) => record.id,
    );

    expect(result.status, result.failureMessage).toBe("completed");
    expect(result.career.currentSeason).toBe(4);
    expect(result.career.seasonState.yearLabel).toBe(2029);
    expect(result.career.seasonState.phase).toBe("competition");
    expect(result.career.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(result.career.seasonState.asianGames).toBeUndefined();
    expect(
      result.career.seasonState.competitions.some(
        (competition) => competition.competitionId === "asian-games",
      ),
    ).toBe(false);
    expect(result.career.seasonState.worlds).toBeUndefined();
    expect(result.career.seasonState.worldsQualification).toBeUndefined();
    expect(result.career.seasonHistory).toHaveLength(2);
    expect(visitedCompetitions.has("lck-rounds-3-5")).toBe(true);
    expect(visitedCompetitions.has("worlds")).toBe(true);
    expect(result.steps.some((step) => step.trace.after.phase === "offseason")).toBe(
      true,
    );
    expect(visitedCompetitions.has("lck-cup")).toBe(true);
    expect(findDuplicateIds(scheduledMatchIds)).toEqual([]);
    expect(findDuplicateIds(competitionScheduleIds)).toEqual([]);
    expect(findDuplicateIds(matchRecordIds)).toEqual([]);
    expect(
      result.steps.some((step) =>
        step.autoActions.includes("start-offseason-market"),
      ),
    ).toBe(true);
    expect(
      result.steps.some((step) =>
        step.autoActions.some((action) => action.startsWith("renew:")),
      ),
    ).toBe(true);
  });

  it("fails with diagnostic information when max steps are exhausted", () => {
    const result = runCareerProgressDebugRunner(createPlayable2027Career(), {
      maxSteps: 1,
      target: () => false,
    });

    expect(result.status).toBe("failed");
    expect(result.failureReason).toBe("max-step-exceeded");
    expect(result.lastTrace?.before.yearLabel).toBe(2027);
  });

  it("fails before success when the target state violates career integrity", () => {
    const career = createPlayable2027Career();
    const firstMatch = career.seasonState.competitions.flatMap(
      (competition) => competition.schedule,
    )[0];

    expect(firstMatch).toBeDefined();

    const result = runCareerProgressDebugRunner(
      {
        ...career,
        seasonState: {
          ...career.seasonState,
          scheduledMatches: [firstMatch, firstMatch],
        },
      },
      {
        target: () => true,
      },
    );

    expect(result.status).toBe("failed");
    expect(result.failureReason).toBe("integrity-violation");
    expect(result.failureMessage).toContain("duplicate-scheduled-match-id");
  });
});
