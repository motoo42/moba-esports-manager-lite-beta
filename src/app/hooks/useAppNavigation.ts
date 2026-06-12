import { useCallback, type Dispatch } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { CareerSave, CompetitionId } from "../../types/game";
import {
  getPathForRoute,
  getRouteMatchFromPath,
  type AppRoute,
  type CalendarSubPage,
  type CompetitionSubPage,
  type InboxSubPage,
  type OffseasonSubPage,
  type RouteSubPage,
} from "../routes";
import { gameActions, type GameAction } from "../state";
import { recordRouteDebugTrace } from "../routeDebugTrace";

export function useAppNavigation({
  career,
  dispatch,
  isProgressing,
  selectedCompetitionId,
}: {
  career: CareerSave | null;
  dispatch: Dispatch<GameAction>;
  isProgressing: boolean;
  selectedCompetitionId: CompetitionId | null;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const goToRoute = useCallback(
    (
      route: AppRoute,
      options: {
        competitionId?: CompetitionId | null;
        teamId?: string | null;
        subPage?: RouteSubPage | null;
        hash?: string | null;
      } = {},
    ) => {
      if (isProgressing) {
        return;
      }

      const competitionId =
        route === "competition-dashboard"
          ? options.competitionId ??
            career?.seasonState.currentCompetitionId ??
            selectedCompetitionId ??
            null
          : null;
      const routeId =
        route === "lck-team-info" ? options.teamId ?? null : competitionId;

      const targetPath = getPathForRoute(route, routeId, options.subPage);
      const targetUrl = options.hash ? `${targetPath}#${options.hash}` : targetPath;
      const currentUrl = `${location.pathname}${location.hash}`;

      if (currentUrl !== targetUrl) {
        recordRouteDebugTrace({
          fromPath: currentUrl,
          reason: "user-navigation",
          source: "navigation",
          stateRoute: route,
          toPath: targetUrl,
          urlRoute: getRouteMatchFromPath(location.pathname).route,
        });
        navigate(targetUrl);
        return;
      }

      dispatch(gameActions.syncRoute(route, competitionId));
    },
    [
      career?.seasonState.currentCompetitionId,
      dispatch,
      isProgressing,
      location.pathname,
      location.hash,
      navigate,
      selectedCompetitionId,
    ],
  );

  const handleCompetitionSubPageChange = useCallback(
    (subPage: CompetitionSubPage) => {
      const competitionId =
        selectedCompetitionId ?? career?.seasonState.currentCompetitionId;

      if (!competitionId) {
        return;
      }

      const targetPath = getPathForRoute(
        "competition-dashboard",
        competitionId,
        subPage,
      );

      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [
      career?.seasonState.currentCompetitionId,
      location.pathname,
      navigate,
      selectedCompetitionId,
    ],
  );

  const handleCalendarSubPageChange = useCallback(
    (subPage: CalendarSubPage) => {
      const targetPath = getPathForRoute("season-calendar", null, subPage);

      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [location.pathname, navigate],
  );

  const handleInboxSubPageChange = useCallback(
    (subPage: InboxSubPage) => {
      const targetPath = getPathForRoute("inbox", null, subPage);

      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [location.pathname, navigate],
  );

  const handleOffseasonSubPageChange = useCallback(
    (subPage: OffseasonSubPage) => {
      const targetPath = getPathForRoute("offseason", null, subPage);

      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [location.pathname, navigate],
  );

  return {
    goToRoute,
    handleCalendarSubPageChange,
    handleCompetitionSubPageChange,
    handleInboxSubPageChange,
    handleOffseasonSubPageChange,
  };
}
