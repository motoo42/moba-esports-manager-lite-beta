import { config } from "dotenv";

config({ path: ".env.local" });
config();

export const defaultOwnerId = "local-dev";
export const defaultPort = 4000;
export const defaultHost = "127.0.0.1";
export const defaultCorsOrigins = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];

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

export function getServerHost() {
  if (isProduction()) {
    return getEnvValue("HOST") ?? "0.0.0.0";
  }

  return getEnvValue("HOST") ?? defaultHost;
}

export function getCorsOrigins() {
  const configuredOrigins = getEnvValue("CORS_ORIGINS");

  if (!configuredOrigins) {
    return defaultCorsOrigins;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function isProduction() {
  return getEnvValue("NODE_ENV") === "production";
}

export function shouldServeClient() {
  return getEnvValue("SERVE_CLIENT") === "true" || isProduction();
}

export function getClientDistPath() {
  return getEnvValue("CLIENT_DIST_DIR") ?? "dist";
}

export function getAiNewsProvider() {
  return getEnvValue("AI_NEWS_PROVIDER") ?? "none";
}

export function isAiNewsEnabled() {
  return getEnvValue("AI_NEWS_ENABLED") === "true";
}

export function getAiNewsModel() {
  return getEnvValue("AI_NEWS_MODEL") ?? "gemini-3.5-flash";
}

export function getGeminiApiKey() {
  return getEnvValue("GEMINI_API_KEY");
}

export function isAiNewsTestEndpointEnabled() {
  if (!isProduction()) {
    return true;
  }

  return getEnvValue("AI_NEWS_TEST_ENDPOINT_ENABLED") === "true";
}
