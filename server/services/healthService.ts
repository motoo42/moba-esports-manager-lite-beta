import { pingDatabase } from "../db/mongo.js";
import { ensureCareerSaveIndexes } from "../repositories/careerSavesRepository.js";

export async function getHealthStatus() {
  return {
    ok: true,
    service: "moba-esports-manager-lite-api",
  };
}

export async function getDatabaseHealthStatus() {
  const result = await pingDatabase();

  await ensureCareerSaveIndexes();

  return {
    database: result.databaseName,
    ok: true,
    service: "moba-esports-manager-lite-api",
  };
}
