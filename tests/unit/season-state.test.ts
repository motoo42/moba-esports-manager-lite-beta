import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  completeStoveLeague,
  createInitialSeasonState,
  getSeasonProfile,
  isAsianGamesSeasonYear,
} from "../../src/domain/season";
import type { CompetitionState } from "../../src/types/game";

describe("createInitialSeasonState", () => {
  it("creates explicit season profiles for the 2026-2028 final project run", () => {
    const season2026 = getSeasonProfile(1);
    const season2027 = getSeasonProfile(2);
    const season2028 = getSeasonProfile(3);

    expect(season2026).toMatchObject({
      yearLabel: 2026,
      calendarType: "asian-games",
      hasAsianGames: true,
      postMsiCompetitionId: "lck-rounds-3-4",
      lateSeasonCompetitionId: "lck-rounds-3-4",
    });
    expect(season2026.competitionIds).toContain("asian-games");
    expect(season2027).toMatchObject({
      yearLabel: 2027,
      calendarType: "normal",
      hasAsianGames: false,
      postMsiCompetitionId: "lck-rounds-3-5",
      lateSeasonCompetitionId: "lck-rounds-3-5",
    });
    expect(season2027.competitionIds).toContain("lck-rounds-3-5");
    expect(season2027.competitionIds).not.toContain("asian-games");
    expect(season2028).toMatchObject({
      yearLabel: 2028,
      calendarType: "normal",
      hasAsianGames: false,
      postMsiCompetitionId: "lck-rounds-3-5",
    });
    expect(isAsianGamesSeasonYear(2026)).toBe(true);
    expect(isAsianGamesSeasonYear(2027)).toBe(false);
    expect(isAsianGamesSeasonYear(2028)).toBe(false);
    expect(isAsianGamesSeasonYear(2030)).toBe(true);
  });

  it("starts season 1 as a 2026 Asian Games season in stove league", () => {
    const seasonState = createInitialSeasonState({
      seasonNumber: 1,
      userTeamName: "T1",
    });

    expect(seasonState.yearLabel).toBe(2026);
    expect(seasonState.calendarType).toBe("asian-games");
    expect(seasonState.phase).toBe("stove-league");
    expect(seasonState.currentCompetitionId).toBeNull();
    expect(seasonState.currentDateKey).toBe("2026-01-01");
    expect(seasonState.currentDateLabel).toBe("2026 Stove League Week 1");
    expect(seasonState.progressStatus).toBe("idle");
    expect(seasonState.stoveLeague.status).toBe("active");
    expect(seasonState.nextMatchIds).toEqual([]);
    expect(
      seasonState.competitions.map((competition) => competition.competitionId),
    ).toEqual([
      "lck-cup",
      "first-stand",
      "lck-rounds-1-2",
      "msi",
      "lck-rounds-3-4",
      "asian-games",
      "worlds",
    ]);
  });

  it("starts seasons 2 and 3 as normal seasons with Rounds 3-5 and no Asian Games state", () => {
    const season2027 = createInitialSeasonState({
      seasonNumber: 2,
      userTeamName: "T1",
    });
    const season2028 = createInitialSeasonState({
      seasonNumber: 3,
      userTeamName: "T1",
    });

    expect(season2027.yearLabel).toBe(2027);
    expect(season2027.calendarType).toBe("normal");
    expect(season2027.asianGames).toBeUndefined();
    expect(
      season2027.competitions.map((competition) => competition.competitionId),
    ).toEqual([
      "lck-cup",
      "first-stand",
      "lck-rounds-1-2",
      "msi",
      "lck-rounds-3-5",
      "worlds",
    ]);
    expect(season2028.yearLabel).toBe(2028);
    expect(season2028.calendarType).toBe("normal");
    expect(
      season2028.competitions.some(
        (competition) => competition.competitionId === "asian-games",
      ),
    ).toBe(false);
  });

  it("routes a completed normal-season MSI into the Rounds 3-5 setup step", () => {
    const career = createInitialCareer("T1");
    const normalSeason = createInitialSeasonState({
      seasonNumber: 2,
      userTeamName: "T1",
    });
    const result = progressCareer({
      ...career,
      currentSeason: 2,
      seasonState: {
        ...normalSeason,
        phase: "competition",
        currentCompetitionId: "msi",
        currentDateKey: "2027-06-22",
        currentDateLabel: "2027 MSI Completed",
        progressStatus: "match-review",
        competitions: normalSeason.competitions.map(
          (competition): CompetitionState =>
            competition.competitionId === "msi"
              ? {
                  ...competition,
                  status: "completed",
                  currentStageName: "Completed",
                  completed: true,
                }
              : competition,
        ),
      },
    });
    const lckRounds35 = result.career.seasonState.competitions.find(
      (competition) => competition.competitionId === "lck-rounds-3-5",
    );

    expect(result.career.seasonState.currentCompetitionId).toBe("lck-rounds-3-5");
    expect(result.career.seasonState.currentDateKey).toBe("2027-07-07");
    expect(result.career.seasonState.asianGames).toBeUndefined();
    expect(lckRounds35?.status).toBe("active");
    expect(lckRounds35?.currentStageName).toBe("Legend / Rise Groups");
    expect(lckRounds35?.standings).toHaveLength(10);
    expect(lckRounds35?.schedule).toHaveLength(60);
  });

  it("keeps LCK Cup inactive until stove league is completed", () => {
    const seasonState = createInitialSeasonState({
      seasonNumber: 1,
      userTeamName: "T1",
    });
    const lckCup = seasonState.competitions.find(
      (competition) => competition.competitionId === "lck-cup",
    );

    expect(lckCup?.status).toBe("locked");

    const activeSeason = completeStoveLeague(seasonState);
    const activeLckCup = activeSeason.competitions.find(
      (competition) => competition.competitionId === "lck-cup",
    );

    expect(activeSeason.phase).toBe("competition");
    expect(activeSeason.currentCompetitionId).toBe("lck-cup");
    expect(activeSeason.currentDateKey).toBe("2026-01-14");
    expect(activeSeason.currentDateLabel).toBe("2026년 1월 14일 (수)");
    expect(activeSeason.progressStatus).toBe("idle");
    expect(activeSeason.stoveLeague.completed).toBe(true);
    expect(activeLckCup?.status).toBe("active");
    expect(activeLckCup?.schedule).toHaveLength(25);
    expect(activeLckCup?.schedule[0].scheduledDate).toBe("2026-01-14");
    expect(activeSeason.nextMatchIds).toHaveLength(0);
    expect(activeLckCup?.standings.filter((entry) => entry.lckCupGroup === "baron")).toHaveLength(5);
    expect(activeLckCup?.standings.filter((entry) => entry.lckCupGroup === "elder")).toHaveLength(5);
  });

  it("creates fixed 10-team LCK standings with real team names", () => {
    const seasonState = createInitialSeasonState({
      seasonNumber: 1,
      userTeamName: "T1",
    });
    const lckCup = seasonState.competitions.find(
      (competition) => competition.competitionId === "lck-cup",
    );

    expect(lckCup?.standings).toHaveLength(10);
    expect(lckCup?.standings.map((entry) => entry.teamName)).toContain("Hanjin BRION");
    expect(lckCup?.standings.map((entry) => entry.teamName)).toContain("DN SOOPers");
    expect(lckCup?.standings.find((entry) => entry.teamName === "T1")?.isUserTeam).toBe(true);
  });

  it("connects the running season state to a new career save", () => {
    const career = createInitialCareer("T1");

    expect(career.seasonState.seasonNumber).toBe(1);
    expect(career.seasonState.phase).toBe("stove-league");
    expect(career.seasonState.competitions).toHaveLength(7);
  });
});
