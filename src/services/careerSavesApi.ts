import type { CareerSave, CompetitionId } from "../types/game";

export type CareerSaveSummary = {
  teamName: string;
  seasonNumber: number;
  currentDateLabel: string;
  currentCompetitionId: CompetitionId | null;
  currentCompetitionName?: string;
};

export type CareerSaveDto = {
  id: string;
  schemaVersion: number;
  mode: "single-player" | "league-multiplayer";
  ownerId: string;
  worldId: string;
  saveName: string;
  participants: Array<{
    ownerId: string;
    teamId: string;
    role: "commissioner" | "manager";
  }>;
  revision: number;
  createdAt: string;
  updatedAt: string;
  summary: CareerSaveSummary;
  career?: CareerSave;
};

type SaveResponse = {
  save: CareerSaveDto;
};

type SaveListResponse = {
  saves: CareerSaveDto[];
};

const defaultApiBaseUrl = "http://127.0.0.1:4000/api";
const defaultOwnerId = "local-dev";

export class SaveConflictError extends Error {
  currentRevision?: number;

  constructor(message: string, currentRevision?: number) {
    super(message);
    this.name = "SaveConflictError";
    this.currentRevision = currentRevision;
  }
}

export function isSaveConflictError(error: unknown): error is SaveConflictError {
  return error instanceof SaveConflictError;
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
}

function createUrl(path: string) {
  const url = new URL(`${getApiBaseUrl()}${path}`);

  url.searchParams.set("ownerId", defaultOwnerId);

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 409) {
      throw new SaveConflictError(
        typeof body.error === "string" ? body.error : "Save revision conflict.",
        typeof body.currentRevision === "number" ? body.currentRevision : undefined,
      );
    }

    throw new Error(
      typeof body.error === "string" ? body.error : "Save API request failed.",
    );
  }

  return body as T;
}

export async function listCareerSaves() {
  const response = await fetch(createUrl("/saves"));
  const body = await parseResponse<SaveListResponse>(response);

  return body.saves;
}

export async function getCareerSave(saveId: string) {
  const response = await fetch(createUrl(`/saves/${saveId}`));
  const body = await parseResponse<SaveResponse>(response);

  return body.save;
}

export async function createCareerSave({
  career,
  saveName,
}: {
  career: CareerSave;
  saveName?: string;
}) {
  const response = await fetch(createUrl("/saves"), {
    body: JSON.stringify({
      career,
      ownerId: defaultOwnerId,
      saveName,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = await parseResponse<SaveResponse>(response);

  return body.save;
}

export async function updateCareerSave({
  career,
  expectedRevision,
  saveId,
  saveName,
}: {
  career: CareerSave;
  expectedRevision?: number | null;
  saveId: string;
  saveName?: string;
}) {
  const response = await fetch(createUrl(`/saves/${saveId}`), {
    body: JSON.stringify({
      career,
      expectedRevision,
      ownerId: defaultOwnerId,
      saveName,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  const body = await parseResponse<SaveResponse>(response);

  return body.save;
}
