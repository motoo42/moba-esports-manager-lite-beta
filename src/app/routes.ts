import type { CompetitionId } from "../types/game";

export type AppRoute =
  | "career-setup"
  | "inbox"
  | "roster-builder"
  | "main-dashboard"
  | "match-week"
  | "competition-dashboard"
  | "lck-team-info"
  | "season-calendar"
  | "save-manager"
  | "offseason"
  | "season-summary"
  | "settings";

export type CompetitionSubPage =
  | "overview"
  | "groups"
  | "standings"
  | "schedule"
  | "tournament"
  | "bracket";

export type CalendarSubPage = "roadmap" | "calendar";

export type RosterSubPage = "main" | "academy" | "contracts";

export type InboxSubPage = "all" | "important" | "schedule" | "transfer";

export type OffseasonSubPage = "overview" | "free-agents" | "schedule" | "log";

export type RouteSubPage =
  | CompetitionSubPage
  | CalendarSubPage
  | RosterSubPage
  | InboxSubPage
  | OffseasonSubPage;

export const appRoutes: AppRoute[] = [
  "career-setup",
  "inbox",
  "roster-builder",
  "main-dashboard",
  "match-week",
  "competition-dashboard",
  "lck-team-info",
  "season-calendar",
  "save-manager",
  "offseason",
  "season-summary",
  "settings",
];

const routePathByRoute: Record<AppRoute, string> = {
  "career-setup": "/",
  inbox: "/inbox",
  "roster-builder": "/roster",
  "main-dashboard": "/hub",
  "match-week": "/match",
  "competition-dashboard": "/competitions",
  "lck-team-info": "/teams",
  "season-calendar": "/calendar",
  "save-manager": "/saves",
  offseason: "/offseason",
  "season-summary": "/summary",
  settings: "/settings",
};

const competitionIds = new Set<CompetitionId>([
  "lck-cup",
  "first-stand",
  "lck-rounds-1-2",
  "msi",
  "lck-rounds-3-5",
  "lck-rounds-3-4",
  "worlds",
  "asian-games",
]);

const competitionSubPages = new Set<CompetitionSubPage>([
  "overview",
  "groups",
  "standings",
  "schedule",
  "tournament",
  "bracket",
]);

const calendarSubPages = new Set<CalendarSubPage>(["roadmap", "calendar"]);
const rosterSubPages = new Set<RosterSubPage>(["main", "academy", "contracts"]);
const inboxSubPages = new Set<InboxSubPage>([
  "all",
  "important",
  "schedule",
  "transfer",
]);
const offseasonSubPages = new Set<OffseasonSubPage>([
  "overview",
  "free-agents",
  "schedule",
  "log",
]);

export type RouteMatch = {
  route: AppRoute;
  competitionId?: CompetitionId | null;
  teamId?: string | null;
  competitionSubPage?: CompetitionSubPage | null;
  calendarSubPage?: CalendarSubPage | null;
  rosterSubPage?: RosterSubPage | null;
  inboxSubPage?: InboxSubPage | null;
  offseasonSubPage?: OffseasonSubPage | null;
};

export function isCompetitionId(value: string): value is CompetitionId {
  return competitionIds.has(value as CompetitionId);
}

export function isCompetitionSubPage(
  value: string,
): value is CompetitionSubPage {
  return competitionSubPages.has(value as CompetitionSubPage);
}

export function isCalendarSubPage(value: string): value is CalendarSubPage {
  return calendarSubPages.has(value as CalendarSubPage);
}

export function isRosterSubPage(value: string): value is RosterSubPage {
  return rosterSubPages.has(value as RosterSubPage);
}

export function isInboxSubPage(value: string): value is InboxSubPage {
  return inboxSubPages.has(value as InboxSubPage);
}

export function isOffseasonSubPage(value: string): value is OffseasonSubPage {
  return offseasonSubPages.has(value as OffseasonSubPage);
}

