import { describe, expect, it } from "vitest";
import {
  activateLckRounds35,
  completeLckRounds35IfFinished,
  createInitialLckStandings,
  createInitialSeasonState,
  createLckRounds35Setup,
  isLckRounds35PostseasonStageName,
  lckRounds35MatchesPerTeam,
  lckRounds35PostseasonStageNames,
  lckRounds35RegularWeeks,
  lckRounds35StageNames,
  lckRounds35TotalMatches,
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
  const blueWins = match.format === "bo5" ? 3 : 2;

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
      blueWins,
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

function createRounds35ReadySeason() {
  const carriedStandings = createCarriedRounds12Standings();
  const season = createInitialSeasonState({
    seasonNumber: 2,
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

function getRounds35Competition(season: SeasonState) {
  const competition = season.competitions.find(
    (candidate) => candidate.competitionId === "lck-rounds-3-5",
  );

  if (!competition) {
    throw new Error("LCK Rounds 3-5 state was not created.");
  }

  return competition;
}

function completeScheduledStage(season: SeasonState, stageName: string) {
  const competition = getRounds35Competition(season);
  const scheduledMatches = competition.schedule.filter(
    (match) => match.stageName === stageName && match.status === "scheduled",
  );

  if (scheduledMatches.length === 0) {
    throw new Error(`No scheduled matches found for ${stageName}.`);
  }

  return completeLckRounds35IfFinished(
    recordCompletedMatches(season, scheduledMatches.map(createBlueWinRecord)),
  );
}

describe("LCK Rounds 3-5 format", () => {
  it("splits Rounds 1-2 standings into Legend and Rise groups with carry-over records", () => {
    const carriedStandings = createCarriedRounds12Standings();
    const setup = createLckRounds35Setup(carriedStandings, {
      calendarType: "normal",
      year: 2027,
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

  it("creates an 8-week group-internal triple round robin with 60 BO3 Fearless series", () => {
    const setup = createLckRounds35Setup(createCarriedRounds12Standings(), {
      calendarType: "normal",
      year: 2027,
    });
    const matchesByTeam = new Map<string, number>();
    const groupByTeamId = new Map(
      setup.standings.map((entry) => [entry.teamId, entry.lckRoundsGroup]),
    );

    expect(setup.schedule).toHaveLength(lckRounds35TotalMatches);
    expect(setup.schedule.every((match) => match.competitionId === "lck-rounds-3-5")).toBe(
      true,
    );
    expect(setup.schedule.every((match) => match.format === "bo3")).toBe(true);
    expect(setup.schedule.every((match) => match.fearlessEnabled)).toBe(true);
    expect(new Set(setup.schedule.map((match) => match.week))).toEqual(
      new Set([1, 2, 3, 4, 5, 6, 7, 8]),
    );
    expect(
      setup.schedule.filter(
        (match) => match.stageName === lckRounds35StageNames.legend,
      ),
    ).toHaveLength(30);
    expect(
      setup.schedule.filter((match) => match.stageName === lckRounds35StageNames.rise),
    ).toHaveLength(30);

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
      expect(matchesByTeam.get(team.teamId)).toBe(lckRounds35MatchesPerTeam);
    });
    expect(Math.max(...setup.schedule.map((match) => match.week))).toBe(
      lckRounds35RegularWeeks,
    );
    expect(setup.schedule[0].scheduledDate).toBe("2027-07-07");
  });

  it("activates Rounds 3-5 from the carried LCK table", () => {
    const season = activateLckRounds35(createRounds35ReadySeason());
    const competition = getRounds35Competition(season);

    expect(season.currentCompetitionId).toBe("lck-rounds-3-5");
    expect(season.currentDateKey).toBe("2027-07-07");
    expect(competition.status).toBe("active");
    expect(competition.standings).toHaveLength(10);
    expect(competition.standings[0].wins).toBe(18);
    expect(competition.schedule).toHaveLength(lckRounds35TotalMatches);
  });

  it("starts Season Play-In after Rounds 3-5 regular stage and stores path seeds", () => {
    let season = activateLckRounds35(createRounds35ReadySeason());
    const competition = getRounds35Competition(season);

    season = completeLckRounds35IfFinished(
      recordCompletedMatches(season, competition.schedule.map(createBlueWinRecord)),
    );

    const completedCompetition = getRounds35Competition(season);
    const worlds = season.competitions.find(
      (candidate) => candidate.competitionId === "worlds",
    );
    const legendStandings = completedCompetition.standings
      .filter((entry) => entry.lckRoundsGroup === "legend")
      .sort((left, right) => left.rank - right.rank);
    const riseStandings = completedCompetition.standings
      .filter((entry) => entry.lckRoundsGroup === "rise")
      .sort((left, right) => left.rank - right.rank);

    expect(completedCompetition.status).toBe("active");
    expect(completedCompetition.completed).toBe(false);
    expect(completedCompetition.currentStageName).toBe(
      lckRounds35PostseasonStageNames.seasonPlayInRound1,
    );
    expect(completedCompetition.qualifiedTeamIds).toEqual([
      ...legendStandings.slice(0, 5).map((entry) => entry.teamId),
      ...riseStandings.slice(0, 3).map((entry) => entry.teamId),
    ]);
    expect(completedCompetition.qualifiedTeamNames).toHaveLength(8);
    expect(
      completedCompetition.schedule.filter((match) =>
        isLckRounds35PostseasonStageName(match.stageName),
      ),
    ).toHaveLength(2);
    expect(worlds?.status).toBe("locked");
  });

  it("runs Season Play-In and Playoffs, then stores final top four and Worlds entrants", () => {
    let season: SeasonState = {
      ...activateLckRounds35(createRounds35ReadySeason()),
      worldsQualification: {
        status: "msi-seeds-decided" as const,
        sourceCompetitionId: "msi" as const,
        decidedAtDateKey: "2027-07-12",
        bonusLeagueLabels: ["LCK" as const, "LPL" as const],
        msiLeagueResults: [],
        lckSeeds: [],
        entrants: [],
        totalEntrants: 0,
      },
    };
    const regularCompetition = getRounds35Competition(season);

    season = completeLckRounds35IfFinished(
      recordCompletedMatches(
        season,
        regularCompetition.schedule.map(createBlueWinRecord),
      ),
    );

    [
      lckRounds35PostseasonStageNames.seasonPlayInRound1,
      lckRounds35PostseasonStageNames.seasonPlayInQualifier,
      lckRounds35PostseasonStageNames.playoffsRound1,
      lckRounds35PostseasonStageNames.playoffsRound2,
      lckRounds35PostseasonStageNames.lowerRound1,
      lckRounds35PostseasonStageNames.playoffsRound3,
      lckRounds35PostseasonStageNames.lowerRound2,
      lckRounds35PostseasonStageNames.lowerFinal,
      lckRounds35PostseasonStageNames.grandFinal,
    ].forEach((stageName) => {
      season = completeScheduledStage(season, stageName);
    });

    const completedCompetition = getRounds35Competition(season);
    const worlds = season.competitions.find(
      (candidate) => candidate.competitionId === "worlds",
    );
    const postseasonSchedule = completedCompetition.schedule.filter((match) =>
      isLckRounds35PostseasonStageName(match.stageName),
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
    expect(season.worldsQualification?.status).toBe("lck-seeds-decided");
    expect(season.worldsQualification?.lckSeeds[3].status).toBe("qualified");
    expect(season.worldsQualification?.entrants).toHaveLength(20);
    expect(worlds?.status).toBe("available");
    expect(worlds?.qualifiedTeamIds).toHaveLength(20);
  });
});
