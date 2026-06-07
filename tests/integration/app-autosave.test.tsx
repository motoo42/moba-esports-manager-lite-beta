import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
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
    id: "autosave-1",
    schemaVersion: 1,
    mode: "single-player",
    ownerId: "local-dev",
    worldId: "autosave-1",
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

describe("App autosave", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("creates the first autosave after a career starts", async () => {
    const createdSave = createSaveDto();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse({ save: createdSave }, 201);
      }

      return jsonResponse({ saves: [] });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Start career" }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/api/saves?ownerId=local-dev") &&
            init?.method === "POST",
        ),
      ).toBe(true),
    );

    const postCall = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    const requestBody = JSON.parse(postCall?.[1]?.body as string);

    expect(requestBody.saveName).toBe("T1 S1 Autosave");
    expect(await screen.findByText("첫 저장 완료")).toBeInTheDocument();
  });
});