export function getPathForRoute(
  route: AppRoute,
  routeId?: CompetitionId | string | null,
  subPage?: RouteSubPage | null,
) {
  if (route === "competition-dashboard" && routeId && isCompetitionId(routeId)) {
    if (subPage && isCompetitionSubPage(subPage)) {
      return `/competitions/${routeId}/${subPage}`;
    }

    return `/competitions/${routeId}`;
  }

  if (route === "lck-team-info") {
    return routeId ? `/teams/${routeId}` : routePathByRoute[route];
  }

  if (route === "season-calendar") {
    if (subPage && isCalendarSubPage(subPage)) {
      return `/calendar/${subPage}`;
    }

    return routePathByRoute[route];
  }

  if (route === "roster-builder") {
    if (subPage && isRosterSubPage(subPage)) {
      return `/roster/${subPage}`;
    }

    return routePathByRoute[route];
  }

  if (route === "inbox") {
    if (subPage && isInboxSubPage(subPage) && subPage !== "all") {
      return `/inbox/${subPage}`;
    }

    return routePathByRoute[route];
  }

  if (route === "offseason") {
    if (subPage && isOffseasonSubPage(subPage)) {
      return `/offseason/${subPage}`;
    }

    return routePathByRoute[route];
  }

  return routePathByRoute[route];
}

export function getRouteMatchFromPath(pathname: string): RouteMatch {
  if (pathname === "/roster") {
    return { route: "roster-builder", rosterSubPage: null };
  }

  const rosterMatch = pathname.match(/^\/roster\/([^/]+)$/);

  if (rosterMatch) {
    return {
      route: "roster-builder",
      rosterSubPage: isRosterSubPage(rosterMatch[1]) ? rosterMatch[1] : null,
    };
  }

  if (pathname === "/hub") {
    return { route: "main-dashboard" };
  }

  if (pathname === "/inbox") {
    return { route: "inbox", inboxSubPage: null };
  }

  const inboxMatch = pathname.match(/^\/inbox\/([^/]+)$/);

  if (inboxMatch) {
    return {
      route: "inbox",
      inboxSubPage: isInboxSubPage(inboxMatch[1]) ? inboxMatch[1] : null,
    };
  }

  if (pathname === "/match") {
    return { route: "match-week" };
  }

  if (pathname === "/calendar") {
    return { route: "season-calendar", calendarSubPage: null };
  }

  if (pathname === "/teams") {
    return { route: "lck-team-info", teamId: null };
  }

  const teamMatch = pathname.match(/^\/teams\/([^/]+)$/);

  if (teamMatch) {
    return { route: "lck-team-info", teamId: teamMatch[1] };
  }

  if (pathname === "/saves") {
    return { route: "save-manager" };
  }

  const calendarMatch = pathname.match(/^\/calendar\/([^/]+)$/);

  if (calendarMatch) {
    return {
      route: "season-calendar",
      calendarSubPage: isCalendarSubPage(calendarMatch[1])
        ? calendarMatch[1]
        : null,
    };
  }

  if (pathname === "/summary") {
    return { route: "season-summary" };
  }

  if (pathname === "/settings") {
    return { route: "settings" };
  }

  if (pathname === "/offseason") {
    return { route: "offseason", offseasonSubPage: null };
  }

  const offseasonMatch = pathname.match(/^\/offseason\/([^/]+)$/);

  if (offseasonMatch) {
    return {
      route: "offseason",
      offseasonSubPage: isOffseasonSubPage(offseasonMatch[1])
        ? offseasonMatch[1]
        : null,
    };
  }

  if (pathname === "/competitions") {
    return { route: "competition-dashboard", competitionId: null };
  }

  const competitionMatch = pathname.match(/^\/competitions\/([^/]+)(?:\/([^/]+))?$/);

  if (competitionMatch && isCompetitionId(competitionMatch[1])) {
    const subPage = competitionMatch[2];

    return {
      route: "competition-dashboard",
      competitionId: competitionMatch[1],
      competitionSubPage:
        subPage && isCompetitionSubPage(subPage) ? subPage : null,
    };
  }

  return { route: "career-setup" };
}
