import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { Player, Role, SeasonProgressStatus, Team } from "../../types/game";
import { getMoraleLabel } from "../../domain/player-status";
import {
  formatSeasonDateLabel,
  isLineupEditableDate,
} from "../../domain/season/seasonScheduleDates";
import { formatSalaryAmount } from "../../shared/format/money";
import { EvaluationStars } from "../../shared/ui/EvaluationStars";
import { MoraleIndicator } from "../../shared/ui/MoraleIndicator";
import { PlayerDetailModal } from "../../shared/ui/PlayerDetailModal";
import { PlayerPortrait } from "../../shared/ui/PlayerPortrait";

type RosterSubPage = "main" | "academy" | "contracts";

type SeasonRosterManagerProps = {
  players: Player[];
  team: Team;
  currentDateKey: string;
  forceEditable?: boolean;
  progressStatus: SeasonProgressStatus;
  subPage?: RosterSubPage | null;
  onCallUpPlayer: (playerId: string) => void;
  onSendDownPlayer: (playerId: string) => void;
  onSetStarter: (role: Role, player: Player) => void;
};

const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];
const roleLabels: Record<Role, string> = {
  top: "탑",
  jungle: "정글",
  mid: "미드",
  bot: "원딜",
  support: "서폿",
};

function uniqueIds(playerIds: Array<string | undefined>) {
  return [...new Set(playerIds.filter((playerId): playerId is string => Boolean(playerId)))];
}

function sortRosterPlayers(left: Player, right: Player) {
  const roleDiff = roleOrder.indexOf(left.role) - roleOrder.indexOf(right.role);

  if (roleDiff !== 0) {
    return roleDiff;
  }

  return right.overall - left.overall || left.name.localeCompare(right.name);
}

function getActiveContractedPlayerIds(team: Team, players: Player[]) {
  const availablePlayerIds = new Set(
    players
      .filter((player) => player.availableForRoster)
      .map((player) => player.id),
  );

  return new Set(
    team.contracts
      .filter(
        (contract) =>
          contract.remainingYears > 0 && availablePlayerIds.has(contract.playerId),
      )
      .map((contract) => contract.playerId),
  );
}

function getActiveContractSalaryTotal(team: Team) {
  return team.contracts
    .filter((contract) => contract.remainingYears > 0)
    .reduce((total, contract) => total + contract.salary, 0);
}

function getRosterBuckets(team: Team, players: Player[]) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const activeContractIds = getActiveContractedPlayerIds(team, players);
  const starterIdsByRole = Object.fromEntries(
    roleOrder.map((role) => {
      const playerId = team.roster[role];

      return [
        role,
        playerId && activeContractIds.has(playerId) ? playerId : undefined,
      ];
    }),
  ) as Partial<Record<Role, string>>;
  const starterIds = new Set(uniqueIds(Object.values(starterIdsByRole)));
  const mainRosterIds = uniqueIds([
    ...team.mainRosterPlayerIds,
    ...Object.values(starterIdsByRole),
  ]).filter((playerId) => activeContractIds.has(playerId));
  const mainRosterSet = new Set(mainRosterIds);
  const academyRosterIds = uniqueIds(team.academyRosterPlayerIds).filter(
    (playerId) => activeContractIds.has(playerId) && !mainRosterSet.has(playerId),
  );
  const assignedRosterIds = new Set([...mainRosterIds, ...academyRosterIds]);

  activeContractIds.forEach((playerId) => {
    if (assignedRosterIds.has(playerId)) {
      return;
    }

    const player = playerById.get(playerId);

    if (player?.rosterTier === "academy") {
      academyRosterIds.push(playerId);
      assignedRosterIds.add(playerId);
      return;
    }

    mainRosterIds.push(playerId);
    mainRosterSet.add(playerId);
    assignedRosterIds.add(playerId);
  });

  const mainRosterPlayers = mainRosterIds
    .map((playerId) => playerById.get(playerId))
    .filter((player): player is Player => Boolean(player))
    .sort(sortRosterPlayers);
  const academyRosterPlayers = academyRosterIds
    .map((playerId) => playerById.get(playerId))
    .filter((player): player is Player => Boolean(player))
    .sort(sortRosterPlayers);
  const starterPlayers = Object.fromEntries(
    roleOrder.map((role) => [
      role,
      starterIdsByRole[role] ? playerById.get(starterIdsByRole[role] ?? "") : undefined,
    ]),
  ) as Partial<Record<Role, Player | undefined>>;
  const mainBenchPlayers = mainRosterPlayers.filter(
    (player) => !starterIds.has(player.id),
  );

  return {
    academyRosterPlayers,
    mainBenchPlayers,
    mainRosterPlayers,
    starterIds,
    starterPlayers,
  };
}

