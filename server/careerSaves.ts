import { ObjectId, type Db, type WithId } from "mongodb";
import { defaultOwnerId } from "./config.js";
import type { CareerSave, CompetitionId } from "../src/types/game.js";

export const careerSaveCollectionName = "careerSaves";
export const careerSaveSchemaVersion = 1;

type SaveMode = "single-player" | "league-multiplayer";
type ParticipantRole = "commissioner" | "manager";

export type CareerSaveParticipant = {
  ownerId: string;
  teamId: string;
  role: ParticipantRole;
};

export type CareerSaveSummary = {
  teamName: string;
  seasonNumber: number;
  currentDateLabel: string;
  currentCompetitionId: CompetitionId | null;
  currentCompetitionName?: string;
};

export type CareerSaveDocument = {
  _id?: ObjectId;
  schemaVersion: number;
  mode: SaveMode;
  ownerId: string;
  worldId: string;
  saveName: string;
  participants: CareerSaveParticipant[];
  revision: number;
  createdAt: string;
  updatedAt: string;
  summary: CareerSaveSummary;
  career: CareerSave;
};

export type CareerSaveDto = Omit<CareerSaveDocument, "_id" | "career"> & {
  id: string;
  career?: CareerSave;
};

type CreateCareerSaveInput = {
  career: CareerSave;
  ownerId?: string;
  saveName?: string;
};

type UpdateCareerSaveInput = CreateCareerSaveInput & {
  expectedRevision?: number;
};

export class CareerSaveConflictError extends Error {
  status = 409;
  currentRevision: number;

  constructor(currentRevision: number) {
    super("Save revision conflict.");
    this.name = "CareerSaveConflictError";
    this.currentRevision = currentRevision;
  }
}

function getCollection(database: Db) {
  return database.collection<CareerSaveDocument>(careerSaveCollectionName);
}

export async function ensureCareerSaveIndexes(database: Db) {
  const collection = getCollection(database);

  await collection.createIndex({ ownerId: 1, updatedAt: -1 });
  await collection.createIndex({ worldId: 1 });
  await collection.createIndex({ ownerId: 1, saveName: 1 });
}

function getOwnerId(ownerId?: string) {
  const normalizedOwnerId = ownerId?.trim();

  return normalizedOwnerId && normalizedOwnerId.length > 0
    ? normalizedOwnerId
    : defaultOwnerId;
}

function getCompetitionName(career: CareerSave) {
  const currentCompetition = career.seasonState.competitions.find(
    (competition) =>
      competition.competitionId === career.seasonState.currentCompetitionId,
  );
  const activeCompetition = career.seasonState.competitions.find(
    (competition) => competition.status === "active",
  );

  return currentCompetition?.name ?? activeCompetition?.name;
}

export function createCareerSaveSummary(career: CareerSave): CareerSaveSummary {
  return {
    teamName: career.userTeam.name,
    seasonNumber: career.currentSeason,
    currentDateLabel: career.seasonState.currentDateLabel,
    currentCompetitionId: career.seasonState.currentCompetitionId,
    currentCompetitionName: getCompetitionName(career),
  };
}

function createDefaultSaveName(career: CareerSave) {
  return `${career.userTeam.name} S${career.currentSeason}`;
}

function createParticipants(
  ownerId: string,
  career: CareerSave,
): CareerSaveParticipant[] {
  return [
    {
      ownerId,
      teamId: career.userTeam.name,
      role: "manager",
    },
  ];
}

function toDto(document: WithId<CareerSaveDocument>): CareerSaveDto {
  const { _id, ...rest } = document;

  return {
    ...rest,
    id: _id.toHexString(),
  };
}

function assertCareerSave(value: unknown): asserts value is CareerSave {
  if (!value || typeof value !== "object") {
    throw new Error("career is required.");
  }

  const career = value as Partial<CareerSave>;

  if (!career.userTeam || !career.seasonState || !career.currentSeason) {
    throw new Error("career payload is not a valid CareerSave.");
  }
}

function toObjectId(saveId: string) {
  if (!ObjectId.isValid(saveId)) {
    throw new Error("Invalid save id.");
  }

  return new ObjectId(saveId);
}

export async function listCareerSaves(database: Db, ownerId?: string) {
  const collection = getCollection(database);
  const saves = await collection
    .find({ ownerId: getOwnerId(ownerId) })
    .sort({ updatedAt: -1 })
    .project<Omit<CareerSaveDocument, "career">>({ career: 0 })
    .toArray();

  return saves.map((save) => toDto(save as WithId<CareerSaveDocument>));
}

export async function getCareerSave(
  database: Db,
  saveId: string,
  ownerId?: string,
) {
  const collection = getCollection(database);
  const save = await collection.findOne({
    _id: toObjectId(saveId),
    ownerId: getOwnerId(ownerId),
  });

  return save ? toDto(save) : null;
}

export async function createCareerSave(
  database: Db,
  input: CreateCareerSaveInput,
) {
  assertCareerSave(input.career);

  const collection = getCollection(database);
  const now = new Date().toISOString();
  const ownerId = getOwnerId(input.ownerId);
  const _id = new ObjectId();
  const document: CareerSaveDocument = {
    _id,
    schemaVersion: careerSaveSchemaVersion,
    mode: "single-player",
    ownerId,
    worldId: _id.toHexString(),
    saveName: input.saveName?.trim() || createDefaultSaveName(input.career),
    participants: createParticipants(ownerId, input.career),
    revision: 1,
    createdAt: now,
    updatedAt: now,
    summary: createCareerSaveSummary(input.career),
    career: input.career,
  };

  await collection.insertOne(document);

  return toDto({ ...document, _id });
}

export async function updateCareerSave(
  database: Db,
  saveId: string,
  input: UpdateCareerSaveInput,
) {
  assertCareerSave(input.career);

  const collection = getCollection(database);
  const _id = toObjectId(saveId);
  const ownerId = getOwnerId(input.ownerId);
  const existing = await collection.findOne({ _id, ownerId });
  const expectedRevision =
    typeof input.expectedRevision === "number" &&
    Number.isInteger(input.expectedRevision) &&
    input.expectedRevision > 0
      ? input.expectedRevision
      : undefined;

  if (!existing) {
    return null;
  }

  if (expectedRevision && existing.revision !== expectedRevision) {
    throw new CareerSaveConflictError(existing.revision);
  }

  const now = new Date().toISOString();
  const nextRevision = existing.revision + 1;
  const update = {
    $set: {
      career: input.career,
      participants: existing.participants.length
        ? existing.participants
        : createParticipants(ownerId, input.career),
      saveName: input.saveName?.trim() || existing.saveName,
      schemaVersion: careerSaveSchemaVersion,
      summary: createCareerSaveSummary(input.career),
      updatedAt: now,
    },
    $inc: {
      revision: 1,
    },
  };

  const result = await collection.updateOne(
    expectedRevision ? { _id, ownerId, revision: expectedRevision } : { _id, ownerId },
    update,
  );

  if (expectedRevision && result.matchedCount === 0) {
    const latest = await collection.findOne({ _id, ownerId });

    if (!latest) {
      return null;
    }

    throw new CareerSaveConflictError(latest.revision);
  }

  return toDto({
    ...existing,
    ...update.$set,
    revision: nextRevision,
    _id,
  });
}

export async function deleteCareerSave(
  database: Db,
  saveId: string,
  ownerId?: string,
) {
  const collection = getCollection(database);
  const result = await collection.deleteOne({
    _id: toObjectId(saveId),
    ownerId: getOwnerId(ownerId),
  });

  return result.deletedCount > 0;
}
