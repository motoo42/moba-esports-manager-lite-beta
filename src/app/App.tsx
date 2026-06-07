import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { CareerSetupPage } from "../pages/CareerSetupPage";
import { MainDashboardPage } from "../pages/MainDashboardPage";
import { MatchWeekPage } from "../pages/MatchWeekPage";
import { CompetitionDashboardPage } from "../pages/CompetitionDashboardPage";
import { RosterBuilderPage } from "../pages/RosterBuilderPage";
import { SeasonCalendarPage } from "../pages/SeasonCalendarPage";
import { SeasonSummaryPage } from "../pages/SeasonSummaryPage";
import { OffseasonPage } from "../pages/OffseasonPage";
import { progressCareer, type CareerProgressResult } from "../domain/game-progress/progressCareer";
import {
  getAsianGamesRoleSelectionLabel,
  isAsianGamesDecisionPending,
} from "../domain/season";
import { SaveManager, type AutoSaveStatus } from "../features/save-manager";
import {
  createCareerSave,
  isSaveConflictError,
  updateCareerSave,
  type CareerSaveDto,
} from "../services/careerSavesApi";
import { AppShell, type ProgressOverlayState } from "../shared/layout/AppShell";
import type { AsianGamesState, CareerSave, CompetitionId } from "../types/game";
import { GameProvider, useGame } from "./GameProvider";
import {
  getPathForRoute,
  getRouteMatchFromPath,
  type AppRoute,
  type CalendarSubPage,
  type CompetitionSubPage,
  type RouteSubPage,
} from "./routes";

const minimumProgressDelayMs = 5000;

type ActiveSaveMeta = {
  id: string;
  revision: number | null;
  saveName: string;
};

type PendingAutoSave = {
  career: CareerSave;
  reason: "checkpoint" | "initial";
};

function getProgressOverlayState(
  career: NonNullable<ReturnType<typeof useGame>["state"]["career"]>,
): ProgressOverlayState {
  if (career.seasonState.phase === "offseason") {
    return {
      title: "스토브리그 진행중",
      message: "계약 제안, AI 경쟁, 이적 로그를 정리하며 다음날로 이동하는 중",
      steps: ["제안 확인", "AI 경쟁 처리", "로스터 상태 갱신", "다음날 준비"],
    };
  }

  if (career.seasonState.progressStatus === "match-preview") {
    return {
      title: "경기 진행중",
      message: "밴픽, 선수 상태, 시리즈 결과를 계산하는 중",
      steps: ["밴픽 분석", "선수 컨디션 반영", "세트 결과 계산", "순위표 갱신"],
    };
  }

  if (career.seasonState.progressStatus === "match-review") {
    return {
      title: "경기 후 정리중",
      message: "리뷰를 마무리하고 다음 날짜로 이동하는 중",
      steps: ["경기 기록 저장", "선수 상태 반영", "다음 일정 확인"],
    };
  }

  return {
    title: "하루 진행중",
    message: "오늘의 일정과 AI 경기 결과를 처리하는 중",
    steps: ["일정 확인", "AI 경기 계산", "대회 상태 갱신", "다음 날짜 준비"],
  };
}

type RenderRouteOptions = {
  calendarSubPage?: CalendarSubPage | null;
  competitionSubPage?: CompetitionSubPage | null;
  onCalendarSubPageChange: (subPage: CalendarSubPage) => void;
  onCompetitionSubPageChange: (subPage: CompetitionSubPage) => void;
  savePanel?: ReactNode;
};

function renderRoute(route: AppRoute, options: RenderRouteOptions) {
  if (route === "career-setup") {
    return <CareerSetupPage savePanel={options.savePanel} />;
  }

  if (route === "roster-builder") {
    return <RosterBuilderPage />;
  }

  if (route === "main-dashboard") {
    return <MainDashboardPage />;
  }

  if (route === "match-week") {
    return <MatchWeekPage />;
  }

  if (route === "competition-dashboard") {
    return (
      <CompetitionDashboardPage
        subPage={options.competitionSubPage}
        onSubPageChange={options.onCompetitionSubPageChange}
      />
    );
  }

  if (route === "season-calendar") {
    return (
      <SeasonCalendarPage
        subPage={options.calendarSubPage}
        onSubPageChange={options.onCalendarSubPageChange}
      />
    );
  }

  if (route === "offseason") {
    return <OffseasonPage />;
  }

  return <SeasonSummaryPage />;
}

function getAutosaveName(career: CareerSave) {
  return `${career.userTeam.name} S${career.currentSeason} Autosave`;
}

