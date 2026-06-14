import { useEffect, useMemo, useRef, useState } from "react";
import {
  getScrimDateOptions,
  getScrimOpponentOptions,
  getTodayAcceptedScrim,
  validateScrimRequest,
  type ScrimRequestInput,
} from "../../domain/scrim";
import { Button } from "../../shared/ui/Button";
import { TeamLogo } from "../../shared/ui/TeamLogo";
import type { CareerSave, ScrimSchedule } from "../../types/game";

type ScrimViewProps = {
  career: CareerSave;
  onRequestScrim: (request: ScrimRequestInput) => void;
  onRunTodayScrim: () => void;
};

const matchCounts = [1, 2, 3, 4, 5] as const;

function getStatusLabel(status: ScrimSchedule["status"]) {
  if (status === "pending") {
    return "응답 대기";
  }

  if (status === "accepted") {
    return "확정";
  }

  if (status === "completed") {
    return "완료";
  }

  return "거절";
}

function getChanceLabel(chance: number | undefined) {
  if (chance === undefined) {
    return "상대 선택 대기";
  }

  if (chance >= 80) {
    return "높음";
  }

  if (chance >= 65) {
    return "보통";
  }

  return "낮음";
}

export function ScrimView({
  career,
  onRequestScrim,
  onRunTodayScrim,
}: ScrimViewProps) {
  const runTimeoutRef = useRef<number | null>(null);
  const dateOptions = useMemo(() => getScrimDateOptions(career), [career]);
  const firstSelectableDate =
    dateOptions.find((option) => !option.isDisabled)?.dateKey ??
    dateOptions[0]?.dateKey ??
    "";
  const [selectedDateKey, setSelectedDateKey] = useState(firstSelectableDate);
  const [isDateListOpen, setIsDateListOpen] = useState(false);
  const opponentOptions = useMemo(
    () => getScrimOpponentOptions(career, selectedDateKey),
    [career, selectedDateKey],
  );
  const firstSelectableOpponent =
    opponentOptions.find((option) => !option.isDisabled)?.teamId ??
    opponentOptions[0]?.teamId ??
    "";
  const [selectedOpponentTeamId, setSelectedOpponentTeamId] = useState(
    firstSelectableOpponent,
  );
  const [matchCount, setMatchCount] = useState(3);
  const [isRunningScrim, setIsRunningScrim] = useState(false);
  const selectedDate = dateOptions.find(
    (option) => option.dateKey === selectedDateKey,
  );
  const selectedOpponent =
    opponentOptions.find((option) => option.teamId === selectedOpponentTeamId) ??
    opponentOptions.find((option) => !option.isDisabled);
  const selectedRequest = {
    scheduledDateKey: selectedDateKey,
    opponentTeamId: selectedOpponent?.teamId ?? "",
    matchCount,
  };
  const validation = validateScrimRequest(career, selectedRequest);
  const todayScrim = getTodayAcceptedScrim(career);
  const scrimState = career.seasonState.scrim;
  const requests = [...(scrimState?.requests ?? [])].sort((left, right) =>
    right.requestedDateKey.localeCompare(left.requestedDateKey),
  );
  const lastResult = requests.find(
    (request) => request.id === scrimState?.lastResultId,
  );

  useEffect(
    () => () => {
      if (runTimeoutRef.current !== null) {
        window.clearTimeout(runTimeoutRef.current);
      }
    },
    [],
  );

  const handleRunTodayScrim = () => {
    if (!todayScrim || isRunningScrim) {
      return;
    }

    setIsRunningScrim(true);
    runTimeoutRef.current = window.setTimeout(() => {
      runTimeoutRef.current = null;
      onRunTodayScrim();
      setIsRunningScrim(false);
    }, 1400);
  };

  return (
    <div className="strategy-panel scrim-view">
      <section className="strategy-plan-summary strategy-plan-summary-active scrim-progress-card">
        <div>
          <p className="eyebrow">스크림 진행</p>
          <h3>
            {todayScrim
              ? `${todayScrim.opponentTeamName} · ${todayScrim.matchCount}경기`
              : "오늘 진행 가능한 스크림 없음"}
          </h3>
          <p>
            스크림은 공식 경기 ELO를 바꾸지 않고 선발 선수의 경기력과 피로도에만
            소폭 반영됩니다.
          </p>
        </div>
        <Button
          disabled={!todayScrim || isRunningScrim}
          onClick={handleRunTodayScrim}
          variant="primary"
        >
          {isRunningScrim ? "진행중" : "스크림 진행"}
        </Button>
      </section>

      {lastResult?.resultSummary && (
        <section className="strategy-subsection scrim-result-card">
          <p className="eyebrow">최근 결과</p>
          <h3>{lastResult.opponentTeamName}</h3>
          <p>{lastResult.resultSummary}</p>
        </section>
      )}

      <section className="strategy-subsection">
        <div className="scrim-section-heading">
          <div>
            <p className="eyebrow">스크림 요청</p>
            <h3>날짜와 상대 선택</h3>
          </div>
          <span>요청 가능 범위: 1주일</span>
        </div>

        <div className="scrim-picker">
          <button
            className="scrim-date-field"
            onClick={() => setIsDateListOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span>선택 날짜</span>
            <strong>{selectedDate?.dateLabel ?? "날짜 선택"}</strong>
          </button>
          {isDateListOpen && (
            <div className="scrim-date-list">
              {dateOptions.map((option) => (
                <button
                  className={`scrim-date-option ${
                    option.dateKey === selectedDateKey
                      ? "scrim-date-option-active"
                      : ""
                  }`}
                  disabled={option.isDisabled}
                  key={option.dateKey}
                  onClick={() => {
                    setSelectedDateKey(option.dateKey);
                    setIsDateListOpen(false);
                  }}
                  type="button"
                >
                  <strong>{option.shortLabel}</strong>
                  <span>{option.dateLabel}</span>
                  {option.disabledReason && <small>{option.disabledReason}</small>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="option-grid option-grid-compact scrim-opponent-grid">
          {opponentOptions.map((option) => (
            <button
              className={`option-card ${
                option.teamId === selectedOpponent?.teamId
                  ? "option-card-active"
                  : ""
              }`}
              disabled={option.isDisabled}
              key={option.teamId}
              onClick={() => setSelectedOpponentTeamId(option.teamId)}
              type="button"
            >
              <span className="scrim-opponent-card-header">
                <TeamLogo
                  size="sm"
                  teamId={option.teamId}
                  teamName={option.teamName}
                />
                <span className="scrim-opponent-card-copy">
                  <strong>{option.shortName}</strong>
                  <span>{option.teamName}</span>
                </span>
              </span>
              <small>
                수락 가능성 {getChanceLabel(option.acceptanceChance)}
                {option.disabledReason ? ` · ${option.disabledReason}` : ""}
              </small>
            </button>
          ))}
        </div>

        <div className="scrim-match-counts" aria-label="스크림 경기 수">
          {matchCounts.map((count) => (
            <button
              className={count === matchCount ? "scrim-count-active" : ""}
              key={count}
              onClick={() => setMatchCount(count)}
              type="button"
            >
              {count}경기
            </button>
          ))}
        </div>

        <div className="scrim-request-footer">
          <p>
            예상 수락 가능성:{" "}
            <strong>{getChanceLabel(selectedOpponent?.acceptanceChance)}</strong>
          </p>
          {validation.errors.length > 0 && (
            <ul>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <Button
            disabled={!validation.isValid}
            onClick={() => onRequestScrim(selectedRequest)}
            variant="primary"
          >
            스크림 요청
          </Button>
        </div>
      </section>

      <section className="strategy-subsection">
        <div className="scrim-section-heading">
          <div>
            <p className="eyebrow">스크림 일정</p>
            <h3>요청 및 확정 현황</h3>
          </div>
          <span>{requests.length}건</span>
        </div>
        {requests.length === 0 ? (
          <p className="empty-copy">아직 요청한 스크림이 없습니다.</p>
        ) : (
          <div className="scrim-schedule-list">
            {requests.map((request) => (
              <article
                className={`scrim-schedule-item scrim-schedule-item-${request.status}`}
                key={request.id}
              >
                <div>
                  <strong>{request.opponentTeamName}</strong>
                  <span>
                    {request.scheduledDateLabel} · {request.matchCount}경기
                  </span>
                </div>
                <b>{getStatusLabel(request.status)}</b>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
