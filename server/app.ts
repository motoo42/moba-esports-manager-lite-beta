import cors from "cors";
import express from "express";
import path from "node:path";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { defaultCorsOrigins } from "./config.js";
import { careerSavesRoutes } from "./routes/careerSavesRoutes.js";
import { aiNewsRoutes } from "./routes/aiNewsRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";

type CreateAppOptions = {
  clientDistPath?: string;
  corsOrigins?: string[];
  serveClient?: boolean;
};

export function createApp({
  clientDistPath = "dist",
  corsOrigins = defaultCorsOrigins,
  serveClient = false,
}: CreateAppOptions = {}) {
  const app = express();
  const resolvedClientDistPath = path.resolve(process.cwd(), clientDistPath);

  app.use(
    cors({
      origin: corsOrigins,
    }),
  );
  app.use(express.json({ limit: "10mb" }));

  app.use("/api", healthRoutes);
  app.use("/api", careerSavesRoutes);
  app.use("/api", aiNewsRoutes);

  if (serveClient) {
    app.use(express.static(resolvedClientDistPath));
    app.get(/^\/(?!api(?:\/|$)).*/, (_request, response) => {
      response.sendFile(path.join(resolvedClientDistPath, "index.html"));
    });
  }

  app.use(errorMiddleware);

  return app;
}
