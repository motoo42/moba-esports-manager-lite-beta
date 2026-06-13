import { type KeyboardEvent } from "react";
import type { OffseasonSubPage } from "../../app/routes";
import { getLckTeamDisplayName, lck2026Teams } from "../../data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../data/offseasonFreeAgents";
import {
  getOffseasonMarketViewStatus,
  getOffseasonVisibleDemandSalary,
  isFreeAgentMarketPlayer,
  isObservableFreeAgentPlayer,
} from "../../domain/season";
import { formatSalaryAmount, formatSalaryRange } from "../../shared/format/money";
import { Card } from "../../shared/ui/Card";
import { PlayerPortrait } from "../../shared/ui/PlayerPortrait";
import type {
  CareerSave,
  ContractType,
  OffseasonLogEntry,
  OffseasonNegotiationContext,
  OffseasonOffer,
  OffseasonRequestedRosterRole,
  Player,
  Role,
} from "../../types/game";

export type OffseasonTab = "contracts" | "free-agents" | "roster" | "log";

export type NegotiationMode = "renewal" | "free-agent";

export type NegotiationTarget = {
  mode: NegotiationMode;
  playerId: string;
};

export const contractOptions: Array<{ value: ContractType; label: string }> = [
  { value: "one-year", label: "1년" },
  { value: "two-year", label: "2년" },
  { value: "one-plus-one", label: "1+1년" },
];

export const requestedRosterRoleOptions: Array<{
  value: OffseasonRequestedRosterRole;
  label: string;
  description: string;
}> = [
  {
    value: "starter",
    label: "1군 주전",
    description: "해당 포지션 선발 슬롯에 등록",
  },
  {
    value: "sixth-man",
    label: "식스맨",
    description: "1군 후보로 등록",
  },
  {
    value: "academy",
    label: "2군",
    description: "아카데미 로스터에 등록, 구단 경쟁 없음",
  },
];

export const tabs: Array<{ id: OffseasonTab; label: string }> = [
  { id: "contracts", label: "내 팀 계약" },
  { id: "free-agents", label: "FA 시장" },
  { id: "roster", label: "로스터 현황" },
  { id: "log", label: "이적 로그" },
];

export function getOffseasonSubPageFromTab(tab: OffseasonTab): OffseasonSubPage {
  if (tab === "free-agents") {
    return "free-agents";
  }

  if (tab === "log") {
    return "log";
  }

  if (tab === "roster") {
    return "schedule";
  }

  return "overview";
}

export function getOffseasonTabFromSubPage(
  subPage: OffseasonSubPage | null | undefined,
): OffseasonTab {
  if (subPage === "free-agents") {
    return "free-agents";
  }

  if (subPage === "log") {
    return "log";
  }

  if (subPage === "schedule") {
    return "roster";
  }

  return "contracts";
}

export const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "top", label: "탑" },
  { value: "jungle", label: "정글" },
  { value: "mid", label: "미드" },
  { value: "bot", label: "원딜" },
  { value: "support", label: "서폿" },
];

export const logTeamFilterOptions = [
  { value: "all", label: "전체 팀" },
  ...lck2026Teams.map((team) => ({
    value: team.name,
    label: getLckTeamDisplayName(team),
  })),
];

export type OffseasonLogTeamFilter = (typeof logTeamFilterOptions)[number]["value"];

export function getRoleLabel(role: Role) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

export function getRosterTierLabel(player: Player) {
  if (player.rosterTier === "main") {
    return "1군";
  }

  if (player.rosterTier === "academy") {
    return "2군";
  }

  return "FA";
}

export function getMarketTeamLabel(player: Player) {
  return player.currentTeam
    ? `${getLckTeamDisplayName(player.currentTeam)} 소속`
    : "무소속 FA";
}

export function getLogTeamAliases(teamName: string) {
  const team = lck2026Teams.find((candidate) => candidate.name === teamName);

  if (!team) {
    return [teamName];
  }

  return [team.name, team.displayNameKo, team.shortName].filter(Boolean);
}

export function includesAnyTeamAlias(value: string, teamName: string) {
  const normalizedValue = value.toLowerCase();

  return getLogTeamAliases(teamName).some((alias) =>
    normalizedValue.includes(alias.toLowerCase()),
  );
}

export function logMatchesTeamFilter({
  career,
  log,
  teamFilter,
}: {
  career: CareerSave;
  log: OffseasonLogEntry;
  teamFilter: OffseasonLogTeamFilter;
}) {
  if (teamFilter === "all") {
    return true;
  }

  if (log.isUserTeamRelated && career.userTeam.name === teamFilter) {
    return true;
  }

  const relatedTeamText = log.relatedTeamNames?.join(" ") ?? "";
  const searchableText = `${log.message} ${relatedTeamText}`;

  return includesAnyTeamAlias(searchableText, teamFilter);
}

export function offerMatchesTeamFilter({
  offer,
  teamFilter,
}: {
  offer: OffseasonOffer;
  teamFilter: OffseasonLogTeamFilter;
}) {
  if (teamFilter === "all") {
    return true;
  }

  return (
    includesAnyTeamAlias(offer.fromTeamName, teamFilter) ||
    includesAnyTeamAlias(offer.toTeamName, teamFilter)
  );
}

