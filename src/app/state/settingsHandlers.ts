import { markCareerGuideSeen } from "../../domain/career/careerGuides";
import {
  saveAppSettings,
  setAiNewsEnabled,
  setBackgroundMusicEnabled,
  setBackgroundMusicVolume,
  setFirstEntryGuidesEnabled,
  setMessageNewsFrequency,
  setSoundEffectsEnabled,
  setSoundEffectsVolume,
  setThemeMode,
} from "../../domain/settings/appSettings";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";

type SettingsAction = Extract<
  GameAction,
  {
    type:
      | "set-ai-news-enabled"
      | "set-theme-mode"
      | "set-background-music-enabled"
      | "set-background-music-volume"
      | "set-sound-effects-enabled"
      | "set-sound-effects-volume"
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

  if (action.type === "set-theme-mode") {
    const appSettings = setThemeMode(state.appSettings, action.mode);

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

  if (action.type === "set-background-music-enabled") {
    const appSettings = setBackgroundMusicEnabled(
      state.appSettings,
      action.enabled,
    );

    saveAppSettings(appSettings);

    return {
      ...state,
      appSettings,
    };
  }

  if (action.type === "set-background-music-volume") {
    const appSettings = setBackgroundMusicVolume(
      state.appSettings,
      action.volume,
    );

    saveAppSettings(appSettings);

    return {
      ...state,
      appSettings,
    };
  }

  if (action.type === "set-sound-effects-enabled") {
    const appSettings = setSoundEffectsEnabled(
      state.appSettings,
      action.enabled,
    );

    saveAppSettings(appSettings);

    return {
      ...state,
      appSettings,
    };
  }

  if (action.type === "set-sound-effects-volume") {
    const appSettings = setSoundEffectsVolume(
      state.appSettings,
      action.volume,
    );

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
