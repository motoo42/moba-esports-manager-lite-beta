import { config } from "dotenv";

config({ path: ".env.local" });
config();

export const defaultOwnerId = "local-dev";
export const defaultPort = 4000;

export function getEnvValue(key: string) {
  const value = process.env[key]?.trim();

  return value && value.length > 0 ? value : undefined;
}

export function getMongoUri() {
  const uri = getEnvValue("MONGODB_URI");

  if (!uri) {
    throw new Error("Missing MONGODB_URI. Add it to .env.local.");
  }

  return uri;
}

export function getDatabaseName() {
  return getEnvValue("MONGODB_DB_NAME") ?? "moba_esports_manager";
}

export function getServerPort() {
  const configuredPort = Number.parseInt(getEnvValue("PORT") ?? "", 10);

  return Number.isFinite(configuredPort) ? configuredPort : defaultPort;
}
