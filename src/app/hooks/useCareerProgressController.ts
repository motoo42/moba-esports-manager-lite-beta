import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  progressCareer,
  type CareerProgressResult,
} from "../../domain/game-progress/progressCareer";
import {
  getTodayAcceptedScrim,
  resolvePendingScrimRequests,
} from "../../domain/scrim";
import { isAsianGamesDecisionPending } from "../../domain/season";
import type { ProgressOverlayState } from "../../shared/layout/AppShell";
import type { CareerSave } from "../../types/game";
import { getProgressOverlayState } from "../progressOverlay";
import { getRouteForCareer, gameActions, type GameAction } from "../state";
import { getPathForRoute, getRouteMatchFromPath } from "../routes";
import { recordRouteDebugTrace } from "../routeDebugTrace";

const minimumProgressDelayMs = 3600;
const progressNoticeDelayMs = 3200;

export function useCareerProgressController({
  career,
  dispatch,
}: {
  career: CareerSave | null;
  dispatch: Dispatch<GameAction>;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const progressTimeoutRef = useRef<number | null>(null);
  const progressNoticeTimeoutRef = useRef<number | null>(null);
  const currentPathnameRef = useRef(location.pathname);
  const pendingProgressResultRef = useRef<CareerProgressResult | null>(null);
  const [progressOverlay, setProgressOverlay] =
    useState<ProgressOverlayState | null>(null);
  const [progressNotice, setProgressNotice] = useState<string | null>(null);
  const isProgressing = progressOverlay !== null;

  useEffect(
    () => () => {
      if (progressTimeoutRef.current !== null) {
        window.clearTimeout(progressTimeoutRef.current);
      }

      if (progressNoticeTimeoutRef.current !== null) {
        window.clearTimeout(progressNoticeTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    currentPathnameRef.current = location.pathname;
  }, [location.pathname]);

  const handleProgress = useCallback(() => {
    if (
      isProgressing ||
      !career ||
      career.seasonState.phase === "stove-league" ||
      (career.seasonState.phase === "offseason" &&
        career.seasonState.offseason?.status !== "active") ||
      career.seasonState.phase === "completed" ||
      isAsianGamesDecisionPending(career.seasonState)
    ) {
      return;
    }

    const todayScrim = getTodayAcceptedScrim(career);

    if (todayScrim) {
      if (progressNoticeTimeoutRef.current !== null) {
        window.clearTimeout(progressNoticeTimeoutRef.current);
      }

      setProgressNotice(
        `오늘 ${todayScrim.opponentTeamName} 상대 ${todayScrim.matchCount}경기 스크림이 예정되어 있습니다. 전략/훈련 탭의 스크림 메뉴에서 먼저 스크림을 진행하세요.`,
      );
      progressNoticeTimeoutRef.current = window.setTimeout(() => {
        setProgressNotice(null);
        progressNoticeTimeoutRef.current = null;
      }, progressNoticeDelayMs);
      return;
    }

    setProgressNotice(null);
    const progressResult = progressCareer(career);
    const resolvedResult = {
      ...progressResult,
      career: resolvePendingScrimRequests(progressResult.career),
    };

    // A played user match routes into the live-match replay, which replaces the
    // progress gauge — commit and navigate immediately, with no overlay. Other
    // progress (day advance, etc.) keeps the gauge.
    if (resolvedResult.career.seasonState.progressStatus === "match-review") {
      dispatch(gameActions.commitProgressResult(resolvedResult));
      navigate(getPathForRoute("live-match"));
      return;
    }

    pendingProgressResultRef.current = resolvedResult;
    setProgressOverlay(getProgressOverlayState(career));

    progressTimeoutRef.current = window.setTimeout(() => {
      const pendingResult = pendingProgressResultRef.current;
      pendingProgressResultRef.current = null;
      progressTimeoutRef.current = null;

      if (pendingResult) {
        dispatch(gameActions.commitProgressResult(pendingResult));

        const nextRoute = getRouteForCareer(pendingResult.career);
        const targetPath = getPathForRoute(
          nextRoute,
          nextRoute === "competition-dashboard"
            ? pendingResult.career.seasonState.currentCompetitionId
            : null,
        );

        if (currentPathnameRef.current !== targetPath) {
          recordRouteDebugTrace({
            fromPath: currentPathnameRef.current,
            reason: "progress-result-route",
            source: "post-action",
            stateRoute: nextRoute,
            toPath: targetPath,
            urlRoute: getRouteMatchFromPath(currentPathnameRef.current).route,
          });
          navigate(targetPath);
        }
      }

      setProgressOverlay(null);
    }, minimumProgressDelayMs);
  }, [career, dispatch, isProgressing, navigate]);

  return {
    handleProgress,
    isProgressing,
    progressOverlay,
    progressNotice,
  };
}
