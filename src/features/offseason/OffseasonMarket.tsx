import { useMemo, useState } from "react";
import {
  getOffseasonContractDemand,
  getUnresolvedExpiredPlayerIds,
  validateOffseasonRoster,
  type OffseasonContractOfferInput,
} from "../../domain/season";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import type { CareerSave, ContractType, Player } from "../../types/game";

type OffseasonMarketProps = {
  career: CareerSave;
  onReleaseExpiredPlayer: (playerId: string) => void;
  onSubmitFreeAgentOffer: (offer: OffseasonContractOfferInput) => void;
  onSubmitRenewalOffer: (offer: OffseasonContractOfferInput) => void;
  onViewRoster: () => void;
};

type OffseasonTab = "contracts" | "free-agents" | "roster" | "log";

const contractOptions: Array<{ value: ContractType; label: string }> = [
  { value: "one-year", label: "1년" },
  { value: "two-year", label: "2년" },
  { value: "one-plus-one", label: "1+1년" },
];

const tabs: Array<{ id: OffseasonTab; label: string }> = [
  { id: "contracts", label: "내 팀 계약" },
  { id: "free-agents", label: "FA 시장" },
  { id: "roster", label: "로스터 현황" },
  { id: "log", label: "이적 로그" },
];

function getPlayer(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId);
}

function getPlayerLabel(player: Player) {
  return `${player.role.toUpperCase()} · OVR ${player.overall} · POT ${player.potential} · ${player.age}세`;
}

function getDefaultSalary(player: Player, contractType: ContractType) {
  return getOffseasonContractDemand(player, contractType);
}

