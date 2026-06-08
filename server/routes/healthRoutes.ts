import { Router } from "express";
import {
  getDatabaseHealthController,
  getHealthController,
} from "../controllers/healthController.js";

export const healthRoutes = Router();

healthRoutes.get("/health", getHealthController);
healthRoutes.get("/health/database", getDatabaseHealthController);
