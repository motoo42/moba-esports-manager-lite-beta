import { useEffect, useRef, type PropsWithChildren, type ReactNode } from "react";
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
  InboxSubPage,
  OffseasonSubPage,
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
  inboxSubPage?: InboxSubPage | null;
  offseasonSubPage?: OffseasonSubPage | null;
  currentHash?: string;
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
      hash?: string | null;
    },
  ) => void;
  onProgress: () => void;
}>;

type ShellMenuIconId =
  | "home"
  | "inbox"
  | "roster"
  | "training"
  | "competition"
  | "calendar"
  | "offseason"
  | "teams"
  | "save"
  | "summary"
  | "settings";

type ShellMenuItem = {
  id: string;
  label: string;
  icon: ShellMenuIconId;
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
  hash?: string | null;
  isDefault?: boolean;
};

function ShellMenuIcon({ icon }: { icon: ShellMenuIconId }) {
  const commonProps = {
    "aria-hidden": true,
    fill: "none",
    focusable: false,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  const paths: Record<ShellMenuIconId, ReactNode> = {
    home: (
      <>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6.5 10.5V20h11v-9.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 6h16v12H4z" />
        <path d="m4 8 8 6 8-6" />
      </>
    ),
    roster: (
      <>
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M3.5 20a4.5 4.5 0 0 1 9 0" />
        <path d="M15 8h5" />
        <path d="M15 13h5" />
        <path d="M15 18h5" />
      </>
    ),
    training: (
      <>
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
    competition: (
      <>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H5a3 3 0 0 0 3 5" />
        <path d="M16 6h3a3 3 0 0 1-3 5" />
        <path d="M12 12v4" />
        <path d="M9 20h6" />
        <path d="M10 16h4v4h-4z" />
      </>
    ),
    calendar: (
      <>
        <path d="M5 5h14v15H5z" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M5 9h14" />
        <path d="M8 13h2" />
        <path d="M14 13h2" />
        <path d="M8 17h2" />
      </>
    ),
    offseason: (
      <>
        <path d="M7 7h10" />
        <path d="m15 4 3 3-3 3" />
        <path d="M17 17H7" />
        <path d="m9 14-3 3 3 3" />
      </>
    ),
    teams: (
      <>
        <path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6l-7-3Z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </>
    ),
    save: (
      <>
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v6h8V4" />
        <path d="M8 20v-6h8v6" />
      </>
    ),
    summary: (
      <>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="m5.6 5.6 2.1 2.1" />
        <path d="m16.3 16.3 2.1 2.1" />
        <path d="m18.4 5.6-2.1 2.1" />
        <path d="m7.7 16.3-2.1 2.1" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[icon]}</svg>;
}

const shellMenuGroups: ShellMenuGroup[] = [
  {
    id: "management",
    label: "관리",
    items: [
      {
        id: "home",
        label: "홈",
        icon: "home",
        route: "main-dashboard",
        subItems: ["대시보드", "최근 메시지", "다음 일정"],
      },
      {
        id: "inbox",
        label: "메시지함",
        icon: "inbox",
        route: "inbox",
        subItems: ["전체", "중요", "일정", "이적"],
      },
      {
        id: "roster",
        label: "로스터 관리",
        icon: "roster",
        route: "roster-builder",
        subItems: ["선발 5인", "계약", "2군"],
      },
      {
        id: "training",
        label: "전략 / 훈련",
        icon: "training",
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
        icon: "competition",
        route: "competition-dashboard",
        subItems: ["대회 현황", "순위표", "일정/결과", "토너먼트"],
      },
      {
        id: "calendar",
        label: "시즌 캘린더",
        icon: "calendar",
        route: "season-calendar",
        subItems: ["로드맵", "월간 달력", "대회 일정"],
      },
      {
        id: "offseason",
        label: "스토브리그",
        icon: "offseason",
        route: "offseason",
        subItems: ["시장 개요", "FA 명단", "일정 안내", "이적 로그"],
      },
      {
        id: "lck-team-info",
        label: "LCK 구단 정보",
        icon: "teams",
        route: "lck-team-info",
        subItems: ["구단 목록"],
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
        icon: "save",
        route: "save-manager",
        subItems: [],
      },
      {
        id: "other",
        label: "시즌 결산",
        icon: "summary",
        route: "season-summary",
        subItems: [],
      },
      {
        id: "settings",
        label: "설정",
        icon: "settings",
        route: "settings",
        subItems: [],
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

  if (route === "settings") {
    return getMenuItemById("settings");
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

function getHomeSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "dashboard",
      label: "대시보드",
      route: "main-dashboard",
      hash: "dashboard",
      isDefault: true,
    },
    {
      id: "recent-messages",
      label: "최근 메시지",
      route: "main-dashboard",
      hash: "recent-messages",
    },
    {
      id: "schedule",
      label: "다음 일정",
      route: "main-dashboard",
      hash: "schedule",
    },
  ];
}

function getInboxSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "all",
      label: "전체",
      route: "inbox",
      subPage: "all",
      isDefault: true,
    },
    {
      id: "important",
      label: "중요",
      route: "inbox",
      subPage: "important",
    },
    {
      id: "schedule",
      label: "일정",
      route: "inbox",
      subPage: "schedule",
    },
    {
      id: "transfer",
      label: "이적",
      route: "inbox",
      subPage: "transfer",
    },
  ];
}

function getOffseasonSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "overview",
      label: "시장 개요",
      route: "offseason",
      subPage: "overview",
      isDefault: true,
    },
    {
      id: "free-agents",
      label: "FA 명단",
      route: "offseason",
      subPage: "free-agents",
    },
    {
      id: "schedule",
      label: "일정 안내",
      route: "offseason",
      subPage: "schedule",
    },
    {
      id: "log",
      label: "이적 로그",
      route: "offseason",
      subPage: "log",
    },
  ];
}

function getLckTeamSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "teams",
      label: "구단 목록",
      route: "lck-team-info",
      isDefault: true,
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
  currentHash,
  inboxSubPage,
  item,
  offseasonSubPage,
  rosterSubPage,
  route,
}: {
  calendarSubPage: CalendarSubPage | null;
  competitionSubPage: CompetitionSubPage | null;
  currentHash: string;
  inboxSubPage: InboxSubPage | null;
  offseasonSubPage: OffseasonSubPage | null;
  item: ShellSubMenuItem;
  rosterSubPage: RosterSubPage | null;
  route: AppRoute;
}) {
  if (item.route === "main-dashboard") {
    return (
      route === item.route &&
      (item.hash
        ? currentHash === `#${item.hash}` || (!currentHash && item.isDefault)
        : !currentHash)
    );
  }

  if (item.route === "inbox") {
    return (
      route === item.route &&
      (item.subPage
        ? inboxSubPage === item.subPage ||
          (!inboxSubPage && item.isDefault)
        : !inboxSubPage)
    );
  }

  if (item.route === "offseason") {
    return (
      route === item.route &&
      (item.subPage
        ? offseasonSubPage === item.subPage ||
          (!offseasonSubPage && item.isDefault)
        : !offseasonSubPage)
    );
  }

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

  if (item.route === "lck-team-info") {
    return route === item.route && Boolean(item.isDefault);
  }

  return route === item.route && Boolean(item.isDefault);
}

export function AppShell({
  children,
  career,
  calendarSubPage = null,
  currentHash = "",
  competitionSubPage = null,
  inboxSubPage = null,
  rosterSubPage = null,
  offseasonSubPage = null,
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

    if (route === "main-dashboard" && currentHash) {
      const targetElement = mainElement.querySelector(currentHash);

      if (targetElement instanceof HTMLElement) {
        if (typeof targetElement.scrollIntoView === "function") {
          targetElement.scrollIntoView({ block: "start" });
        }

        if (typeof targetElement.focus === "function") {
          targetElement.focus({ preventScroll: true });
        }

        return;
      }
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
    currentHash,
    inboxSubPage,
    offseasonSubPage,
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
    activeMenuItem.route === "main-dashboard"
      ? getHomeSubMenuItems()
      : activeMenuItem.route === "inbox"
        ? getInboxSubMenuItems()
        : activeMenuItem.route === "offseason"
          ? getOffseasonSubMenuItems()
          : activeMenuItem.route === "lck-team-info"
            ? getLckTeamSubMenuItems()
            : activeMenuItem.route === "competition-dashboard"
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
                          <ShellMenuIcon icon={item.icon} />
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
                              currentHash,
                              inboxSubPage,
                              item: subItem,
                              offseasonSubPage,
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
                                    hash: subItem.hash,
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
