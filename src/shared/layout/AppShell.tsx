import type { PropsWithChildren, ReactNode } from "react";
import {
  getStrategyLabel,
  getTrainingIntensityLabel,
} from "../../domain/weekly-plan";
import { getSeasonProgressActionLabel } from "../../domain/season";
import type {
  AppRoute,
  CalendarSubPage,
  CompetitionSubPage,
  RouteSubPage,
} from "../../app/routes";
import type { CareerSave, CompetitionId, CompetitionState } from "../../types/game";

export type ProgressOverlayState = {
  title: string;
  message: string;
  steps: string[];
};

type AppShellProps = PropsWithChildren<{
  career: CareerSave | null;
  isProgressBlocked?: boolean;
  isProgressing?: boolean;
  progressOverlay?: ProgressOverlayState | null;
  route: AppRoute;
  selectedCompetitionId?: CompetitionId | null;
  competitionSubPage?: CompetitionSubPage | null;
  calendarSubPage?: CalendarSubPage | null;
  saveControls?: ReactNode;
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      subPage?: RouteSubPage | null;
    },
  ) => void;
  onProgress: () => void;
}>;

type ShellMenuItem = {
  id: string;
  label: string;
  icon: string;
  route: AppRoute;
  subItems: string[];
};

type ShellSubMenuItem = {
  id: string;
  label: string;
  route: AppRoute;
  competitionId?: CompetitionId | null;
  subPage?: RouteSubPage | null;
  isDefault?: boolean;
};

const shellMenuItems: ShellMenuItem[] = [
  {
    id: "inbox",
    label: "메인 허브",
    icon: "HB",
    route: "main-dashboard",
    subItems: ["중요 알림", "뉴스", "일정 알림"],
  },
  {
    id: "roster",
    label: "로스터 관리",
    icon: "RS",
    route: "roster-builder",
    subItems: ["선발 5인", "계약", "2군"],
  },
  {
    id: "training",
    label: "전략/훈련",
    icon: "TR",
    route: "match-week",
    subItems: ["주간 계획", "전략", "훈련 강도"],
  },
  {
    id: "scout",
    label: "스카우트",
    icon: "SC",
    route: "main-dashboard",
    subItems: ["선수 검색", "상대 분석", "관찰 목록"],
  },
  {
    id: "offseason",
    label: "스토브리그",
    icon: "FA",
    route: "offseason",
    subItems: ["타임라인", "내 팀 계약", "FA 시장", "이적 로그"],
  },
  {
    id: "competition",
    label: "대회",
    icon: "CP",
    route: "competition-dashboard",
    subItems: ["대회 현황", "순위표", "일정/결과", "토너먼트"],
  },
  {
    id: "calendar",
    label: "캘린더",
    icon: "CA",
    route: "season-calendar",
    subItems: ["로드맵", "월간 달력", "대회 일정"],
  },
  {
    id: "other",
    label: "기록",
    icon: "LG",
    route: "season-summary",
    subItems: ["기록", "설정", "시즌 요약"],
  },
];

function getActiveMenuItem(route: AppRoute) {
  if (route === "roster-builder") {
    return shellMenuItems[1];
  }

  if (route === "match-week") {
    return shellMenuItems[2];
  }

  if (route === "competition-dashboard") {
    return shellMenuItems[5];
  }

  if (route === "season-calendar") {
    return shellMenuItems[6];
  }

  if (route === "season-summary") {
    return shellMenuItems[7];
  }

  if (route === "offseason") {
    return shellMenuItems[4];
  }

  return shellMenuItems[0];
}

function getActiveCompetitionName(career: CareerSave | null) {
  const activeCompetition = career?.seasonState.competitions.find(
    (competition) => competition.status === "active",
  );
  const currentCompetition = career?.seasonState.competitions.find(
    (competition) =>
      competition.competitionId === career.seasonState.currentCompetitionId,
  );

  if (activeCompetition) {
    return activeCompetition.name;
  }

  if (currentCompetition?.status === "completed") {
    return `${currentCompetition.name} Completed`;
  }

  return currentCompetition?.name ?? "No active competition";
}

