import { Router } from "express";
import {
  generateAiNewsController,
  generateAiNewsTestController,
  getAiNewsStatusController,
} from "../controllers/aiNewsController.js";

export const aiNewsRoutes = Router();

aiNewsRoutes.get("/ai-news/status", getAiNewsStatusController);
aiNewsRoutes.post("/ai-news/generate", generateAiNewsController);
aiNewsRoutes.post("/ai-news/test", generateAiNewsTestController);
