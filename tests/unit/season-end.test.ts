import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  calculateNextSeasonTeamBalanceAdjustments,
  completeSeasonAfterWorlds,
  createInitialLckStandings,
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
    offseason: undefined,
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
    const career = createWorldsCompletedCareer();
    const offseasonCareer = completeSeasonAfterWorlds({
      ...career,
      lckPlayers: career.lckPlayers.map((player) =>
        player.id === "lck-top-01"
          ? {
              ...player,
              age: 18,
              overall: 70,
              ability: 69,
              potential: 86,
              salaryExpectation: 70,
              cost: 70,
              development: {
                ...player.development,
                growthRate: 80,
                peakAgeStart: 22,
                peakAgeEnd: 27,
              },
            }
          : player,
      ),
    });
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
    expect(nextTop?.overall).toBeGreaterThan(previousTop?.overall ?? 0);
    expect(nextTop?.salaryExpectation).not.toBe(
      previousTop?.salaryExpectation,
    );
    expect(nextTop?.status.fatigue).toBe(0);
    expect(nextTop?.status.morale).toBe("neutral");
  });

  it("carries a small LCK performance budget and strength adjustment into the next season", () => {
    const standings = createInitialLckStandings("T1").map((entry) => {
      if (entry.teamName === "T1") {
        return { ...entry, rank: 1 };
      }

      if (entry.teamName === "Gen.G") {
        return { ...entry, rank: 2 };
      }

      if (entry.teamName === "Hanwha Life Esports") {
        return { ...entry, rank: 3 };
      }

      return entry;
    });
    const career = createWorldsCompletedCareer();
    const completedCareer = completeSeasonAfterWorlds({
      ...career,
      seasonState: {
        ...career.seasonState,
        competitions: career.seasonState.competitions.map((competition) =>
          competition.competitionId === "lck-rounds-3-4"
            ? {
                ...competition,
                status: "completed",
                completed: true,
                currentStageName: "Completed",
                standings,
              }
            : competition,
        ),
      },
    });
    const adjustment = calculateNextSeasonTeamBalanceAdjustments(
      completedCareer,
    ).find((candidate) => candidate.teamName === "T1");
    const readyCareer = renewExpiredContractsForOffseason({
      career: completedCareer,
      contractTypes: {
        "lck-top-01": "one-year",
      },
    });
    const nextCareer = startNextSeasonFromOffseason(readyCareer);

    expect(adjustment).toMatchObject({
      baseEloDelta: 30,
      budgetDelta: 70,
      strengthDelta: 2,
    });
    expect(nextCareer.userTeam.elo).toBe(1740);
    expect(nextCareer.userTeam.budget).toBe(970);
    expect(nextCareer.seasonState.teamBalanceAdjustments).toContainEqual(
      expect.objectContaining({
        teamName: "T1",
        resultRank: 1,
      }),
    );
  });

  it("attaches the completed offseason summary before starting the next season", () => {
    const offseasonCareer = completeSeasonAfterWorlds(createWorldsCompletedCareer());
    const readyCareer: CareerSave = {
      ...offseasonCareer,
      seasonState: {
        ...offseasonCareer.seasonState,
        offseason: {
          ...offseasonCareer.seasonState.offseason!,
          status: "ready-for-next-season",
          marketStatus: "completed",
          renewedPlayerIds: ["lck-top-01"],
          releasedPlayerIds: ["lck-jungle-01"],
          signedPlayerIds: ["lck-mid-02"],
          resolvedExpiredPlayerIds: ["lck-top-01"],
          retiredPlayerIds: ["retired-veteran"],
          militaryServicePlayerIds: ["military-rookie"],
          resolvedOffers: [
            {
              id: "ai-offer-1",
              kind: "contract",
              fromTeamName: "Gen.G",
              toTeamName: "Free Agent",
              playerIds: ["lck-bot-02"],
              salaryOffer: 95,
              status: "accepted",
              createdDay: 12,
              resolvedDay: 13,
              negotiationContext: "ai-depth",
            },
          ],
          logEntries: [
            {
              id: "log-1",
              day: 7,
              week: 1,
              type: "renewal",
              message: "Zeus와 재계약에 합의했습니다.",
            },
            {
              id: "log-2",
              day: 13,
              week: 2,
              type: "ai-signing",
              message: "Gen.G가 FA 선수를 영입했습니다.",
            },
          ],
        },
      },
    };
    const nextCareer = startNextSeasonFromOffseason(readyCareer);
    const offseasonSummary = nextCareer.seasonHistory[0].offseasonSummary;

    expect(offseasonSummary?.renewedPlayerIds).toEqual(["lck-top-01"]);
    expect(offseasonSummary?.releasedPlayerIds).toEqual(["lck-jungle-01"]);
    expect(offseasonSummary?.signedPlayerIds).toEqual(["lck-mid-02"]);
    expect(offseasonSummary?.retiredPlayerIds).toEqual(["retired-veteran"]);
    expect(offseasonSummary?.militaryServicePlayerIds).toEqual([
      "military-rookie",
    ]);
    expect(offseasonSummary?.aiSigningCount).toBe(1);
    expect(offseasonSummary?.notableLogEntries?.map((entry) => entry.message)).toEqual(
      ["Zeus와 재계약에 합의했습니다.", "Gen.G가 FA 선수를 영입했습니다."],
    );
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