function getSelectedCompetition(
  career: CareerSave | null,
  selectedCompetitionId: CompetitionId | null | undefined,
) {
  const competitionId =
    selectedCompetitionId ?? career?.seasonState.currentCompetitionId ?? null;

  if (!competitionId) {
    return null;
  }

  return (
    career?.seasonState.competitions.find(
      (competition) => competition.competitionId === competitionId,
    ) ?? null
  );
}

function getCompetitionSubMenuItems(
  competition: CompetitionState | null,
): ShellSubMenuItem[] {
  const competitionId = competition?.competitionId ?? null;

  if (!competitionId) {
    return [
      {
        id: "competition-default",
        label: "대회 현황",
        route: "competition-dashboard",
        isDefault: true,
      },
    ];
  }

  if (
    competitionId === "lck-rounds-1-2" ||
    competitionId === "lck-rounds-3-4" ||
    competitionId === "lck-rounds-3-5"
  ) {
    return [
      {
        id: "standings",
        label: "순위표",
        route: "competition-dashboard",
        competitionId,
        subPage: "standings",
        isDefault: true,
      },
      {
        id: "schedule",
        label: "일정/결과",
        route: "competition-dashboard",
        competitionId,
        subPage: "schedule",
      },
      {
        id: "tournament",
        label:
          competitionId === "lck-rounds-3-4" ||
          competitionId === "lck-rounds-3-5"
            ? "진출 경로"
            : "토너먼트",
        route: "competition-dashboard",
        competitionId,
        subPage: "tournament",
      },
    ];
  }

  if (competitionId === "first-stand") {
    return [
      {
        id: "overview",
        label: "개요",
        route: "competition-dashboard",
        competitionId,
        subPage: "overview",
        isDefault: true,
      },
      {
        id: "groups",
        label: "조별 순위",
        route: "competition-dashboard",
        competitionId,
        subPage: "groups",
      },
      {
        id: "schedule",
        label: "일정/결과",
        route: "competition-dashboard",
        competitionId,
        subPage: "schedule",
      },
      {
        id: "tournament",
        label: "토너먼트",
        route: "competition-dashboard",
        competitionId,
        subPage: "tournament",
      },
    ];
  }

  if (competitionId === "msi" || competitionId === "asian-games") {
    return [
      {
        id: "overview",
        label: "개요",
        route: "competition-dashboard",
        competitionId,
        subPage: "overview",
        isDefault: true,
      },
      {
        id: "schedule",
        label: "일정/결과",
        route: "competition-dashboard",
        competitionId,
        subPage: "schedule",
      },
      {
        id: "bracket",
        label: "브래킷",
        route: "competition-dashboard",
        competitionId,
        subPage: "bracket",
      },
    ];
  }

  if (competitionId === "worlds") {
    return [
      {
        id: "overview",
        label: "개요",
        route: "competition-dashboard",
        competitionId,
        subPage: "overview",
        isDefault: true,
      },
      {
        id: "schedule",
        label: "일정/결과",
        route: "competition-dashboard",
        competitionId,
        subPage: "schedule",
      },
      {
        id: "groups",
        label: "조별 순위",
        route: "competition-dashboard",
        competitionId,
        subPage: "groups",
      },
      {
        id: "bracket",
        label: "브래킷",
        route: "competition-dashboard",
        competitionId,
        subPage: "bracket",
      },
    ];
  }

  return [
    {
      id: "competition-default",
      label: "대회 현황",
      route: "competition-dashboard",
      competitionId,
      isDefault: true,
    },
  ];
}

function getCalendarSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "roadmap",
      label: "로드맵",
      route: "season-calendar",
      subPage: "roadmap",
      isDefault: true,
    },
    {
      id: "calendar",
      label: "달력",
      route: "season-calendar",
      subPage: "calendar",
    },
  ];
}

function getStaticSubMenuItems(activeMenuItem: ShellMenuItem): ShellSubMenuItem[] {
  return activeMenuItem.subItems.map((label, index) => ({
    id: `${activeMenuItem.id}-${index}`,
    label,
    route: activeMenuItem.route,
    isDefault: index === 0,
  }));
}

