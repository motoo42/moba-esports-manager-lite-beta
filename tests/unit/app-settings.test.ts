import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultAppSettings,
  loadAppSettings,
  normalizeAppSettings,
  saveAppSettings,
  setAiNewsEnabled,
  setFirstEntryGuidesEnabled,
  setMessageNewsFrequency,
} from "../../src/domain/settings/appSettings";

describe("app settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
});