function getProgressHint(progressStatus: SeasonProgressStatus, currentDateKey: string) {
  if (!isLineupEditableDate(currentDateKey)) {
    return `${formatSeasonDateLabel(currentDateKey)}은 선발 변경 잠금일입니다. 선발 교체는 월요일과 화요일에만 가능합니다.`;
  }

  if (progressStatus === "match-preview") {
    return "경기 주간 준비일입니다. 선발 변경은 다음 우리 팀 경기부터 반영됩니다.";
  }

  if (progressStatus === "match-review") {
    return "경기 리뷰 상태입니다. 선발 변경은 다음 경기부터 반영됩니다.";
  }

  return "선발 변경 가능일입니다. 1군 후보 카드를 같은 포지션 선발 슬롯으로 드롭하면 즉시 반영됩니다.";
}

function getForcedEditableHint(progressStatus: SeasonProgressStatus) {
  if (progressStatus === "match-preview") {
    return "경기 주간 준비일입니다. 선발 변경은 다음 우리 팀 경기부터 반영됩니다.";
  }

  if (progressStatus === "match-review") {
    return "경기 리뷰 상태입니다. 선발 변경은 다음 경기부터 반영됩니다.";
  }

  return "프리시즌 스토브리그 기간입니다. 계약이 확정된 선수는 언제든 1군/2군 이동과 선발 조정이 가능합니다.";
}

function isRosterCardActionTarget(event: SyntheticEvent<HTMLElement>) {
  const target = event.target;

  return (
    target instanceof HTMLElement &&
    event.currentTarget.contains(target) &&
    Boolean(target.closest("[data-roster-card-action]"))
  );
}

function StarterSlot({
  player,
  role,
  onViewDetail,
}: {
  player: Player | undefined;
  role: Role;
  onViewDetail: (player: Player) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `starter-slot-${role}`,
    data: { role },
  });

  return (
    <article
      className={`lineup-slot ${isOver ? "lineup-slot-over" : ""}`}
      ref={setNodeRef}
    >
      <div className="lineup-slot-header">
        <strong>{roleLabels[role]}</strong>
        <span>선발 슬롯</span>
      </div>
      {player ? (
        <RosterPlayerCard
          action={{
            disabled: true,
            label: "선발 잠김",
            onClick: () => undefined,
            title: "현재 선발 선수는 먼저 같은 포지션 1군 후보로 교체해야 2군으로 내릴 수 있습니다.",
          }}
          compact
          onViewDetail={onViewDetail}
          player={player}
          rosterLabel="1군 선발"
        />
      ) : (
        <div className="lineup-empty-slot">선발 없음</div>
      )}
    </article>
  );
}

function RosterPlayerCard({
  action,
  compact = false,
  draggable = false,
  overlay = false,
  onViewDetail,
  player,
  rosterLabel,
}: {
  action?: {
    disabled?: boolean;
    label: string;
    onClick: () => void;
    title?: string;
  };
  compact?: boolean;
  draggable?: boolean;
  overlay?: boolean;
  onViewDetail: (player: Player) => void;
  player: Player;
  rosterLabel: string;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `player-${player.id}`,
    data: { playerId: player.id, role: player.role },
    disabled: !draggable || overlay,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <article
      className={`roster-management-card ${
        compact ? "roster-management-card-compact" : ""
      } ${overlay ? "roster-management-card-overlay" : ""} ${
        draggable ? "roster-management-card-draggable" : "roster-management-card-static"
      } ${
        isDragging ? "roster-management-card-dragging" : ""
      }`}
      aria-label={`${player.name} 선수 상세 보기`}
      onClick={(event) => {
        if (!overlay && !isRosterCardActionTarget(event)) {
          onViewDetail(player);
        }
      }}
      ref={setNodeRef}
      style={style}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isRosterCardActionTarget(event)) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewDetail(player);
        }
      }}
    >
      <div className="roster-management-card-identity">
        <PlayerPortrait
          className="roster-management-card-portrait"
          player={player}
          size={compact ? "md" : "lg"}
        />
        <div className="roster-management-card-main">
          <strong>{player.name}</strong>
          <span>{roleLabels[player.role]} · {rosterLabel}</span>
        </div>
      </div>
      <div className="roster-management-card-meta">
        <EvaluationStars player={player} />
      </div>
      <div className="roster-management-card-status-strip">
        <span>피로 {player.status.fatigue}</span>
        <span>컨디션 {player.status.condition}</span>
        <span className="card-morale-cell">
          <MoraleIndicator level={player.status.morale} />
          {getMoraleLabel(player.status.morale)}
        </span>
      </div>
      {action && !overlay && (
        <button
          className="button button-ghost roster-card-action-button"
          data-roster-card-action
          disabled={action.disabled}
          onClick={(event) => {
            event.stopPropagation();
            action.onClick();
          }}
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerDownCapture={(event) => event.stopPropagation()}
          title={action.title}
          type="button"
        >
          {action.label}
        </button>
      )}
    </article>
  );
}

