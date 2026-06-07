import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { defaultOwnerId, getServerPort } from "./config.js";
import {
  createCareerSave,
  deleteCareerSave,
  ensureCareerSaveIndexes,
  getCareerSave,
  listCareerSaves,
  updateCareerSave,
} from "./careerSaves.js";
import {
  closeMongoConnection,
  getDatabase,
  pingDatabase,
} from "./mongo.js";

type ErrorWithStatus = Error & {
  currentRevision?: number;
  status?: number;
};

const app = express();
const port = getServerPort();

app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  }),
);
app.use(express.json({ limit: "10mb" }));

function getOwnerId(request: Request) {
  const ownerId = request.query.ownerId;

  return typeof ownerId === "string" && ownerId.trim()
    ? ownerId
    : defaultOwnerId;
}

app.get("/api/health", async (_request, response, next) => {
  try {
    const result = await pingDatabase();
    const database = await getDatabase();

    await ensureCareerSaveIndexes(database);

    response.json({
      database: result.databaseName,
      ok: true,
      service: "moba-esports-manager-lite-api",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/saves", async (request, response, next) => {
  try {
    const database = await getDatabase();
    const saves = await listCareerSaves(database, getOwnerId(request));

    response.json({ saves });
  } catch (error) {
    next(error);
  }
});

app.post("/api/saves", async (request, response, next) => {
  try {
    const database = await getDatabase();
    const save = await createCareerSave(database, {
      career: request.body.career,
      ownerId: request.body.ownerId ?? getOwnerId(request),
      saveName: request.body.saveName,
    });

    response.status(201).json({ save });
  } catch (error) {
    next(error);
  }
});

app.get("/api/saves/:saveId", async (request, response, next) => {
  try {
    const database = await getDatabase();
    const save = await getCareerSave(
      database,
      request.params.saveId,
      getOwnerId(request),
    );

    if (!save) {
      response.status(404).json({ error: "Save not found." });
      return;
    }

    response.json({ save });
  } catch (error) {
    next(error);
  }
});

app.put("/api/saves/:saveId", async (request, response, next) => {
  try {
    const database = await getDatabase();
    const save = await updateCareerSave(database, request.params.saveId, {
      career: request.body.career,
      expectedRevision: request.body.expectedRevision,
      ownerId: request.body.ownerId ?? getOwnerId(request),
      saveName: request.body.saveName,
    });

    if (!save) {
      response.status(404).json({ error: "Save not found." });
      return;
    }

    response.json({ save });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/saves/:saveId", async (request, response, next) => {
  try {
    const database = await getDatabase();
    const deleted = await deleteCareerSave(
      database,
      request.params.saveId,
      getOwnerId(request),
    );

    if (!deleted) {
      response.status(404).json({ error: "Save not found." });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: ErrorWithStatus,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    const status = error.status ?? 500;

    response.status(status).json({
      error: status === 500 ? "Internal server error." : error.message,
      ...(typeof error.currentRevision === "number"
        ? { currentRevision: error.currentRevision }
        : {}),
    });
  },
);

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});

async function shutdown() {
  server.close();
  await closeMongoConnection();
}

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});
