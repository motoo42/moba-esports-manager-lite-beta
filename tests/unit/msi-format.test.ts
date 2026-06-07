import { describe, expect, it } from "vitest";
import { sampleOpponents } from "../../src/data/sampleOpponents";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  advanceMsiAfterCompletedMatches,
  createInitialLckStandings,
  createInitialSeasonState,
  msiMatchIds,
  msiStageNames,
  transitionFromLckRounds12ToMsi,
} from "../../src/domain/season";
import { recordCompletedMatches } from "../../src/domain/season/progressSeason";
import type {
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  SeasonState,
} from "../../src/types/game";

function createBlueWinRecord(match: MatchSchedule, index: number): MatchRecord {
  const blueWins = match.format === "bo5" ? 3 : match.format === "bo3" ? 2 : 1;
  const redWins = match.format === "bo5" ? 2 : match.format === "bo3" ? 1 : 0;

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

const firstStandTeamNames: Record<string, string> = {
  "first-stand-lpl-1": "Bilibili Gaming",
  "first-stand-lec-1": "G2 Esports",
  "first-stand-cblol-1": "LOUD",
  t1: "T1",
};

function createMsiReadySeason({
  firstStandRunnerUpTeamId = "t1",
  firstStandWinnerTeamId = "first-stand-lpl-1",
}: {
  firstStandRunnerUpTeamId?: string;
  firstStandWinnerTeamId?: string;
} = {}): SeasonState {
  const season = createInitialSeasonState({
    seasonNumber: 1,
    userTeamName: "T1",
  });
  const lckStandings = createInitialLckStandings("T1");

  return {
    ...season,
    phase: "competition",
    currentCompetitionId: "lck-rounds-1-2",
    competitions: season.competitions.map((competition) => {
      if (competition.competitionId === "first-stand") {
        return {
          ...competition,
          status: "completed",
          currentStageName: "Completed",
          standings: [
            {
              teamId: firstStandWinnerTeamId,
              teamName: firstStandTeamNames[firstStandWinnerTeamId],
              rank: 1,
              initialSeed: 1,
              wins: 0,
              losses: 0,
              matchWins: 0,
              matchLosses: 0,
              setWins: 0,
              setLosses: 0,
              winRate: 0,
              isUserTeam: false,
            },
          ],
          qualifiedTeamIds: [firstStandWinnerTeamId, firstStandRunnerUpTeamId],
          qualifiedTeamNames: [
            firstStandTeamNames[firstStandWinnerTeamId],
            firstStandTeamNames[firstStandRunnerUpTeamId],
          ],
          winnerTeamId: firstStandWinnerTeamId,
          winnerTeamName: firstStandTeamNames[firstStandWinnerTeamId],
          completed: true,
        };
      }

      if (competition.competitionId === "lck-rounds-1-2") {
        return {
          ...competition,
          status: "completed",
          currentStageName: "Playoffs Completed",
          standings: lckStandings,
          qualifiedTeamIds: ["t1", "gen-g"],
          qualifiedTeamNames: ["T1", "Gen.G"],
          winnerTeamId: "t1",
          winnerTeamName: "T1",
          completed: true,
        };
      }

      return competition;
    }),
  };
}

function getMsi(season: SeasonState): CompetitionState {
  const msi = season.competitions.find(
    (competition) => competition.competitionId === "msi",
  );

  if (!msi) {
    throw new Error("MSI state was not created.");
  }

  return msi;
}

function createActiveMsiSeason() {
  return transitionFromLckRounds12ToMsi(createMsiReadySeason(), sampleOpponents);
}

function getPlayInTeamNames(season: SeasonState) {
  return getMsi(season).schedule.flatMap((match) => [
    match.blueTeamName,
    match.redTeamName,
  ]);
}

function getScheduledStage(season: SeasonState, stageName: string) {
  return getMsi(season).schedule.filter(
    (match) => match.stageName === stageName && match.status === "scheduled",
  );
}

function playMatches(season: SeasonState, matches: MatchSchedule[]) {
  return advanceMsiAfterCompletedMatches(
    recordCompletedMatches(season, matches.map(createBlueWinRecord)),
  );
}

describe("MSI format", () => {
  it("activates the 2026 MSI play-in from LCK Rounds 1-2 and First Stand results", () => {
    const season = createActiveMsiSeason();
    const msi = getMsi(season);
    const playInTeamNames = getPlayInTeamNames(season);

    expect(season.currentCompetitionId).toBe("msi");
    expect(season.currentDateKey).toBe("2026-06-08");
    expect(msi.status).toBe("active");
    expect(msi.currentStageName).toBe(msiStageNames.playInSemifinals);
    expect(msi.standings).toHaveLength(11);
    expect(msi.schedule).toHaveLength(2);
    expect(msi.schedule.every((match) => match.format === "bo3")).toBe(true);
    expect(playInTeamNames).toEqual([
      "Gen.G",
      "GAM Esports",
      "Fnatic",
      "FlyQuest",
    ]);
    expect(playInTeamNames).not.toContain("Top Esports");
  });

  it("passes the second-seed bye to the First Stand runner-up league when CBLOL wins", () => {
    const season = transitionFromLckRounds12ToMsi(
      createMsiReadySeason({
        firstStandWinnerTeamId: "first-stand-cblol-1",
        firstStandRunnerUpTeamId: "first-stand-lec-1",
      }),
      sampleOpponents,
    );
    const playInTeamNames = getPlayInTeamNames(season);

    expect(playInTeamNames).toContain("Top Esports");
    expect(playInTeamNames).not.toContain("Fnatic");
  });

  it("runs play-in, upper/lower bracket, and stores the MSI champion", () => {
    let season = createActiveMsiSeason();

    season = playMatches(
      season,
      getScheduledStage(season, msiStageNames.playInSemifinals),
    );

    let playInFinal = getScheduledStage(season, msiStageNames.playInFinal);

    expect(playInFinal).toHaveLength(1);
    expect(playInFinal[0].id).toBe(msiMatchIds.playInFinal);
    expect(playInFinal[0].format).toBe("bo5");

    season = playMatches(season, playInFinal);

    const upperRound1 = getScheduledStage(season, msiStageNames.upperRound1);

    expect(upperRound1).toHaveLength(4);
    expect(upperRound1.every((match) => match.format === "bo3")).toBe(true);
    expect(
      upperRound1.some(
        (match) => match.blueTeamName === "Gen.G" || match.redTeamName === "Gen.G",
      ),
    ).toBe(true);

    season = playMatches(season, upperRound1);

    const upperRound2AndLowerRound1 = [
      ...getScheduledStage(season, msiStageNames.upperRound2),
      ...getScheduledStage(season, msiStageNames.lowerRound1),
    ];

    expect(upperRound2AndLowerRound1).toHaveLength(4);

    season = playMatches(season, upperRound2AndLowerRound1);

    const upperFinal = getScheduledStage(season, msiStageNames.upperFinal);
    const lowerRound2 = getScheduledStage(season, msiStageNames.lowerRound2);

    expect(upperFinal).toHaveLength(1);
    expect(upperFinal[0].format).toBe("bo5");
    expect(lowerRound2).toHaveLength(2);
    expect(lowerRound2.every((match) => match.format === "bo3")).toBe(true);

    season = playMatches(season, lowerRound2);

    const lowerRound3 = getScheduledStage(season, msiStageNames.lowerRound3);

    expect(lowerRound3).toHaveLength(1);
    expect(lowerRound3[0].format).toBe("bo3");

    season = playMatches(season, [...upperFinal, ...lowerRound3]);

    const lowerFinal = getScheduledStage(season, msiStageNames.lowerFinal);

    expect(lowerFinal).toHaveLength(1);
    expect(lowerFinal[0].format).toBe("bo5");

    season = playMatches(season, lowerFinal);

    const grandFinal = getScheduledStage(season, msiStageNames.grandFinal);

    expect(grandFinal).toHaveLength(1);
    expect(grandFinal[0].format).toBe("bo5");

    season = playMatches(season, grandFinal);

    const completedMsi = getMsi(season);

    expect(completedMsi.status).toBe("completed");
    expect(completedMsi.completed).toBe(true);
    expect(completedMsi.winnerTeamId).toBeDefined();
    expect(completedMsi.winnerTeamName).toBeDefined();
    expect(completedMsi.qualifiedTeamIds).toHaveLength(2);
    expect(completedMsi.qualifiedTeamNames).toHaveLength(2);
    expect(season.worldsQualification?.bonusLeagueLabels).toHaveLength(2);
    expect(season.worldsQualification?.totalEntrants).toBe(20);
    expect(season.worldsQualification?.entrants).toHaveLength(20);
  });

  it("opens MSI through the normal career progress transition after LCK Rounds 1-2", () => {
    const career = createInitialCareer("T1");
    const result = progressCareer({
      ...career,
      seasonState: {
        ...createMsiReadySeason(),
        progressStatus: "match-review",
      },
    });

    expect(result.career.seasonState.currentCompetitionId).toBe("msi");
    expect(
      result.career.seasonState.competitions.find(
        (competition) => competition.competitionId === "msi",
      )?.status,
    ).toBe("active");
  });
});