function useOfferInputs(players: Player[]) {
  const [contractTypes, setContractTypes] = useState<Record<string, ContractType>>(
    {},
  );
  const [salaryOffers, setSalaryOffers] = useState<Record<string, number>>({});

  function getContractType(playerId: string) {
    return contractTypes[playerId] ?? "one-year";
  }

  function getSalaryOffer(player: Player) {
    const contractType = getContractType(player.id);

    return salaryOffers[player.id] ?? getDefaultSalary(player, contractType);
  }

  function setContractType(playerId: string, contractType: ContractType) {
    setContractTypes((current) => ({
      ...current,
      [playerId]: contractType,
    }));
    const player = getPlayer(players, playerId);

    if (player) {
      setSalaryOffers((current) => ({
        ...current,
        [playerId]: current[playerId] ?? getDefaultSalary(player, contractType),
      }));
    }
  }

  function setSalaryOffer(playerId: string, salaryOffer: number) {
    setSalaryOffers((current) => ({
      ...current,
      [playerId]: salaryOffer,
    }));
  }

  return {
    getContractType,
    getSalaryOffer,
    setContractType,
    setSalaryOffer,
  };
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

function ContractTab({
  career,
  offerInputs,
  onReleaseExpiredPlayer,
  onSubmitRenewalOffer,
}: {
  career: CareerSave;
  offerInputs: ReturnType<typeof useOfferInputs>;
  onReleaseExpiredPlayer: (playerId: string) => void;
  onSubmitRenewalOffer: (offer: OffseasonContractOfferInput) => void;
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
        const contractType = offerInputs.getContractType(player.id);
        const salaryOffer = offerInputs.getSalaryOffer(player);
        const demand = getOffseasonContractDemand(player, contractType);
        const resolved = !unresolvedIds.has(player.id);

        return (
          <article className="offseason-player-row" key={player.id}>
            <div className="offseason-player-main">
              <strong>{player.name}</strong>
              <span>{getPlayerLabel(player)}</span>
              <small>요구액 {demand} · 수락 기준 {Math.ceil(demand * 0.9)}</small>
            </div>
            {resolved ? (
              <strong className="offseason-status-label">처리 완료</strong>
            ) : (
              <div className="offseason-offer-controls">
                <select
                  value={contractType}
                  onChange={(event) =>
                    offerInputs.setContractType(
                      player.id,
                      event.target.value as ContractType,
                    )
                  }
                >
                  {contractOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  min={0}
                  step={5}
                  type="number"
                  value={salaryOffer}
                  onChange={(event) =>
                    offerInputs.setSalaryOffer(player.id, Number(event.target.value))
                  }
                />
                <Button
                  onClick={() =>
                    onSubmitRenewalOffer({
                      playerId: player.id,
                      contractType,
                      salaryOffer,
                    })
                  }
                >
                  제안
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

function FreeAgentTab({
  career,
  offerInputs,
  onSubmitFreeAgentOffer,
}: {
  career: CareerSave;
  offerInputs: ReturnType<typeof useOfferInputs>;
  onSubmitFreeAgentOffer: (offer: OffseasonContractOfferInput) => void;
}) {
  const offseason = career.seasonState.offseason;
  const currentDay = offseason?.currentDay ?? 1;
  const canOffer = currentDay >= 8 && currentDay < 28;
  const pendingPlayerIds = new Set(
    (offseason?.pendingOffers ?? [])
      .filter((offer) => offer.status === "pending")
      .flatMap((offer) => offer.playerIds),
  );
  const freeAgents = (offseason?.freeAgentPlayerIds ?? [])
    .map((playerId) => getPlayer(career.lckPlayers, playerId))
    .filter((player): player is Player => Boolean(player))
    .sort((left, right) => right.overall - left.overall);

  if (freeAgents.length === 0) {
    return (
      <div className="offseason-empty">
        <strong>FA 시장에 남은 선수가 없습니다.</strong>
        <span>이적 로그와 최종 로스터를 확인하세요.</span>
      </div>
    );
  }

  return (
    <div className="offseason-list">
      {!canOffer && (
        <p className="muted">
          FA 제안은 2주차부터 4주차 27일차까지 가능합니다. 28일차에는 최종
          등록만 진행됩니다.
        </p>
      )}
      {freeAgents.map((player) => {
        const contractType = offerInputs.getContractType(player.id);
        const salaryOffer = offerInputs.getSalaryOffer(player);
        const demand = getOffseasonContractDemand(player, contractType);
        const isPending = pendingPlayerIds.has(player.id);

        return (
          <article className="offseason-player-row" key={player.id}>
            <div className="offseason-player-main">
              <strong>{player.name}</strong>
              <span>{getPlayerLabel(player)}</span>
              <small>요구액 {demand} · 현재 FA</small>
            </div>
            <div className="offseason-offer-controls">
              <select
                disabled={!canOffer || isPending}
                value={contractType}
                onChange={(event) =>
                  offerInputs.setContractType(
                    player.id,
                    event.target.value as ContractType,
                  )
                }
              >
                {contractOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                disabled={!canOffer || isPending}
                min={0}
                step={5}
                type="number"
                value={salaryOffer}
                onChange={(event) =>
                  offerInputs.setSalaryOffer(player.id, Number(event.target.value))
                }
              />
              <Button
                disabled={!canOffer || isPending}
                onClick={() =>
                  onSubmitFreeAgentOffer({
                    playerId: player.id,
                    contractType,
                    salaryOffer,
                  })
                }
              >
                {isPending ? "제안 대기" : "FA 제안"}
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
    .map((contract) => getPlayer(career.lckPlayers, contract.playerId))
    .filter((player): player is Player => Boolean(player));

  return (
    <div className="offseason-roster-panel">
      <div className="season-summary-metrics">
        <article className="season-summary-metric">
          <span>계약 선수</span>
          <strong>{validation.contractedPlayerIds.length}명</strong>
          <small>최소 10명 / 최대 15명</small>
        </article>
        <article className="season-summary-metric">
          <span>연봉 총액</span>
          <strong>
            {validation.yearlySalary} / {career.userTeam.budget}
          </strong>
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

function LogTab({ career }: { career: CareerSave }) {
  const logs = [...(career.seasonState.offseason?.logEntries ?? [])].reverse();
  const offers = [...(career.seasonState.offseason?.resolvedOffers ?? [])]
    .reverse()
    .slice(0, 8);

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
      <div className="offseason-log-list">
        {logs.map((log) => (
          <article className={`offseason-log-entry offseason-log-${log.type}`} key={log.id}>
            <span>
              {log.week}주차 {log.day}일
            </span>
            <strong>{log.message}</strong>
          </article>
        ))}
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
                {offer.fromTeamName} · {offer.status}
              </strong>
              <span>
                {playerNames} · {offer.salaryOffer}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function OffseasonMarket({
  career,
  onReleaseExpiredPlayer,
  onSubmitFreeAgentOffer,
  onSubmitRenewalOffer,
  onViewRoster,
}: OffseasonMarketProps) {
  const [activeTab, setActiveTab] = useState<OffseasonTab>("contracts");
  const offerInputs = useOfferInputs(career.lckPlayers);
  const offseason = career.seasonState.offseason;
  const validationErrors = offseason?.validationErrors ?? [];

  const activePanel = useMemo(() => {
    if (activeTab === "contracts") {
      return (
        <ContractTab
          career={career}
          offerInputs={offerInputs}
          onReleaseExpiredPlayer={onReleaseExpiredPlayer}
          onSubmitRenewalOffer={onSubmitRenewalOffer}
        />
      );
    }

    if (activeTab === "free-agents") {
      return (
        <FreeAgentTab
          career={career}
          offerInputs={offerInputs}
          onSubmitFreeAgentOffer={onSubmitFreeAgentOffer}
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
    offerInputs,
    onReleaseExpiredPlayer,
    onSubmitFreeAgentOffer,
    onSubmitRenewalOffer,
    onViewRoster,
  ]);

  if (career.seasonState.phase !== "offseason" || offseason?.status !== "active") {
    return (
      <section className="stack offseason-page">
        <Card>
          <div className="offseason-empty">
            <strong>진행 중인 스토브리그가 없습니다.</strong>
            <span>시즌 요약 화면에서 스토브리그에 진입하세요.</span>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="stack offseason-page">
      <WeekTimeline career={career} />
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
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activePanel}
      </Card>
    </section>
  );
}
