import { useGameSelector } from "../app/GameProvider";
import type { AppRoute, CompetitionSubPage, RouteSubPage } from "../app/routes";
import { CompetitionDashboard } from "../features/competition-dashboard";
import { CareerRequiredFallback } from "./CareerRequiredFallback";
import type { CompetitionId } from "../types/game";

type CompetitionDashboardPageProps = {
  competitionId?: CompetitionId | null;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  onGoTo?: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      teamId?: string | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
};

export function CompetitionDashboardPage({
  competitionId,
  subPage,
  onSubPageChange,
  onGoTo,
}: CompetitionDashboardPageProps) {
  const career = useGameSelector((state) => state.career);
  const selectedCompetitionId = useGameSelector(
    (state) => state.selectedCompetitionId,
  );

  if (!career) {
    return <CareerRequiredFallback title="대회 화면을 열 수 없습니다" />;
  }

  return (
    <CompetitionDashboard
      career={career}
      competitionId={competitionId ?? selectedCompetitionId}
      subPage={subPage}
      onSubPageChange={onSubPageChange}
      onViewTeam={(teamId) => onGoTo?.("lck-team-info", { teamId })}
    />
  );
}
