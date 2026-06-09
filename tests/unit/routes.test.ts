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

  it("parses and creates the save manager route", () => {
    expect(getRouteMatchFromPath("/saves")).toEqual({
      route: "save-manager",
    });
    expect(getPathForRoute("save-manager")).toBe("/saves");
  });

  it("parses and creates the inbox route", () => {
    expect(getRouteMatchFromPath("/inbox")).toEqual({
      route: "inbox",
    });
    expect(getPathForRoute("inbox")).toBe("/inbox");
  });

  it("parses and creates roster subpage routes", () => {
    expect(getRouteMatchFromPath("/roster")).toEqual({
      route: "roster-builder",
      rosterSubPage: null,
    });
    expect(getRouteMatchFromPath("/roster/main")).toEqual({
      route: "roster-builder",
      rosterSubPage: "main",
    });
    expect(getRouteMatchFromPath("/roster/academy")).toEqual({
      route: "roster-builder",
      rosterSubPage: "academy",
    });
    expect(getRouteMatchFromPath("/roster/contracts")).toEqual({
      route: "roster-builder",
      rosterSubPage: "contracts",
    });
    expect(getRouteMatchFromPath("/roster/unknown")).toEqual({
      route: "roster-builder",
      rosterSubPage: null,
    });
    expect(getPathForRoute("roster-builder", null, "academy")).toBe(
      "/roster/academy",
    );
  });

  it("parses and creates LCK team info routes", () => {
    expect(getRouteMatchFromPath("/teams")).toEqual({
      route: "lck-team-info",
      teamId: null,
    });
    expect(getRouteMatchFromPath("/teams/gen-g")).toEqual({
      route: "lck-team-info",
      teamId: "gen-g",
    });
    expect(getRouteMatchFromPath("/teams/t1")).toEqual({
      route: "lck-team-info",
      teamId: "t1",
    });
    expect(getRouteMatchFromPath("/teams/unknown")).toEqual({
      route: "lck-team-info",
      teamId: "unknown",
    });
    expect(getPathForRoute("lck-team-info")).toBe("/teams");
    expect(getPathForRoute("lck-team-info", "gen-g")).toBe("/teams/gen-g");
  });
});
