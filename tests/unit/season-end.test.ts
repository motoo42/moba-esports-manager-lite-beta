import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  completeSeasonAfterWorlds,
  renewExpiredContractsForOffseason,
  startNextSeasonFromOffseason,
} from "../../src/domain/season";
import type {
  CareerSave,
  CompetitionState,
  PlayerContract,
  SeasonState,
} from "../../src/types/game";

const contractFixtures: PlayerContract[] = [
  {
    playerId: "lck-top-01",
    salary: 115,
    type: "one-year",
    guaranteedYears: 1,
    remainingYears: 1,
  },
  {
    playerId: "lck-jungle-01",
    salary: 120,
    type: "two-year",
    guaranteedYears: 2,
    remainingYears: 2,
  },
];

function completeWorldsInSeason(seasonState: SeasonState): SeasonState {
  return {
    ...seasonState,
    phase: "competition",
    currentCompetitionId: "worlds",
    currentDateKey: "2026-11-08",
    currentDateLabel: "2026 Worlds Final",
    progressStatus: "match-review",
    worlds: {
      status: "completed",
      playInGroups: [],
      groupStageGroups: [],
      knockoutTeamIds: ["t1", "gen-g"],
      knockoutTeamNames: ["T1", "Gen.G"],
      championTeamId: "t1",
      championTeamName: "T1",
      runnerUpTeamId: "gen-g",
      runnerUpTeamName: "Gen.G",
      semifinalistTeamIds: ["hle", "dk"],
      semifinalistTeamNames: ["Hanwha Life Esports", "Dplus KIA"],
    },
    competitions: seasonState.competitions.map((competition): CompetitionState => {
      if (competition.competitionId !== "worlds") {
        return competition;
      }

      return {
        ...competition,
        status: "completed",
        currentStageName: "Completed",
        winnerTeamId: "t1",
        winnerTeamName: "T1",
        completed: true,
      };
    }),
  };
}

function createWorldsCompletedCareer(): CareerSave {
  const career = createInitialCareer("T1");

  return {
    ...career,
    userTeam: {
      ...career.userTeam,
      roster: {
        top: "lck-top-01",
        jungle: "lck-jungle-01",
      },
      mainRosterPlayerIds: ["lck-top-01", "lck-jungle-01"],
      academyRosterPlayerIds: [],
      contracts: contractFixtures,
      wins: 42,
      losses: 17,
      elo: 1710,
    },
    seasonState: completeWorldsInSeason(career.seasonState),
  };
}

describe("season end transition", () => {
  it("creates one season summary and opens the offseason entry state after Worlds", () => {
    const completed = completeSeasonAfterWorlds(createWorldsCompletedCareer());

    expect(completed.seasonState.phase).toBe("offseason");
    expect(completed.seasonState.offseason?.status).toBe("summary");
    expect(completed.seasonHistory).toHaveLength(1);
    expect(completed.seasonHistory[0].worldsChampionTeamName).toBe("T1");
    expect(completed.seasonHistory[0].finalRecord).toEqual({
      wins: 42,
      losses: 17,
    });
    expect(completed.seasonState.offseason?.expiredContractPlayerIds).toEqual([
      "lck-top-01",
    ]);
    expect(
      completed.userTeam.contracts.find(
        (contract) => contract.playerId === "lck-top-01",
      )?.remainingYears,
    ).toBe(0);
    expect(
      completed.userTeam.contracts.find(
        (contract) => contract.playerId === "lck-jungle-01",
      )?.remainingYears,
    ).toBe(1);
  });

  it("uses progressCareer to close the season from a completed Worlds review", () => {
    const result = progressCareer(createWorldsCompletedCareer());

    expect(result.career.seasonState.phase).toBe("offseason");
    expect(result.career.seasonHistory[0].worldsChampionTeamName).toBe("T1");
    expect(result.career.userTeam.contracts[0].remainingYears).toBe(0);
  });

  it("renews expired contracts and starts the next season with rolled player status", () => {
    const offseasonCareer = completeSeasonAfterWorlds(createWorldsCompletedCareer());
    const renewedCareer = renewExpiredContractsForOffseason({
      career: offseasonCareer,
      contractTypes: {
        "lck-top-01": "two-year",
      },
    });
    const previousTop = renewedCareer.lckPlayers.find(
      (player) => player.id === "lck-top-01",
    );
    const nextCareer = startNextSeasonFromOffseason(renewedCareer);
    const nextTop = nextCareer.lckPlayers.find(
      (player) => player.id === "lck-top-01",
    );

    expect(renewedCareer.seasonState.offseason?.status).toBe(
      "ready-for-next-season",
    );
    expect(
      renewedCareer.userTeam.contracts.find(
        (contract) => contract.playerId === "lck-top-01",
      )?.remainingYears,
    ).toBe(2);
    expect(nextCareer.currentSeason).toBe(2);
    expect(nextCareer.seasonState.seasonNumber).toBe(2);
    expect(nextCareer.seasonState.yearLabel).toBe(2027);
    expect(nextCareer.seasonState.calendarType).toBe("normal");
    expect(nextCareer.seasonState.phase).toBe("competition");
    expect(nextCareer.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(nextCareer.seasonState.asianGames).toBeUndefined();
    expect(
      nextCareer.seasonState.competitions.some(
        (competition) => competition.competitionId === "asian-games",
      ),
    ).toBe(false);
    expect(
      nextCareer.seasonState.competitions.some(
        (competition) => competition.competitionId === "lck-rounds-3-5",
      ),
    ).toBe(true);
    expect(nextCareer.userTeam.wins).toBe(0);
    expect(nextCareer.userTeam.losses).toBe(0);
    expect(nextCareer.userTeam.elo).toBe(1710);
    expect(nextTop?.age).toBe((previousTop?.age ?? 0) + 1);
    expect(nextTop?.status.fatigue).toBe(0);
    expect(nextTop?.status.morale).toBe("neutral");
  });

  it("marks the career completed instead of opening a new season at maxSeason", () => {
    const career = createWorldsCompletedCareer();
    const completed = completeSeasonAfterWorlds({
      ...career,
      currentSeason: career.maxSeason,
      seasonState: {
        ...career.seasonState,
        seasonNumber: career.maxSeason,
      },
    });

    expect(completed.seasonState.phase).toBe("completed");
    expect(completed.seasonState.offseason?.status).toBe("career-completed");
    expect(completed.seasonState.offseason?.nextSeasonNumber).toBeUndefined();
  });
});
