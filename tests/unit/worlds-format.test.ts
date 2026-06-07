import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  activateWorlds,
  advanceWorldsAfterCompletedMatches,
  assignWorldsGroups,
  createInitialSeasonState,
  createLckWorldsSeeds,
  createWorldsEntrants,
  getWorldsGroupStandings,
  recordCompletedMatches,
  splitWorldsEntrants,
  worldsMatchIds,
  worldsStageNames,
} from "../../src/domain/season";
import type {
  CompetitionState,
  LeagueCode,
  MatchRecord,
  MatchSchedule,
  SeasonState,
  WorldsGroupAssignment,
} from "../../src/types/game";
import type { SeededWorldsEntrant } from "../../src/domain/season";

function createBlueWinRecord(match: MatchSchedule, index: number): MatchRecord {
  const blueWins = match.format === "bo5" ? 3 : match.format === "bo3" ? 2 : 1;
  const redWins = match.format === "bo1" ? 0 : 1;

  return {
    id: `${match.id}-record-${index}`,
    scheduleId: match.id,
    competitionId: match.competitionId,
    week: match.week,
    stageName: match.stageName,
    winnerSide: "blue",
    winnerTeamId: match.blueTeamId,
    winnerTeamName: match.blueTeamName,
    score: { blueWins, redWins },
    userResult: "none",
    log: [`${match.blueTeamName} beat ${match.redTeamName}`],
    createdAtTurn: index + 1,
  };
}

function createWorldsReadySeason(currentDateKey = "2026-09-20"): SeasonState {
  const base = createInitialSeasonState({
    seasonNumber: 1,
    userTeamName: "T1",
  });
  const lckSeeds = createLckWorldsSeeds(
    [
      { teamId: "t1", teamName: "T1" },
      { teamId: "gen-g", teamName: "Gen.G" },
      { teamId: "hle", teamName: "Hanwha Life Esports" },
      { teamId: "dk", teamName: "Dplus KIA" },
    ],
    ["LCK", "LPL"],
  );
  const entrants = createWorldsEntrants({
    bonusLeagueLabels: ["LCK", "LPL"],
    lckSeeds,
  });

  return {
    ...base,
    phase: "competition",
    currentCompetitionId: "asian-games",
    currentDateKey,
    worldsQualification: {
      status: "lck-seeds-decided",
      sourceCompetitionId: "msi",
      decidedAtDateKey: "2026-07-12",
      bonusLeagueLabels: ["LCK", "LPL"],
      msiLeagueResults: [
        {
          leagueLabel: "LCK",
          rank: 1,
          bestTeamId: "t1",
          bestTeamName: "T1",
          resultLabel: "MSI 우승",
          initialSeed: 1,
        },
        {
          leagueLabel: "LPL",
          rank: 2,
          bestTeamId: "msi-lpl-1",
          bestTeamName: "Bilibili Gaming",
          resultLabel: "MSI 준우승",
          initialSeed: 2,
        },
      ],
      lckSeeds,
      entrants,
      totalEntrants: entrants.length,
    },
    competitions: base.competitions.map((competition) =>
      competition.competitionId === "worlds"
        ? {
            ...competition,
            status: "available" as const,
            qualifiedTeamIds: entrants.map((entrant) => entrant.teamId),
            qualifiedTeamNames: entrants.map((entrant) => entrant.teamName),
          }
        : competition,
    ),
  };
}

function getWorlds(season: SeasonState): CompetitionState {
  const worlds = season.competitions.find(
    (competition) => competition.competitionId === "worlds",
  );

  if (!worlds) {
    throw new Error("Worlds competition is missing.");
  }

  return worlds;
}

function getScheduledStage(season: SeasonState, stageName: string) {
  return getWorlds(season).schedule.filter(
    (match) => match.stageName === stageName && match.status === "scheduled",
  );
}

