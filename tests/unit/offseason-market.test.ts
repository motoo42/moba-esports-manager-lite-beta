import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  completeSeasonAfterWorlds,
  initializeOffseasonMarket,
  progressOffseasonDay,
  releaseExpiredOffseasonPlayer,
  submitFreeAgentOffer,
  submitOffseasonRenewalOffer,
} from "../../src/domain/season";
import type {
  CareerSave,
  CompetitionState,
  ContractType,
  PlayerContract,
  SeasonState,
} from "../../src/types/game";

function createContract(
  playerId: string,
  type: ContractType = "two-year",
): PlayerContract {
  return {
    playerId,
    salary: 100,
    type,
    guaranteedYears: type === "two-year" ? 2 : 1,
    optionYear: type === "one-plus-one" ? true : undefined,
    remainingYears: type === "one-year" ? 1 : 2,
  };
}

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

function createWorldsCompletedCareer({
  expiringTop = false,
}: {
  expiringTop?: boolean;
} = {}): CareerSave {
  const career = createInitialCareer("T1");
  const starterPlayerIds = [
    "lck-top-01",
    "lck-jungle-01",
    "lck-mid-01",
    "lck-bot-01",
    "lck-support-01",
  ];
  const benchPlayerIds = [
    "lck-mid-02",
    "lck-top-02",
    "lck-top-03",
    "lck-jungle-02",
    "lck-mid-04",
  ];
  const rosterPlayerIds = [...starterPlayerIds, ...benchPlayerIds];

  return {
    ...career,
    userTeam: {
      ...career.userTeam,
      roster: {
        top: "lck-top-01",
        jungle: "lck-jungle-01",
        mid: "lck-mid-01",
        bot: "lck-bot-01",
        support: "lck-support-01",
      },
      mainRosterPlayerIds: starterPlayerIds,
      academyRosterPlayerIds: benchPlayerIds,
      contracts: rosterPlayerIds.map((playerId) =>
        createContract(
          playerId,
          expiringTop && playerId === "lck-top-01" ? "one-year" : "two-year",
        ),
      ),
      elo: 1710,
    },
    seasonState: completeWorldsInSeason(career.seasonState),
  };
}

function startMarket(career = createWorldsCompletedCareer({ expiringTop: true })) {
  return initializeOffseasonMarket(completeSeasonAfterWorlds(career));
}

