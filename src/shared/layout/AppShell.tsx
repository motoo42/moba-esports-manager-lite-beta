import { useEffect, useRef, type PropsWithChildren } from "react";
import {
  getStrategyLabel,
  getTrainingIntensityLabel,
} from "../../domain/weekly-plan";
import { isImportantCareerMessage } from "../../domain/messages";
import { findLckTeamSeed, getLckTeamDisplayName } from "../../data/lckTeams";
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
  TrainingSubPage,
} from "../../app/routes";
import type { CareerSave, CompetitionId } from "../../types/game";

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
  trainingSubPage?: TrainingSubPage | null;
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

import {
  formatShellBadgeCount,
  getActiveMenuItem,
  ShellMenuIcon,
  shellMenuGroups,
  type ShellMenuItem,
  type ShellSubMenuItem,
} from "./appShellNavigation";

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
      id: "academy",
      label: "2군",
      route: "roster-builder",
      subPage: "academy",
    },
    {
      id: "contracts",
      label: "계약",
      route: "roster-builder",
      subPage: "contracts",
    },
  ];
}

function getTrainingSubMenuItems(): ShellSubMenuItem[] {
  return [
    {
      id: "plan",
      label: "주간 계획",
      route: "match-week",
      subPage: "plan",
      isDefault: true,
    },
    {
      id: "strategy",
      label: "전략",
      route: "match-week",
      subPage: "strategy",
    },
    {
      id: "intensity",
      label: "훈련 강도",
      route: "match-week",
      subPage: "intensity",
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
  trainingSubPage,
  route,
}: {
  calendarSubPage: CalendarSubPage | null;
  competitionSubPage: CompetitionSubPage | null;
  currentHash: string;
  inboxSubPage: InboxSubPage | null;
  offseasonSubPage: OffseasonSubPage | null;
  item: ShellSubMenuItem;
  rosterSubPage: RosterSubPage | null;
  trainingSubPage: TrainingSubPage | null;
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

  if (item.route === "match-week") {
    return (
      route === item.route &&
      (item.subPage
        ? trainingSubPage === item.subPage ||
          (!trainingSubPage && item.isDefault)
        : !trainingSubPage)
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
  trainingSubPage = null,
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

    if (route === "match-week" && trainingSubPage) {
      const targetSelector =
        trainingSubPage === "strategy"
          ? "#strategy"
          : trainingSubPage === "intensity"
            ? "#training-intensity"
            : "#weekly-plan";
      const targetElement = mainElement.querySelector(targetSelector);

      if (targetElement instanceof HTMLElement) {
        if (typeof targetElement.scrollIntoView === "function") {
          targetElement.scrollIntoView({ block: "start" });
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
    trainingSubPage,
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
  const subMenuItems =
    activeMenuItem.route === "inbox"
      ? getInboxSubMenuItems()
      : activeMenuItem.route === "offseason"
        ? getOffseasonSubMenuItems()
        : activeMenuItem.route === "competition-dashboard"
          ? getStaticSubMenuItems(activeMenuItem)
          : activeMenuItem.route === "season-calendar"
        ? getCalendarSubMenuItems()
        : activeMenuItem.route === "roster-builder"
          ? getRosterSubMenuItems()
          : activeMenuItem.route === "match-week"
            ? getTrainingSubMenuItems()
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
  const userTeamDisplayName = getLckTeamDisplayName(userTeamSeed ?? career?.userTeam.name);
  const unreadImportantMessageCount =
    career?.messages?.filter(
      (message) => !message.read && isImportantCareerMessage(message),
    ).length ?? 0;
  const unreadImportantMessageBadge =
    unreadImportantMessageCount > 0
      ? formatShellBadgeCount(unreadImportantMessageCount)
      : null;

  return (
    <div className={`app-shell ${isProgressing ? "app-shell-busy" : ""}`}>
      <aside className="shell-sidebar" aria-label="Main navigation">
        <div className="shell-sidebar-header">
          <div className="club-mark">
            <TeamLogo
              fallbackLabel={userTeamDisplayName.slice(0, 2).toUpperCase() || "LM"}
              size="md"
              team={userTeamSeed}
              teamName={career?.userTeam.name}
            />
          </div>
          <div>
            <span>Manager</span>
            <strong title={career?.userTeam.name}>{userTeamDisplayName || "LoL Manager"}</strong>
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
                        {item.id === "inbox" && unreadImportantMessageBadge && (
                          <span
                            aria-label={`읽지 않은 중요 메시지 ${unreadImportantMessageCount}개`}
                            className="shell-menu-badge"
                          >
                            {unreadImportantMessageBadge}
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
                              trainingSubPage,
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
            <h1>{userTeamDisplayName || "LoL Manager"}</h1>
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
