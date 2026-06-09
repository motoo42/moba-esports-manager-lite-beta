import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import {
  completeSeasonAfterWorlds,
  initializeOffseasonMarket,
} from "../../src/domain/season";
import { OffseasonMarket } from "../../src/features/offseason";
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
      knockoutTeamIds: ["t1"],
      knockoutTeamNames: ["T1"],
      championTeamId: "t1",
      championTeamName: "T1",
    },
    competitions: seasonState.competitions.map((competition): CompetitionState => {
      if (competition.competitionId !== "worlds") {
        return competition;
      }

      return {
        ...competition,
        status: "completed",
        winnerTeamId: "t1",
        winnerTeamName: "T1",
        completed: true,
      };
    }),
  };
}

function createActiveOffseasonCareer(): CareerSave {
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
  const completedCareer: CareerSave = {
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
        createContract(playerId, playerId === "lck-top-01" ? "one-year" : "two-year"),
      ),
    },
    seasonState: completeWorldsInSeason(career.seasonState),
  };

  return initializeOffseasonMarket(completeSeasonAfterWorlds(completedCareer));
}

describe("OffseasonMarket", () => {
  it("renders the new career preseason renewals and full LCK market filters", () => {
    const career = createInitialCareer("T1");

    render(
      <OffseasonMarket
        career={career}
        onCancelFreeAgentSigning={vi.fn()}
        onConfirmFreeAgentSigning={vi.fn()}
        onReleaseExpiredPlayer={vi.fn()}
        onSubmitFreeAgentOffer={vi.fn()}
        onSubmitRenewalOffer={vi.fn()}
        onViewRoster={vi.fn()}
      />,
    );

    expect(screen.getByText("Faker")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "FA 시장" }));
    expect(screen.getByLabelText("시장 선수 검색")).toBeVisible();
    expect(screen.getByLabelText("시장 팀 필터")).toBeVisible();
    expect(screen.getByLabelText("시장 포지션 필터")).toBeVisible();
    expect(screen.getByLabelText("시장 1군 2군 필터")).toBeVisible();

    fireEvent.change(screen.getByLabelText("시장 팀 필터"), {
      target: { value: "Gen.G" },
    });
    fireEvent.change(screen.getByLabelText("시장 포지션 필터"), {
      target: { value: "mid" },
    });
    fireEvent.change(screen.getByLabelText("시장 1군 2군 필터"), {
      target: { value: "main" },
    });

    expect(screen.getByText("Chovy")).toBeVisible();
    expect(screen.queryByText("Faker")).not.toBeInTheDocument();
  });

  it("renders the renewal week and submits a renewal offer", () => {
    const onSubmitRenewalOffer = vi.fn();

    render(
      <OffseasonMarket
        career={createActiveOffseasonCareer()}
        onCancelFreeAgentSigning={vi.fn()}
        onConfirmFreeAgentSigning={vi.fn()}
        onReleaseExpiredPlayer={vi.fn()}
        onSubmitFreeAgentOffer={vi.fn()}
        onSubmitRenewalOffer={onSubmitRenewalOffer}
        onViewRoster={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "스토브리그 1일차" })).toBeVisible();
    expect(screen.getByText("Zeus")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "재계약 협상" }));
    expect(screen.getByRole("dialog", { name: "재계약 협상" })).toBeVisible();
    expect(screen.getByLabelText("제안 역할")).toBeVisible();
    expect(screen.getByText("협상 분위기")).toBeVisible();
    expect(screen.queryByText("현재 최소 수락선")).not.toBeInTheDocument();
    expect(screen.queryByText("수락권")).not.toBeInTheDocument();
    expect(screen.queryByText("거절 위험")).not.toBeInTheDocument();

    const initialMood = screen.getByTestId("negotiation-mood-score").textContent;
    fireEvent.change(screen.getByLabelText("제안 연봉"), {
      target: { value: "1" },
    });
    expect(screen.getByTestId("negotiation-mood-score").textContent).not.toBe(
      initialMood,
    );
    fireEvent.click(screen.getByRole("button", { name: "제안 보내기" }));

    expect(onSubmitRenewalOffer).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "lck-top-01",
        contractType: "one-year",
        requestedRosterRole: "starter",
      }),
    );
  });

  it("renders the FA market and submits a pending FA offer", () => {
    const onSubmitFreeAgentOffer = vi.fn();
    const career = createActiveOffseasonCareer();
    const weekTwoCareer: CareerSave = {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          currentDay: 8,
          currentWeek: 2,
          marketStatus: "free-agency",
        },
      },
    };

    render(
      <OffseasonMarket
        career={weekTwoCareer}
        onCancelFreeAgentSigning={vi.fn()}
        onConfirmFreeAgentSigning={vi.fn()}
        onReleaseExpiredPlayer={vi.fn()}
        onSubmitFreeAgentOffer={onSubmitFreeAgentOffer}
        onSubmitRenewalOffer={vi.fn()}
        onViewRoster={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "FA 시장" }));

    expect(screen.getByText("BeryL")).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "FA 협상" })[0]);
    expect(screen.getByRole("dialog", { name: "FA 계약 협상" })).toBeVisible();
    expect(screen.getByLabelText("제안 역할")).toBeVisible();
    expect(screen.getByText("선수 측 요구액")).toBeVisible();
    expect(screen.getByText("협상 분위기")).toBeVisible();
    expect(screen.queryByText("현재 최소 수락선")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "제안 보내기" }));

    expect(onSubmitFreeAgentOffer).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "fa-2026-beryl",
        requestedRosterRole: "academy",
      }),
    );
  });

  it("renders confirmation pending signings and highlights user-team logs", () => {
    const onConfirmFreeAgentSigning = vi.fn();
    const onCancelFreeAgentSigning = vi.fn();
    const career = createActiveOffseasonCareer();
    const weekTwoCareer: CareerSave = {
      ...career,
      userTeam: {
        ...career.userTeam,
        budget: 3000,
      },
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...career.seasonState.offseason!,
          currentDay: 9,
          currentWeek: 2,
          marketStatus: "free-agency",
          resolvedOffers: [
            ...(career.seasonState.offseason?.resolvedOffers ?? []),
            {
              id: "pending-beryl",
              kind: "contract",
              fromTeamName: "T1",
              toTeamName: "Free Agent",
              playerIds: ["fa-2026-beryl"],
              salaryOffer: 120,
              contractType: "one-year",
              status: "confirmation-pending",
              createdDay: 8,
              resolvedDay: 9,
              negotiationContext: "free-agent",
              requestedRosterRole: "sixth-man",
            },
          ],
          logEntries: [
            ...(career.seasonState.offseason?.logEntries ?? []),
            {
              id: "user-log",
              day: 9,
              week: 2,
              type: "signing",
              message: "BeryL 영입 경쟁에서 승리했습니다.",
              isUserTeamRelated: true,
            },
          ],
        },
      },
    };

    render(
      <OffseasonMarket
        career={weekTwoCareer}
        onCancelFreeAgentSigning={onCancelFreeAgentSigning}
        onConfirmFreeAgentSigning={onConfirmFreeAgentSigning}
        onReleaseExpiredPlayer={vi.fn()}
        onSubmitFreeAgentOffer={vi.fn()}
        onSubmitRenewalOffer={vi.fn()}
        onViewRoster={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "FA 시장" }));

    expect(screen.getByText("영입 확정 대기")).toBeVisible();
    expect(screen.getByText("제안 역할 식스맨")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "영입 확정" }));
    expect(onConfirmFreeAgentSigning).toHaveBeenCalledWith("pending-beryl");

    fireEvent.click(screen.getByRole("button", { name: "이적 로그" }));
    expect(
      screen.getByText("BeryL 영입 경쟁에서 승리했습니다.").closest("article"),
    ).toHaveClass("offseason-log-user-team");
  });
});
