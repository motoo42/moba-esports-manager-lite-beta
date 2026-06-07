import { describe, expect, it } from "vitest";
import { samplePlayers } from "../../src/data/samplePlayers";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  activateAsianGames,
  advanceAsianGamesAfterCompletedMatches,
  applyAsianGamesGoldRewardToPlayers,
  asianGamesKoreaTeamId,
  asianGamesMatchIds,
  asianGamesStageNames,
  createInitialSeasonState,
  recordCompletedMatches,
  selectAsianGamesRoster,
  setAsianGamesPlayMode,
} from "../../src/domain/season";
import { advanceToNextDay } from "../../src/domain/season/progressSeason";
import type { MatchRecord, MatchSchedule, SeasonState } from "../../src/types/game";

function createNeutralBlueWinRecord(
  match: MatchSchedule,
  index: number,
): MatchRecord {
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

function getAsianGames(season: SeasonState) {
  const competition = season.competitions.find(
    (candidate) => candidate.competitionId === "asian-games",
  );

  if (!competition) {
    throw new Error("Asian Games competition is missing.");
  }

  return competition;
}

function getScheduledStage(season: SeasonState, stageName: string) {
  return getAsianGames(season).schedule.filter(
    (match) => match.stageName === stageName && match.status === "scheduled",
  );
}

function playScheduledMatches(season: SeasonState, matches: MatchSchedule[]) {
  return advanceAsianGamesAfterCompletedMatches(
    recordCompletedMatches(season, matches.map(createNeutralBlueWinRecord)),
  );
}

function createActiveAsianGamesSeason(currentDateKey = "2026-08-24") {
  const base = createInitialSeasonState({
    seasonNumber: 1,
    userTeamName: "T1",
  });

  return activateAsianGames(
    {
      ...base,
      phase: "competition",
      currentDateKey,
      currentCompetitionId: "lck-rounds-3-4",
    },
    samplePlayers,
  );
}

function createAsianGamesCareer(playMode: "manual" | "auto") {
  const career = createInitialCareer("T1");
  const activeSeason = createActiveAsianGamesSeason();
  const promptSeason = advanceToNextDay(activeSeason);

  return {
    ...career,
    seasonState: setAsianGamesPlayMode(promptSeason, playMode),
  };
}

describe("Asian Games format", () => {
  it("selects five role starters and one sixth player from LCK form tiebreakers", () => {
    const roster = selectAsianGamesRoster(samplePlayers);

    expect(roster).toHaveLength(6);
    expect(roster.filter((member) => member.isStarter).map((member) => member.role))
      .toEqual(["top", "jungle", "mid", "bot", "support"]);
    expect(roster.map((member) => member.playerName)).toEqual([
      "Kiin",
      "Canyon",
      "Faker",
      "Ruler",
      "Delight",
      "Kanavi",
    ]);
    expect(roster[5].selectionReason).toBe("sixth-best-form");
  });

  it("stores fixed selection and prompt dates, with late-transition fallback", () => {
    const season = createActiveAsianGamesSeason();

    expect(season.currentCompetitionId).toBe("asian-games");
    expect(season.currentDateKey).toBe("2026-09-01");
    expect(season.asianGames?.status).toBe("roster-selected");
    expect(season.asianGames?.playChoiceDateKey).toBe("2026-09-02");
    expect(season.asianGames?.tournamentStartDateKey).toBe("2026-09-08");

    const prompted = advanceToNextDay(season);

    expect(prompted.currentDateKey).toBe("2026-09-02");
    expect(prompted.asianGames?.status).toBe("decision-pending");

    const lateSeason = createActiveAsianGamesSeason("2026-09-05");

    expect(lateSeason.asianGames?.rosterSelectedDateKey).toBe("2026-09-05");
    expect(lateSeason.asianGames?.playChoiceDateKey).toBe("2026-09-06");
  });

  it("routes only Korea matches to match-preview when direct play is selected", () => {
    let career = createAsianGamesCareer("manual");

    for (let index = 0; index < 6; index += 1) {
      career = progressCareer(career).career;
    }

    expect(career.seasonState.currentDateKey).toBe("2026-09-08");
    expect(career.seasonState.progressStatus).toBe("match-preview");
    expect(career.seasonState.nextMatchIds).toContain(
      asianGamesMatchIds.quarterfinalA,
    );
  });

  it("auto-runs Korea matches as neutral AI matches when auto mode is selected", () => {
    let career = createAsianGamesCareer("auto");

    for (let index = 0; index < 6; index += 1) {
      career = progressCareer(career).career;
    }

    expect(career.seasonState.currentDateKey).toBe("2026-09-08");
    expect(career.seasonState.progressStatus).toBe("idle");

    career = progressCareer(career).career;

    const koreaQuarterfinal = career.seasonState.matchRecords.find(
      (record) => record.scheduleId === asianGamesMatchIds.quarterfinalA,
    );

    expect(koreaQuarterfinal?.userResult).toBe("none");
    expect(career.seasonState.currentDateKey).toBe("2026-09-09");
  });

  it("generates quarterfinals, semifinals, bronze match, and BO5 final", () => {
    let season = createActiveAsianGamesSeason();
    const quarterfinals = getScheduledStage(
      season,
      asianGamesStageNames.quarterfinals,
    );

    expect(quarterfinals).toHaveLength(4);
    expect(quarterfinals.map((match) => `${match.blueTeamName} vs ${match.redTeamName}`))
      .toEqual([
        "대한민국 vs 마카오",
        "일본 vs 홍콩",
        "중국 vs 인도",
        "대만 vs 베트남",
      ]);

    season = playScheduledMatches(season, quarterfinals);

    const semifinals = getScheduledStage(season, asianGamesStageNames.semifinals);

    expect(semifinals).toHaveLength(2);
    expect(semifinals.every((match) => match.format === "bo3")).toBe(true);

    season = playScheduledMatches(season, semifinals);

    const bronzeAndFinal = [
      ...getScheduledStage(season, asianGamesStageNames.bronzeMedal),
      ...getScheduledStage(season, asianGamesStageNames.final),
    ];

    expect(bronzeAndFinal).toHaveLength(2);
    expect(
      bronzeAndFinal.find((match) => match.id === asianGamesMatchIds.bronzeMedal)
        ?.format,
    ).toBe("bo3");
    expect(
      bronzeAndFinal.find((match) => match.id === asianGamesMatchIds.final)?.format,
    ).toBe("bo5");
  });

  it("stores medals and grants military exemption to Korea's six-player roster on gold", () => {
    let season = createActiveAsianGamesSeason();

    season = playScheduledMatches(
      season,
      getScheduledStage(season, asianGamesStageNames.quarterfinals),
    );
    season = playScheduledMatches(
      season,
      getScheduledStage(season, asianGamesStageNames.semifinals),
    );
    season = playScheduledMatches(season, [
      ...getScheduledStage(season, asianGamesStageNames.bronzeMedal),
      ...getScheduledStage(season, asianGamesStageNames.final),
    ]);

    expect(season.asianGames?.medals?.goldTeamId).toBe(asianGamesKoreaTeamId);
    expect(getAsianGames(season).status).toBe("completed");
    expect(
      getAsianGames(season).qualifiedTeamNames.slice(0, 3),
    ).toEqual(["대한민국", "중국", "일본"]);

    const rewardedPlayers = applyAsianGamesGoldRewardToPlayers({
      players: samplePlayers,
      seasonState: season,
    });
    const rosterIds = new Set(
      season.asianGames?.roster.map((member) => member.playerId) ?? [],
    );

    expect(
      rewardedPlayers
        .filter((player) => rosterIds.has(player.id))
        .every((player) => player.militaryServiceStatus === "completed"),
    ).toBe(true);
    expect(
      rewardedPlayers
        .filter((player) => !rosterIds.has(player.id))
        .some((player) => player.militaryServiceStatus === "completed"),
    ).toBe(false);
  });
});