function getRouteForLoadedCareer(career: CareerSave): AppRoute {
  if (career.seasonState.phase === "completed") {
    return "season-summary";
  }

  if (career.seasonState.phase === "offseason") {
    const offseasonStatus = career.seasonState.offseason?.status;

    return offseasonStatus === "active" || offseasonStatus === "ready-for-next-season"
      ? "offseason"
      : "season-summary";
  }

  return "main-dashboard";
}

function getCareerAutoSaveCheckpoint(career: CareerSave) {
  const seasonState = career.seasonState;
  const asianGamesFingerprint = seasonState.asianGames
    ? [
        seasonState.asianGames.status,
        seasonState.asianGames.playMode,
        seasonState.asianGames.roster
          .map((member) => `${member.playerId}:${member.isStarter}`)
          .join(","),
        seasonState.asianGames.medals?.goldTeamId ?? "no-gold",
        seasonState.asianGames.medals?.silverTeamId ?? "no-silver",
        seasonState.asianGames.medals?.bronzeTeamId ?? "no-bronze",
      ].join(":")
    : "no-asian-games";
  const competitionFingerprint = seasonState.competitions
    .map(
      (competition) =>
        `${competition.competitionId}:${competition.status}:${competition.currentStageName}:${competition.completed}:${competition.schedule.length}:${competition.qualifiedTeamIds.join(",")}`,
    )
    .join("|");
  const contractFingerprint = career.userTeam.contracts
    .map(
      (contract) =>
        `${contract.playerId}:${contract.type}:${contract.remainingYears}:${contract.salary}`,
    )
    .join("|");
  const offseasonFingerprint = seasonState.offseason
    ? [
        seasonState.offseason.status,
        seasonState.offseason.completedSeasonNumber,
        seasonState.offseason.nextSeasonNumber ?? "final",
        seasonState.offseason.currentDay ?? "no-day",
        seasonState.offseason.currentWeek ?? "no-week",
        seasonState.offseason.marketStatus ?? "no-market",
        seasonState.offseason.expiredContractPlayerIds.join(","),
        seasonState.offseason.renewedPlayerIds.join(","),
        seasonState.offseason.resolvedExpiredPlayerIds?.join(",") ?? "",
        seasonState.offseason.releasedPlayerIds?.join(",") ?? "",
        seasonState.offseason.signedPlayerIds?.join(",") ?? "",
        seasonState.offseason.freeAgentPlayerIds?.join(",") ?? "",
        seasonState.offseason.pendingOffers
          ?.map(
            (offer) =>
              `${offer.id}:${offer.status}:${offer.playerIds.join(",")}:${offer.salaryOffer}`,
          )
          .join(",") ?? "",
        seasonState.offseason.resolvedOffers
          ?.map(
            (offer) =>
              `${offer.id}:${offer.status}:${offer.playerIds.join(",")}:${offer.salaryOffer}`,
          )
          .join(",") ?? "",
        seasonState.offseason.logEntries?.length ?? 0,
      ].join(":")
    : "no-offseason";
  const worldsFingerprint = seasonState.worlds
    ? [
        seasonState.worlds.status,
        seasonState.worlds.championTeamId ?? "no-champion",
        seasonState.worlds.runnerUpTeamId ?? "no-runner-up",
      ].join(":")
    : "no-worlds";

  return [
    career.currentSeason,
    career.seasonHistory.length,
    contractFingerprint,
    seasonState.phase,
    seasonState.currentCompetitionId,
    seasonState.currentDateKey,
    seasonState.currentTurn,
    seasonState.progressStatus,
    seasonState.matchRecords.length,
    competitionFingerprint,
    asianGamesFingerprint,
    worldsFingerprint,
    offseasonFingerprint,
  ].join("::");
}

function toActiveSaveMeta(save: CareerSaveDto): ActiveSaveMeta {
  return {
    id: save.id,
    revision: save.revision,
    saveName: save.saveName,
  };
}

function getAutoSaveFailureStatus(error: unknown): AutoSaveStatus {
  if (isSaveConflictError(error)) {
    return {
      kind: "conflict",
      message: "저장 충돌: 새로고침 필요",
    };
  }

  if (error instanceof TypeError) {
    return {
      kind: "failed",
      message: "저장 서버 대기",
    };
  }

  return {
    kind: "failed",
    message: "자동 저장 실패",
  };
}

function roleLabel(role: AsianGamesState["roster"][number]["role"]) {
  if (role === "jungle") {
    return "JGL";
  }

  return role.toUpperCase();
}

