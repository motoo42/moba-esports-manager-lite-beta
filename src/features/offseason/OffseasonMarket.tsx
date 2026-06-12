import { useMemo, useState, type KeyboardEvent } from "react";
import type { OffseasonSubPage } from "../../app/routes";
import { getLckTeamDisplayName, lck2026Teams } from "../../data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../data/offseasonFreeAgents";
import {
  getOffseasonMarketViewStatus,
  getOffseasonNegotiationSnapshot,
  getOffseasonVisibleDemandSalary,
  getUnresolvedExpiredPlayerIds,
  isFreeAgentMarketPlayer,
  isObservableFreeAgentPlayer,
  validateOffseasonRoster,
  type OffseasonContractOfferInput,
} from "../../domain/season";
import { formatSalaryAmount, formatSalaryRange } from "../../shared/format/money";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { EvaluationStars } from "../../shared/ui/EvaluationStars";
import { PlayerDetailModal } from "../../shared/ui/PlayerDetailModal";
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

type OffseasonMarketProps = {
  career: CareerSave;
  subPage?: OffseasonSubPage | null;
  onCancelFreeAgentSigning: (offerId: string) => void;
  onConfirmFreeAgentSigning: (offerId: string) => void;
  onReleaseExpiredPlayer: (playerId: string) => void;
  onSubmitFreeAgentOffer: (offer: OffseasonContractOfferInput) => void;
  onSubmitRenewalOffer: (offer: OffseasonContractOfferInput) => void;
  onSubPageChange?: (subPage: OffseasonSubPage) => void;
  onViewRoster: () => void;
};

type OffseasonTab = "contracts" | "free-agents" | "roster" | "log";

type NegotiationMode = "renewal" | "free-agent";

type NegotiationTarget = {
  mode: NegotiationMode;
  playerId: string;
};

const contractOptions: Array<{ value: ContractType; label: string }> = [
  { value: "one-year", label: "1년" },
  { value: "two-year", label: "2년" },
  { value: "one-plus-one", label: "1+1년" },
];

const requestedRosterRoleOptions: Array<{
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
    description: "아카데미 로스터에 등록",
  },
];

const tabs: Array<{ id: OffseasonTab; label: string }> = [
  { id: "contracts", label: "내 팀 계약" },
  { id: "free-agents", label: "FA 시장" },
  { id: "roster", label: "로스터 현황" },
  { id: "log", label: "이적 로그" },
];

function getOffseasonSubPageFromTab(tab: OffseasonTab): OffseasonSubPage {
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

function getOffseasonTabFromSubPage(
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

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "top", label: "탑" },
  { value: "jungle", label: "정글" },
  { value: "mid", label: "미드" },
  { value: "bot", label: "원딜" },
  { value: "support", label: "서폿" },
];

const logTeamFilterOptions = [
  { value: "all", label: "전체 팀" },
  ...lck2026Teams.map((team) => ({
    value: team.name,
    label: getLckTeamDisplayName(team),
  })),
];

type OffseasonLogTeamFilter = (typeof logTeamFilterOptions)[number]["value"];

function getRoleLabel(role: Role) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function getRosterTierLabel(player: Player) {
  if (player.rosterTier === "main") {
    return "1군";
  }

  if (player.rosterTier === "academy") {
    return "2군";
  }

  return "FA";
}

function getMarketTeamLabel(player: Player) {
  return player.currentTeam
    ? `${getLckTeamDisplayName(player.currentTeam)} 소속`
    : "무소속 FA";
}

function getLogTeamAliases(teamName: string) {
  const team = lck2026Teams.find((candidate) => candidate.name === teamName);

  if (!team) {
    return [teamName];
  }

  return [team.name, team.displayNameKo, team.shortName].filter(Boolean);
}

function includesAnyTeamAlias(value: string, teamName: string) {
  const normalizedValue = value.toLowerCase();

  return getLogTeamAliases(teamName).some((alias) =>
    normalizedValue.includes(alias.toLowerCase()),
  );
}

