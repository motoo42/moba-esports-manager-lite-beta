import { describe, expect, it } from "vitest";
import {
  activateLckRounds34,
  completeLckRounds34IfFinished,
  createInitialLckStandings,
  createInitialSeasonState,
  createLckRounds34Setup,
  isLckRounds34PostseasonStageName,
  lckRounds34MatchesPerTeam,
  lckRounds34PostseasonStageNames,
  lckRounds34RegularWeeks,
  lckRounds34StageNames,
  lckRounds34TotalMatches,
} from "../../src/domain/season";
import { recordCompletedMatches } from "../../src/domain/season/progressSeason";
import type {
  MatchRecord,
  MatchSchedule,
  SeasonState,
  StandingEntry,
} from "../../src/types/game";

function createCarriedRounds12Standings(): StandingEntry[] {
  return createInitialLckStandings("T1").map((entry, index) => {
    const wins = 18 - index;
    const losses = index;
    const setWins = 36 - index;
    const setLosses = index;

    return {
      ...entry,
      rank: index + 1,
      initialSeed: index + 1,
      wins,
      losses,
      matchWins: wins,
      matchLosses: losses,
      setWins,
      setLosses,
      winRate: wins / (wins + losses),
    };
  });
}

function createBlueWinRecord(match: MatchSchedule, index: number): MatchRecord {
  return {
    id: `${match.id}-record-${index}`,
    scheduleId: match.id,
    competitionId: match.competitionId,
    week: match.week,
    stageName: match.stageName,
    winnerSide: "blue",
    winnerTeamId: match.blueTeamId,
    winnerTeamName: match.blueTeamName,
    score: {
      blueWins: 2,
      redWins: 1,
    },
    userResult:
      match.blueTeamName === "T1"
        ? "win"
        : match.redTeamName === "T1"
          ? "loss"
          : "none",
    log: [`${match.blueTeamName} beat ${match.redTeamName}`],
    createdAtTurn: index + 1,
  };
}

function createRounds34ReadySeason() {
  const carriedStandings = createCarriedRounds12Standings();
  const season = createInitialSeasonState({
    seasonNumber: 1,
    userTeamName: "T1",
  });

  return {
    ...season,
    competitions: season.competitions.map((competition) =>
      competition.competitionId === "lck-rounds-1-2"
        ? {
            ...competition,
            status: "completed" as const,
            currentStageName: "Playoffs Completed",
            standings: carriedStandings,
            completed: true,
          }
        : competition,
    ),
  };
}

function getRounds34Competition(season: ReturnType<typeof activateLckRounds34>) {
  const competition = season.competitions.find(
    (candidate) => candidate.competitionId === "lck-rounds-3-4",
  );

  if (!competition) {
    throw new Error("LCK Rounds 3-4 state was not created.");
  }

  return competition;
}

function completeScheduledStage(
  season: ReturnType<typeof activateLckRounds34>,
  stageName: string,
) {
  const competition = getRounds34Competition(season);
  const scheduledMatches = competition.schedule.filter(
    (match) => match.stageName === stageName && match.status === "scheduled",
  );

  if (scheduledMatches.length === 0) {
    throw new Error(`No scheduled matches found for ${stageName}.`);
  }

  return completeLckRounds34IfFinished(
    recordCompletedMatches(season, scheduledMatches.map(createBlueWinRecord)),
  );
}

