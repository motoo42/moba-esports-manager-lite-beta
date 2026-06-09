import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import {
  clearRouteDebugTrace,
  getRouteDebugTrace,
} from "../../src/app/routeDebugTrace";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { completeStoveLeague } from "../../src/domain/season";
import type { CareerSaveDto } from "../../src/services/careerSavesApi";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

function createSaveDto(overrides: Partial<CareerSaveDto> = {}): CareerSaveDto {
  const career = createInitialCareer("T1");

  return {
    id: "save-1",
    schemaVersion: 1,
    mode: "single-player",
    ownerId: "local-dev",
    worldId: "save-1",
    saveName: "T1 S1 Autosave",
    participants: [{ ownerId: "local-dev", teamId: "T1", role: "manager" }],
    revision: 1,
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    summary: {
      teamName: "T1",
      seasonNumber: 1,
      currentDateLabel: career.seasonState.currentDateLabel,
      currentCompetitionId: career.seasonState.currentCompetitionId,
      currentCompetitionName: "LCK Cup",
    },
    ...overrides,
  };
}

function getMainContent() {
  const main = document.querySelector(".app-main");

  if (!main) {
    throw new Error("App main content was not rendered.");
  }

  return within(main as HTMLElement);
}

describe("App routing", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    clearRouteDebugTrace();
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ saves: [] })),
    );
  });

  it.each([
    "/hub",
    "/summary",
    "/offseason",
    "/saves",
    "/inbox",
    "/teams",
    "/teams/gen-g",
    "/calendar/calendar",
    "/competitions/worlds/bracket",
  ])("guards %s when no career is loaded", async (pathname) => {
    window.history.pushState({}, "", pathname);

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Start career" }),
    ).toBeVisible();
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("navigates calendar submenu clicks to URL subpages", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));
    fireEvent.click(await screen.findByTestId("shell-menu-calendar"));

    await waitFor(() => expect(window.location.pathname).toBe("/calendar"));

    fireEvent.click(screen.getAllByRole("button", { name: "달력" })[0]);

    await waitFor(() =>
      expect(window.location.pathname).toBe("/calendar/calendar"),
    );
    expect(screen.getByText("Selected Day")).toBeVisible();
  });

  it("moves save controls to the dedicated save manager route", async () => {
    const save = createSaveDto();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "POST") {
          return jsonResponse({ save }, 201);
        }

        return jsonResponse({ saves: [save] });
      }),
    );

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));

    expect(screen.queryByRole("button", { name: "저장" })).not.toBeInTheDocument();
    expect(
      await screen.findByText(/자동 저장|첫 저장|저장 서버|저장 충돌/),
    ).toBeVisible();

    fireEvent.click(await screen.findByTestId("shell-menu-save"));

    await waitFor(() => expect(window.location.pathname).toBe("/saves"));
    expect(
      screen.getByRole("heading", { level: 1, name: "데이터 저장" }),
    ).toBeVisible();
    const savePanel = screen.getByText("저장 불러오기").closest("section");

    expect(savePanel).not.toBeNull();
    const savePanelQueries = within(savePanel as HTMLElement);

    expect(savePanelQueries.getByRole("button", { name: "저장" })).toBeVisible();
    expect(
      savePanelQueries.getByRole("button", { name: "새 저장" }),
    ).toBeVisible();
    expect(
      savePanelQueries.getByRole("button", { name: "불러오기" }),
    ).toBeVisible();
  });

  it("opens the read-only offseason hub from the sidebar during competition", async () => {
    const baseCareer = createInitialCareer("T1");
    const career = {
      ...baseCareer,
      seasonState: {
        ...completeStoveLeague(baseCareer.seasonState),
        offseason: undefined,
      },
    };
    const save = createSaveDto({ career });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL) => {
        const requestUrl = String(url);

        if (requestUrl.includes("/api/saves/save-1")) {
          return jsonResponse({ save });
        }

        return jsonResponse({ saves: [save] });
      }),
    );

    render(<App />);

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.change(screen.getByRole("combobox", { name: "Save slot" }), {
      target: { value: "save-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "불러오기" }));

    await waitFor(() => expect(window.location.pathname).toBe("/hub"));

    fireEvent.click(await screen.findByTestId("shell-menu-offseason"));

    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));
    expect(
      await screen.findByText("현재 이적시장은 닫혀 있습니다."),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "FA 협상" })).not.toBeInTheDocument();
  });

  it("opens the LCK team info route from the season sidebar", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));
    await waitFor(() => expect(window.location.pathname).toBe("/offseason"));

    fireEvent.click(await screen.findByTestId("shell-menu-lck-team-info"));

    await waitFor(() => expect(window.location.pathname).toBe("/teams"));
    expect(
      screen.getByRole("heading", { level: 1, name: "LCK 구단 정보" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Gen\.G/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/teams/gen-g"));
    expect(screen.getByRole("heading", { level: 1, name: "Gen.G" })).toBeVisible();
  });

  it("keeps dashboard internal navigation on the target URL without route bounce", async () => {
    const baseCareer = createInitialCareer("T1");
    const career = {
      ...baseCareer,
      seasonState: {
        ...completeStoveLeague(baseCareer.seasonState),
        offseason: undefined,
      },
    };
    const save = createSaveDto({ career });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL) => {
        const requestUrl = String(url);

        if (requestUrl.includes("/api/saves/save-1")) {
          return jsonResponse({ save });
        }

        return jsonResponse({ saves: [save] });
      }),
    );

    render(<App />);

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.change(screen.getByRole("combobox", { name: "Save slot" }), {
      target: { value: "save-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "불러오기" }));

    await waitFor(() => expect(window.location.pathname).toBe("/hub"));

    fireEvent.click(getMainContent().getByRole("button", { name: "로스터 관리" }));
    await waitFor(() => expect(window.location.pathname).toBe("/roster"));
    await waitFor(() => expect(window.location.pathname).not.toBe("/hub"));

    fireEvent.click(screen.getByRole("button", { name: "2군" }));
    await waitFor(() => expect(window.location.pathname).toBe("/roster/academy"));

    fireEvent.click(screen.getByRole("button", { name: "계약" }));
    await waitFor(() => expect(window.location.pathname).toBe("/roster/contracts"));

    fireEvent.click(await screen.findByTestId("shell-menu-home"));
    await waitFor(() => expect(window.location.pathname).toBe("/hub"));

    fireEvent.click(getMainContent().getByRole("button", { name: "대회 현황" }));
    await waitFor(() =>
      expect(window.location.pathname).toMatch(/^\/competitions/),
    );
    await waitFor(() => expect(window.location.pathname).not.toBe("/hub"));

    fireEvent.click(await screen.findByTestId("shell-menu-home"));
    await waitFor(() => expect(window.location.pathname).toBe("/hub"));

    fireEvent.click(getMainContent().getByRole("button", { name: "시즌 일정" }));
    await waitFor(() => expect(window.location.pathname).toBe("/calendar"));
    await waitFor(() => expect(window.location.pathname).not.toBe("/hub"));

    expect(
      getRouteDebugTrace().filter(
        (entry) => entry.source === "navigation" && entry.toPath === entry.fromPath,
      ),
    ).toEqual([]);
  });
});
