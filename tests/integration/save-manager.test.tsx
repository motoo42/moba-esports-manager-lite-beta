import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialCareer } from "../../src/domain/career/createInitialCareer";
import { SaveManager } from "../../src/features/save-manager";
import type { CareerSaveDto } from "../../src/services/careerSavesApi";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

function noContentResponse() {
  return new Response(null, { status: 204 });
}

function createSaveDto(overrides: Partial<CareerSaveDto> = {}): CareerSaveDto {
  const career = createInitialCareer("T1");

  return {
    id: "save-1",
    schemaVersion: 1,
    mode: "single-player",
    ownerId: "local-dev",
    worldId: "save-1",
    saveName: "T1 S1",
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

describe("SaveManager", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a career save through the save API", async () => {
    const career = createInitialCareer("T1");
    const save = createSaveDto();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ saves: [] }))
      .mockResolvedValueOnce(jsonResponse({ save }, 201))
      .mockResolvedValueOnce(jsonResponse({ saves: [save] }));
    const onActiveSaveChange = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SaveManager
        activeSaveId={null}
        career={career}
        onActiveSaveChange={onActiveSaveChange}
        onLoadCareer={vi.fn()}
        variant="panel"
      />,
    );

    await screen.findByText("저장 슬롯 없음");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onActiveSaveChange).toHaveBeenCalledWith("save-1"));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/saves?ownerId=local-dev"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates an active save with the expected revision", async () => {
    const career = createInitialCareer("T1");
    const initialSave = createSaveDto({ revision: 3 });
    const updatedSave = createSaveDto({ revision: 4 });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ saves: [initialSave] }))
      .mockResolvedValueOnce(jsonResponse({ save: updatedSave }))
      .mockResolvedValueOnce(jsonResponse({ saves: [updatedSave] }));
    const onSaveCommitted = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SaveManager
        activeSaveId="save-1"
        activeSaveRevision={3}
        career={career}
        onActiveSaveChange={vi.fn()}
        onLoadCareer={vi.fn()}
        onSaveCommitted={onSaveCommitted}
        variant="panel"
      />,
    );

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onSaveCommitted).toHaveBeenCalledWith(updatedSave));
    const [, requestInit] = fetchMock.mock.calls[1];
    const requestBody = JSON.parse(requestInit.body as string);

    expect(fetchMock.mock.calls[1][0]).toContain("/api/saves/save-1?ownerId=local-dev");
    expect(requestInit).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(requestBody.expectedRevision).toBe(3);
  });

  it("shows a revision conflict when the save API rejects a stale update", async () => {
    const career = createInitialCareer("T1");
    const initialSave = createSaveDto({ revision: 3 });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ saves: [initialSave] }))
      .mockResolvedValueOnce(
        jsonResponse(
          { currentRevision: 4, error: "Save revision conflict." },
          409,
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SaveManager
        activeSaveId="save-1"
        activeSaveRevision={3}
        career={career}
        onActiveSaveChange={vi.fn()}
        onLoadCareer={vi.fn()}
        variant="panel"
      />,
    );

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByText("저장 충돌: 새로고침 필요")).toBeInTheDocument();
  });

  it("loads a selected career save through the save API", async () => {
    const career = createInitialCareer("T1");
    const legacyCareer = {
      ...career,
      seasonHistory: undefined,
      weeklyPlan: undefined,
    } as unknown as typeof career;
    const save = createSaveDto({ career: legacyCareer });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ saves: [createSaveDto()] }))
      .mockResolvedValueOnce(jsonResponse({ save }));
    const onLoadCareer = vi.fn();
    const onSaveCommitted = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SaveManager
        activeSaveId={null}
        career={null}
        onActiveSaveChange={vi.fn()}
        onLoadCareer={onLoadCareer}
        onSaveCommitted={onSaveCommitted}
        variant="panel"
      />,
    );

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.change(screen.getByRole("combobox", { name: "Save slot" }), {
      target: { value: "save-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "불러오기" }));

    await waitFor(() => expect(onLoadCareer).toHaveBeenCalled());
    const loadedCareer = onLoadCareer.mock.calls[0][0];

    expect(loadedCareer.weeklyPlan).toEqual({
      strategy: "balanced",
      trainingIntensity: "normal",
    });
    expect(loadedCareer.seasonHistory).toEqual([]);
    expect(onLoadCareer.mock.calls[0][1]).toBe("save-1");
    expect(onSaveCommitted.mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: save.id }),
    );
    expect(onSaveCommitted.mock.calls[0][0].career.weeklyPlan).toEqual({
      strategy: "balanced",
      trainingIntensity: "normal",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/saves/save-1?ownerId=local-dev"),
    );
  });

  it("deletes a selected save after confirmation", async () => {
    const career = createInitialCareer("T1");
    const save = createSaveDto();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ saves: [save] }))
      .mockResolvedValueOnce(noContentResponse())
      .mockResolvedValueOnce(jsonResponse({ saves: [] }));
    const onActiveSaveChange = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SaveManager
        activeSaveId="save-1"
        activeSaveRevision={1}
        career={career}
        onActiveSaveChange={onActiveSaveChange}
        onLoadCareer={vi.fn()}
        variant="panel"
      />,
    );

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    const dialog = await screen.findByRole("dialog", {
      name: "저장 삭제 확인",
    });

    expect(within(dialog).getByText("T1 S1")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

    await waitFor(() => expect(onActiveSaveChange).toHaveBeenCalledWith(null));
    expect(fetchMock.mock.calls[1][0]).toContain(
      "/api/saves/save-1?ownerId=local-dev",
    );
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(await screen.findByText("저장 슬롯 없음")).toBeInTheDocument();
  });

  it("keeps a save when delete confirmation is cancelled", async () => {
    const save = createSaveDto();
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ saves: [save] }));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SaveManager
        activeSaveId={null}
        career={null}
        onActiveSaveChange={vi.fn()}
        onLoadCareer={vi.fn()}
        variant="panel"
      />,
    );

    await screen.findByText("저장 목록 동기화됨");
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    const dialog = await screen.findByRole("dialog", {
      name: "저장 삭제 확인",
    });

    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "저장 삭제 확인" }),
      ).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
