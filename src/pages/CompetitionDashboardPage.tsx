import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import type { AppRoute, CompetitionSubPage, RouteSubPage } from "../app/routes";
import { gameActions } from "../app/state";
import {
  COMPETITION_DASHBOARD_GUIDE_ID,
  hasSeenCareerGuide,
} from "../domain/career/careerGuides";
import { CareerGuideEntry } from "../features/career-guides";
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
  const showFirstEntryGuides = useGameSelector(
    (state) => state.appSettings.guides.showFirstEntryGuides,
  );
  const dispatch = useGameDispatch();

  if (!career) {
    return <CareerRequiredFallback title="대회 화면을 열 수 없습니다" />;
  }

  return (
    <section className="stack">
      <CareerGuideEntry
        guideId={COMPETITION_DASHBOARD_GUIDE_ID}
        hasSeenGuide={hasSeenCareerGuide(
          career,
          COMPETITION_DASHBOARD_GUIDE_ID,
        )}
        onMarkGuideSeen={() =>
          dispatch(
            gameActions.markCareerGuideSeen(COMPETITION_DASHBOARD_GUIDE_ID),
          )
        }
        showFirstEntryGuide={showFirstEntryGuides}
      />
      <CompetitionDashboard
        career={career}
        competitionId={
          competitionId === null
            ? null
            : competitionId ?? selectedCompetitionId
        }
        subPage={subPage}
        onSubPageChange={onSubPageChange}
        onSelectCompetition={(nextCompetitionId) =>
          onGoTo?.("competition-dashboard", { competitionId: nextCompetitionId })
        }
        onViewCalendar={() =>
          onGoTo?.("season-calendar", { subPage: "roadmap" })
        }
        onViewTeam={(teamId) => onGoTo?.("lck-team-info", { teamId })}
      />
    </section>
  );
}
