import { describe, expect, it } from "vitest";
import {
  completeLckRounds12IfFinished,
  createInitialLckStandings,
  createInitialSeasonState,
  createLckRounds12Schedule,
  getLckRounds12Finalists,
  lckRounds12PlayoffStageNames,
  lckRounds12MatchesPerTeam,
  lckRounds12RegularWeeks,
  transitionFromLckCupToLckRounds12,
} from "../../src/domain/season";
import { recordCompletedMatches } from "../../src/domain/season/progressSeason";
import type { MatchRecord, MatchSchedule } from "../../src/types/game";

function createBlueWinRecord(match: MatchSchedule, index: number): MatchRecord {
  const blueWins = match.format === "bo5" ? 3 : match.format === "bo3" ? 2 : 1;

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

describe("LCK Rounds 1-2 format", () => {
  it("creates a 9-week double round robin with 90 BO3 series", () => {
    const standings = createInitialLckStandings("T1");
    const schedule = createLckRounds12Schedule(standings, {
      calendarType: "asian-games",
      year: 2026,
    });

    expect(schedule).toHaveLength(90);
    expect(schedule.every((match) => match.format === "bo3")).toBe(true);
    expect(schedule.every((match) => !match.fearlessEnabled)).toBe(true);

    for (let week = 1; week <= lckRounds12RegularWeeks; week += 1) {
      const weekMatches = schedule.filter((match) => match.week === week);

      expect(weekMatches).toHaveLength(10);

      standings.forEach((team) => {
        const appearances = weekMatches.filter(
          (match) =>
            match.blueTeamId === team.teamId || match.redTeamId === team.teamId,
        );

        expect(appearances).toHaveLength(2);
      });
    }
  });

  it("gives every team 18 matches and places two series per match day", () => {
    const standings = createInitialLckStandings("T1");
    const schedule = createLckRounds12Schedule(standings, {
      calendarType: "asian-games",
      year: 2026,
    });
    const matchesByTeam = new Map<string, number>();
    const matchesByDate = new Map<string, number>();

    schedule.forEach((match) => {
      matchesByTeam.set(
        match.blueTeamId,
        (matchesByTeam.get(match.blueTeamId) ?? 0) + 1,
      );
      matchesByTeam.set(
        match.redTeamId,
        (matchesByTeam.get(match.redTeamId) ?? 0) + 1,
      );
      matchesByDate.set(
        match.scheduledDate ?? "",
        (matchesByDate.get(match.scheduledDate ?? "") ?? 0) + 1,
      );
    });

    standings.forEach((team) => {
      expect(matchesByTeam.get(team.teamId)).toBe(lckRounds12MatchesPerTeam);
    });
    expect(schedule[0].scheduledDate).toBe("2026-04-01");
    expect(schedule[schedule.length - 1].scheduledDate).toBe("2026-05-31");
    expect([...matchesByDate.values()].every((count) => count === 2)).toBe(true);
  });

  it("activates playoffs and stores the top six playoff qualifiers after the regular season", () => {
    const season = transitionFromLckCupToLckRounds12(
      createInitialSeasonState({
        seasonNumber: 1,
        userTeamName: "T1",
      }),
    );
    const lckRounds = season.competitions.find(
      (competition) => competition.competitionId === "lck-rounds-1-2",
    );

    if (!lckRounds) {
      throw new Error("LCK Rounds 1-2 state was not created.");
    }

    const seasonWithRecords = recordCompletedMatches(
      season,
      lckRounds.schedule.map(createBlueWinRecord),
    );
    const playoffSeason = completeLckRounds12IfFinished(seasonWithRecords);
    const playoffRounds = playoffSeason.competitions.find(
      (competition) => competition.competitionId === "lck-rounds-1-2",
    );

    expect(playoffRounds?.status).toBe("active");
    expect(playoffRounds?.completed).toBe(false);
    expect(playoffRounds?.currentStageName).toBe(lckRounds12PlayoffStageNames.round1);
    expect(playoffRounds?.qualifiedTeamIds).toHaveLength(6);
    expect(playoffRounds?.qualifiedTeamNames).toHaveLength(6);
    expect(
      playoffRounds?.schedule.filter(
        (match) => match.stageName === lckRounds12PlayoffStageNames.round1,
      ),
    ).toHaveLength(2);
    expect(
      playoffSeason.scheduledMatches.filter(
        (match) => match.stageName === lckRounds12PlayoffStageNames.round1,
      ),
    ).toHaveLength(2);
  });

  it("runs the Rounds 1-2 playoff bracket and stores winner and runner-up", () => {
    let season = transitionFromLckCupToLckRounds12(
      createInitialSeasonState({
        seasonNumber: 1,
        userTeamName: "T1",
      }),
    );
    const lckRounds = season.competitions.find(
      (competition) => competition.competitionId === "lck-rounds-1-2",
    );

    if (!lckRounds) {
      throw new Error("LCK Rounds 1-2 state was not created.");
    }

    season = completeLckRounds12IfFinished(
      recordCompletedMatches(
        season,
        lckRounds.schedule.map(createBlueWinRecord),
      ),
    );

    const playStage = (stageName: string) => {
      const activeRounds = season.competitions.find(
        (competition) => competition.competitionId === "lck-rounds-1-2",
      );
      const stageMatches =
        activeRounds?.schedule.filter(
          (match) => match.stageName === stageName && match.status === "scheduled",
        ) ?? [];

      season = completeLckRounds12IfFinished(
        recordCompletedMatches(season, stageMatches.map(createBlueWinRecord)),
      );
    };

    playStage(lckRounds12PlayoffStageNames.round1);
    playStage(lckRounds12PlayoffStageNames.semifinals);
    playStage(lckRounds12PlayoffStageNames.final);

    const completedRounds = season.competitions.find(
      (competition) => competition.competitionId === "lck-rounds-1-2",
    );
    const finalists = completedRounds
      ? getLckRounds12Finalists(completedRounds, season.matchRecords)
      : [];

    expect(completedRounds?.status).toBe("completed");
    expect(completedRounds?.completed).toBe(true);
    expect(completedRounds?.currentStageName).toBe("Playoffs Completed");
    expect(completedRounds?.winnerTeamId).toBeDefined();
    expect(completedRounds?.winnerTeamName).toBeDefined();
    expect(completedRounds?.qualifiedTeamIds).toHaveLength(2);
    expect(completedRounds?.qualifiedTeamNames).toHaveLength(2);
    expect(finalists).toHaveLength(2);
    expect(completedRounds?.qualifiedTeamIds[0]).toBe(completedRounds?.winnerTeamId);
  });
});