function playMatches(season: SeasonState, matches: MatchSchedule[]) {
  return advanceWorldsAfterCompletedMatches(
    recordCompletedMatches(season, matches.map(createBlueWinRecord)),
  );
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

function expectNoLeagueDuplicates(assignments: WorldsGroupAssignment[]) {
  const groupIds = [...new Set(assignments.map((assignment) => assignment.groupId))];

  groupIds.forEach((groupId) => {
    expect(
      countLeagueDuplicates(
        assignments.filter((assignment) => assignment.groupId === groupId),
      ),
    ).toBe(0);
  });
}

describe("Worlds format", () => {
  it("splits the 20-team pool into 12 direct entrants and 8 play-in entrants", () => {
    const season = createWorldsReadySeason();
    const { directEntrants, playInEntrants } = splitWorldsEntrants(
      season.worldsQualification?.entrants ?? [],
    );

    expect(season.worldsQualification?.totalEntrants).toBe(20);
    expect(directEntrants).toHaveLength(12);
    expect(playInEntrants).toHaveLength(8);
    expect(directEntrants.every((entrant) => entrant.seed <= 3)).toBe(true);
    expect(playInEntrants.map((entrant) => entrant.teamId)).toContain("dk");
    expect(
      playInEntrants.filter((entrant) => entrant.source === "lcq-placeholder"),
    ).toHaveLength(2);
  });

  it("draws play-in and group-stage groups without same-league duplicates when possible", () => {
    let season = activateWorlds(createWorldsReadySeason());

    expect(season.worlds?.playInGroups).toHaveLength(8);
    expectNoLeagueDuplicates(season.worlds?.playInGroups ?? []);

    season = playMatches(season, [
      ...getScheduledStage(season, worldsStageNames.playInGroupA),
      ...getScheduledStage(season, worldsStageNames.playInGroupB),
    ]);

    expect(season.worlds?.groupStageGroups).toHaveLength(16);
    expectNoLeagueDuplicates(season.worlds?.groupStageGroups ?? []);
  });

  it("falls back to the minimum duplicate count when a clean draw is impossible", () => {
    const entrants: SeededWorldsEntrant[] = Array.from({ length: 5 }, (_, index) => ({
      teamId: `lck-${index + 1}`,
      teamName: `LCK ${index + 1}`,
      leagueLabel: "LCK",
      seed: index + 1,
      slotLabel: `LCK ${index + 1}`,
      source: "regional-base",
      isPlaceholder: false,
      entryStage: "play-in",
      initialSeed: index + 1,
    }));
    const assignments = assignWorldsGroups({
      entrants,
      groupIds: ["play-in-a", "play-in-b"],
      stage: "play-in",
    });
    const duplicates = ["play-in-a", "play-in-b"].reduce(
      (total, groupId) =>
        total +
        countLeagueDuplicates(
          assignments.filter((assignment) => assignment.groupId === groupId),
        ),
      0,
    );

    expect(assignments).toHaveLength(5);
    expect(duplicates).toBe(3);
  });

  it("runs play-in, group stage, knockout, and stores the Worlds champion", () => {
    let season = activateWorlds(createWorldsReadySeason());
    let worlds = getWorlds(season);

    const playInMatches = [
      ...getScheduledStage(season, worldsStageNames.playInGroupA),
      ...getScheduledStage(season, worldsStageNames.playInGroupB),
    ];

    expect(season.currentCompetitionId).toBe("worlds");
    expect(season.currentDateKey).toBe("2026-10-01");
    expect(worlds.status).toBe("active");
    expect(playInMatches).toHaveLength(12);
    expect(playInMatches.every((match) => match.format === "bo1")).toBe(true);

    season = playMatches(season, playInMatches);
    worlds = getWorlds(season);

    const groupMatches = [
      ...getScheduledStage(season, worldsStageNames.groupStageA),
      ...getScheduledStage(season, worldsStageNames.groupStageB),
      ...getScheduledStage(season, worldsStageNames.groupStageC),
      ...getScheduledStage(season, worldsStageNames.groupStageD),
    ];

    expect(season.worlds?.status).toBe("group-stage");
    expect(groupMatches).toHaveLength(48);
    expect(groupMatches.every((match) => match.format === "bo1")).toBe(true);
    expect(
      getWorldsGroupStandings({
        assignments: season.worlds?.playInGroups ?? [],
        competition: worlds,
        groupId: "play-in-a",
        records: season.matchRecords,
      }).slice(0, 2),
    ).toHaveLength(2);

    season = playMatches(season, groupMatches);

    const quarterfinals = getScheduledStage(
      season,
      worldsStageNames.quarterfinals,
    );

    expect(season.worlds?.status).toBe("knockout");
    expect(quarterfinals.map((match) => match.id)).toEqual([
      worldsMatchIds.quarterfinalA1VsB2,
      worldsMatchIds.quarterfinalB1VsA2,
      worldsMatchIds.quarterfinalC1VsD2,
      worldsMatchIds.quarterfinalD1VsC2,
    ]);
    expect(quarterfinals.every((match) => match.format === "bo5")).toBe(true);

    season = playMatches(season, quarterfinals);

    const semifinals = getScheduledStage(season, worldsStageNames.semifinals);

    expect(semifinals).toHaveLength(2);
    expect(semifinals.every((match) => match.format === "bo5")).toBe(true);

    season = playMatches(season, semifinals);

    const final = getScheduledStage(season, worldsStageNames.final);

    expect(final).toHaveLength(1);
    expect(final[0].format).toBe("bo5");

    season = playMatches(season, final);
    worlds = getWorlds(season);

    expect(season.worlds?.status).toBe("completed");
    expect(worlds.status).toBe("completed");
    expect(worlds.completed).toBe(true);
    expect(worlds.winnerTeamId).toBeDefined();
    expect(worlds.winnerTeamName).toBeDefined();
    expect(season.worlds?.championTeamId).toBe(worlds.winnerTeamId);
    expect(season.worlds?.runnerUpTeamId).toBeDefined();
    expect(season.worlds?.semifinalistTeamIds).toHaveLength(2);
  });

  it("activates Worlds through the normal Asian Games completion transition", () => {
    const career = createInitialCareer("T1");
    const readySeason = createWorldsReadySeason("2026-09-20");
    const result = progressCareer({
      ...career,
      seasonState: {
        ...readySeason,
        progressStatus: "match-review",
        currentCompetitionId: "asian-games",
        competitions: readySeason.competitions.map((competition) =>
          competition.competitionId === "asian-games"
            ? {
                ...competition,
                status: "completed" as const,
                currentStageName: "Completed",
                completed: true,
              }
            : competition,
        ),
      },
    });

    expect(result.career.seasonState.currentCompetitionId).toBe("worlds");
    expect(result.career.seasonState.worlds?.status).toBe("play-in");
    expect(getWorlds(result.career.seasonState).schedule).toHaveLength(12);
  });
});
