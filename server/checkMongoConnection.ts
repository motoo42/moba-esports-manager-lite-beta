import { ensureCareerSaveIndexes } from "./careerSaves.js";
import { closeMongoConnection, getDatabase, pingDatabase } from "./mongo.js";

try {
  const ping = await pingDatabase();
  const database = await getDatabase();

  await ensureCareerSaveIndexes(database);
  console.log(
    JSON.stringify(
      {
        collection: "careerSaves",
        database: ping.databaseName,
        ok: true,
      },
      null,
      2,
    ),
  );
} finally {
  await closeMongoConnection();
}
