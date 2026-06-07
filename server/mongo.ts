import { MongoClient, type Db } from "mongodb";
import { getDatabaseName, getMongoUri } from "./config.js";

let client: MongoClient | null = null;

export async function getMongoClient() {
  if (!client) {
    client = new MongoClient(getMongoUri());
  }

  await client.connect();

  return client;
}

export async function getDatabase(): Promise<Db> {
  const mongoClient = await getMongoClient();

  return mongoClient.db(getDatabaseName());
}

export async function pingDatabase() {
  const database = await getDatabase();

  await database.command({ ping: 1 });

  return {
    databaseName: database.databaseName,
    ok: true,
  };
}

export async function closeMongoConnection() {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
}