export function getPlayer(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId);
}

export function getPlayerLabel(player: Player) {
  return `${player.role.toUpperCase()} · ${player.age}세 · ${getRosterTierLabel(player)}`;
}

export function getNegotiationContext(mode: NegotiationMode): OffseasonNegotiationContext {
  return mode === "renewal" ? "renewal" : "free-agent";
}

export function getCurrentOffseasonDay(career: CareerSave) {
  return career.seasonState.offseason?.currentDay ?? 1;
}

export function getVisibleDemand({
  career,
  context,
  contractType,
  player,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  contractType: ContractType;
  player: Player;
}) {
  return getOffseasonVisibleDemandSalary({
    context,
    contractType,
    day: getCurrentOffseasonDay(career),
    player,
  });
}

export function getOfferStatusLabel(status: OffseasonOffer["status"]) {
  if (status === "confirmation-pending") {
    return "확정 대기";
  }

  if (status === "accepted") {
    return "수락";
  }

  if (status === "rejected") {
    return "거절";
  }

  if (status === "lost") {
    return "경쟁 패배";
  }

  if (status === "withdrawn") {
    return "철회";
  }

  return "대기";
}

export function getRequestedRosterRoleLabel(
  requestedRosterRole?: OffseasonRequestedRosterRole,
) {
  if (requestedRosterRole === "starter") {
    return "1군 주전";
  }

  if (requestedRosterRole === "sixth-man") {
    return "식스맨";
  }

  return "2군";
}

export function getDefaultRequestedRosterRole({
  career,
  mode,
  player,
}: {
  career: CareerSave;
  mode: NegotiationMode;
  player: Player;
}): OffseasonRequestedRosterRole {
  if (mode === "free-agent") {
    return player.rosterTier === "academy" || player.overall < 70
      ? "academy"
      : "sixth-man";
  }

  if (career.userTeam.roster[player.role] === player.id) {
    return "starter";
  }

  if (career.userTeam.mainRosterPlayerIds.includes(player.id)) {
    return "sixth-man";
  }

  return "academy";
}

export function getActiveSalaryTotal(career: CareerSave) {
  return career.userTeam.contracts
    .filter((contract) => contract.remainingYears > 0)
    .reduce((total, contract) => total + contract.salary, 0);
}

