import { describe, expect, it } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { progressCareer } from "../../src/domain/game-progress/progressCareer";
import {
  cancelFreeAgentSigning,
  completeSeasonAfterWorlds,
  confirmFreeAgentSigning,
  getOffseasonMoodColor,
  initializeOffseasonMarket,
  getOffseasonMinimumAcceptableSalary,
  getOffseasonNegotiationSnapshot,
  getOffseasonVisibleDemandSalary,
  progressOffseasonDay,
  releaseExpiredOffseasonPlayer,
  submitFreeAgentOffer,
  submitOffseasonRenewalOffer,
} from "../../src/domain/season";
import { lck2026Teams } from "../../src/data/lckTeams";
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
  const academyPlayerIds = career.userTeam.academyRosterPlayerIds.slice(0, 5);
  const rosterPlayerIds = [
    ...starterPlayerIds,
    ...benchPlayerIds,
    ...academyPlayerIds,
  ];

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
      academyRosterPlayerIds: [...benchPlayerIds, ...academyPlayerIds],
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
  it("starts a new career in the 2026 preseason market with selected-team renewals and the full LCK market", () => {
    const career = createInitialCareer("T1");
    const expiredIds = career.seasonState.offseason?.expiredContractPlayerIds ?? [];
    const marketIds = career.seasonState.offseason?.freeAgentPlayerIds ?? [];

    expect(career.seasonState.phase).toBe("offseason");
    expect(career.seasonState.offseason?.context).toBe("preseason");
    expect(career.seasonState.offseason?.status).toBe("active");
    expect(expiredIds).toContain("lck-mid-01");
    expect(expiredIds).toContain("lck-2026-t1-cloud");
    expect(marketIds).not.toContain("lck-mid-01");
    expect(marketIds).toContain("lck-mid-02");
  });

  it("enters the 2026 LCK Cup from the final preseason day without advancing the season number", () => {
    const career = createInitialCareer("T1");
    const renewedCareer: CareerSave = {
      ...career,
      userTeam: {
        ...career.userTeam,
        contracts: career.userTeam.contracts.map((contract) => ({
          ...contract,
          remainingYears: 1,
        })),
      },
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          currentDay: 28,
          currentWeek: 4,
          marketStatus: "final-day",
          renewedPlayerIds:
            career.seasonState.offseason?.expiredContractPlayerIds ?? [],
          resolvedExpiredPlayerIds:
            career.seasonState.offseason?.expiredContractPlayerIds ?? [],
        },
      },
    };
    const nextCareer = progressCareer(renewedCareer).career;

    expect(nextCareer.currentSeason).toBe(1);
    expect(nextCareer.seasonState.phase).toBe("competition");
    expect(nextCareer.seasonState.currentCompetitionId).toBe("lck-cup");
    expect(nextCareer.seasonState.offseason).toBeUndefined();
  });

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

  it("resolves renewal offers against the current minimum salary", () => {
    const career = startMarket();
    const pendingRejected = submitOffseasonRenewalOffer(career, {
      playerId: "lck-top-01",
      contractType: "one-year",
      salaryOffer: 10,
    });
    const rejected = progressOffseasonDay(
      progressOffseasonDay(pendingRejected),
    );

    expect(rejected.seasonState.offseason?.resolvedExpiredPlayerIds).not.toContain(
      "lck-top-01",
    );
    expect(
      rejected.seasonState.offseason?.resolvedOffers?.some(
        (offer) =>
          offer.playerIds.includes("lck-top-01") && offer.status === "rejected",
      ),
    ).toBe(true);

    const pendingAccepted = submitOffseasonRenewalOffer(rejected, {
      playerId: "lck-top-01",
      contractType: "two-year",
      requestedRosterRole: "academy",
      salaryOffer: 200,
    });
    const accepted = progressOffseasonDay(progressOffseasonDay(pendingAccepted));

    expect(accepted.seasonState.offseason?.resolvedExpiredPlayerIds).toContain(
      "lck-top-01",
    );
    expect(
      accepted.userTeam.contracts.find(
        (contract) => contract.playerId === "lck-top-01",
      )?.remainingYears,
    ).toBe(2);
    expect(accepted.userTeam.academyRosterPlayerIds).toContain("lck-top-01");
    expect(accepted.userTeam.roster.top).toBeUndefined();
  });

  it("resolves day-seven renewal offers before blocking week two", () => {
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
    const pending = submitOffseasonRenewalOffer(daySevenCareer, {
      playerId: "lck-top-01",
      contractType: "one-year",
      salaryOffer: 200,
    });
    const progressed = progressOffseasonDay(pending);

    expect(progressed.seasonState.offseason?.currentDay).toBe(8);
    expect(progressed.seasonState.offseason?.resolvedExpiredPlayerIds).toContain(
      "lck-top-01",
    );
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

  it("holds user-won FA offers for confirmation before signing", () => {
    const renewed = progressOffseasonDay(
      progressOffseasonDay(
        submitOffseasonRenewalOffer(startMarket(), {
          playerId: "lck-top-01",
          contractType: "two-year",
          salaryOffer: 200,
        }),
      ),
    );
    const weekTwoCareer: CareerSave = {
      ...renewed,
      userTeam: {
        ...renewed.userTeam,
        budget: 3000,
      },
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
    const pendingOffer = resolved.seasonState.offseason?.resolvedOffers?.find(
      (offer) =>
        offer.status === "confirmation-pending" &&
        offer.playerIds.includes("fa-2026-beryl"),
    );

    expect(pendingOffer).toBeDefined();
    expect(resolved.seasonState.offseason?.signedPlayerIds).not.toContain(
      "fa-2026-beryl",
    );
    expect(
      resolved.lckPlayers.find((player) => player.id === "fa-2026-beryl")
        ?.currentTeam,
    ).toBeUndefined();

    const confirmed = confirmFreeAgentSigning(resolved, pendingOffer!.id);

    expect(confirmed.seasonState.offseason?.signedPlayerIds).toContain(
      "fa-2026-beryl",
    );
    expect(
      confirmed.lckPlayers.find((player) => player.id === "fa-2026-beryl")
        ?.currentTeam,
    ).toBe("T1");
  });

  it("can cancel a user-won FA offer before final registration", () => {
    const renewed = progressOffseasonDay(
      progressOffseasonDay(
        submitOffseasonRenewalOffer(startMarket(), {
          playerId: "lck-top-01",
          contractType: "two-year",
          salaryOffer: 200,
        }),
      ),
    );
    const weekTwoCareer: CareerSave = {
      ...renewed,
      userTeam: {
        ...renewed.userTeam,
        budget: 3000,
      },
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
    const resolved = progressOffseasonDay(progressOffseasonDay(offered));
    const pendingOffer = resolved.seasonState.offseason?.resolvedOffers?.find(
      (offer) =>
        offer.status === "confirmation-pending" &&
        offer.playerIds.includes("fa-2026-beryl"),
    );

    const cancelled = cancelFreeAgentSigning(resolved, pendingOffer!.id);

    expect(
      cancelled.seasonState.offseason?.resolvedOffers?.find(
        (offer) => offer.id === pendingOffer!.id,
      )?.status,
    ).toBe("withdrawn");
    expect(cancelled.seasonState.offseason?.freeAgentPlayerIds).toContain(
      "fa-2026-beryl",
    );
    expect(
      cancelled.lckPlayers.find((player) => player.id === "fa-2026-beryl")
        ?.currentTeam,
    ).toBeUndefined();
  });

  it("blocks final FA registration when budget or role limits fail", () => {
    const renewed = progressOffseasonDay(
      progressOffseasonDay(
        submitOffseasonRenewalOffer(startMarket(), {
          playerId: "lck-top-01",
          contractType: "two-year",
          salaryOffer: 200,
        }),
      ),
    );
    const supportDepth = renewed.lckPlayers
      .filter((player) => player.role === "support" && player.id !== "fa-2026-beryl")
      .slice(0, 3)
      .map((player) => player.id);
    const weekTwoCareer: CareerSave = {
      ...renewed,
      userTeam: {
        ...renewed.userTeam,
        budget: 1,
        contracts: [
          ...renewed.userTeam.contracts,
          ...supportDepth.map((playerId) => createContract(playerId)),
        ],
      },
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
    const resolved = progressOffseasonDay(progressOffseasonDay(offered));
    const pendingOffer = resolved.seasonState.offseason?.resolvedOffers?.find(
      (offer) =>
        offer.status === "confirmation-pending" &&
        offer.playerIds.includes("fa-2026-beryl"),
    );

    const blocked = confirmFreeAgentSigning(resolved, pendingOffer!.id);

    expect(
      blocked.seasonState.offseason?.resolvedOffers?.find(
        (offer) => offer.id === pendingOffer!.id,
      )?.status,
    ).toBe("confirmation-pending");
    expect(blocked.seasonState.offseason?.validationErrors?.join(" ")).toContain(
      "예산",
    );
    expect(blocked.seasonState.offseason?.validationErrors?.join(" ")).toContain(
      "SUPPORT",
    );
  });

  it("keeps a player in the FA pool when every offer is below the minimum", () => {
    const renewed = progressOffseasonDay(
      progressOffseasonDay(
        submitOffseasonRenewalOffer(startMarket(), {
          playerId: "lck-top-01",
          contractType: "two-year",
          salaryOffer: 200,
        }),
      ),
    );
    const weekTwoCareer: CareerSave = {
      ...renewed,
      lckPlayers: [
        ...renewed.lckPlayers,
        ...lck2026Teams.flatMap((team) =>
          team.name === "T1"
            ? []
            : [0, 1, 2].map((index) => ({
                ...renewed.lckPlayers.find(
                  (player) => player.id === "fa-2026-beryl",
                )!,
                id: `ai-support-depth-${team.shortName}-${index}`,
                name: `AI Support ${team.shortName} ${index}`,
                currentTeam: team.name,
              })),
        ),
      ],
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

    expect(beryl?.currentTeam).toBeUndefined();
    expect(resolved.seasonState.offseason?.freeAgentPlayerIds).toContain(
      "fa-2026-beryl",
    );
    expect(
      resolved.seasonState.offseason?.resolvedOffers?.some(
        (offer) =>
          offer.status === "rejected" && offer.playerIds.includes("fa-2026-beryl"),
      ),
    ).toBe(true);
  });

  it("moves FA players to AI teams when the user loses the bid", () => {
    const renewed = progressOffseasonDay(
      progressOffseasonDay(
        submitOffseasonRenewalOffer(startMarket(), {
          playerId: "lck-top-01",
          contractType: "two-year",
          salaryOffer: 200,
        }),
      ),
    );
    const weekFourCareer: CareerSave = {
      ...renewed,
      seasonState: {
        ...renewed.seasonState,
        offseason: {
          ...renewed.seasonState.offseason!,
          currentDay: 22,
          currentWeek: 4,
          marketStatus: "free-agency",
        },
      },
    };
    const offered = submitFreeAgentOffer(weekFourCareer, {
      playerId: "fa-2026-beryl",
      contractType: "one-year",
      salaryOffer: 1,
    });
    const resolved = progressOffseasonDay(progressOffseasonDay(offered));
    const beryl = resolved.lckPlayers.find((player) => player.id === "fa-2026-beryl");

    expect(beryl?.currentTeam).toBeTruthy();
    expect(beryl?.currentTeam).not.toBe("T1");
    expect(resolved.seasonState.offseason?.resolvedOffers?.some(
      (offer) => offer.status === "rejected" && offer.playerIds.includes("fa-2026-beryl"),
    )).toBe(true);
    expect(resolved.seasonState.offseason?.resolvedOffers?.some(
      (offer) => offer.status === "accepted" && offer.playerIds.includes("fa-2026-beryl"),
    )).toBe(true);
  });

  it("lowers the minimum acceptable FA salary as the market approaches the deadline", () => {
    const career = startMarket();
    const beryl = career.lckPlayers.find((player) => player.id === "fa-2026-beryl")!;
    const earlyMinimum = getOffseasonMinimumAcceptableSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 8,
      player: beryl,
    });
    const lateMinimum = getOffseasonMinimumAcceptableSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 27,
      player: beryl,
    });

    expect(lateMinimum).toBeLessThan(earlyMinimum);
  });

  it("keeps the public demand above the hidden minimum and lowers both over time", () => {
    const career = startMarket();
    const beryl = career.lckPlayers.find((player) => player.id === "fa-2026-beryl")!;
    const earlyMinimum = getOffseasonMinimumAcceptableSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 8,
      player: beryl,
    });
    const lateMinimum = getOffseasonMinimumAcceptableSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 27,
      player: beryl,
    });
    const earlyDemand = getOffseasonVisibleDemandSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 8,
      player: beryl,
    });
    const lateDemand = getOffseasonVisibleDemandSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 27,
      player: beryl,
    });

    expect(earlyDemand).toBeGreaterThan(earlyMinimum);
    expect(lateDemand).toBeGreaterThan(lateMinimum);
    expect(lateMinimum).toBeLessThan(earlyMinimum);
    expect(lateDemand).toBeLessThan(earlyDemand);
  });

  it("uses negotiation mood to adjust the hidden acceptable salary", () => {
    const career = startMarket();
    const beryl = career.lckPlayers.find((player) => player.id === "fa-2026-beryl")!;
    const visibleDemand = getOffseasonVisibleDemandSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 1,
      player: beryl,
    });
    const goodMood = getOffseasonNegotiationSnapshot({
      career,
      context: "free-agent",
      contractType: "one-year",
      player: beryl,
      salaryOffer: visibleDemand,
    });
    const badMood = getOffseasonNegotiationSnapshot({
      career,
      context: "free-agent",
      contractType: "one-year",
      player: beryl,
      salaryOffer: 1,
    });

    expect(goodMood.moodScore).toBe(100);
    expect(badMood.moodScore).toBeLessThan(50);
    expect(goodMood.minAcceptableSalary).toBeLessThan(
      badMood.minAcceptableSalary,
    );
  });

  it("lowers mood after repeated rejections but softens the penalty for near misses", () => {
    const career = startMarket();
    const beryl = career.lckPlayers.find((player) => player.id === "fa-2026-beryl")!;
    const minimum = getOffseasonMinimumAcceptableSalary({
      context: "free-agent",
      contractType: "one-year",
      day: 1,
      player: beryl,
    });
    const farRejectedCareer: CareerSave = {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          resolvedOffers: [
            {
              id: "far-rejected-offer",
              kind: "contract",
              fromTeamName: career.userTeam.name,
              toTeamName: "Free Agent",
              playerIds: [beryl.id],
              salaryOffer: Math.floor(minimum * 0.7),
              contractType: "one-year",
              status: "rejected",
              createdDay: 8,
              resolvedDay: 9,
              negotiationContext: "free-agent",
              minAcceptableSalary: minimum,
            },
          ],
        },
      },
    };
    const nearRejectedCareer: CareerSave = {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          resolvedOffers: [
            {
              id: "near-rejected-offer",
              kind: "contract",
              fromTeamName: career.userTeam.name,
              toTeamName: "Free Agent",
              playerIds: [beryl.id],
              salaryOffer: Math.ceil(minimum * 0.98),
              contractType: "one-year",
              status: "rejected",
              createdDay: 8,
              resolvedDay: 9,
              negotiationContext: "free-agent",
              minAcceptableSalary: minimum,
            },
          ],
        },
      },
    };
    const freshMood = getOffseasonNegotiationSnapshot({
      career,
      context: "free-agent",
      contractType: "one-year",
      player: beryl,
      salaryOffer: minimum,
    });
    const farMood = getOffseasonNegotiationSnapshot({
      career: farRejectedCareer,
      context: "free-agent",
      contractType: "one-year",
      player: beryl,
      salaryOffer: minimum,
    });
    const nearMood = getOffseasonNegotiationSnapshot({
      career: nearRejectedCareer,
      context: "free-agent",
      contractType: "one-year",
      player: beryl,
      salaryOffer: minimum,
    });

    expect(farMood.moodScore).toBeLessThan(freshMood.moodScore);
    expect(nearMood.moodScore).toBeGreaterThan(farMood.moodScore);
  });

  it("maps negotiation mood colors from red through white to green", () => {
    expect(getOffseasonMoodColor(0)).toBe("#ef4444");
    expect(getOffseasonMoodColor(50)).toBe("#f8fafc");
    expect(getOffseasonMoodColor(100)).toBe("#22c55e");
  });

  it("removes retired and military service players from contracts and the FA pool", () => {
    const completedCareer = createWorldsCompletedCareer();
    const careerWithDepartures: CareerSave = {
      ...completedCareer,
      lckPlayers: completedCareer.lckPlayers.map((player) => {
        if (player.id === "lck-top-01") {
          return {
            ...player,
            retirementAge: player.age,
          };
        }

        if (player.id === "lck-mid-02") {
          return {
            ...player,
            militaryServiceStatus: "pending",
          };
        }

        return player;
      }),
    };
    const market = initializeOffseasonMarket(
      completeSeasonAfterWorlds(careerWithDepartures),
    );

    expect(market.userTeam.contracts.map((contract) => contract.playerId)).not.toContain(
      "lck-top-01",
    );
    expect(market.userTeam.contracts.map((contract) => contract.playerId)).not.toContain(
      "lck-mid-02",
    );
    expect(market.seasonState.offseason?.freeAgentPlayerIds).not.toContain(
      "lck-top-01",
    );
    expect(market.seasonState.offseason?.retiredPlayerIds).toContain("lck-top-01");
    expect(market.seasonState.offseason?.militaryServicePlayerIds).toContain(
      "lck-mid-02",
    );
  });

  it("lets AI teams sign FA players for role depth without generating prospects", () => {
    const renewed = progressOffseasonDay(
      progressOffseasonDay(
        submitOffseasonRenewalOffer(startMarket(), {
          playerId: "lck-top-01",
          contractType: "two-year",
          salaryOffer: 200,
        }),
      ),
    );
    const targetTeam = lck2026Teams.find((team) => team.name !== "T1")!;
    const weekFourCareer: CareerSave = {
      ...renewed,
      lckPlayers: renewed.lckPlayers.map((player) => {
        if (player.id === "lck-top-02") {
          return {
            ...player,
            currentTeam: undefined,
          };
        }

        if (player.currentTeam === targetTeam.name && player.role === "top") {
          return {
            ...player,
            currentTeam: undefined,
          };
        }

        return player;
      }),
      seasonState: {
        ...renewed.seasonState,
        offseason: {
          ...renewed.seasonState.offseason!,
          currentDay: 22,
          currentWeek: 4,
          marketStatus: "free-agency",
          freeAgentPlayerIds: [
            ...(renewed.seasonState.offseason?.freeAgentPlayerIds ?? []),
            "lck-top-02",
          ],
        },
      },
    };
    const progressed = progressOffseasonDay(weekFourCareer);
    const signedTop = progressed.lckPlayers.find((player) => player.id === "lck-top-02");

    expect(signedTop?.currentTeam).toBeTruthy();
    expect(signedTop?.currentTeam).not.toBe("T1");
    expect(progressed.lckPlayers.length).toBe(weekFourCareer.lckPlayers.length);
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
