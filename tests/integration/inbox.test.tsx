import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { Inbox } from "../../src/features/inbox";
import type { CareerMessage } from "../../src/types/game";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { AppShell } from "../../src/shared/layout/AppShell";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

function getMainContent() {
  const main = document.querySelector(".app-main");

  if (!main) {
    throw new Error("App main content was not rendered.");
  }

  return within(main as HTMLElement);
}

describe("Inbox", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ saves: [] })),
    );
  });

  it("opens the inbox route from the sidebar and marks messages read", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-inbox"));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));

    expect(
      screen.getByRole("heading", { level: 1, name: "메시지함" }),
    ).toBeVisible();
    expect(
      within(screen.getByLabelText("메시지 목록")).getByText(
        "프리시즌 스토브리그 시작",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /중요/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox/important"));
    expect(
      within(screen.getByLabelText("메시지 목록")).getByText(
        "프리시즌 스토브리그 시작",
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: /전체/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));

    fireEvent.click(screen.getByRole("button", { name: "모두 읽음" }));
    expect(screen.getByText(/읽지 않음/)).toHaveTextContent("읽지 않음 0");
  });

  it("opens inbox category routes directly from the sidebar submenu", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-inbox"));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));

    fireEvent.click(screen.getByRole("button", { name: "이적" }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox/transfer"));
    expect(screen.getByRole("tab", { name: /이적/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "일정" }));
    await waitFor(() => expect(window.location.pathname).toBe("/inbox/schedule"));
    expect(screen.getByRole("tab", { name: /일정/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("caps the sidebar unread important message badge at 99+", () => {
    const career = createInitialCareer("T1");
    const messages: CareerMessage[] = Array.from({ length: 120 }, (_, index) => ({
      id: `important-${index}`,
      dateKey: "2026-01-01",
      dateLabel: "2026년 1월 1일",
      category: "important",
      priority: "important",
      title: `중요 메시지 ${index + 1}`,
      body: "배지 표시 회귀 테스트용 메시지입니다.",
      read: false,
      createdTurn: index,
      source: "club",
    }));

    render(
      <AppShell
        career={{ ...career, messages }}
        onGoTo={vi.fn()}
        onProgress={vi.fn()}
        route="main-dashboard"
      >
        <div>Dashboard</div>
      </AppShell>,
    );

    const inboxButton = screen.getByTestId("shell-menu-inbox");

    expect(
      within(inboxButton).getByLabelText("읽지 않은 중요 메시지 120개"),
    ).toHaveTextContent("99+");
  });

  it("shows recent messages on the main dashboard", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-home"));
    await waitFor(() => expect(window.location.pathname).toBe("/hub"));

    expect(getMainContent().getByText("최근 메시지")).toBeVisible();
    expect(getMainContent().getByText("프리시즌 스토브리그 시작")).toBeVisible();

    fireEvent.click(
      getMainContent().getByRole("button", { name: "최근 메시지함 열기" }),
    );
    await waitFor(() => expect(window.location.pathname).toBe("/inbox"));
  });

  it("keeps priority badges stable for long titles and hides created turn metadata", () => {
    const career = createInitialCareer("T1");
    const longMessage: CareerMessage = {
      id: "long-message",
      dateKey: "2026-01-01",
      dateLabel: "2026년 1월 1일",
      category: "important",
      priority: "important",
      title:
        "아주 긴 제목의 중요 메시지가 들어와도 중요도 배지는 찌그러지지 않아야 합니다",
      body: "긴 제목 UI 회귀 테스트용 메시지입니다.",
      read: false,
      createdTurn: 42,
      source: "club",
      relatedCompetitionId: "lck-cup",
    };

    render(
      <Inbox
        career={{ ...career, messages: [longMessage] }}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        onGoTo={vi.fn()}
        onSubPageChange={vi.fn()}
        subPage="important"
      />,
    );

    const chip = document.querySelector(".inbox-priority-chip");

    expect(chip).not.toBeNull();
    expect(chip as HTMLElement).toHaveClass(
      "inbox-priority-chip",
      "inbox-priority-important",
    );
    const readChip = document.querySelector(".inbox-read-chip");

    expect(readChip).not.toBeNull();
    expect(readChip as HTMLElement).toHaveClass(
      "inbox-read-chip",
      "inbox-read-chip-unread",
    );
    expect(readChip).toHaveTextContent("안읽음");
    expect(screen.queryByText("생성 턴")).not.toBeInTheDocument();
    expect(screen.queryByText("42")).not.toBeInTheDocument();
    expect(screen.queryByText("상태")).not.toBeInTheDocument();
    expect(screen.queryByText("관련 대회")).not.toBeInTheDocument();
    expect(screen.queryByText("lck-cup")).not.toBeInTheDocument();
  });

  it("shows important-priority offseason transfer messages in the important tab", () => {
    const career = createInitialCareer("T1");
    const transferMessage: CareerMessage = {
      id: "important-transfer-message",
      dateKey: "2025-12-20",
      dateLabel: "2025년 12월 20일",
      category: "transfer",
      priority: "important",
      title: "FA 협상 결과",
      body: "Gen.G가 재계약을 마쳤습니다.",
      read: false,
      createdTurn: 3,
      source: "offseason",
    };

    render(
      <Inbox
        career={{ ...career, messages: [transferMessage] }}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        onGoTo={vi.fn()}
        onSubPageChange={vi.fn()}
        subPage="important"
      />,
    );

    expect(screen.getByRole("tab", { name: /중요 1/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      within(screen.getByLabelText("메시지 목록")).getByText("FA 협상 결과"),
    ).toBeVisible();
    expect(screen.queryByText(/AI 재계약/)).not.toBeInTheDocument();
    expect(screen.getByText("이적 · 스토브리그")).toBeVisible();
  });

  it("shows contextual inbox action buttons for report and offseason summary messages", () => {
    const career = createInitialCareer("T1");
    const onGoTo = vi.fn();
    const messages: CareerMessage[] = [
      {
        id: "weekly-squad-report",
        dateKey: "2026-01-21",
        dateLabel: "2026년 1월 21일",
        category: "training",
        priority: "normal",
        title: "주간 선수단 리포트",
        body:
          "이번 주 선수단 리포트\n- 선발 평균 컨디션 86\n- 평균 피로도 36\n권장 조치: 주간 계획을 확인하세요.",
        read: false,
        createdTurn: 4,
        source: "club",
      },
      {
        id: "offseason-weekly-summary",
        dateKey: "2025-12-24",
        dateLabel: "2025년 12월 24일",
        category: "transfer",
        priority: "normal",
        title: "스토브리그 주간 요약",
        body: "1주차 주요 스토브리그 움직임입니다. Chovy 재계약(Gen.G).",
        read: false,
        createdTurn: 3,
        source: "offseason",
      },
    ];

    render(
      <Inbox
        career={{ ...career, messages }}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        onGoTo={onGoTo}
        onSubPageChange={vi.fn()}
        subPage="all"
      />,
    );

    expect(screen.getByText("선발 평균 컨디션 86")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "주간 계획으로 이동" }));
    expect(onGoTo).toHaveBeenCalledWith("match-week", { subPage: "plan" });

    fireEvent.click(screen.getByText("스토브리그 주간 요약"));
    fireEvent.click(screen.getByRole("button", { name: "스토브리그로 이동" }));
    expect(onGoTo).toHaveBeenCalledWith("offseason", { subPage: "overview" });
  });

  it("shows roster and strategy shortcuts for next match schedule messages", () => {
    const career = createInitialCareer("T1");
    const onGoTo = vi.fn();
    const scheduleMessage: CareerMessage = {
      id: "next-schedule-message",
      dateKey: "2026-01-14",
      dateLabel: "2026년 1월 14일",
      category: "schedule",
      priority: "important",
      title: "다음 경기 일정 안내",
      body: "오늘 경기 준비 알림\n- Gen.G 상대 경기가 오늘 예정되어 있습니다.\n권장 행동: 로스터 관리와 전략/훈련 탭을 확인하세요.",
      read: false,
      createdTurn: 5,
      source: "competition",
    };

    render(
      <Inbox
        career={{ ...career, messages: [scheduleMessage] }}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        onGoTo={onGoTo}
        onSubPageChange={vi.fn()}
        subPage="schedule"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "로스터 관리로 이동" }));
    expect(onGoTo).toHaveBeenCalledWith("roster-builder", { subPage: "main" });

    fireEvent.click(screen.getByRole("button", { name: "전략/훈련으로 이동" }));
    expect(onGoTo).toHaveBeenCalledWith("match-week", { subPage: "report" });
  });
});
