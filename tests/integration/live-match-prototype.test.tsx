import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveMatchPrototype } from "../../src/features/live-match/LiveMatchPrototype";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Each set opens on the draft screen; start the match before exercising it.
function renderAndStart() {
  const utils = render(<LiveMatchPrototype career={null} onExit={() => {}} />);

  act(() => {
    fireEvent.click(screen.getByText("경기 시작"));
  });

  return utils;
}

describe("LiveMatchPrototype", () => {
  it("opens on the draft screen and starts the match on 경기 시작", () => {
    const { container } = render(
      <LiveMatchPrototype career={null} onExit={() => {}} />,
    );

    expect(container.querySelector(".live-draft-screen")).toBeTruthy();
    expect(container.querySelector(".live-match-main")).toBeNull();

    act(() => {
      fireEvent.click(screen.getByText("경기 시작"));
    });

    expect(container.querySelector(".live-match-main")).toBeTruthy();
  });

  it("plays an engine-driven match and reveals commentary over time", () => {
    const { container } = renderAndStart();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    const earlyCount = container.querySelectorAll(".live-commentary-event").length;

    act(() => {
      vi.advanceTimersByTime(70_000);
    });
    const lateCount = container.querySelectorAll(".live-commentary-event").length;

    expect(lateCount).toBeGreaterThan(earlyCount);
    // The mandatory closing nexus is reached and narrated by the end. Scope to the
    // commentary feed since the momentum graph callout shows the same event name.
    const feed = container.querySelector(".live-commentary-feed") as HTMLElement;
    expect(within(feed).getByText("넥서스 파괴")).toBeInTheDocument();
  });

  it("renders a live 10-player stat board with KDA after playback", () => {
    const { container } = renderAndStart();

    act(() => {
      vi.advanceTimersByTime(70_000);
    });

    const rows = container.querySelectorAll(".live-player-row");
    expect(rows).toHaveLength(10);
  });

  it("jumps to the result when 세트 결과 is pressed", () => {
    const { container } = renderAndStart();

    act(() => {
      fireEvent.click(screen.getByText("세트 결과"));
    });

    const feed = container.querySelector(".live-commentary-feed") as HTMLElement;
    expect(within(feed).getByText("넥서스 파괴")).toBeInTheDocument();
  });

  it("filters the feed down to swing moments under 핵심 상황", () => {
    const { container } = renderAndStart();

    act(() => {
      fireEvent.click(screen.getByText("세트 결과"));
    });
    const majorCount = container.querySelectorAll(".live-commentary-event").length;

    act(() => {
      fireEvent.click(screen.getByText("핵심 상황"));
    });
    const coreCount = container.querySelectorAll(".live-commentary-event").length;

    expect(coreCount).toBeLessThanOrEqual(majorCount);
  });

  it("pauses playback when 일시정지 is pressed", () => {
    renderAndStart();

    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    act(() => {
      fireEvent.click(screen.getByText("일시정지"));
    });

    expect(screen.getByText("재생")).toBeInTheDocument();
  });
});