function logMatchesTeamFilter({
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

function offerMatchesTeamFilter({
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

function getPlayer(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId);
}

function getPlayerLabel(player: Player) {
  return `${player.role.toUpperCase()} · ${player.age}세 · ${getRosterTierLabel(player)}`;
}

function getNegotiationContext(mode: NegotiationMode): OffseasonNegotiationContext {
  return mode === "renewal" ? "renewal" : "free-agent";
}

function getCurrentOffseasonDay(career: CareerSave) {
  return career.seasonState.offseason?.currentDay ?? 1;
}

function getVisibleDemand({
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

function getOfferStatusLabel(status: OffseasonOffer["status"]) {
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

function getRequestedRosterRoleLabel(
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

function getDefaultRequestedRosterRole({
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

function getActiveSalaryTotal(career: CareerSave) {
  return career.userTeam.contracts
    .filter((contract) => contract.remainingYears > 0)
    .reduce((total, contract) => total + contract.salary, 0);
}

function BudgetMetric({
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

function OffseasonBudgetSummary({
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

function getContractedRoleCount(career: CareerSave, role: Role) {
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

function getConfirmationPendingOffers(career: CareerSave) {
  return (career.seasonState.offseason?.resolvedOffers ?? []).filter(
    (offer) =>
      offer.status === "confirmation-pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent",
  );
}

function getClosedMarketPlayers(career: CareerSave) {
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

function getRecentOffseasonLogs(career: CareerSave) {
  const activeLogs = career.seasonState.offseason?.logEntries ?? [];
  const historyLogs = career.seasonHistory.flatMap(
    (summary) => summary.offseasonSummary?.notableLogEntries ?? [],
  );

  return [...historyLogs, ...activeLogs].slice(-8).reverse();
}

function getClosedMarketStatusLabel(career: CareerSave) {
  const offseasonStatus = career.seasonState.offseason?.status;

  if (career.seasonState.phase === "offseason" && offseasonStatus === "summary") {
    return "스토브리그 대기";
  }

  if (career.seasonState.phase === "completed") {
    return "커리어 결산";
  }

  return "시장 닫힘";
}

function getNextMarketDescription(career: CareerSave) {
  const offseasonStatus = career.seasonState.offseason?.status;

  if (career.seasonState.phase === "offseason" && offseasonStatus === "summary") {
    return "시즌 결산 화면에서 28일 스토브리그에 진입할 수 있습니다.";
  }

  if (career.seasonState.phase === "completed") {
    return "3시즌 결산 상태입니다. 추가 시즌 확장 전까지 이적시장은 열리지 않습니다.";
  }

  return "정식 시장은 시즌 종료 후 28일 스토브리그로 열립니다. LCK 1~2라운드 종료 후 MSI 전후 단기 시장은 후속 확장 예정입니다.";
}

function findLatestOffer(
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

function WeekTimeline({ career }: { career: CareerSave }) {
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

function handleRowActivation(
  event: KeyboardEvent<HTMLElement>,
  onActivate: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onActivate();
}

function OffseasonPlayerMarketDetails({
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

function ContractOfferModal({
  career,
  onClose,
  onSubmit,
  target,
}: {
  career: CareerSave;
  onClose: () => void;
  onSubmit: (offer: OffseasonContractOfferInput) => void;
  target: NegotiationTarget;
}) {
  const player = getPlayer(career.lckPlayers, target.playerId);
  const [contractType, setContractType] = useState<ContractType>("one-year");
  const [requestedRosterRole, setRequestedRosterRole] =
    useState<OffseasonRequestedRosterRole>(() =>
      player
        ? getDefaultRequestedRosterRole({
            career,
            mode: target.mode,
            player,
          })
        : "academy",
    );
  const [salaryOffer, setSalaryOffer] = useState(() =>
    player
      ? getVisibleDemand({
          career,
          context: getNegotiationContext(target.mode),
          contractType: "one-year",
          player,
        })
      : 0,
  );

  if (!player) {
    return null;
  }

  const modalPlayer = player;
  const context = getNegotiationContext(target.mode);
  const negotiation = getOffseasonNegotiationSnapshot({
    career,
    context,
    contractType,
    player: modalPlayer,
    requestedRosterRole,
    salaryOffer,
  });
  const latestOffer = findLatestOffer(career, modalPlayer.id, context);
  const title = target.mode === "renewal" ? "재계약 협상" : "FA 계약 협상";
  const activeSalaryTotal = getActiveSalaryTotal(career);
  const projectedRemainingBudget =
    career.userTeam.budget - activeSalaryTotal - salaryOffer;

  function handleContractTypeChange(nextContractType: ContractType) {
    setContractType(nextContractType);
    setSalaryOffer(
      getVisibleDemand({
        career,
        context,
        contractType: nextContractType,
        player: modalPlayer,
      }),
    );
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label={title}
        aria-modal="true"
        className="contract-offer-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="contract-offer-header">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>{modalPlayer.name}</h2>
            <span>{getPlayerLabel(modalPlayer)}</span>
            <EvaluationStars player={modalPlayer} />
          </div>
          <button
            aria-label="닫기"
            className="modal-close-button"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="contract-offer-grid">
          <label>
            <span>계약 형태</span>
            <select
              value={contractType}
              onChange={(event) =>
                handleContractTypeChange(event.target.value as ContractType)
              }
            >
              {contractOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>제안 역할</span>
            <select
              aria-label="제안 역할"
              value={requestedRosterRole}
              onChange={(event) =>
                setRequestedRosterRole(
                  event.target.value as OffseasonRequestedRosterRole,
                )
              }
            >
              {requestedRosterRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>
              {
                requestedRosterRoleOptions.find(
                  (option) => option.value === requestedRosterRole,
                )?.description
              }
            </small>
          </label>
          <label>
            <span>제안 연봉</span>
            <input
              aria-label="제안 연봉"
              min={0}
              step={5}
              type="number"
              value={salaryOffer}
              onChange={(event) => setSalaryOffer(Number(event.target.value))}
            />
            <small>현재 제안: {formatSalaryAmount(salaryOffer)}</small>
          </label>
        </div>
        <div className="contract-offer-summary">
          <article>
            <span>선수 측 요구액</span>
            <strong>{formatSalaryAmount(negotiation.visibleDemand)}</strong>
          </article>
          <article
            className={
              projectedRemainingBudget < 0
                ? "contract-offer-budget-card contract-offer-budget-card-danger"
                : "contract-offer-budget-card"
            }
          >
            <span>제안 후 잔여 예산</span>
            <strong>{formatSalaryAmount(projectedRemainingBudget)}</strong>
            <small>
              현재 잔여 {formatSalaryAmount(career.userTeam.budget - activeSalaryTotal)}
            </small>
          </article>
          <article className="contract-offer-mood-card">
            <span>협상 분위기</span>
            <div className="negotiation-mood-value">
              <strong
                data-testid="negotiation-mood-score"
                style={{ color: negotiation.moodColor }}
              >
                {negotiation.moodScore}%
              </strong>
            </div>
            <div
              aria-label={`협상 분위기 ${negotiation.moodScore}%`}
              className="negotiation-mood-track"
            >
              <div
                className="negotiation-mood-fill"
                style={{
                  backgroundColor: negotiation.moodColor,
                  color: negotiation.moodColor,
                  width: `${negotiation.moodScore}%`,
                }}
              />
            </div>
          </article>
        </div>
        {latestOffer && (
          <div className="contract-offer-history-note">
            최근 제안: {getOfferStatusLabel(latestOffer.status)} ·{" "}
            {formatSalaryAmount(latestOffer.salaryOffer)} · 역할{" "}
            {getRequestedRosterRoleLabel(latestOffer.requestedRosterRole)}
            {latestOffer.moodScore !== undefined
              ? ` · 분위기 ${latestOffer.moodScore}%`
              : ""}
          </div>
        )}
        <div className="season-summary-actions">
          <Button
            onClick={() => {
              onSubmit({
                playerId: modalPlayer.id,
                contractType,
                requestedRosterRole,
                salaryOffer,
              });
              onClose();
            }}
          >
            제안 보내기
          </Button>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>
      </section>
    </div>
  );
}

function ContractTab({
  career,
  onOpenNegotiation,
  onReleaseExpiredPlayer,
  onViewPlayer,
}: {
  career: CareerSave;
  onOpenNegotiation: (target: NegotiationTarget) => void;
  onReleaseExpiredPlayer: (playerId: string) => void;
  onViewPlayer: (player: Player) => void;
}) {
  const offseason = career.seasonState.offseason;
  const unresolvedIds = new Set(getUnresolvedExpiredPlayerIds(career));
  const expiredPlayers = (offseason?.expiredContractPlayerIds ?? [])
    .map((playerId) => getPlayer(career.lckPlayers, playerId))
    .filter((player): player is Player => Boolean(player));

  if (expiredPlayers.length === 0) {
    return (
      <div className="offseason-empty">
        <strong>계약 만료 선수가 없습니다.</strong>
        <span>2주차부터 FA 시장에 집중하면 됩니다.</span>
      </div>
    );
  }

  return (
    <div className="offseason-list">
      {expiredPlayers.map((player) => {
        const resolved = !unresolvedIds.has(player.id);
        const latestOffer = findLatestOffer(career, player.id, "renewal");
        const isPending = latestOffer?.status === "pending";

        return (
          <article
            className="offseason-player-row offseason-player-row-clickable"
            key={player.id}
            onClick={() => onViewPlayer(player)}
            onKeyDown={(event) =>
              handleRowActivation(event, () => onViewPlayer(player))
            }
            role="button"
            tabIndex={0}
          >
            <div className="offseason-player-portrait-cell">
              <PlayerPortrait player={player} size="lg" />
            </div>
            <div className="offseason-player-main">
              <strong>{player.name}</strong>
              <span>{getPlayerLabel(player)}</span>
              <EvaluationStars compact player={player} />
            </div>
            <div className="offseason-player-market-info">
              <small>
                {latestOffer
                  ? `최근 재계약 제안 ${getOfferStatusLabel(
                      latestOffer.status,
                    )} · ${formatSalaryAmount(
                      latestOffer.salaryOffer,
                    )} · ${getRequestedRosterRoleLabel(
                      latestOffer.requestedRosterRole,
                    )}`
                  : `선수 측 요구액 ${formatSalaryAmount(
                      getVisibleDemand({
                        career,
                        context: "renewal",
                        contractType: "one-year",
                        player,
                      }),
                    )}`}
              </small>
            </div>
            {resolved ? (
              <strong className="offseason-status-label">처리 완료</strong>
            ) : (
              <div
                className="offseason-offer-controls"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Button
                  disabled={isPending}
                  onClick={() =>
                    onOpenNegotiation({
                      mode: "renewal",
                      playerId: player.id,
                    })
                  }
                >
                  {isPending ? "제안 대기" : "재계약 협상"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onReleaseExpiredPlayer(player.id)}
                >
                  방출
                </Button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ConfirmationPendingSection({
  career,
  onCancelFreeAgentSigning,
  onConfirmFreeAgentSigning,
  onViewPlayer,
}: {
  career: CareerSave;
  onCancelFreeAgentSigning: (offerId: string) => void;
  onConfirmFreeAgentSigning: (offerId: string) => void;
  onViewPlayer: (player: Player) => void;
}) {
  const [notice, setNotice] = useState("");
  const pendingOffers = getConfirmationPendingOffers(career);

  if (pendingOffers.length === 0) {
    return null;
  }

  return (
    <div className="offseason-confirmation-section">
      <div className="section-label-row">
        <span>영입 확정 대기</span>
        <strong>{pendingOffers.length}</strong>
      </div>
      {notice && <p className="offseason-confirmation-notice">{notice}</p>}
      <div className="offseason-confirmation-grid">
        {pendingOffers.map((offer) => {
          const player = getPlayer(career.lckPlayers, offer.playerIds[0]);
          const activeSalaryTotal = getActiveSalaryTotal(career);
          const remainingBudget = career.userTeam.budget - activeSalaryTotal;
          const roleCount = player
            ? getContractedRoleCount(career, player.role)
            : 0;
          const budgetExceeded = offer.salaryOffer > remainingBudget;
          const roleLimitExceeded = roleCount >= 3;
          const canConfirm = Boolean(player) && !budgetExceeded && !roleLimitExceeded;
          const blockReason = budgetExceeded
            ? `예산 여유 ${formatSalaryAmount(
                remainingBudget,
              )}보다 제안 연봉이 높습니다.`
            : roleLimitExceeded && player
              ? `${player.role.toUpperCase()} 포지션은 이미 3명을 보유 중입니다.`
              : "";

          return (
            <article className="offseason-confirmation-card" key={offer.id}>
              <div
                className={
                  player
                    ? "offseason-confirmation-player-card offseason-confirmation-player-card-clickable"
                    : "offseason-confirmation-player-card"
                }
                onClick={
                  player ? () => onViewPlayer(player) : undefined
                }
                onKeyDown={
                  player
                    ? (event) =>
                        handleRowActivation(event, () => onViewPlayer(player))
                    : undefined
                }
                role={player ? "button" : undefined}
                tabIndex={player ? 0 : undefined}
              >
                {player ? (
                  <>
                    <PlayerPortrait player={player} size="lg" />
                    <em>{player.name}</em>
                    <EvaluationStars compact player={player} />
                  </>
                ) : (
                  <>
                    <span>FA</span>
                    <em>{offer.playerIds[0]}</em>
                  </>
                )}
              </div>
              <div className="offseason-confirmation-details">
                <strong>{player?.name ?? offer.playerIds[0]}</strong>
                <span>{player ? getPlayerLabel(player) : "선수 정보 없음"}</span>
                {player && <EvaluationStars compact player={player} />}
                <small>제안 연봉 {formatSalaryAmount(offer.salaryOffer)}</small>
                <small>
                  제안 역할 {getRequestedRosterRoleLabel(offer.requestedRosterRole)}
                </small>
                <small>
                  예산 여유 {formatSalaryAmount(remainingBudget)} · 포지션{" "}
                  {roleCount}/3
                </small>
                {!canConfirm && blockReason && (
                  <small className="offseason-confirm-block-reason">
                    확정 불가: {blockReason}
                  </small>
                )}
              </div>
              <div
                className="offseason-confirmation-actions"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {!canConfirm && blockReason && (
                  <small className="offseason-confirm-tooltip-copy">
                    {blockReason}
                  </small>
                )}
                <Button
                  aria-disabled={!canConfirm}
                  className={
                    canConfirm
                      ? "offseason-confirm-button"
                      : "offseason-confirm-button offseason-confirm-button-disabled"
                  }
                  onClick={() => {
                    if (!canConfirm) {
                      setNotice(
                        `${player?.name ?? "해당 선수"} 영입 불가: ${blockReason}`,
                      );
                      return;
                    }

                    setNotice("");
                    onConfirmFreeAgentSigning(offer.id);
                  }}
                  title={!canConfirm ? blockReason : undefined}
                  type="button"
                >
                  영입 확정
                </Button>
                <Button
                  className="offseason-cancel-button"
                  onClick={() => {
                    setNotice("");
                    onCancelFreeAgentSigning(offer.id);
                  }}
                  type="button"
                  variant="ghost"
                >
                  영입 취소
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FreeAgentTab({
  career,
  onCancelFreeAgentSigning,
  onConfirmFreeAgentSigning,
  onOpenNegotiation,
  onViewPlayer,
}: {
  career: CareerSave;
  onCancelFreeAgentSigning: (offerId: string) => void;
  onConfirmFreeAgentSigning: (offerId: string) => void;
  onOpenNegotiation: (target: NegotiationTarget) => void;
  onViewPlayer: (player: Player) => void;
}) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [tierFilter, setTierFilter] = useState<
    "all" | "main" | "academy" | "free-agent"
  >("all");
  const offseason = career.seasonState.offseason;
  const currentDay = offseason?.currentDay ?? 1;
  const canOffer = currentDay >= 8 && currentDay < 28;
  const pendingPlayerIds = new Set(
    (offseason?.pendingOffers ?? [])
      .filter((offer) => offer.status === "pending")
      .flatMap((offer) => offer.playerIds),
  );
  const confirmationPendingOffers = getConfirmationPendingOffers(career);
  const freeAgents = career.lckPlayers
    .filter((player) => isFreeAgentMarketPlayer(career, player))
    .sort((left, right) => right.overall - left.overall);
  const normalizedQuery = query.trim().toLowerCase();
  const teamOptions = [
    ...new Set(
      freeAgents
        .map((player) => player.currentTeam)
        .filter((teamName): teamName is string => Boolean(teamName)),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const filteredPlayers = freeAgents.filter((player) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      player.name.toLowerCase().includes(normalizedQuery) ||
      (player.realName ?? "").toLowerCase().includes(normalizedQuery) ||
      (player.nativeName ?? "").toLowerCase().includes(normalizedQuery);
    const matchesTeam =
      teamFilter === "all" || player.currentTeam === teamFilter;
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const matchesTier =
      tierFilter === "all" || (player.rosterTier ?? "free-agent") === tierFilter;

    return matchesQuery && matchesTeam && matchesRole && matchesTier;
  });

  if (freeAgents.length === 0 && confirmationPendingOffers.length === 0) {
    return (
      <div className="offseason-empty">
        <strong>FA 시장에 남은 선수가 없습니다.</strong>
        <span>이적 로그와 최종 로스터를 확인하세요.</span>
      </div>
    );
  }

  return (
    <div className="offseason-list">
      <ConfirmationPendingSection
        career={career}
        onCancelFreeAgentSigning={onCancelFreeAgentSigning}
        onConfirmFreeAgentSigning={onConfirmFreeAgentSigning}
        onViewPlayer={onViewPlayer}
      />
      {freeAgents.length === 0 && (
        <div className="offseason-empty">
          <strong>FA 시장에 남은 선수가 없습니다.</strong>
          <span>확정 대기 중인 영입을 처리한 뒤 이적 로그를 확인하세요.</span>
        </div>
      )}
      <div className="offseason-filter-row">
        <label>
          <span>검색</span>
          <input
            aria-label="시장 선수 검색"
            placeholder="선수명"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>팀</span>
          <select
            aria-label="시장 팀 필터"
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
          >
            <option value="all">전체 팀</option>
            {teamOptions.map((teamName) => (
              <option key={teamName} value={teamName}>
                {teamName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>포지션</span>
          <select
            aria-label="시장 포지션 필터"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as "all" | Role)
            }
          >
            <option value="all">전체 포지션</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>구분</span>
          <select
            aria-label="시장 1군 2군 필터"
            value={tierFilter}
            onChange={(event) =>
              setTierFilter(
                event.target.value as "all" | "main" | "academy" | "free-agent",
              )
            }
          >
            <option value="all">전체</option>
            <option value="main">1군</option>
            <option value="academy">2군</option>
            <option value="free-agent">무소속</option>
          </select>
        </label>
        <strong>{filteredPlayers.length}명</strong>
      </div>
      {!canOffer && (
        <p className="muted">
          FA 제안은 2주차부터 4주차 27일차까지 가능합니다. 28일차에는 최종
          등록만 진행됩니다.
        </p>
      )}
      {filteredPlayers.length === 0 && (
        <div className="offseason-empty">
          <strong>필터에 맞는 선수가 없습니다.</strong>
          <span>검색어 또는 필터를 조정해 보세요.</span>
        </div>
      )}
      {filteredPlayers.map((player) => {
        const demand = getVisibleDemand({
          career,
          context: "free-agent",
          contractType: "one-year",
          player,
        });
        const isPending = pendingPlayerIds.has(player.id);
        const latestOffer = findLatestOffer(career, player.id, "free-agent");

        return (
          <article
            className="offseason-player-row offseason-player-row-clickable"
            key={player.id}
            onClick={() => onViewPlayer(player)}
            onKeyDown={(event) =>
              handleRowActivation(event, () => onViewPlayer(player))
            }
            role="button"
            tabIndex={0}
          >
            <div className="offseason-player-portrait-cell">
              <PlayerPortrait player={player} size="lg" />
            </div>
            <div className="offseason-player-main">
              <strong>{player.name}</strong>
              <span>{getPlayerLabel(player)}</span>
              <EvaluationStars compact player={player} />
            </div>
            <div className="offseason-player-market-info">
              <small>
                {latestOffer
                  ? `최근 FA 제안 ${getOfferStatusLabel(
                      latestOffer.status,
                    )} · ${formatSalaryAmount(
                      latestOffer.salaryOffer,
                    )} · ${getRequestedRosterRoleLabel(
                      latestOffer.requestedRosterRole,
                    )}`
                  : `선수 측 요구액 ${formatSalaryAmount(
                      demand,
                    )} · ${getMarketTeamLabel(player)} · ${getRosterTierLabel(
                      player,
                      )}`}
              </small>
            </div>
            <div
              className="offseason-offer-controls"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Button
                disabled={!canOffer || isPending}
                onClick={() =>
                  onOpenNegotiation({
                    mode: "free-agent",
                    playerId: player.id,
                  })
                }
              >
                {isPending ? "제안 대기" : "FA 협상"}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function RosterTab({
  career,
  onViewRoster,
}: {
  career: CareerSave;
  onViewRoster: () => void;
}) {
  const validation = validateOffseasonRoster(career);
  const rosteredPlayers = career.userTeam.contracts
    .filter((contract) => contract.remainingYears > 0)
    .map((contract) => getPlayer(career.lckPlayers, contract.playerId))
    .filter(
      (player): player is Player =>
        player !== undefined && player.availableForRoster,
    );
  const minMainRosterPlayers =
    career.userTeam.rosterSettings.minMainRosterPlayers ?? 5;
  const minAcademyRosterPlayers =
    career.userTeam.rosterSettings.minAcademyRosterPlayers ?? 5;

  return (
    <div className="offseason-roster-panel">
      <div className="season-summary-metrics">
        <article className="season-summary-metric">
          <span>계약 선수</span>
          <strong>{validation.contractedPlayerIds.length}명</strong>
          <small>
            최소 {career.userTeam.rosterSettings.minPlayers}명 / 최대{" "}
            {career.userTeam.rosterSettings.maxPlayers}명
          </small>
        </article>
        <article className="season-summary-metric">
          <span>1군 등록</span>
          <strong>
            {validation.mainRosterPlayerIds.length}/{minMainRosterPlayers}
          </strong>
          <small>선발 5인 + 1군 후보</small>
        </article>
        <article className="season-summary-metric">
          <span>2군 등록</span>
          <strong>
            {validation.academyPlayerIds.length}/{minAcademyRosterPlayers}
          </strong>
          <small>2군 계약 선수</small>
        </article>
        <article className="season-summary-metric">
          <span>연봉 총액</span>
          <strong>{formatSalaryRange(validation.yearlySalary, career.userTeam.budget)}</strong>
          <small>예산 기준</small>
        </article>
        <article className="season-summary-metric">
          <span>최종 등록</span>
          <strong>{validation.isValid ? "가능" : "불가"}</strong>
          <small>28일차 진행 시 검사</small>
        </article>
      </div>
      {validation.errors.length > 0 && (
        <div className="offseason-validation-box">
          {validation.errors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}
      <div className="offseason-roster-list">
        {rosteredPlayers.map((player) => (
          <article className="offseason-mini-player" key={player.id}>
            <strong>{player.name}</strong>
            <span>{getPlayerLabel(player)}</span>
            <EvaluationStars compact player={player} />
          </article>
        ))}
      </div>
      <div className="season-summary-actions">
        <Button variant="ghost" onClick={onViewRoster}>
          선발/2군 조정
        </Button>
      </div>
    </div>
  );
}

function OffseasonLogTeamSelect({
  filteredCount,
  onChange,
  totalCount,
  value,
}: {
  filteredCount: number;
  onChange: (value: OffseasonLogTeamFilter) => void;
  totalCount: number;
  value: OffseasonLogTeamFilter;
}) {
  return (
    <div className="offseason-filter-row offseason-log-filter-row">
      <label>
        <span>팀</span>
        <select
          aria-label="이적 로그 팀 필터"
          value={value}
          onChange={(event) =>
            onChange(event.target.value as OffseasonLogTeamFilter)
          }
        >
          {logTeamFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <strong>
        {filteredCount}/{totalCount}건
      </strong>
    </div>
  );
}

function LogTab({ career }: { career: CareerSave }) {
  const [teamFilter, setTeamFilter] =
    useState<OffseasonLogTeamFilter>("all");
  const logs = [...(career.seasonState.offseason?.logEntries ?? [])].reverse();
  const filteredLogs = logs.filter((log) =>
    logMatchesTeamFilter({ career, log, teamFilter }),
  );
  const allOffers = [...(career.seasonState.offseason?.resolvedOffers ?? [])]
    .reverse()
    .slice(0, 8);
  const offers = allOffers.filter((offer) =>
    offerMatchesTeamFilter({ offer, teamFilter }),
  );

  if (logs.length === 0 && offers.length === 0) {
    return (
      <div className="offseason-empty">
        <strong>아직 이적 로그가 없습니다.</strong>
        <span>제안과 AI 계약 경쟁 결과가 이곳에 쌓입니다.</span>
      </div>
    );
  }

  return (
    <div className="offseason-log-grid">
      <div className="offseason-log-panel">
        <OffseasonLogTeamSelect
          filteredCount={filteredLogs.length}
          onChange={setTeamFilter}
          totalCount={logs.length}
          value={teamFilter}
        />
        {filteredLogs.length === 0 ? (
          <div className="offseason-empty">
            <strong>선택한 팀의 이적 로그가 없습니다.</strong>
            <span>다른 팀을 선택하거나 전체 팀으로 돌아가세요.</span>
          </div>
        ) : (
          <div className="offseason-log-list">
            {filteredLogs.map((log) => (
              <article
                className={`offseason-log-entry offseason-log-${log.type} ${
                  log.isUserTeamRelated ? "offseason-log-user-team" : ""
                }`}
                key={log.id}
              >
                <span>
                  {log.week}주차 {log.day}일
                </span>
                <strong>{log.message}</strong>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="offseason-offer-history">
        <div className="section-label-row">
          <span>최근 제안 결과</span>
          <strong>{offers.length}</strong>
        </div>
        {offers.map((offer) => {
          const playerNames = offer.playerIds
            .map((playerId) => getPlayer(career.lckPlayers, playerId)?.name ?? playerId)
            .join(", ");

          return (
            <article className="offseason-mini-player" key={offer.id}>
              <strong>
                {offer.fromTeamName} · {getOfferStatusLabel(offer.status)}
              </strong>
              <span>
                {playerNames} · {formatSalaryAmount(offer.salaryOffer)} ·{" "}
                {getOfferStatusLabel(offer.status)} ·{" "}
                {getRequestedRosterRoleLabel(offer.requestedRosterRole)}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ClosedMarketFreeAgentPanel({
  career,
  onViewPlayer,
}: {
  career: CareerSave;
  onViewPlayer: (player: Player) => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [tierFilter, setTierFilter] = useState<
    "all" | "main" | "academy" | "free-agent"
  >("all");
  const players = getClosedMarketPlayers(career);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPlayers = players.filter((player) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      player.name.toLowerCase().includes(normalizedQuery) ||
      (player.realName ?? "").toLowerCase().includes(normalizedQuery) ||
      (player.nativeName ?? "").toLowerCase().includes(normalizedQuery);
    const matchesRole = roleFilter === "all" || player.role === roleFilter;
    const matchesTier =
      tierFilter === "all" || (player.rosterTier ?? "free-agent") === tierFilter;

    return matchesQuery && matchesRole && matchesTier;
  });

  return (
    <Card>
      <div className="section-label-row">
        <span>FA 명단</span>
        <strong>{filteredPlayers.length}명</strong>
      </div>
      <p className="muted">
        협상은 등록된 이적시장 기간에만 가능합니다. 지금은 시장 상태와
        후보군만 확인할 수 있습니다.
      </p>
      <div className="offseason-filter-row">
        <label>
          <span>검색</span>
          <input
            aria-label="닫힌 시장 선수 검색"
            placeholder="선수명"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>포지션</span>
          <select
            aria-label="닫힌 시장 포지션 필터"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as "all" | Role)
            }
          >
            <option value="all">전체 포지션</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>구분</span>
          <select
            aria-label="닫힌 시장 1군 2군 필터"
            value={tierFilter}
            onChange={(event) =>
              setTierFilter(
                event.target.value as "all" | "main" | "academy" | "free-agent",
              )
            }
          >
            <option value="all">전체</option>
            <option value="main">1군</option>
            <option value="academy">2군</option>
            <option value="free-agent">무소속</option>
          </select>
        </label>
      </div>
      {filteredPlayers.length === 0 ? (
        <div className="offseason-empty">
          <strong>확인 가능한 FA 선수가 없습니다.</strong>
          <span>필터를 조정하거나 다음 이적시장 개장을 기다리세요.</span>
        </div>
      ) : (
        <div className="offseason-list offseason-closed-player-list">
          {filteredPlayers.slice(0, 16).map((player) => (
            <article
              className="offseason-player-row offseason-player-row-clickable"
              key={player.id}
              onClick={() => onViewPlayer(player)}
              onKeyDown={(event) =>
                handleRowActivation(event, () => onViewPlayer(player))
              }
              role="button"
              tabIndex={0}
            >
              <div className="offseason-player-portrait-cell">
                <PlayerPortrait player={player} size="lg" />
              </div>
              <div className="offseason-player-main">
                <strong>{player.name}</strong>
                <span>{getPlayerLabel(player)}</span>
                <EvaluationStars compact player={player} />
              </div>
              <div className="offseason-player-market-info">
                <small>
                  {getMarketTeamLabel(player)} · {getRosterTierLabel(player)}
                </small>
                <small>협상 가능 기간에 제안할 수 있습니다.</small>
              </div>
              <strong className="offseason-status-label">관찰 가능</strong>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function ClosedMarketLogPanel({ career }: { career: CareerSave }) {
  const [teamFilter, setTeamFilter] =
    useState<OffseasonLogTeamFilter>("all");
  const logs = getRecentOffseasonLogs(career);
  const filteredLogs = logs.filter((log) =>
    logMatchesTeamFilter({ career, log, teamFilter }),
  );

  return (
    <Card>
      <div className="section-label-row">
        <span>이적 로그</span>
        <strong>{filteredLogs.length}</strong>
      </div>
      {logs.length === 0 ? (
        <div className="offseason-empty">
          <strong>아직 확인할 이적 로그가 없습니다.</strong>
          <span>스토브리그가 진행되면 주요 기록이 이곳에 남습니다.</span>
        </div>
      ) : (
        <div className="offseason-log-panel">
          <OffseasonLogTeamSelect
            filteredCount={filteredLogs.length}
            onChange={setTeamFilter}
            totalCount={logs.length}
            value={teamFilter}
          />
          {filteredLogs.length === 0 ? (
            <div className="offseason-empty">
              <strong>선택한 팀의 이적 로그가 없습니다.</strong>
              <span>다른 팀을 선택하거나 전체 팀으로 돌아가세요.</span>
            </div>
          ) : (
            <div className="offseason-log-list offseason-closed-log-list">
              {filteredLogs.map((log) => (
                <article
                  className={`offseason-log-entry offseason-log-${log.type} ${
                    log.isUserTeamRelated ? "offseason-log-user-team" : ""
                  }`}
                  key={log.id}
                >
                  <span>
                    {log.week}주차 {log.day}일
                  </span>
                  <strong>{log.message}</strong>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ClosedMarketOverviewPanel({ career }: { career: CareerSave }) {
  const validation = validateOffseasonRoster(career);
  const activeSalaryTotal = getActiveSalaryTotal(career);
  const remainingBudget = career.userTeam.budget - activeSalaryTotal;

  return (
    <>
      <Card>
        <div className="offseason-closed-hero">
          <div>
            <p className="eyebrow">Stove League Hub</p>
            <h1>현재 이적시장은 닫혀 있습니다.</h1>
            <p>{getNextMarketDescription(career)}</p>
          </div>
          <div className="offseason-day-badge">
            <span>현재 상태</span>
            <strong>{getClosedMarketStatusLabel(career)}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-label-row">
          <span>시장 개요</span>
          <strong>{career.seasonState.currentDateLabel}</strong>
        </div>
        <div className="season-summary-metrics">
          <article className="season-summary-metric">
            <span>총 예산</span>
            <strong>{formatSalaryAmount(career.userTeam.budget)}</strong>
            <small>현재 시즌 기준</small>
          </article>
          <article className="season-summary-metric">
            <span>연봉 총액</span>
            <strong>{formatSalaryAmount(activeSalaryTotal)}</strong>
            <small>잔여 {formatSalaryAmount(remainingBudget)}</small>
          </article>
          <article
            className={`season-summary-metric budget-metric-${
              remainingBudget < 0 ? "danger" : "good"
            }`}
          >
            <span>예산 상태</span>
            <strong>{remainingBudget < 0 ? "초과" : "정상"}</strong>
            <small>{formatSalaryAmount(remainingBudget)}</small>
          </article>
          <article className="season-summary-metric">
            <span>1군 등록</span>
            <strong>{validation.mainRosterPlayerIds.length}명</strong>
            <small>선발 5인 + 후보</small>
          </article>
          <article className="season-summary-metric">
            <span>2군 등록</span>
            <strong>{validation.academyPlayerIds.length}명</strong>
            <small>아카데미 로스터</small>
          </article>
        </div>
      </Card>
    </>
  );
}

function ClosedMarketSchedulePanel() {
  return (
      <Card>
        <div className="section-label-row">
          <span>일정 안내</span>
          <strong>후속 확장 여지</strong>
        </div>
        <div className="offseason-window-grid">
          <article className="offseason-mini-player">
            <strong>정규 스토브리그</strong>
            <span>프리시즌과 시즌 종료 후 28일 시장</span>
          </article>
          <article className="offseason-mini-player">
            <strong>MSI 전후 단기 시장</strong>
            <span>
              LCK Rounds 1-2 종료 후 추가 영입, 방출, 트레이드 확장 예정
            </span>
          </article>
        </div>
      </Card>
  );
}

function ClosedOffseasonInfo({
  career,
  subPage,
}: {
  career: CareerSave;
  subPage?: OffseasonSubPage | null;
}) {
  const activeSubPage = subPage ?? "overview";
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const detailPlayer = detailPlayerId
    ? getPlayer(career.lckPlayers, detailPlayerId)
    : undefined;

  return (
    <section className="stack offseason-page">
      {activeSubPage === "overview" && <ClosedMarketOverviewPanel career={career} />}
      {activeSubPage === "free-agents" && (
        <ClosedMarketFreeAgentPanel
          career={career}
          onViewPlayer={(player) => setDetailPlayerId(player.id)}
        />
      )}
      {activeSubPage === "schedule" && <ClosedMarketSchedulePanel />}
      {activeSubPage === "log" && <ClosedMarketLogPanel career={career} />}
      {detailPlayer && (
        <PlayerDetailModal
          extraContent={<OffseasonPlayerMarketDetails player={detailPlayer} />}
          onClose={() => setDetailPlayerId(null)}
          player={detailPlayer}
          rosterLabel={getRosterTierLabel(detailPlayer)}
          titlePrefix="Stove League Profile"
        />
      )}
    </section>
  );
}

export function OffseasonMarket({
  career,
  subPage,
  onCancelFreeAgentSigning,
  onConfirmFreeAgentSigning,
  onReleaseExpiredPlayer,
  onSubmitFreeAgentOffer,
  onSubmitRenewalOffer,
  onSubPageChange,
  onViewRoster,
}: OffseasonMarketProps) {
  const [fallbackActiveTab, setFallbackActiveTab] =
    useState<OffseasonTab>("contracts");
  const [negotiationTarget, setNegotiationTarget] =
    useState<NegotiationTarget | null>(null);
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const offseason = career.seasonState.offseason;
  const validationErrors = offseason?.validationErrors ?? [];
  const marketViewStatus = getOffseasonMarketViewStatus(career);
  const activeTab = subPage
    ? getOffseasonTabFromSubPage(subPage)
    : fallbackActiveTab;
  const detailPlayer = detailPlayerId
    ? getPlayer(career.lckPlayers, detailPlayerId)
    : undefined;

  const activePanel = useMemo(() => {
    if (activeTab === "contracts") {
      return (
        <ContractTab
          career={career}
          onOpenNegotiation={setNegotiationTarget}
          onReleaseExpiredPlayer={onReleaseExpiredPlayer}
          onViewPlayer={(player) => setDetailPlayerId(player.id)}
        />
      );
    }

    if (activeTab === "free-agents") {
      return (
        <FreeAgentTab
          career={career}
          onCancelFreeAgentSigning={onCancelFreeAgentSigning}
          onConfirmFreeAgentSigning={onConfirmFreeAgentSigning}
          onOpenNegotiation={setNegotiationTarget}
          onViewPlayer={(player) => setDetailPlayerId(player.id)}
        />
      );
    }

    if (activeTab === "roster") {
      return <RosterTab career={career} onViewRoster={onViewRoster} />;
    }

    return <LogTab career={career} />;
  }, [
    activeTab,
    career,
    onCancelFreeAgentSigning,
    onConfirmFreeAgentSigning,
    onReleaseExpiredPlayer,
    onViewRoster,
  ]);

  if (marketViewStatus === "closed-info") {
    return <ClosedOffseasonInfo career={career} subPage={subPage} />;
  }

  return (
    <section className="stack offseason-page">
      <WeekTimeline career={career} />
      <OffseasonBudgetSummary career={career} />
      {validationErrors.length > 0 && (
        <div className="offseason-validation-box">
          {validationErrors.map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}
      <Card>
        <div className="offseason-tab-list">
          {tabs.map((tab) => (
            <button
              className={`offseason-tab ${
                activeTab === tab.id ? "offseason-tab-active" : ""
              }`}
              key={tab.id}
              onClick={() => {
                setFallbackActiveTab(tab.id);
                onSubPageChange?.(getOffseasonSubPageFromTab(tab.id));
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activePanel}
      </Card>
      {negotiationTarget && (
        <ContractOfferModal
          career={career}
          key={`${negotiationTarget.mode}-${negotiationTarget.playerId}`}
          onClose={() => setNegotiationTarget(null)}
          onSubmit={
            negotiationTarget.mode === "renewal"
              ? onSubmitRenewalOffer
              : onSubmitFreeAgentOffer
          }
          target={negotiationTarget}
        />
      )}
      {detailPlayer && (
        <PlayerDetailModal
          extraContent={<OffseasonPlayerMarketDetails player={detailPlayer} />}
          onClose={() => setDetailPlayerId(null)}
          player={detailPlayer}
          rosterLabel={getRosterTierLabel(detailPlayer)}
          titlePrefix="Stove League Profile"
        />
      )}
    </section>
  );
}
