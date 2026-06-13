import { useState } from "react";
import { formatSalaryAmount } from "../../shared/format/money";
import type { CareerSave } from "../../types/game";
import {
  getOfferStatusLabel,
  getPlayer,
  getRequestedRosterRoleLabel,
  logMatchesTeamFilter,
  logTeamFilterOptions,
  offerMatchesTeamFilter,
  type OffseasonLogTeamFilter,
} from "./offseasonMarketShared";

export function OffseasonLogTeamSelect({
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

export function LogTab({ career }: { career: CareerSave }) {
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
        <span>제안과 구단 경쟁 결과가 이곳에 쌓입니다.</span>
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