describe("LCK Rounds 3-4 format", () => {
  it("splits Rounds 1-2 standings into Legend and Rise groups with carry-over records", () => {
    const carriedStandings = createCarriedRounds12Standings();
    const setup = createLckRounds34Setup(carriedStandings, {
      calendarType: "asian-games",
      year: 2026,
    });

    expect(setup.legendGroup).toHaveLength(5);
    expect(setup.riseGroup).toHaveLength(5);
    expect(setup.legendGroup.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(setup.riseGroup.map((entry) => entry.rank)).toEqual([6, 7, 8, 9, 10]);
    expect(setup.standings[0].wins).toBe(carriedStandings[0].wins);
    expect(setup.standings[0].setWins).toBe(carriedStandings[0].setWins);
    expect(setup.legendGroup.every((entry) => entry.lckRoundsGroup === "legend")).toBe(
      true,
    );
    expect(setup.riseGroup.every((entry) => entry.lckRoundsGroup === "rise")).toBe(
      true,
    );
  });

  it("creates a 5-week group-internal double round robin with 40 BO3 Fearless series", () => {
    const setup = createLckRounds34Setup(createCarriedRounds12Standings(), {
      calendarType: "asian-games",
      year: 2026,
    });
    const matchesByTeam = new Map<string, number>();
    const groupByTeamId = new Map(
      setup.standings.map((entry) => [entry.teamId, entry.lckRoundsGroup]),
    );

    expect(setup.schedule).toHaveLength(lckRounds34TotalMatches);
    expect(setup.schedule.every((match) => match.competitionId === "lck-rounds-3-4")).toBe(
      true,
    );
    expect(setup.schedule.every((match) => match.format === "bo3")).toBe(true);
    expect(setup.schedule.every((match) => match.fearlessEnabled)).toBe(true);
    expect(new Set(setup.schedule.map((match) => match.week))).toEqual(
      new Set([1, 2, 3, 4, 5]),
    );
    expect(
      setup.schedule.filter(
        (match) => match.stageName === lckRounds34StageNames.legend,
      ),
    ).toHaveLength(20);
    expect(
      setup.schedule.filter((match) => match.stageName === lckRounds34StageNames.rise),
    ).toHaveLength(20);

    setup.schedule.forEach((match) => {
      matchesByTeam.set(
        match.blueTeamId,
        (matchesByTeam.get(match.blueTeamId) ?? 0) + 1,
      );
      matchesByTeam.set(
        match.redTeamId,
        (matchesByTeam.get(match.redTeamId) ?? 0) + 1,
      );
      expect(groupByTeamId.get(match.blueTeamId)).toBe(
        groupByTeamId.get(match.redTeamId),
      );
    });

    setup.standings.forEach((team) => {
      expect(matchesByTeam.get(team.teamId)).toBe(lckRounds34MatchesPerTeam);
    });
    expect(Math.max(...setup.schedule.map((match) => match.week))).toBe(
      lckRounds34RegularWeeks,
    );
    expect(setup.schedule[0].scheduledDate).toBe("2026-07-08");
  });

  it("activates Rounds 3-4 from the carried LCK table", () => {
    const season = activateLckRounds34(createRounds34ReadySeason());
    const competition = season.competitions.find(
      (candidate) => candidate.competitionId === "lck-rounds-3-4",
    );

    expect(season.currentCompetitionId).toBe("lck-rounds-3-4");
    expect(season.currentDateKey).toBe("2026-07-08");
    expect(competition?.status).toBe("active");
    expect(competition?.standings).toHaveLength(10);
    expect(competition?.standings[0].wins).toBe(18);
    expect(competition?.schedule).toHaveLength(lckRounds34TotalMatches);
  });

  it("starts Season Play-In after Rounds 3-4 regular stage and stores path seeds", () => {
    let season = activateLckRounds34(createRounds34ReadySeason());
    const competition = getRounds34Competition(season);

    season = completeLckRounds34IfFinished(
      recordCompletedMatches(season, competition.schedule.map(createBlueWinRecord)),
    );

    const completedCompetition = season.competitions.find(
      (candidate) => candidate.competitionId === "lck-rounds-3-4",
    );
    const asianGames = season.competitions.find(
      (candidate) => candidate.competitionId === "asian-games",
    );
    const legendStandings =
      completedCompetition?.standings
        .filter((entry) => entry.lckRoundsGroup === "legend")
        .sort((left, right) => left.rank - right.rank) ?? [];
    const riseStandings =
      completedCompetition?.standings
        .filter((entry) => entry.lckRoundsGroup === "rise")
        .sort((left, right) => left.rank - right.rank) ?? [];

    expect(completedCompetition?.status).toBe("active");
    expect(completedCompetition?.completed).toBe(false);
    expect(completedCompetition?.currentStageName).toBe(
      lckRounds34PostseasonStageNames.seasonPlayInRound1,
    );
    expect(completedCompetition?.qualifiedTeamIds).toEqual([
      ...legendStandings.slice(0, 5).map((entry) => entry.teamId),
      ...riseStandings.slice(0, 3).map((entry) => entry.teamId),
    ]);
    expect(completedCompetition?.qualifiedTeamNames).toHaveLength(8);
    expect(
      completedCompetition?.schedule.filter((match) =>
        isLckRounds34PostseasonStageName(match.stageName),
      ),
    ).toHaveLength(2);
    expect(asianGames?.status).toBe("locked");
  });

  it("runs Season Play-In and Playoffs, then stores the final top four", () => {
    let season: SeasonState = {
      ...activateLckRounds34(createRounds34ReadySeason()),
      worldsQualification: {
        status: "msi-seeds-decided" as const,
        sourceCompetitionId: "msi" as const,
        decidedAtDateKey: "2026-07-12",
        bonusLeagueLabels: ["LCK" as const, "LPL" as const],
        msiLeagueResults: [],
        lckSeeds: [],
        entrants: [],
        totalEntrants: 0,
      },
    };
    const regularCompetition = getRounds34Competition(season);

    season = completeLckRounds34IfFinished(
      recordCompletedMatches(
        season,
        regularCompetition.schedule.map(createBlueWinRecord),
      ),
    );

    [
      lckRounds34PostseasonStageNames.seasonPlayInRound1,
      lckRounds34PostseasonStageNames.seasonPlayInQualifier,
      lckRounds34PostseasonStageNames.playoffsRound1,
      lckRounds34PostseasonStageNames.playoffsRound2,
      lckRounds34PostseasonStageNames.lowerRound1,
      lckRounds34PostseasonStageNames.playoffsRound3,
      lckRounds34PostseasonStageNames.lowerRound2,
      lckRounds34PostseasonStageNames.lowerFinal,
      lckRounds34PostseasonStageNames.grandFinal,
    ].forEach((stageName) => {
      season = completeScheduledStage(season, stageName);
    });

    const completedCompetition = getRounds34Competition(season);
    const asianGames = season.competitions.find(
      (candidate) => candidate.competitionId === "asian-games",
    );
    const worlds = season.competitions.find(
      (candidate) => candidate.competitionId === "worlds",
    );
    const postseasonSchedule = completedCompetition.schedule.filter((match) =>
      isLckRounds34PostseasonStageName(match.stageName),
    );

    expect(completedCompetition.status).toBe("completed");
    expect(completedCompetition.completed).toBe(true);
    expect(completedCompetition.currentStageName).toBe("Playoffs Completed");
    expect(completedCompetition.qualifiedTeamIds).toHaveLength(4);
    expect(completedCompetition.qualifiedTeamNames).toHaveLength(4);
    expect(completedCompetition.winnerTeamId).toBe(
      completedCompetition.qualifiedTeamIds[0],
    );
    expect(postseasonSchedule).toHaveLength(13);
    expect(postseasonSchedule.every((match) => match.format === "bo5")).toBe(true);
    expect(postseasonSchedule.every((match) => match.fearlessEnabled)).toBe(true);
    expect(asianGames?.status).toBe("available");
    expect(season.worldsQualification?.status).toBe("lck-seeds-decided");
    expect(season.worldsQualification?.lckSeeds[3].status).toBe("qualified");
    expect(season.worldsQualification?.entrants).toHaveLength(20);
    expect(worlds?.qualifiedTeamIds).toHaveLength(20);
  });
});
