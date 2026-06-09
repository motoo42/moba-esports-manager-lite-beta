import { useEffect, useRef, type PropsWithChildren } from "react";
import {
  getStrategyLabel,
  getTrainingIntensityLabel,
} from "../../domain/weekly-plan";
import { findLckTeamSeed } from "../../data/lckTeams";
import { getSeasonProgressActionLabel } from "../../domain/season";
import { TeamLogo } from "../ui/TeamLogo";
import type {
  AppRoute,
  CalendarSubPage,
  CompetitionSubPage,
  RosterSubPage,
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
  rosterSubPage?: RosterSubPage | null;
  autoSaveStatus?: {
    kind: "idle" | "saving" | "saved" | "failed" | "conflict";
    message: string;
  } | null;
  onGoTo: (
    route: AppRoute,
    options?: {
      competitionId?: CompetitionId | null;
      teamId?: string | null;
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

type ShellMenuGroup = {
  id: string;
  label: string;
  items: ShellMenuItem[];
};

type ShellSubMenuItem = {
  id: string;
  label: string;
  route: AppRoute;
  competitionId?: CompetitionId | null;
  subPage?: RouteSubPage | null;
  isDefault?: boolean;
};

const shellMenuGroups: ShellMenuGroup[] = [
  {
    id: "management",
    label: "관리",
    items: [
      {
        id: "home",
        label: "홈",
        icon: "HB",
        route: "main-dashboard",
        subItems: ["대시보드", "최근 메시지", "다음 일정"],
      },
      {
        id: "inbox",
        label: "메시지함",
        icon: "MS",
        route: "inbox",
        subItems: ["전체", "중요", "일정", "이적"],
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
        label: "전략 / 훈련",
        icon: "TR",
        route: "match-week",
        subItems: ["주간 계획", "전략", "훈련 강도"],
      },
    ],
  },
  {
    id: "season",
    label: "시즌",
    items: [
      {
        id: "competition",
        label: "대회 현황",
        icon: "CP",
        route: "competition-dashboard",
        subItems: ["대회 현황", "순위표", "일정/결과", "토너먼트"],
      },
      {
        id: "calendar",
        label: "시즌 캘린더",
        icon: "CA",
        route: "season-calendar",
        subItems: ["로드맵", "월간 달력", "대회 일정"],
      },
      {
        id: "offseason",
        label: "스토브리그",
        icon: "FA",
        route: "offseason",
        subItems: ["시장 개요", "FA 명단", "일정 안내", "이적 로그"],
      },
      {
        id: "lck-team-info",
        label: "LCK 구단 정보",
        icon: "TM",
        route: "lck-team-info",
        subItems: ["구단 목록", "선발 5인", "1군 후보", "2군"],
      },
    ],
  },
  {
    id: "system",
    label: "시스템",
    items: [
      {
        id: "save",
        label: "데이터 저장",
        icon: "SV",
        route: "save-manager",
        subItems: ["저장 슬롯", "불러오기", "자동 저장"],
      },
      {
        id: "other",
        label: "시즌 결산",
        icon: "LG",
        route: "season-summary",
        subItems: ["기록", "설정", "시즌 요약"],
      },
    ],
  },
];

const shellMenuItems = shellMenuGroups.flatMap((group) => group.items);

function getMenuItemById(id: string) {
  return shellMenuItems.find((item) => item.id === id) ?? shellMenuItems[0];
}

function getActiveMenuItem(route: AppRoute) {
  if (route === "roster-builder") {
    return getMenuItemById("roster");
  }

  if (route === "match-week") {
    return getMenuItemById("training");
  }

  if (route === "inbox") {
    return getMenuItemById("inbox");
  }

  if (route === "competition-dashboard") {
    return getMenuItemById("competition");
  }

  if (route === "season-calendar") {
    return getMenuItemById("calendar");
  }

  if (route === "season-summary") {
    return getMenuItemById("other");
  }

  if (route === "offseason") {
    return getMenuItemById("offseason");
  }

  if (route === "lck-team-info") {
    return getMenuItemById("lck-team-info");
  }

  if (route === "save-manager") {
    return getMenuItemById("save");
  }

  return getMenuItemById("home");
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

function getRosterSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "main",
      label: "선발 5인",
      route: "roster-builder",
      subPage: "main",
      isDefault: true,
    },
    {
      id: "contracts",
      label: "계약",
      route: "roster-builder",
      subPage: "contracts",
    },
    {
      id: "academy",
      label: "2군",
      route: "roster-builder",
      subPage: "academy",
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

function isSubMenuItemActive({
  calendarSubPage,
  competitionSubPage,
  item,
  rosterSubPage,
  route,
}: {
  calendarSubPage: CalendarSubPage | null;
  competitionSubPage: CompetitionSubPage | null;
  item: ShellSubMenuItem;
  rosterSubPage: RosterSubPage | null;
  route: AppRoute;
}) {
  if (item.route === "competition-dashboard") {
    return (
      route === item.route &&
      (item.subPage
        ? competitionSubPage === item.subPage ||
          (!competitionSubPage && item.isDefault)
        : !competitionSubPage)
    );
  }

  if (item.route === "season-calendar") {
    return (
      route === item.route &&
      (item.subPage
        ? calendarSubPage === item.subPage || (!calendarSubPage && item.isDefault)
        : !calendarSubPage)
    );
  }

  if (item.route === "roster-builder") {
    return (
      route === item.route &&
      (item.subPage
        ? rosterSubPage === item.subPage || (!rosterSubPage && item.isDefault)
        : !rosterSubPage)
    );
  }

  return route === item.route && Boolean(item.isDefault);
}

export function AppShell({
  children,
  career,
  calendarSubPage = null,
  competitionSubPage = null,
  rosterSubPage = null,
  isProgressBlocked = false,
  isProgressing = false,
  progressOverlay,
  route,
  selectedCompetitionId = null,
  autoSaveStatus,
  onGoTo,
  onProgress,
}: AppShellProps) {
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mainElement = mainRef.current;

    if (!mainElement) {
      return;
    }

    if (typeof mainElement.scrollTo === "function") {
      mainElement.scrollTo({ top: 0, left: 0 });
      return;
    }

    mainElement.scrollTop = 0;
    mainElement.scrollLeft = 0;
  }, [
    calendarSubPage,
    competitionSubPage,
    rosterSubPage,
    route,
    selectedCompetitionId,
  ]);

  if (route === "career-setup") {
    return (
      <div className="app-shell app-shell-simple">
        <main className="app-main app-main-simple" ref={mainRef}>
          {children}
        </main>
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
        : activeMenuItem.route === "roster-builder"
          ? getRosterSubMenuItems()
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
  const userTeamSeed = career ? findLckTeamSeed(career.userTeam.name) : undefined;
  const unreadImportantMessageCount =
    career?.messages?.filter(
      (message) =>
        !message.read &&
        (message.priority !== "normal" || message.category === "important"),
    ).length ?? 0;

  return (
    <div className={`app-shell ${isProgressing ? "app-shell-busy" : ""}`}>
      <aside className="shell-sidebar" aria-label="Main navigation">
        <div className="shell-sidebar-header">
          <div className="club-mark">
            <TeamLogo
              fallbackLabel={career?.userTeam.name.slice(0, 2).toUpperCase() ?? "LM"}
              size="md"
              team={userTeamSeed}
              teamName={career?.userTeam.name}
            />
          </div>
          <div>
            <span>Manager</span>
            <strong>{career?.userTeam.name ?? "LoL Manager"}</strong>
          </div>
        </div>

        <nav className="shell-menu-groups">
          {shellMenuGroups.map((group) => (
            <section className="shell-menu-group" key={group.id}>
              <h2>{group.label}</h2>
              <div className="shell-menu-list">
                {group.items.map((item) => {
                  const isActiveMenu = item.id === activeMenuItem.id;

                  return (
                    <div className="shell-menu-block" key={item.id}>
                      <button
                        aria-current={isActiveMenu ? "page" : undefined}
                        className={`shell-menu-button ${
                          isActiveMenu ? "shell-menu-button-active" : ""
                        }`}
                        data-testid={`shell-menu-${item.id}`}
                        disabled={isProgressing}
                        onClick={() => onGoTo(item.route)}
                        title={item.label}
                        type="button"
                      >
                        <span className="shell-menu-icon" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className="shell-menu-label">{item.label}</span>
                        {item.id === "inbox" && unreadImportantMessageCount > 0 && (
                          <span
                            aria-label={`읽지 않은 중요 메시지 ${unreadImportantMessageCount}개`}
                            className="shell-menu-badge"
                          >
                            {unreadImportantMessageCount}
                          </span>
                        )}
                      </button>

                      {isActiveMenu && subMenuItems.length > 0 && (
                        <div className="submenu-list shell-inline-submenu">
                          {subMenuItems.map((subItem) => {
                            const isActive = isSubMenuItemActive({
                              calendarSubPage,
                              competitionSubPage,
                              item: subItem,
                              rosterSubPage,
                              route,
                            });

                            return (
                              <button
                                className={`submenu-item ${
                                  isActive ? "submenu-item-active" : ""
                                }`}
                                disabled={isProgressing}
                                key={subItem.id}
                                onClick={() =>
                                  onGoTo(subItem.route, {
                                    competitionId: subItem.competitionId,
                                    subPage: subItem.subPage,
                                  })
                                }
                                type="button"
                              >
                                {subItem.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
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
          {career && autoSaveStatus && (
            <span
              className={`shell-save-status shell-save-status-${autoSaveStatus.kind}`}
            >
              {autoSaveStatus.message}
            </span>
          )}
          <button
            className="shell-progress-button"
            disabled={progressDisabled}
            onClick={onProgress}
            type="button"
          >
            {isProgressing ? "진행중" : progressActionLabel}
          </button>
        </header>
        <main className="app-main" ref={mainRef}>
          {children}
        </main>
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
