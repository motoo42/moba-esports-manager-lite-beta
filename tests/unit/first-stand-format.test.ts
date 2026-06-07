import { describe, expect, it } from "vitest";
import { sampleOpponents } from "../../src/data/sampleOpponents";
import {
  activateFirstStand,
  advanceFirstStandAfterCompletedMatches,
  completeStoveLeague,
  createInitialSeasonState,
  firstStandMatchIds,
  firstStandStageNames,
  getFirstStandGroupStandings,
  transitionFromFirstStandToLckRounds12,
} from "../../src/domain/season";
import { recordCompletedMatches } from "../../src/domain/season/progressSeason";
import type { MatchRecord, MatchSchedule, SeasonState } from "../../src/types/game";

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
    score: {
      blueWins,
      redWins,
    },
    userResult:
      match.blueTeamId === "t1"
        ? "win"
        : match.redTeamId === "t1"
          ? "loss"
          : "none",
    log: [`${match.blueTeamName} beat ${match.redTeamName}`],
    createdAtTurn: index + 1,
  };
}

function createSeasonAfterLckCupFinal(): SeasonState {
  const activeSeason = completeStoveLeague(
    createInitialSeasonState({
      seasonNumber: 1,
      userTeamName: "T1",
    }),
  );

  return {
    ...activeSeason,
    currentCompetitionId: "lck-cup",
    competitions: activeSeason.competitions.map((competition) =>
      competition.competitionId === "lck-cup"
        ? {
            ...competition,
            status: "completed",
            currentStageName: "Completed",
            qualifiedTeamIds: ["gen-g", "t1"],
            qualifiedTeamNames: ["Gen.G", "T1"],
            winnerTeamId: "t1",
            winnerTeamName: "T1",
            completed: true,
          }
        : competition,
    ),
  };
}

function createActiveFirstStandSeason() {
  return activateFirstStand(createSeasonAfterLckCupFinal(), sampleOpponents);
}

function getFirstStand(season: SeasonState) {
  const firstStand = season.competitions.find(
    (competition) => competition.competitionId === "first-stand",
  );

  if (!firstStand) {
    throw new Error("First Stand state was not created.");
  }

  return firstStand;
}

describe("First Stand format", () => {
  it("activates an 8-team First Stand after LCK Cup with fixed groups", () => {
    const season = createActiveFirstStandSeason();
    const firstStand = getFirstStand(season);
    const groupA = getFirstStandGroupStandings(firstStand, [], "A");
    const groupB = getFirstStandGroupStandings(firstStand, [], "B");

    expect(season.currentCompetitionId).toBe("first-stand");
    expect(season.currentDateKey).toBe("2026-03-10");
    expect(firstStand.status).toBe("active");
    expect(firstStand.completed).toBe(false);
    expect(firstStand.standings).toHaveLength(8);
    expect(firstStand.schedule).toHaveLength(12);
    expect(firstStand.schedule.every((match) => match.format === "bo1")).toBe(true);
    expect(firstStand.schedule[0].scheduledDate).toBe("2026-03-10");
    expect(firstStand.schedule[firstStand.schedule.length - 1].scheduledDate).toBe(
      "2026-03-15",
    );
    expect(groupA.map((entry) => entry.teamName)).toEqual([
      "T1",
      "Top Esports",
      "G2 Esports",
      "LOUD",
    ]);
    expect(groupB.map((entry) => entry.teamName)).toEqual([
      "Gen.G",
      "Bilibili Gaming",
      "Cloud9",
      "PSG Talon",
    ]);
  });

  it("creates semifinals, final, and stores First Stand winner and runner-up", () => {
    let season = createActiveFirstStandSeason();
    let firstStand = getFirstStand(season);
    const groupMatches = firstStand.schedule.filter(
      (match) =>
        match.stageName === firstStandStageNames.groupA ||
        match.stageName === firstStandStageNames.groupB,
    );

    season = advanceFirstStandAfterCompletedMatches(
      recordCompletedMatches(season, groupMatches.map(createBlueWinRecord)),
    );
    firstStand = getFirstStand(season);

    const semifinals = firstStand.schedule.filter(
      (match) => match.stageName === firstStandStageNames.semifinals,
    );

    expect(semifinals).toHaveLength(2);
    expect(semifinals[0].id).toBe(firstStandMatchIds.semifinalA1VsB2);
    expect(semifinals[0].blueTeamName).toBe("T1");
    expect(semifinals[0].redTeamName).toBe("Bilibili Gaming");
    expect(semifinals[0].scheduledDate).toBe("2026-03-17");
    expect(semifinals[1].blueTeamName).toBe("Gen.G");
    expect(semifinals[1].redTeamName).toBe("Top Esports");
    expect(semifinals[1].scheduledDate).toBe("2026-03-18");

    season = advanceFirstStandAfterCompletedMatches(
      recordCompletedMatches(season, semifinals.map(createBlueWinRecord)),
    );
    firstStand = getFirstStand(season);

    const final = firstStand.schedule.find(
      (match) => match.id === firstStandMatchIds.final,
    );

    expect(final?.blueTeamName).toBe("T1");
    expect(final?.redTeamName).toBe("Gen.G");
    expect(final?.format).toBe("bo5");
    expect(final?.scheduledDate).toBe("2026-03-20");

    if (!final) {
      throw new Error("First Stand final was not scheduled.");
    }

    season = advanceFirstStandAfterCompletedMatches(
      recordCompletedMatches(season, [createBlueWinRecord(final, 99)]),
    );
    firstStand = getFirstStand(season);

    expect(firstStand.status).toBe("completed");
    expect(firstStand.completed).toBe(true);
    expect(firstStand.winnerTeamId).toBe("t1");
    expect(firstStand.winnerTeamName).toBe("T1");
    expect(firstStand.qualifiedTeamIds).toEqual(["t1", "gen-g"]);
    expect(firstStand.qualifiedTeamNames).toEqual(["T1", "Gen.G"]);
  });

  it("transitions from completed First Stand to LCK Rounds 1-2", () => {
    let season = createActiveFirstStandSeason();
    let firstStand = getFirstStand(season);

    season = advanceFirstStandAfterCompletedMatches(
      recordCompletedMatches(season, firstStand.schedule.map(createBlueWinRecord)),
    );
    firstStand = getFirstStand(season);
    season = advanceFirstStandAfterCompletedMatches(
      recordCompletedMatches(
        season,
        firstStand.schedule
          .filter((match) => match.stageName === firstStandStageNames.semifinals)
          .map(createBlueWinRecord),
      ),
    );
    firstStand = getFirstStand(season);

    const final = firstStand.schedule.find(
      (match) => match.id === firstStandMatchIds.final,
    );

    if (!final) {
      throw new Error("First Stand final was not scheduled.");
    }

    season = advanceFirstStandAfterCompletedMatches(
      recordCompletedMatches(season, [createBlueWinRecord(final, 99)]),
    );

    const lckRoundsSeason = transitionFromFirstStandToLckRounds12(season);
    const lckRounds = lckRoundsSeason.competitions.find(
      (competition) => competition.competitionId === "lck-rounds-1-2",
    );

    expect(lckRoundsSeason.currentCompetitionId).toBe("lck-rounds-1-2");
    expect(lckRoundsSeason.currentDateKey).toBe("2026-04-01");
    expect(lckRounds?.status).toBe("active");
    expect(lckRounds?.schedule).toHaveLength(90);
  });
});
