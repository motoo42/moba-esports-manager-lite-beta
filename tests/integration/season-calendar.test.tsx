import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { normalSeasonCompetitions } from "../../src/data/competitions";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { SeasonCalendar } from "../../src/features/season-calendar";

describe("SeasonCalendar", () => {
  it("renders controlled roadmap and calendar subpages", () => {
    const career = createInitialCareer("T1");
    const props = {
      career,
      competitions: normalSeasonCompetitions,
      onViewCompetition: vi.fn(),
      onViewSummary: vi.fn(),
    };
    const roadmapView = render(
      <SeasonCalendar {...props} viewMode="roadmap" />,
    );

    expect(screen.getByText("현재 대회")).toBeVisible();
    roadmapView.unmount();

    render(<SeasonCalendar {...props} viewMode="calendar" />);

    expect(screen.getByText("Selected Day")).toBeVisible();
    expect(screen.getByText("다음 우리 팀 경기")).toBeVisible();
  });

  it("emits view mode changes instead of mutating internal tabs when controlled", () => {
    const onViewModeChange = vi.fn();

    render(
      <SeasonCalendar
        career={createInitialCareer("T1")}
        competitions={normalSeasonCompetitions}
        viewMode="roadmap"
        onViewModeChange={onViewModeChange}
        onViewCompetition={vi.fn()}
        onViewSummary={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "달력" }));

    expect(onViewModeChange).toHaveBeenCalledWith("calendar");
    expect(screen.getByText("현재 대회")).toBeVisible();
  });
});