describe("offseason market", () => {
  it("initializes a 28-day stove league market after the season summary", () => {
    const career = startMarket();

    expect(career.seasonState.phase).toBe("offseason");
    expect(career.seasonState.offseason?.status).toBe("active");
    expect(career.seasonState.offseason?.currentDay).toBe(1);
    expect(career.seasonState.offseason?.currentWeek).toBe(1);
    expect(career.seasonState.offseason?.totalDays).toBe(28);
    expect(career.seasonState.offseason?.freeAgentPlayerIds).toContain(
      "fa-2026-beryl",
    );
    expect(
      career.lckPlayers.find((player) => player.id === "lck-top-01")?.currentTeam,
    ).toBe("T1");
  });

  it("blocks week two while expired contracts are unresolved", () => {
    const career = startMarket();
    const daySevenCareer: CareerSave = {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          currentDay: 7,
          currentWeek: 1,
        },
      },
    };
    const blocked = progressOffseasonDay(daySevenCareer);

    expect(blocked.seasonState.offseason?.currentDay).toBe(7);
    expect(blocked.seasonState.offseason?.marketStatus).toBe("blocked");
    expect(blocked.seasonState.offseason?.validationErrors?.[0]).toContain(
      "재계약 또는 방출",
    );
  });

  it("accepts renewal offers above 90 percent of demand and rejects low offers", () => {
    const career = startMarket();
    const rejected = submitOffseasonRenewalOffer(career, {
      playerId: "lck-top-01",
      contractType: "one-year",
      salaryOffer: 10,
    });

    expect(rejected.seasonState.offseason?.resolvedExpiredPlayerIds).not.toContain(
      "lck-top-01",
    );

    const accepted = submitOffseasonRenewalOffer(rejected, {
      playerId: "lck-top-01",
      contractType: "two-year",
      salaryOffer: 200,
    });

    expect(accepted.seasonState.offseason?.resolvedExpiredPlayerIds).toContain(
      "lck-top-01",
    );
    expect(
      accepted.userTeam.contracts.find(
        (contract) => contract.playerId === "lck-top-01",
      )?.remainingYears,
    ).toBe(2);
  });

  it("releases expired players into the free agent pool", () => {
    const career = startMarket();
    const released = releaseExpiredOffseasonPlayer(career, "lck-top-01");

    expect(released.userTeam.contracts.map((contract) => contract.playerId)).not.toContain(
      "lck-top-01",
    );
    expect(released.userTeam.roster.top).toBeUndefined();
    expect(released.seasonState.offseason?.freeAgentPlayerIds).toContain(
      "lck-top-01",
    );
  });

  it("resolves FA offers on the next day with AI competition", () => {
    const renewed = submitOffseasonRenewalOffer(startMarket(), {
      playerId: "lck-top-01",
      contractType: "two-year",
      salaryOffer: 200,
    });
    const weekTwoCareer: CareerSave = {
      ...renewed,
      seasonState: {
        ...renewed.seasonState,
        offseason: {
          ...renewed.seasonState.offseason!,
          currentDay: 8,
          currentWeek: 2,
          marketStatus: "free-agency",
        },
      },
    };
    const offered = submitFreeAgentOffer(weekTwoCareer, {
      playerId: "fa-2026-beryl",
      contractType: "two-year",
      salaryOffer: 300,
    });
    const nextDay = progressOffseasonDay(offered);
    const resolved = progressOffseasonDay(nextDay);

    expect(resolved.seasonState.offseason?.signedPlayerIds).toContain(
      "fa-2026-beryl",
    );
    expect(
      resolved.lckPlayers.find((player) => player.id === "fa-2026-beryl")
        ?.currentTeam,
    ).toBe("T1");
  });

  it("moves FA players to AI teams when the user loses the bid", () => {
    const renewed = submitOffseasonRenewalOffer(startMarket(), {
      playerId: "lck-top-01",
      contractType: "two-year",
      salaryOffer: 200,
    });
    const weekTwoCareer: CareerSave = {
      ...renewed,
      seasonState: {
        ...renewed.seasonState,
        offseason: {
          ...renewed.seasonState.offseason!,
          currentDay: 8,
          currentWeek: 2,
          marketStatus: "free-agency",
        },
      },
    };
    const offered = submitFreeAgentOffer(weekTwoCareer, {
      playerId: "fa-2026-beryl",
      contractType: "one-year",
      salaryOffer: 1,
    });
    const resolved = progressOffseasonDay(progressOffseasonDay(offered));
    const beryl = resolved.lckPlayers.find((player) => player.id === "fa-2026-beryl");

    expect(beryl?.currentTeam).toBeTruthy();
    expect(beryl?.currentTeam).not.toBe("T1");
    expect(resolved.seasonState.offseason?.resolvedOffers?.some(
      (offer) => offer.status === "lost" && offer.playerIds.includes("fa-2026-beryl"),
    )).toBe(true);
  });

  it("starts the next season from the final offseason day when roster is valid", () => {
    const career = startMarket(createWorldsCompletedCareer());
    const finalDayCareer: CareerSave = {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          currentDay: 28,
          currentWeek: 4,
          marketStatus: "final-day",
        },
      },
    };
    const nextCareer = progressCareer(finalDayCareer).career;

    expect(nextCareer.currentSeason).toBe(2);
    expect(nextCareer.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(nextCareer.seasonState.phase).toBe("competition");
  });
});
