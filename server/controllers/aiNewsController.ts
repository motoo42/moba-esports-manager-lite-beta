import type { NextFunction, Request, Response } from "express";
import {
  getAiNewsModel,
  getAiNewsProvider,
  getGeminiApiKey,
  isAiNewsEnabled,
  isAiNewsTestEndpointEnabled,
} from "../config.js";
import {
  generateGeminiNews,
  generateGeminiNewsTest,
} from "../services/geminiNewsService.js";

export async function getAiNewsStatusController(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.json({
      enabled: isAiNewsEnabled(),
      hasGeminiApiKey: Boolean(getGeminiApiKey()),
      model: getAiNewsModel(),
      provider: getAiNewsProvider(),
      testEndpointEnabled: isAiNewsTestEndpointEnabled(),
    });
  } catch (error) {
    next(error);
  }
}

export async function generateAiNewsTestController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const news = await generateGeminiNewsTest(request.body);

    response.json({ news });
  } catch (error) {
    next(error);
  }
}

export async function generateAiNewsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const news = await generateGeminiNews(request.body);

    response.json({ news });
  } catch (error) {
    next(error);
  }
}