export function BudgetMetric({
  label,
  note,
  tone = "default",
  value,
}: {
  label: string;
  note?: string;
  tone?: "default" | "good" | "danger";
  value: string;
}) {
  return (
    <article className={`season-summary-metric budget-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

export function OffseasonBudgetSummary({
  career,
  projectedSalaryOffer = 0,
}: {
  career: CareerSave;
  projectedSalaryOffer?: number;
}) {
  const activeSalaryTotal = getActiveSalaryTotal(career);
  const remainingBudget = career.userTeam.budget - activeSalaryTotal;
  const projectedRemainingBudget = remainingBudget - projectedSalaryOffer;
  const isOverBudget = remainingBudget < 0;
  const isProjectedOverBudget = projectedRemainingBudget < 0;

  return (
    <Card>
      <div className="section-label-row">
        <span>예산 요약</span>
        <strong>{isOverBudget ? "예산 초과" : "정상"}</strong>
      </div>
      <div className="season-summary-metrics offseason-budget-metrics">
        <BudgetMetric
          label="총 예산"
          note="현재 시즌 기준"
          value={formatSalaryAmount(career.userTeam.budget)}
        />
        <BudgetMetric
          label="연봉 총액"
          note="확정 계약 기준"
          value={formatSalaryAmount(activeSalaryTotal)}
        />
        <BudgetMetric
          label="잔여 예산"
          note="추가 영입 가능 범위"
          tone={isOverBudget ? "danger" : "good"}
          value={formatSalaryAmount(remainingBudget)}
        />
        <BudgetMetric
          label="제안 후 예상"
          note={
            projectedSalaryOffer > 0
              ? `${formatSalaryAmount(projectedSalaryOffer)} 제안 반영`
              : "새 제안 없음"
          }
          tone={isProjectedOverBudget ? "danger" : "default"}
          value={formatSalaryAmount(projectedRemainingBudget)}
        />
      </div>
    </Card>
  );
}

export function getContractedRoleCount(career: CareerSave, role: Role) {
  const activeContractIds = new Set(
    career.userTeam.contracts
      .filter((contract) => contract.remainingYears > 0)
      .map((contract) => contract.playerId),
  );

  return career.lckPlayers.filter(
    (player) =>
      player.availableForRoster &&
      player.role === role &&
      activeContractIds.has(player.id),
  ).length;
}

export function getConfirmationPendingOffers(career: CareerSave) {
  return (career.seasonState.offseason?.resolvedOffers ?? []).filter(
    (offer) =>
      offer.status === "confirmation-pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent",
  );
}

export function getClosedMarketPlayers(career: CareerSave) {
  const explicitMarketIds = new Set(
    career.seasonState.offseason?.freeAgentPlayerIds ?? [],
  );
  const knownPlayerIds = new Set(career.lckPlayers.map((player) => player.id));
  const displayPlayers = [
    ...career.lckPlayers,
    ...offseasonFreeAgentSeeds.filter((player) => !knownPlayerIds.has(player.id)),
  ];

  return displayPlayers
    .filter(
      (player) =>
        isObservableFreeAgentPlayer(career, player) &&
        (explicitMarketIds.size === 0 || explicitMarketIds.has(player.id)),
    )
    .sort((left, right) => {
      const overallDiff = right.overall - left.overall;

      if (overallDiff !== 0) {
        return overallDiff;
      }

      return left.id.localeCompare(right.id);
    });
}

export function getRecentOffseasonLogs(career: CareerSave) {
  const activeLogs = career.seasonState.offseason?.logEntries ?? [];
  const historyLogs = career.seasonHistory.flatMap(
    (summary) => summary.offseasonSummary?.notableLogEntries ?? [],
  );

  return [...historyLogs, ...activeLogs].slice(-8).reverse();
}

export function getClosedMarketStatusLabel(career: CareerSave) {
  const offseasonStatus = career.seasonState.offseason?.status;

  if (career.seasonState.phase === "offseason" && offseasonStatus === "summary") {
    return "스토브리그 대기";
  }

  if (career.seasonState.phase === "completed") {
    return "커리어 결산";
  }

  return "시장 닫힘";
}

export function getNextMarketDescription(career: CareerSave) {
  const offseasonStatus = career.seasonState.offseason?.status;

  if (career.seasonState.phase === "offseason" && offseasonStatus === "summary") {
    return "시즌 결산 화면에서 28일 스토브리그에 진입할 수 있습니다.";
  }

  if (career.seasonState.phase === "completed") {
    return "3시즌 결산 상태입니다. 추가 시즌 확장 전까지 이적시장은 열리지 않습니다.";
  }

  return "정식 시장은 시즌 종료 후 28일 스토브리그로 열립니다. LCK 1~2라운드 종료 후 MSI 전후 단기 시장은 후속 확장 예정입니다.";
}

export function findLatestOffer(
  career: CareerSave,
  playerId: string,
  context: OffseasonNegotiationContext,
) {
  const offers = [
    ...(career.seasonState.offseason?.pendingOffers ?? []),
    ...(career.seasonState.offseason?.resolvedOffers ?? []),
  ].filter(
    (offer) =>
      offer.playerIds.includes(playerId) &&
      (offer.negotiationContext ?? "free-agent") === context &&
      offer.fromTeamName === career.userTeam.name,
  );

  return offers.sort((left, right) => {
    const dayDiff =
      (right.resolvedDay ?? right.createdDay) -
      (left.resolvedDay ?? left.createdDay);

    if (dayDiff !== 0) {
      return dayDiff;
    }

    return right.id.localeCompare(left.id);
  })[0];
}

export function WeekTimeline({ career }: { career: CareerSave }) {
  const offseason = career.seasonState.offseason;
  const currentDay = offseason?.currentDay ?? 1;
  const currentWeek = offseason?.currentWeek ?? 1;

  return (
    <Card>
      <div className="offseason-timeline-header">
        <div>
          <p className="eyebrow">Stove League</p>
          <h1>스토브리그 {currentDay}일차</h1>
          <span>{career.seasonState.currentDateLabel}</span>
        </div>
        <div className="offseason-day-badge">
          <span>Week {currentWeek}</span>
          <strong>{offseason?.marketStatus ?? "not-started"}</strong>
        </div>
      </div>
      <div className="offseason-week-track">
        {[1, 2, 3, 4].map((week) => (
          <div
            className={`offseason-week-step ${
              week === currentWeek ? "offseason-week-step-active" : ""
            } ${week < currentWeek ? "offseason-week-step-complete" : ""}`}
            key={week}
          >
            <span>{week}주차</span>
            <strong>
              {week === 1
                ? "재계약/방출"
                : week === 4
                  ? "FA 경쟁/최종 등록"
                  : "FA 경쟁"}
            </strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function handleRowActivation(
  event: KeyboardEvent<HTMLElement>,
  onActivate: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onActivate();
}

export function OffseasonPlayerMarketDetails({
  player,
}: {
  player: Player;
}) {
  return (
    <section className="player-detail-section">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Market</p>
          <h3>시장 정보</h3>
        </div>
        <span className="panel-note">게임 내 금액 기준</span>
      </div>
      <div className="player-detail-extra-grid">
        <article>
          <span>현재 소속</span>
          <strong>{getMarketTeamLabel(player)}</strong>
        </article>
        <article>
          <span>리그</span>
          <strong>{player.league}</strong>
        </article>
        <article>
          <span>기대 연봉</span>
          <strong>{formatSalaryAmount(player.salaryExpectation)}</strong>
        </article>
        <article>
          <span>시장 가치</span>
          <strong>{formatSalaryAmount(player.cost)}</strong>
        </article>
      </div>
    </section>
  );
}
