import { useGameSelector } from "../app/GameProvider";
import type { AppRoute, RouteSubPage } from "../app/routes";
import { MainDashboard } from "../features/main-dashboard";
import { CareerRequiredFallback } from "./CareerRequiredFallback";
import type { CompetitionId } from "../types/game";

type MainDashboardPageProps = {
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      teamId?: string | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
};

export function MainDashboardPage({ onGoTo }: MainDashboardPageProps) {
  const career = useGameSelector((state) => state.career);

  if (!career) {
    return <CareerRequiredFallback title="메인 허브를 열 수 없습니다" />;
  }

  return (
    <MainDashboard
      career={career}
      onViewRoster={() => onGoTo("roster-builder")}
      onViewCompetition={() => onGoTo("competition-dashboard")}
      onViewCalendar={() => onGoTo("season-calendar")}
      onViewInbox={() => onGoTo("inbox")}
      onViewTeam={(teamId) => onGoTo("lck-team-info", { teamId })}
    />
  );
}
