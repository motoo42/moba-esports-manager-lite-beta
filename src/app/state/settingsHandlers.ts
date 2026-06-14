import { markCareerGuideSeen } from "../../domain/career/careerGuides";
import {
  saveAppSettings,
  setAiNewsEnabled,
  setFirstEntryGuidesEnabled,
  setMessageNewsFrequency,
} from "../../domain/settings/appSettings";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";

type SettingsAction = Extract<
  GameAction,
  {
    type:
      | "set-ai-news-enabled"
      | "set-first-entry-guides-enabled"
      | "set-message-news-frequency"
      | "mark-career-guide-seen";
  }
>;

export function handleSettingsAction(
  state: GameState,
  action: SettingsAction,
): GameState {
  if (action.type === "set-first-entry-guides-enabled") {
    const appSettings = setFirstEntryGuidesEnabled(
      state.appSettings,
      action.enabled,
    );

    saveAppSettings(appSettings);

    return {
      ...state,
      appSettings,
    };
  }

  if (action.type === "set-ai-news-enabled") {
    const appSettings = setAiNewsEnabled(state.appSettings, action.enabled);

    saveAppSettings(appSettings);

    return {
      ...state,
      appSettings,
    };
  }

  if (action.type === "set-message-news-frequency") {
    const appSettings = setMessageNewsFrequency(
      state.appSettings,
      action.frequency,
    );

    saveAppSettings(appSettings);

    return {
      ...state,
      appSettings,
    };
  }

  if (!state.career) {
    return state;
  }

  return {
    ...state,
    career: markCareerGuideSeen(state.career, action.guideId),
  };
}
