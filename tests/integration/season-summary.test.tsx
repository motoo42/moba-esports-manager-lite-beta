import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { completeSeasonAfterWorlds } from "../../src/domain/season";
import { SeasonSummary } from "../../src/features/season-summary";
import type { CareerSave, PlayerContract } from "../../src/types/game";

const contracts: PlayerContract[] = [
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

function createSummaryCareer(): CareerSave {
  const career = createInitialCareer("T1");
  const worldsCompletedCareer: CareerSave = {
    ...career,
    userTeam: {
      ...career.userTeam,
      contracts,
      wins: 34,
      losses: 12,
      elo: 1688,
    },
    seasonState: {
      ...career.seasonState,
      phase: "competition",
      currentCompetitionId: "worlds",
      currentDateKey: "2026-11-08",
      currentDateLabel: "2026 Worlds Final",
      worlds: {
        status: "completed",
        playInGroups: [],
        groupStageGroups: [],
        knockoutTeamIds: [],
        knockoutTeamNames: [],
        championTeamId: "t1",
        championTeamName: "T1",
        runnerUpTeamId: "gen-g",
        runnerUpTeamName: "Gen.G",
      },
      competitions: career.seasonState.competitions.map((competition) =>
        competition.competitionId === "worlds"
          ? {
              ...competition,
              status: "completed" as const,
              winnerTeamId: "t1",
              winnerTeamName: "T1",
              completed: true,
            }
          : competition,
      ),
    },
  };

  return completeSeasonAfterWorlds(worldsCompletedCareer);
}

describe("SeasonSummary", () => {
  it("renders season results and enters the offseason market", () => {
    const onStartOffseason = vi.fn();

    render(
      <SeasonSummary
        career={createSummaryCareer()}
        onStartOffseason={onStartOffseason}
        onViewRoster={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "2026 시즌 종료" })).toBeVisible();
    expect(screen.getByText("34W 12L")).toBeVisible();
    expect(screen.getByText("1688")).toBeVisible();
    expect(screen.getAllByText("T1").length).toBeGreaterThan(0);
    expect(screen.getByText("Zeus")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "스토브리그 진입" }));

    expect(onStartOffseason).toHaveBeenCalledTimes(1);
  });

  it("disables offseason entry when the career is completed", () => {
    const completedCareer: CareerSave = {
      ...createSummaryCareer(),
      currentSeason: 20,
      seasonState: {
        ...createSummaryCareer().seasonState,
        phase: "completed",
        offseason: {
          ...createSummaryCareer().seasonState.offseason!,
          status: "career-completed",
          nextSeasonNumber: undefined,
        },
      },
    };

    render(
      <SeasonSummary
        career={completedCareer}
        onStartOffseason={vi.fn()}
        onViewRoster={vi.fn()}
      />,
    );

    const offseasonButton = screen.getByRole("button", {
      name: "스토브리그 진입",
    });

    expect(offseasonButton).toBeDisabled();
  });
});
