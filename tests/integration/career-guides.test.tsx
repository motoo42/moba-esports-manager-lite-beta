import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ROSTER_MANAGEMENT_GUIDE_ID } from "../../src/domain/career/careerGuides";
import { CareerGuideEntry } from "../../src/features/career-guides";

describe("CareerGuideEntry", () => {
  it("opens unseen guides automatically and marks them seen on close", () => {
    const onMarkGuideSeen = vi.fn();

    render(
      <CareerGuideEntry
        guideId={ROSTER_MANAGEMENT_GUIDE_ID}
        hasSeenGuide={false}
        onMarkGuideSeen={onMarkGuideSeen}
        showFirstEntryGuide
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "로스터 관리 기본" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onMarkGuideSeen).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("dialog", { name: "로스터 관리 기본" }),
    ).not.toBeInTheDocument();
  });

  it("keeps a manual re-open entry after the guide has already been seen", () => {
    const onMarkGuideSeen = vi.fn();

    render(
      <CareerGuideEntry
        guideId={ROSTER_MANAGEMENT_GUIDE_ID}
        hasSeenGuide
        onMarkGuideSeen={onMarkGuideSeen}
        showFirstEntryGuide
      />,
    );

    expect(
      screen.queryByRole("dialog", { name: "로스터 관리 기본" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "로스터 가이드 보기" }));

    expect(
      screen.getByRole("dialog", { name: "로스터 관리 기본" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onMarkGuideSeen).not.toHaveBeenCalled();
  });
});
