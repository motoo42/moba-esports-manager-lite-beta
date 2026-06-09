import type { ReactNode } from "react";
import { CareerSetupPage } from "../pages/CareerSetupPage";
import { CompetitionDashboardPage } from "../pages/CompetitionDashboardPage";
import { InboxPage } from "../pages/InboxPage";
import { LckTeamInfoPage } from "../pages/LckTeamInfoPage";
import { MainDashboardPage } from "../pages/MainDashboardPage";
import { MatchWeekPage } from "../pages/MatchWeekPage";
import { OffseasonPage } from "../pages/OffseasonPage";
import { RosterBuilderPage } from "../pages/RosterBuilderPage";
import { SaveManagerPage } from "../pages/SaveManagerPage";
import { SeasonCalendarPage } from "../pages/SeasonCalendarPage";
import { SeasonSummaryPage } from "../pages/SeasonSummaryPage";
import type {
  AppRoute,
  CalendarSubPage,
  CompetitionSubPage,
  RosterSubPage,
  RouteSubPage,
} from "./routes";
import type { CompetitionId } from "../types/game";

type AppRouteRendererProps = {
  calendarSubPage?: CalendarSubPage | null;
  competitionId?: CompetitionId | null;
  competitionSubPage?: CompetitionSubPage | null;
  rosterSubPage?: RosterSubPage | null;
  teamId?: string | null;
  onCalendarSubPageChange: (subPage: CalendarSubPage) => void;
  onCompetitionSubPageChange: (subPage: CompetitionSubPage) => void;
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      teamId?: string | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
  route: AppRoute;
  savePanel?: ReactNode;
};

export function AppRouteRenderer({
  calendarSubPage,
  competitionId,
  competitionSubPage,
  rosterSubPage,
  teamId,
  onCalendarSubPageChange,
  onCompetitionSubPageChange,
  onGoTo,
  route,
  savePanel,
}: AppRouteRendererProps) {
  if (route === "career-setup") {
    return <CareerSetupPage savePanel={savePanel} />;
  }

  if (route === "roster-builder") {
    return <RosterBuilderPage onGoTo={onGoTo} subPage={rosterSubPage} />;
  }

  if (route === "main-dashboard") {
    return <MainDashboardPage onGoTo={onGoTo} />;
  }

  if (route === "inbox") {
    return <InboxPage />;
  }

  if (route === "match-week") {
    return <MatchWeekPage onGoTo={onGoTo} />;
  }

  if (route === "competition-dashboard") {
    return (
      <CompetitionDashboardPage
        competitionId={competitionId}
        subPage={competitionSubPage}
        onSubPageChange={onCompetitionSubPageChange}
        onGoTo={onGoTo}
      />
    );
  }

  if (route === "lck-team-info") {
    return <LckTeamInfoPage teamId={teamId} onGoTo={onGoTo} />;
  }

  if (route === "season-calendar") {
    return (
      <SeasonCalendarPage
        subPage={calendarSubPage}
        onSubPageChange={onCalendarSubPageChange}
        onGoTo={onGoTo}
      />
    );
  }

  if (route === "offseason") {
    return <OffseasonPage onGoTo={onGoTo} />;
  }

  if (route === "save-manager") {
    return <SaveManagerPage savePanel={savePanel} />;
  }

  return <SeasonSummaryPage onGoTo={onGoTo} />;
}
