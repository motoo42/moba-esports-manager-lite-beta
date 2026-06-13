import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { lck2026Players } from "../../src/data/lck2026Players";
import { SeasonRosterManager } from "../../src/features/roster-management/SeasonRosterManager";
import type { Player, Role, Team } from "../../src/types/game";

const roles: Role[] = ["top", "jungle", "mid", "bot", "support"];

function createTeam(players: Player[]): Team {
  const starters = new Map(
    roles.map((role) => [
      role,
      players.find((player) => player.role === role)?.id ?? "",
    ]),
  );

  return {
    name: players[0]?.currentTeam ?? "Test Team",
    region: "lck",
    budget: 1500,
    rosterSettings: {
      minPlayers: 10,
      maxPlayers: 15,
      freeMovementBetweenMainAndAcademy: true,
      minMainRosterPlayers: 5,
      minAcademyRosterPlayers: 5,
    },
    roster: {
      top: starters.get("top"),
      jungle: starters.get("jungle"),
      mid: starters.get("mid"),
      bot: starters.get("bot"),
      support: starters.get("support"),
    },
    mainRosterPlayerIds: players.slice(0, 5).map((player) => player.id),
    academyRosterPlayerIds: players.slice(5).map((player) => player.id),
    contracts: players.map((player) => ({
      playerId: player.id,
      salary: player.salaryExpectation,
      type: "one-year",
      guaranteedYears: 1,
      remainingYears: 1,
    })),
    wins: 0,
    losses: 0,
    elo: 1670,
  };
}

describe("SeasonRosterManager", () => {
  it("renders portraits for starters, bench cards, and the player detail modal", () => {
    const players = lck2026Players.filter(
      (player) => player.currentTeam === "KT Rolster" && player.rosterTier === "main",
    );

    const { container } = render(
      <SeasonRosterManager
        players={players}
        team={createTeam(players)}
        currentDateKey="2026-01-05"
        progressStatus="idle"
        onCallUpPlayer={vi.fn()}
        onSendDownPlayer={vi.fn()}
        onSetStarter={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "Bdd portrait" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Effort portrait" })).toBeInTheDocument();
    expect(screen.getByLabelText("로스터 예산 요약")).toBeVisible();
    expect(screen.getByText("총 예산")).toBeVisible();
    expect(screen.getByText("잔여 예산")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Bdd/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "커리어" })).toBeVisible();
    expect(screen.getAllByText("KT Rolster").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByRole("img", { name: "Bdd portrait" }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByLabelText(/평가/).length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByLabelText(/평가/)
        .some((element) => element.getAttribute("aria-label") !== "평가 5.0성"),
    ).toBe(true);
    expect(container.querySelector(".evaluation-star-empty")?.textContent).toBe(
      "☆",
    );
    expect(screen.queryByText(/OVR|POT|오버롤|포텐셜/)).not.toBeInTheDocument();
  });

  it("renders academy players separately and calls up players from the academy page", () => {
    const players = lck2026Players.filter(
      (player) => player.currentTeam === "T1",
    );
    const onCallUpPlayer = vi.fn();

    render(
      <SeasonRosterManager
        players={players}
        team={createTeam(players)}
        currentDateKey="2026-01-05"
        progressStatus="idle"
        subPage="academy"
        onCallUpPlayer={onCallUpPlayer}
        onSendDownPlayer={vi.fn()}
        onSetStarter={vi.fn()}
      />,
    );

    expect(
      screen.getAllByRole("heading", { name: "2군 로스터" }).length,
    ).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getAllByRole("button", { name: "1군 콜업" })[0]);

    expect(onCallUpPlayer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders contract status with roster assignments and opens player detail rows", () => {
    const players = lck2026Players.filter(
      (player) => player.currentTeam === "T1",
    );
    const topContractPlayer = players.find((player) => player.role === "top");

    expect(topContractPlayer).toBeDefined();

    render(
      <SeasonRosterManager
        players={players}
        team={createTeam(players)}
        currentDateKey="2026-01-05"
        progressStatus="idle"
        subPage="contracts"
        onCallUpPlayer={vi.fn()}
        onSendDownPlayer={vi.fn()}
        onSetStarter={vi.fn()}
      />,
    );

    expect(
      screen.getAllByRole("heading", { name: "계약 현황" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1군 선발").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2군").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: `${topContractPlayer?.name ?? ""} 계약 상세 보기`,
      }),
    );

    expect(
      screen.getByRole("dialog", {
        name: `${topContractPlayer?.name ?? ""} 선수 상세`,
      }),
    ).toBeVisible();
  });
});
