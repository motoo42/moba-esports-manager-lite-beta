import type { CareerSave, CompetitionId } from "../types/game";
import { normalizeCareerSave } from "../domain/career/normalizeCareerSave";

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

const defaultApiBaseUrl = "/api";
const defaultOwnerId = "local-dev";
const browserOwnerIdStorageKey = "moba-esports-manager-lite.betaOwnerId";

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

function createBrowserOwnerId() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `beta-${randomPart}`;
}

export function getSaveOwnerId() {
  const configuredOwnerId = import.meta.env.VITE_SAVE_OWNER_ID?.trim();

  if (configuredOwnerId) {
    return configuredOwnerId;
  }

  if (import.meta.env.MODE !== "production" || typeof window === "undefined") {
    return defaultOwnerId;
  }

  const existingOwnerId = window.localStorage.getItem(browserOwnerIdStorageKey);

  if (existingOwnerId) {
    return existingOwnerId;
  }

  const nextOwnerId = createBrowserOwnerId();

  window.localStorage.setItem(browserOwnerIdStorageKey, nextOwnerId);

  return nextOwnerId;
}

function createUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  const ownerId = getSaveOwnerId();

  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    const url = `${baseUrl}${path}`;
    const separator = url.includes("?") ? "&" : "?";

    return `${url}${separator}ownerId=${encodeURIComponent(ownerId)}`;
  }

  const url = new URL(`${baseUrl}${path}`);

  url.searchParams.set("ownerId", ownerId);

  return url.toString();
}

function normalizeCareerSaveDto(save: CareerSaveDto): CareerSaveDto {
  return save.career
    ? {
        ...save,
        career: normalizeCareerSave(save.career),
      }
    : save;
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

  return normalizeCareerSaveDto(body.save);
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
      ownerId: getSaveOwnerId(),
      saveName,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = await parseResponse<SaveResponse>(response);

  return normalizeCareerSaveDto(body.save);
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
      ownerId: getSaveOwnerId(),
      saveName,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  const body = await parseResponse<SaveResponse>(response);

  return normalizeCareerSaveDto(body.save);
}

export async function deleteCareerSave(saveId: string) {
  const response = await fetch(createUrl(`/saves/${saveId}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw new Error(
      typeof body.error === "string" ? body.error : "Save delete failed.",
    );
  }
}
