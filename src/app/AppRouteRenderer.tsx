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
import { SettingsPage } from "../pages/SettingsPage";
import type {
  AppRoute,
  CalendarSubPage,
  CompetitionSubPage,
  InboxSubPage,
  OffseasonSubPage,
  RosterSubPage,
  RouteSubPage,
  TrainingSubPage,
} from "./routes";
import type { CompetitionId } from "../types/game";

type AppRouteRendererProps = {
  calendarSubPage?: CalendarSubPage | null;
  competitionId?: CompetitionId | null;
  competitionSubPage?: CompetitionSubPage | null;
  inboxSubPage?: InboxSubPage | null;
  offseasonSubPage?: OffseasonSubPage | null;
  rosterSubPage?: RosterSubPage | null;
  trainingSubPage?: TrainingSubPage | null;
  teamId?: string | null;
  onCalendarSubPageChange: (subPage: CalendarSubPage) => void;
  onCompetitionSubPageChange: (subPage: CompetitionSubPage) => void;
  onInboxSubPageChange: (subPage: InboxSubPage) => void;
  onOffseasonSubPageChange: (subPage: OffseasonSubPage) => void;
  onGoTo: (
    route: AppRoute,
    options?: {
        competitionId?: CompetitionId | null;
        teamId?: string | null;
        subPage?: RouteSubPage | null;
        hash?: string | null;
      },
  ) => void;
  route: AppRoute;
  savePanel?: ReactNode;
};

export function AppRouteRenderer({
  calendarSubPage,
  competitionId,
  competitionSubPage,
  inboxSubPage,
  offseasonSubPage,
  rosterSubPage,
  trainingSubPage,
  teamId,
  onCalendarSubPageChange,
  onCompetitionSubPageChange,
  onInboxSubPageChange,
  onOffseasonSubPageChange,
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
    return (
      <InboxPage
        subPage={inboxSubPage}
        onSubPageChange={onInboxSubPageChange}
      />
    );
  }

  if (route === "match-week") {
    return <MatchWeekPage onGoTo={onGoTo} subPage={trainingSubPage} />;
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
    return (
      <OffseasonPage
        onGoTo={onGoTo}
        subPage={offseasonSubPage}
        onSubPageChange={onOffseasonSubPageChange}
      />
    );
  }

  if (route === "save-manager") {
    return <SaveManagerPage savePanel={savePanel} />;
  }

  if (route === "settings") {
    return <SettingsPage />;
  }

  return <SeasonSummaryPage onGoTo={onGoTo} />;
}