export function AppShell({
  children,
  career,
  calendarSubPage = null,
  competitionSubPage = null,
  isProgressBlocked = false,
  isProgressing = false,
  progressOverlay,
  route,
  selectedCompetitionId = null,
  saveControls,
  onGoTo,
  onProgress,
}: AppShellProps) {
  if (route === "career-setup") {
    return (
      <div className="app-shell app-shell-simple">
        <main className="app-main app-main-simple">{children}</main>
      </div>
    );
  }

  const activeMenuItem = getActiveMenuItem(route);
  const selectedCompetition = getSelectedCompetition(career, selectedCompetitionId);
  const subMenuItems =
    activeMenuItem.route === "competition-dashboard"
      ? getCompetitionSubMenuItems(selectedCompetition)
      : activeMenuItem.route === "season-calendar"
        ? getCalendarSubMenuItems()
        : getStaticSubMenuItems(activeMenuItem);
  const activeCompetitionName = getActiveCompetitionName(career);
  const seasonLabel = career
    ? career.seasonState.currentDateLabel
    : "새 커리어";
  const progressActionLabel = career
    ? getSeasonProgressActionLabel(career.seasonState)
    : "진행";
  const progressDisabled =
    !career ||
    career.seasonState.phase === "stove-league" ||
    (career.seasonState.phase === "offseason" &&
      career.seasonState.offseason?.status !== "active") ||
    career.seasonState.phase === "completed" ||
    isProgressing ||
    isProgressBlocked;

  return (
    <div className={`app-shell ${isProgressing ? "app-shell-busy" : ""}`}>
      <aside className="shell-sidebar" aria-label="Main navigation">
        <div className="club-mark">{career?.userTeam.name.slice(0, 2).toUpperCase() ?? "LM"}</div>
        <nav className="shell-icon-menu">
          {shellMenuItems.map((item) => (
            <button
              aria-label={item.label}
              className={`shell-menu-button ${
                item.id === activeMenuItem.id ? "shell-menu-button-active" : ""
              }`}
              data-testid={`shell-menu-${item.id}`}
              disabled={isProgressing}
              key={item.id}
              onClick={() => onGoTo(item.route)}
              title={item.label}
              type="button"
            >
              <span>{item.icon}</span>
            </button>
          ))}
        </nav>
      </aside>

      <aside className="shell-submenu">
        <p className="eyebrow">Menu</p>
        <h2>{activeMenuItem.label}</h2>
        <div className="submenu-list">
          {subMenuItems.map((item) => {
            const isActive =
              item.route === "competition-dashboard"
                ? route === item.route &&
                  (item.subPage
                    ? competitionSubPage === item.subPage ||
                      (!competitionSubPage && item.isDefault)
                    : !competitionSubPage)
                : item.route === "season-calendar"
                  ? route === item.route &&
                    (item.subPage
                      ? calendarSubPage === item.subPage ||
                        (!calendarSubPage && item.isDefault)
                      : !calendarSubPage)
                  : route === item.route;

            return (
              <button
                className={`submenu-item ${
                  isActive ? "submenu-item-active" : ""
                }`}
                disabled={isProgressing}
                key={item.id}
                onClick={() =>
                  onGoTo(item.route, {
                    competitionId: item.competitionId,
                    subPage: item.subPage,
                  })
                }
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="shell-content">
        <header className="shell-topbar">
          <div>
            <p className="eyebrow">League Manager</p>
            <h1>{career?.userTeam.name ?? "LoL Manager"}</h1>
          </div>
          <div className="shell-status-strip">
            <span>{seasonLabel}</span>
            <span>{activeCompetitionName}</span>
            {career && (
              <span>
                {getStrategyLabel(career.weeklyPlan.strategy)} /{" "}
                {getTrainingIntensityLabel(career.weeklyPlan.trainingIntensity)}
              </span>
            )}
          </div>
          {saveControls}
          <button
            className="shell-progress-button"
            disabled={progressDisabled}
            onClick={onProgress}
            type="button"
          >
            {isProgressing ? "진행중" : progressActionLabel}
          </button>
        </header>
        <main className="app-main">{children}</main>
      </div>

      {progressOverlay && (
        <div
          aria-live="polite"
          aria-modal="true"
          className="game-progress-overlay"
          role="dialog"
        >
          <section className="game-progress-card">
            <p className="eyebrow">Processing</p>
            <h2>{progressOverlay.title}</h2>
            <p>{progressOverlay.message}</p>
            <div className="game-progress-bar" aria-hidden="true">
              <span />
            </div>
            <ul>
              {progressOverlay.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
