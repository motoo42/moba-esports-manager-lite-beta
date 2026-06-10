import { AppShell } from "../shared/layout/AppShell";
import { useLocation } from "react-router-dom";
import { AppRouteRenderer } from "./AppRouteRenderer";
import { useGameDispatch, useGameSelector } from "./GameProvider";
import { useAppNavigation } from "./hooks/useAppNavigation";
import { useAsianGamesDecision } from "./hooks/useAsianGamesDecision";
import { useAutoSaveController } from "./hooks/useAutoSaveController";
import { useCareerProgressController } from "./hooks/useCareerProgressController";
import { useRouteSynchronization } from "./hooks/useRouteSynchronization";
import { AsianGamesDecisionModal } from "./modals/AsianGamesDecisionModal";
import { SmallScreenGuard } from "./SmallScreenGuard";

export function AppContent() {
  const location = useLocation();
  const career = useGameSelector((state) => state.career);
  const route = useGameSelector((state) => state.route);
  const selectedCompetitionId = useGameSelector(
    (state) => state.selectedCompetitionId,
  );
  const dispatch = useGameDispatch();
  const { handleProgress, isProgressing, progressOverlay } =
    useCareerProgressController({
      career,
      dispatch,
    });
  const {
    asianGamesDecisionState,
    handleSelectAuto,
    handleSelectManual,
  } = useAsianGamesDecision({
    career,
    dispatch,
  });
  const routeMatch = useRouteSynchronization({
    career,
    dispatch,
    route,
    selectedCompetitionId,
  });
  const renderedRoute = routeMatch.route;
  const renderedCompetitionId =
    renderedRoute === "competition-dashboard"
      ? routeMatch.competitionId ??
        selectedCompetitionId ??
        career?.seasonState.currentCompetitionId ??
        null
      : selectedCompetitionId;
  const {
    goToRoute,
    handleCalendarSubPageChange,
    handleCompetitionSubPageChange,
    handleInboxSubPageChange,
    handleOffseasonSubPageChange,
  } = useAppNavigation({
    career,
    dispatch,
    isProgressing,
    selectedCompetitionId: renderedCompetitionId,
  });
  const { autoSaveStatus, savePanel } = useAutoSaveController({
    career,
    dispatch,
    disabled: isProgressing || Boolean(asianGamesDecisionState),
    isProgressing,
  });

  return (
    <>
      <AppShell
        career={career}
        isProgressBlocked={Boolean(asianGamesDecisionState)}
        isProgressing={isProgressing}
        progressOverlay={progressOverlay}
        route={renderedRoute}
        selectedCompetitionId={renderedCompetitionId}
        competitionSubPage={routeMatch.competitionSubPage}
        calendarSubPage={routeMatch.calendarSubPage}
        rosterSubPage={routeMatch.rosterSubPage}
        inboxSubPage={routeMatch.inboxSubPage}
        offseasonSubPage={routeMatch.offseasonSubPage}
        currentHash={location.hash}
        autoSaveStatus={career ? autoSaveStatus : undefined}
        onGoTo={goToRoute}
        onProgress={handleProgress}
      >
        <AppRouteRenderer
          calendarSubPage={routeMatch.calendarSubPage}
          competitionSubPage={routeMatch.competitionSubPage}
          inboxSubPage={routeMatch.inboxSubPage}
          offseasonSubPage={routeMatch.offseasonSubPage}
          rosterSubPage={routeMatch.rosterSubPage}
          teamId={routeMatch.teamId}
          onCalendarSubPageChange={handleCalendarSubPageChange}
          onCompetitionSubPageChange={handleCompetitionSubPageChange}
          onInboxSubPageChange={handleInboxSubPageChange}
          onOffseasonSubPageChange={handleOffseasonSubPageChange}
          onGoTo={goToRoute}
          competitionId={renderedCompetitionId}
          route={renderedRoute}
          savePanel={savePanel}
        />
      </AppShell>
      {asianGamesDecisionState && (
        <AsianGamesDecisionModal
          asianGamesState={asianGamesDecisionState}
          onSelectAuto={handleSelectAuto}
          onSelectManual={handleSelectManual}
        />
      )}
      <SmallScreenGuard />
    </>
  );
}
