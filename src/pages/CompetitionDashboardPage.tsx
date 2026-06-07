import { useGame } from "../app/GameProvider";
import type { CompetitionSubPage } from "../app/routes";
import { CompetitionDashboard } from "../features/competition-dashboard";

type CompetitionDashboardPageProps = {
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
};

export function CompetitionDashboardPage({
  subPage,
  onSubPageChange,
}: CompetitionDashboardPageProps) {
  const { state } = useGame();

  if (!state.career) {
    return null;
  }

  return (
    <CompetitionDashboard
      career={state.career}
      competitionId={state.selectedCompetitionId}
      subPage={subPage}
      onSubPageChange={onSubPageChange}
    />
  );
}
