import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { completeStoveLeague } from "../../src/domain/season";
import { CompetitionDashboard } from "../../src/features/competition-dashboard";
import { LckTeamInfo } from "../../src/features/lck-team-info";

describe("LCK team info", () => {
  it("renders the LCK 10-team grid and opens a selected team", () => {
    const career = createInitialCareer("T1");
    const onViewTeam = vi.fn();

    render(
      <LckTeamInfo
        career={career}
        onViewTeam={onViewTeam}
        onViewTeamList={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LCK 구단 정보" }),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: "Gen.G logo" })).toBeVisible();
    const grid = document.querySelector(".lck-team-info-grid");

    expect(grid).not.toBeNull();
    expect(within(grid as HTMLElement).getAllByRole("button")).toHaveLength(10);
    expect(within(grid as HTMLElement).queryByText("GEN")).not.toBeInTheDocument();
    expect(within(grid as HTMLElement).getByText("젠지")).toBeVisible();
    expect(within(grid as HTMLElement).getByText("DN 수퍼스")).toBeVisible();
    expect(
      screen.queryByText("정교한 운영과 우승권 기준을 상징하는 강팀."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Gen\.G/ }));

    expect(onViewTeam).toHaveBeenCalledWith("gen-g");
  });

  it("shows read-only roster scouting details with evaluation stars", () => {
    const career = createInitialCareer("T1");

    render(
      <LckTeamInfo
        career={career}
        teamId="t1"
        onViewTeam={vi.fn()}
        onViewTeamList={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "T1" })).toBeVisible();
    expect(screen.getAllByRole("img", { name: "T1 logo" }).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/LCK와 국제대회 역사를 대표하는 명문 구단/),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "역사" })).toBeVisible();
    expect(screen.getAllByText(/SK Telecom T1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Worlds 2013/)).toBeVisible();
    expect(screen.queryByText("최근 대회")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/선발 5인과 후보, 아카데미 구성을 스카우팅 관점/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "선발 5인" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "1군 후보" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "2군 / 아카데미" })).toBeVisible();
    expect(screen.getAllByText("평가").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Faker/ }));
    expect(
      screen.getByRole("dialog", { name: "Faker 선수 상세" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "커리어" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByText(/OVR|POT|오버롤|포텐셜/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ability|potential/i)).not.toBeInTheDocument();
  });

  it("falls back to the team list for an unknown team id", () => {
    const career = createInitialCareer("T1");

    render(
      <LckTeamInfo
        career={career}
        teamId="unknown"
        onViewTeam={vi.fn()}
        onViewTeamList={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "LCK 구단 정보" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /젠지.*Gen\.G/ })).toBeVisible();
  });

  it("links LCK standings team names to team scouting details", () => {
    const baseCareer = createInitialCareer("T1");
    const career = {
      ...baseCareer,
      seasonState: completeStoveLeague(baseCareer.seasonState),
    };
    const onViewTeam = vi.fn();

    render(
      <CompetitionDashboard
        career={career}
        competitionId="lck-cup"
        onViewTeam={onViewTeam}
      />,
    );

    expect(screen.getByRole("img", { name: "Gen.G logo" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Gen\.G/ }));

    expect(onViewTeam).toHaveBeenCalledWith("gen-g");
  });
});