function AsianGamesDecisionModal({
  asianGamesState,
  onSelectAuto,
  onSelectManual,
}: {
  asianGamesState: AsianGamesState;
  onSelectAuto: () => void;
  onSelectManual: () => void;
}) {
  const starters = asianGamesState.roster.filter((member) => member.isStarter);
  const sixthMan = asianGamesState.roster.find((member) => !member.isStarter);

  return (
    <div className="modal-backdrop asian-games-decision-backdrop">
      <section
        aria-labelledby="asian-games-decision-title"
        aria-modal="true"
        className="asian-games-decision-modal"
        role="dialog"
      >
        <p className="eyebrow">Asian Games</p>
        <h2 id="asian-games-decision-title">대한민국 대표팀 참가 방식</h2>
        <p>
          대표 6인이 자동 선발됐습니다. 이번 Asian Games 전체를 직접
          플레이할지, AI가 자동 진행할지 선택하세요.
        </p>
        <div className="asian-games-decision-roster">
          {starters.map((member) => (
            <article key={member.playerId}>
              <span>{roleLabel(member.role)}</span>
              <strong>{member.playerName}</strong>
              <small>
                {getAsianGamesRoleSelectionLabel(member)} · 폼{" "}
                {member.formAtSelection}
              </small>
            </article>
          ))}
          {sixthMan && (
            <article className="asian-games-sixth-player" key={sixthMan.playerId}>
              <span>6TH</span>
              <strong>{sixthMan.playerName}</strong>
              <small>
                {getAsianGamesRoleSelectionLabel(sixthMan)} · 폼{" "}
                {sixthMan.formAtSelection}
              </small>
            </article>
          )}
        </div>
        <div className="asian-games-decision-actions">
          <button onClick={onSelectManual} type="button">
            직접 플레이
          </button>
          <button onClick={onSelectAuto} type="button">
            자동 진행
          </button>
        </div>
      </section>
    </div>
  );
}

