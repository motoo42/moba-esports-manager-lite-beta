import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultAppSettings,
  loadDeveloperModeFlag,
  loadAppSettings,
  normalizeAppSettings,
  saveAppSettings,
  saveDeveloperModeFlag,
  setAiNewsEnabled,
  setFirstEntryGuidesEnabled,
  setMessageNewsFrequency,
} from "../../src/domain/settings/appSettings";

describe("app settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState(null, "", "/");
  });

  it("normalizes unknown values to supported defaults", () => {
    expect(normalizeAppSettings(null)).toEqual(defaultAppSettings);
    expect(
      normalizeAppSettings({
        schemaVersion: 99,
        guides: {
          showFirstEntryGuides: false,
          ignored: true,
        },
        messageNews: {
          aiNewsEnabled: false,
          frequency: "debug",
        },
      }),
    ).toEqual({
      schemaVersion: 1,
      guides: {
        showFirstEntryGuides: false,
      },
      messageNews: {
        aiNewsEnabled: false,
        frequency: "debug",
      },
    });
  });

  it("persists the first-entry guide setting globally", () => {
    const disabled = setFirstEntryGuidesEnabled(defaultAppSettings, false);

    saveAppSettings(disabled);

    expect(loadAppSettings().guides.showFirstEntryGuides).toBe(false);
  });

  it("persists message and AI news experiment settings", () => {
    const settings = setMessageNewsFrequency(
      setAiNewsEnabled(defaultAppSettings, false),
      "debug",
    );

    saveAppSettings(settings);

    expect(loadAppSettings().messageNews).toEqual({
      aiNewsEnabled: false,
      frequency: "debug",
    });
  });

  it("keeps developer mode behind a hidden URL or storage flag", () => {
    expect(loadDeveloperModeFlag()).toBe(false);

    window.history.pushState(null, "", "/?dev=1");

    expect(loadDeveloperModeFlag()).toBe(true);

    window.history.pushState(null, "", "/");

    expect(loadDeveloperModeFlag()).toBe(true);

    saveDeveloperModeFlag(false);

    expect(loadDeveloperModeFlag()).toBe(false);
  });
});
