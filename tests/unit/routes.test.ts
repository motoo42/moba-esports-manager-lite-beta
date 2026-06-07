import { describe, expect, it } from "vitest";
import {
  getPathForRoute,
  getRouteMatchFromPath,
} from "../../src/app/routes";

describe("app routes", () => {
  it("parses competition subpage routes", () => {
    expect(getRouteMatchFromPath("/competitions/msi/bracket")).toEqual({
      route: "competition-dashboard",
      competitionId: "msi",
      competitionSubPage: "bracket",
    });
    expect(getRouteMatchFromPath("/competitions/worlds/groups")).toEqual({
      route: "competition-dashboard",
      competitionId: "worlds",
      competitionSubPage: "groups",
    });
  });

  it("keeps the competition route when a subpage is invalid", () => {
    expect(getRouteMatchFromPath("/competitions/msi/unknown")).toEqual({
      route: "competition-dashboard",
      competitionId: "msi",
      competitionSubPage: null,
    });
  });

  it("parses calendar subpage routes", () => {
    expect(getRouteMatchFromPath("/calendar/roadmap")).toEqual({
      route: "season-calendar",
      calendarSubPage: "roadmap",
    });
    expect(getRouteMatchFromPath("/calendar/calendar")).toEqual({
      route: "season-calendar",
      calendarSubPage: "calendar",
    });
  });

  it("keeps the calendar route when a subpage is invalid", () => {
    expect(getRouteMatchFromPath("/calendar/unknown")).toEqual({
      route: "season-calendar",
      calendarSubPage: null,
    });
  });

  it("creates competition and calendar subpage paths", () => {
    expect(getPathForRoute("competition-dashboard", "asian-games", "bracket")).toBe(
      "/competitions/asian-games/bracket",
    );
    expect(getPathForRoute("competition-dashboard", "worlds", "groups")).toBe(
      "/competitions/worlds/groups",
    );
    expect(getPathForRoute("season-calendar", null, "calendar")).toBe(
      "/calendar/calendar",
    );
  });

  it("parses and creates the offseason route", () => {
    expect(getRouteMatchFromPath("/offseason")).toEqual({
      route: "offseason",
    });
    expect(getPathForRoute("offseason")).toBe("/offseason");
  });
});