function AppContent() {
  const { state, dispatch } = useGame();
  const location = useLocation();
  const navigate = useNavigate();
  const syncedPathnameRef = useRef<string | null>(null);
  const progressTimeoutRef = useRef<number | null>(null);
  const pendingProgressResultRef = useRef<CareerProgressResult | null>(null);
  const [progressOverlay, setProgressOverlay] =
    useState<ProgressOverlayState | null>(null);
  const [activeSaveMeta, setActiveSaveMeta] = useState<ActiveSaveMeta | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    kind: "idle",
    message: "자동 저장 대기",
  });
  const [lastCommittedSave, setLastCommittedSave] =
    useState<CareerSaveDto | null>(null);
  const activeSaveMetaRef = useRef<ActiveSaveMeta | null>(null);
  const autoSaveInFlightRef = useRef(false);
  const lastAutoSaveCheckpointRef = useRef<string | null>(null);
  const pendingAutoSaveRef = useRef<PendingAutoSave | null>(null);
  const skipNextAutoSaveRef = useRef(false);
  const routeMatch = useMemo(
    () => getRouteMatchFromPath(location.pathname),
    [location.pathname],
  );
  const autoSaveCheckpoint = useMemo(
    () => (state.career ? getCareerAutoSaveCheckpoint(state.career) : null),
    [state.career],
  );
  const isProgressing = progressOverlay !== null;
  const asianGamesDecisionState =
    state.career && isAsianGamesDecisionPending(state.career.seasonState)
      ? state.career.seasonState.asianGames ?? null
      : null;

  useEffect(() => {
    activeSaveMetaRef.current = activeSaveMeta;
  }, [activeSaveMeta]);

  const handleSaveCommitted = useCallback((save: CareerSaveDto) => {
    const nextMeta = toActiveSaveMeta(save);

    activeSaveMetaRef.current = nextMeta;
    setActiveSaveMeta(nextMeta);
    setLastCommittedSave(save);
  }, []);

  const handleActiveSaveChange = useCallback((saveId: string | null) => {
    setActiveSaveMeta((currentMeta) => {
      if (!saveId) {
        activeSaveMetaRef.current = null;
        return null;
      }

      const nextMeta =
        currentMeta?.id === saveId
          ? currentMeta
          : { id: saveId, revision: null, saveName: "" };

      activeSaveMetaRef.current = nextMeta;
      return nextMeta;
    });
  }, []);

  const requestAutoSave = useCallback(
    async (career: CareerSave, reason: PendingAutoSave["reason"]) => {
      if (autoSaveInFlightRef.current) {
        pendingAutoSaveRef.current = { career, reason };
        return;
      }

      autoSaveInFlightRef.current = true;
      setAutoSaveStatus({
        kind: "saving",
        message: reason === "initial" ? "첫 저장 생성 중" : "자동 저장 중",
      });

      try {
        const activeSave = activeSaveMetaRef.current;
        const save = activeSave?.id
          ? await updateCareerSave({
              career,
              expectedRevision: activeSave.revision,
              saveId: activeSave.id,
              saveName: activeSave.saveName || getAutosaveName(career),
            })
          : await createCareerSave({
              career,
              saveName: getAutosaveName(career),
            });

        handleSaveCommitted(save);
        setAutoSaveStatus({
          kind: "saved",
          message: reason === "initial" ? "첫 저장 완료" : "자동 저장 완료",
        });
      } catch (error) {
        setAutoSaveStatus(getAutoSaveFailureStatus(error));
      } finally {
        autoSaveInFlightRef.current = false;

        if (pendingAutoSaveRef.current) {
          const nextAutoSave = pendingAutoSaveRef.current;

          pendingAutoSaveRef.current = null;
          void requestAutoSave(nextAutoSave.career, nextAutoSave.reason);
        }
      }
    },
    [handleSaveCommitted],
  );

  const handleLoadCareer = useCallback(
    (career: CareerSave, saveId: string) => {
      const route = getRouteForLoadedCareer(career);

      handleActiveSaveChange(saveId);
      skipNextAutoSaveRef.current = true;
      dispatch({ type: "load-career", career });
      navigate(getPathForRoute(route));
    },
    [dispatch, handleActiveSaveChange, navigate],
  );

  useEffect(() => {
    if (!state.career || !autoSaveCheckpoint || isProgressing) {
      return;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      lastAutoSaveCheckpointRef.current = autoSaveCheckpoint;
      return;
    }

    if (lastAutoSaveCheckpointRef.current === autoSaveCheckpoint) {
      return;
    }

    const reason = lastAutoSaveCheckpointRef.current ? "checkpoint" : "initial";

    lastAutoSaveCheckpointRef.current = autoSaveCheckpoint;
    void requestAutoSave(state.career, reason);
  }, [autoSaveCheckpoint, isProgressing, requestAutoSave, state.career]);

  useEffect(() => {
    if (state.career) {
      return;
    }

    activeSaveMetaRef.current = null;
    lastAutoSaveCheckpointRef.current = null;
    pendingAutoSaveRef.current = null;
    setActiveSaveMeta(null);
    setLastCommittedSave(null);
    setAutoSaveStatus({ kind: "idle", message: "자동 저장 대기" });
  }, [state.career]);

  useEffect(() => {
    if (syncedPathnameRef.current === location.pathname) {
      return;
    }

    syncedPathnameRef.current = location.pathname;

    const isUnknownPath =
      routeMatch.route === "career-setup" && location.pathname !== "/";

    if (!state.career && routeMatch.route !== "career-setup") {
      navigate("/", { replace: true });
      return;
    }

    if (state.career && isUnknownPath) {
      navigate(getPathForRoute("main-dashboard"), { replace: true });
      return;
    }

    if (
      state.career &&
      location.pathname === "/" &&
      state.route !== "career-setup"
    ) {
      return;
    }

    if (
      state.route !== routeMatch.route ||
      (routeMatch.route === "competition-dashboard" &&
        state.selectedCompetitionId !== (routeMatch.competitionId ?? null))
    ) {
      dispatch({
        type: "sync-route",
        route: routeMatch.route,
        competitionId: routeMatch.competitionId,
      });
    }
  }, [
    dispatch,
    location.pathname,
    navigate,
    routeMatch.competitionId,
    routeMatch.route,
    state.career,
  ]);

  useEffect(() => {
    if (!state.career && state.route !== "career-setup") {
      return;
    }

    const competitionId =
      state.route === "competition-dashboard"
        ? state.selectedCompetitionId ?? state.career?.seasonState.currentCompetitionId
        : null;

    const routeAlreadyMatchesState =
      routeMatch.route === state.route &&
      (state.route !== "competition-dashboard" ||
        routeMatch.competitionId === competitionId);

    if (routeAlreadyMatchesState) {
      return;
    }

    const targetPath =
      state.route === "competition-dashboard"
        ? getPathForRoute(
            state.route,
            competitionId,
            routeMatch.route === "competition-dashboard"
              ? routeMatch.competitionSubPage
              : null,
          )
        : state.route === "season-calendar"
          ? getPathForRoute(
              state.route,
              null,
              routeMatch.route === "season-calendar"
                ? routeMatch.calendarSubPage
                : null,
            )
          : getPathForRoute(state.route, competitionId);

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [
    location.pathname,
    navigate,
    state.career,
    state.route,
    state.selectedCompetitionId,
    routeMatch.calendarSubPage,
    routeMatch.competitionId,
    routeMatch.competitionSubPage,
    routeMatch.route,
  ]);

  useEffect(
    () => () => {
      if (progressTimeoutRef.current !== null) {
        window.clearTimeout(progressTimeoutRef.current);
      }
    },
    [],
  );

  const goToRoute = useCallback(
    (
      route: AppRoute,
      options: {
        competitionId?: CompetitionId | null;
        subPage?: RouteSubPage | null;
      } = {},
    ) => {
      if (isProgressing) {
        return;
      }

      const competitionId =
        route === "competition-dashboard"
          ? options.competitionId ??
            state.selectedCompetitionId ??
            state.career?.seasonState.currentCompetitionId
          : null;

      navigate(getPathForRoute(route, competitionId, options.subPage));
      dispatch({ type: "go-to", route });
    },
    [
      dispatch,
      isProgressing,
      navigate,
      state.career?.seasonState.currentCompetitionId,
      state.selectedCompetitionId,
    ],
  );

  const handleCompetitionSubPageChange = useCallback(
    (subPage: CompetitionSubPage) => {
      const competitionId =
        state.selectedCompetitionId ?? state.career?.seasonState.currentCompetitionId;

      if (!competitionId) {
        return;
      }

      navigate(getPathForRoute("competition-dashboard", competitionId, subPage));
    },
    [
      navigate,
      state.career?.seasonState.currentCompetitionId,
      state.selectedCompetitionId,
    ],
  );

  const handleCalendarSubPageChange = useCallback(
    (subPage: CalendarSubPage) => {
      navigate(getPathForRoute("season-calendar", null, subPage));
    },
    [navigate],
  );

  const handleProgress = useCallback(() => {
    if (
      isProgressing ||
      !state.career ||
      state.career.seasonState.phase === "stove-league" ||
      (state.career.seasonState.phase === "offseason" &&
        state.career.seasonState.offseason?.status !== "active") ||
      state.career.seasonState.phase === "completed" ||
      isAsianGamesDecisionPending(state.career.seasonState)
    ) {
      return;
    }

    pendingProgressResultRef.current = progressCareer(state.career);
    setProgressOverlay(getProgressOverlayState(state.career));

    progressTimeoutRef.current = window.setTimeout(() => {
      const pendingResult = pendingProgressResultRef.current;
      pendingProgressResultRef.current = null;
      progressTimeoutRef.current = null;

      if (pendingResult) {
        dispatch({ type: "commit-progress-result", result: pendingResult });
      }

      setProgressOverlay(null);
    }, minimumProgressDelayMs);
  }, [dispatch, isProgressing, state.career]);

  const saveControls = (
    <SaveManager
      activeSaveId={activeSaveMeta?.id ?? null}
      activeSaveRevision={activeSaveMeta?.revision ?? null}
      autoSaveStatus={autoSaveStatus}
      career={state.career}
      committedSave={lastCommittedSave}
      disabled={isProgressing || Boolean(asianGamesDecisionState)}
      onActiveSaveChange={handleActiveSaveChange}
      onLoadCareer={handleLoadCareer}
      onSaveCommitted={handleSaveCommitted}
      variant={state.career ? "topbar" : "panel"}
    />
  );

  return (
    <>
      <AppShell
        career={state.career}
        isProgressBlocked={Boolean(asianGamesDecisionState)}
        isProgressing={isProgressing}
        progressOverlay={progressOverlay}
        route={state.route}
        selectedCompetitionId={state.selectedCompetitionId}
        competitionSubPage={routeMatch.competitionSubPage}
        calendarSubPage={routeMatch.calendarSubPage}
        saveControls={state.career ? saveControls : undefined}
        onGoTo={goToRoute}
        onProgress={handleProgress}
      >
        {renderRoute(state.route, {
          calendarSubPage: routeMatch.calendarSubPage,
          competitionSubPage: routeMatch.competitionSubPage,
          onCalendarSubPageChange: handleCalendarSubPageChange,
          onCompetitionSubPageChange: handleCompetitionSubPageChange,
          savePanel: state.career ? undefined : saveControls,
        })}
      </AppShell>
      {asianGamesDecisionState && (
        <AsianGamesDecisionModal
          asianGamesState={asianGamesDecisionState}
          onSelectAuto={() =>
            dispatch({ type: "set-asian-games-play-mode", playMode: "auto" })
          }
          onSelectManual={() =>
            dispatch({ type: "set-asian-games-play-mode", playMode: "manual" })
          }
        />
      )}
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </BrowserRouter>
  );
}