function EmptyRosterNotice({ message }: { message: string }) {
  return <div className="lineup-empty-slot roster-empty-notice">{message}</div>;
}

function RosterMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "danger";
}) {
  return (
    <article className={`roster-management-metric roster-management-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RosterBudgetSummary({ team }: { team: Team }) {
  const salaryTotal = getActiveContractSalaryTotal(team);
  const remainingBudget = team.budget - salaryTotal;
  const isOverBudget = remainingBudget < 0;

  return (
    <section
      aria-label="로스터 예산 요약"
      className="roster-management-budget-panel"
    >
      <RosterMetric label="총 예산" value={formatSalaryAmount(team.budget)} />
      <RosterMetric label="연봉 총액" value={formatSalaryAmount(salaryTotal)} />
      <RosterMetric
        label="잔여 예산"
        tone={isOverBudget ? "danger" : "good"}
        value={formatSalaryAmount(remainingBudget)}
      />
      <RosterMetric
        label="예산 상태"
        tone={isOverBudget ? "danger" : "good"}
        value={isOverBudget ? "초과" : "정상"}
      />
    </section>
  );
}

function AcademyRosterView({
  academyPlayers,
  onCallUpPlayer,
  onViewDetail,
}: {
  academyPlayers: Player[];
  onCallUpPlayer: (player: Player) => void;
  onViewDetail: (player: Player) => void;
}) {
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return academyPlayers.filter((player) => {
      const matchesRole = roleFilter === "all" || player.role === roleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        player.name.toLowerCase().includes(normalizedSearch) ||
        (player.realName?.toLowerCase().includes(normalizedSearch) ?? false);

      return matchesRole && matchesSearch;
    });
  }, [academyPlayers, roleFilter, searchQuery]);

  return (
    <section className="bench-board">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Academy roster</p>
          <h2>2군 로스터</h2>
        </div>
        <span className="panel-note">콜업은 즉시 1군 후보 등록으로 반영됩니다.</span>
      </div>
      <div className="roster-management-filter-row">
        <label>
          <span>검색</span>
          <input
            aria-label="2군 선수 검색"
            placeholder="선수명"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <label>
          <span>포지션</span>
          <select
            aria-label="2군 포지션 필터"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | "all")}
          >
            <option value="all">전체</option>
            {roleOrder.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <strong>{filteredPlayers.length}명</strong>
      </div>
      <div className="bench-player-grid roster-management-wide-grid">
        {filteredPlayers.map((player) => (
          <RosterPlayerCard
            action={{
              label: "1군 콜업",
              onClick: () => onCallUpPlayer(player),
            }}
            compact
            key={player.id}
            onViewDetail={onViewDetail}
            player={player}
            rosterLabel="2군"
          />
        ))}
        {filteredPlayers.length === 0 && (
          <EmptyRosterNotice message="조건에 맞는 2군 선수가 없습니다." />
        )}
      </div>
    </section>
  );
}

function ContractsView({
  academyCount,
  mainCount,
  onViewDetail,
  players,
  starterCount,
  team,
}: {
  academyCount: number;
  mainCount: number;
  onViewDetail: (player: Player) => void;
  players: Player[];
  starterCount: number;
  team: Team;
}) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const mainRosterSet = new Set(team.mainRosterPlayerIds);
  const academyRosterSet = new Set(team.academyRosterPlayerIds);
  const starterSet = new Set(Object.values(team.roster));
  const activeContracts = team.contracts
    .filter((contract) => contract.remainingYears > 0)
    .sort((left, right) => {
      const leftPlayer = playerById.get(left.playerId);
      const rightPlayer = playerById.get(right.playerId);

      return (
        roleOrder.indexOf(leftPlayer?.role ?? "support") -
          roleOrder.indexOf(rightPlayer?.role ?? "support") ||
        (rightPlayer?.overall ?? 0) - (leftPlayer?.overall ?? 0)
      );
    });
  const salaryTotal = getActiveContractSalaryTotal(team);

  return (
    <section className="bench-board">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">Contracts</p>
          <h2>계약 현황</h2>
        </div>
        <span className="panel-note">1 = 1천만원 기준의 게임 내 금액입니다.</span>
      </div>
      <div className="roster-management-metrics">
        <RosterMetric label="선발" value={`${starterCount}/5`} />
        <RosterMetric label="1군 등록" value={`${mainCount}명`} />
        <RosterMetric label="2군 등록" value={`${academyCount}명`} />
        <RosterMetric
          label="연봉 총액"
          value={`${formatSalaryAmount(salaryTotal)} / ${formatSalaryAmount(team.budget)}`}
        />
      </div>
      <div className="roster-contract-table">
        <div className="roster-contract-table-header">
          <span>선수</span>
          <span>소속</span>
          <span>계약</span>
          <span>연봉</span>
        </div>
        {activeContracts.map((contract) => {
          const player = playerById.get(contract.playerId);

          if (!player) {
            return null;
          }

          const rosterLabel = starterSet.has(player.id)
            ? "1군 선발"
            : mainRosterSet.has(player.id)
              ? "1군 후보"
              : academyRosterSet.has(player.id)
                ? "2군"
                : "미배정";

          return (
            <button
              aria-label={`${player.name} 계약 상세 보기`}
              className="roster-contract-row"
              key={contract.playerId}
              onClick={() => onViewDetail(player)}
              type="button"
            >
              <span>
                <strong>{player.name}</strong>
                <small>{roleLabels[player.role]} · 평가 기반 공개 정보</small>
              </span>
              <span>{rosterLabel}</span>
              <span>
                {contract.remainingYears}년 잔여 · {contract.type}
              </span>
              <span>{formatSalaryAmount(contract.salary)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SeasonRosterManager({
  currentDateKey,
  forceEditable = false,
  players,
  progressStatus,
  subPage = "main",
  team,
  onCallUpPlayer,
  onSendDownPlayer,
  onSetStarter,
}: SeasonRosterManagerProps) {
  const canEditLineup = forceEditable || isLineupEditableDate(currentDateKey);
  const activeSubPage = subPage ?? "main";
  const [message, setMessage] = useState(
    forceEditable
      ? getForcedEditableHint(progressStatus)
      : getProgressHint(progressStatus, currentDateKey),
  );
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [activeDragPlayerId, setActiveDragPlayerId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const {
    academyRosterPlayers,
    mainBenchPlayers,
    mainRosterPlayers,
    starterIds,
    starterPlayers,
  } = useMemo(() => getRosterBuckets(team, players), [players, team]);
  const playerById = useMemo(
    () => new Map(mainRosterPlayers.map((player) => [player.id, player])),
    [mainRosterPlayers],
  );
  const activeDragPlayer = activeDragPlayerId
    ? playerById.get(activeDragPlayerId)
    : undefined;
  const detailRosterLabel = detailPlayer
    ? starterIds.has(detailPlayer.id)
      ? "1군 선발"
      : mainRosterPlayers.some((player) => player.id === detailPlayer.id)
        ? "1군 후보"
        : academyRosterPlayers.some((player) => player.id === detailPlayer.id)
          ? "2군"
          : undefined
    : undefined;

  useEffect(() => {
    setMessage(
      forceEditable
        ? getForcedEditableHint(progressStatus)
        : getProgressHint(progressStatus, currentDateKey),
    );
  }, [currentDateKey, forceEditable, progressStatus]);

  function handleDragStart(event: DragStartEvent) {
    if (!canEditLineup) {
      setMessage(
        `${formatSeasonDateLabel(currentDateKey)}에는 선발을 바꿀 수 없습니다. 월/화에 조정해 주세요.`,
      );
      return;
    }

    const playerId = event.active.data.current?.playerId as string | undefined;

    setActiveDragPlayerId(playerId ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragPlayerId(null);

    const playerId = event.active.data.current?.playerId as string | undefined;
    const playerRole = event.active.data.current?.role as Role | undefined;
    const targetRole = event.over?.data.current?.role as Role | undefined;

    if (!canEditLineup) {
      setMessage(
        `${formatSeasonDateLabel(currentDateKey)}에는 선발을 바꿀 수 없습니다. 월/화에 조정해 주세요.`,
      );
      return;
    }

    if (!playerId || !playerRole || !targetRole) {
      return;
    }

    const player = playerById.get(playerId);

    if (!player) {
      return;
    }

    if (playerRole !== targetRole) {
      setMessage(
        `${player.name}은 ${roleLabels[playerRole]} 포지션입니다. 1차 구현에서는 같은 포지션 슬롯에만 배치할 수 있습니다.`,
      );
      return;
    }

    if (team.roster[targetRole] === player.id) {
      setMessage(`${player.name}은 이미 ${roleLabels[targetRole]} 선발입니다.`);
      return;
    }

    onSetStarter(targetRole, player);
    setMessage(
      `${player.name}을 ${roleLabels[targetRole]} 선발로 등록했습니다. 기존 선발은 1군 후보로 유지됩니다.`,
    );
  }

  function handleCallUp(player: Player) {
    onCallUpPlayer(player.id);
    setMessage(`${player.name}을 1군 후보로 콜업했습니다.`);
  }

  function handleSendDown(player: Player) {
    if (starterIds.has(player.id)) {
      setMessage(`${player.name}은 현재 선발입니다. 선발 교체 후 2군으로 내릴 수 있습니다.`);
      return;
    }

    onSendDownPlayer(player.id);
    setMessage(`${player.name}을 2군으로 콜다운했습니다.`);
  }

  return (
    <section className="season-roster-manager">
      <header className="roster-management-header">
        <div>
          <p className="eyebrow">Roster management</p>
          <h1>
            {activeSubPage === "academy"
              ? "2군 로스터"
              : activeSubPage === "contracts"
                ? "계약 현황"
                : "1군 로스터"}
          </h1>
          <p className="lede">
            선발 5인, 1군 후보, 2군 인원을 분리해 관리합니다.
          </p>
        </div>
        <div className="roster-management-status">
          <strong>
            1군 {mainRosterPlayers.length}명 · 2군 {academyRosterPlayers.length}명
          </strong>
          <span>{message}</span>
        </div>
      </header>

      {activeSubPage === "contracts" ? (
        <>
          <RosterBudgetSummary team={team} />
          <ContractsView
            academyCount={academyRosterPlayers.length}
            mainCount={mainRosterPlayers.length}
            onViewDetail={setDetailPlayer}
            players={players}
            starterCount={starterIds.size}
            team={team}
          />
        </>
      ) : activeSubPage === "academy" ? (
        <>
          <RosterBudgetSummary team={team} />
          <AcademyRosterView
            academyPlayers={academyRosterPlayers}
            onCallUpPlayer={handleCallUp}
            onViewDetail={setDetailPlayer}
          />
        </>
      ) : (
        <>
          <RosterBudgetSummary team={team} />
          <DndContext
            sensors={sensors}
            onDragCancel={() => setActiveDragPlayerId(null)}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <section className="lineup-board">
              {roleOrder.map((role) => (
                <StarterSlot
                  key={role}
                  onViewDetail={setDetailPlayer}
                  player={starterPlayers[role]}
                  role={role}
                />
              ))}
            </section>

            <section className="bench-board">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Main roster bench</p>
                  <h2>1군 후보</h2>
                </div>
                <span className="panel-note">
                  후보 카드는 선발 슬롯으로 드래그하거나 2군으로 내릴 수 있습니다.
                </span>
              </div>
              <div className="bench-player-grid roster-management-main-bench-grid">
                {mainBenchPlayers.map((player) => (
                  <RosterPlayerCard
                    action={{
                      label: "2군으로",
                      onClick: () => handleSendDown(player),
                    }}
                    compact
                    draggable={canEditLineup}
                    key={player.id}
                    onViewDetail={setDetailPlayer}
                    player={player}
                    rosterLabel="1군 후보"
                  />
                ))}
                {mainBenchPlayers.length === 0 && (
                  <EmptyRosterNotice message="1군 후보가 없습니다. 2군 화면에서 선수를 콜업할 수 있습니다." />
                )}
              </div>
            </section>
            <DragOverlay className="roster-drag-overlay" dropAnimation={null}>
              {activeDragPlayer ? (
                <RosterPlayerCard
                  compact
                  draggable={false}
                  onViewDetail={setDetailPlayer}
                  overlay
                  player={activeDragPlayer}
                  rosterLabel="1군 후보"
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          onClose={() => setDetailPlayer(null)}
          rosterLabel={detailRosterLabel}
          titlePrefix="Roster Profile"
        />
      )}
    </section>
  );
}
