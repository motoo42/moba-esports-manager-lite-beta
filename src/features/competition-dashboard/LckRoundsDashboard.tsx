import { useState } from "react";
import type { CompetitionSubPage } from "../../app/routes";
import {
  getLckRounds12Finalists,
  getLckRounds34GroupLabel,
  isLckRounds12PlayoffStageName,
  lckRounds12PlayoffMatchIds,
  lckRounds12PlayoffStageNames,
} from "../../domain/season";
import type {
  CareerSave,
  CompetitionState,
  MatchRecord,
  MatchSchedule,
  StandingEntry,
} from "../../types/game";
import {
  CompetitionFormatSummary,
  TeamNameCell,
  compareStandingEntries,
  getDateLabel,
  getFormatLabel,
  getLckRoundsFormatTitle,
  getMatchCount,
  getMatchTitle,
  getNextUserMatch,
  getRecentUserRecord,
  getRecordByScheduleId,
  getScheduleStatusClass,
  getScoreLabel,
  getSetDiff,
  getStatusText,
  getUserResultLabel,
  groupMatchesByDate,
  isLckRounds34Competition,
  isLckRounds35Competition,
  isLateLckRoundsCompetition,
} from "./competitionDashboardShared";
import { CompetitionBracket, type CompetitionBracketColumn } from "./competitionBracket";
import { LckRounds34PostseasonPathView } from "./LckRoundsPostseasonPath";
import {
  createSlotFromMatchSide,
  createWinnerSlot,
  getPlayoffMatch,
  toCompetitionBracketMatch,
  type LckPlayoffMatch,
  type LckPlayoffSlot,
} from "./lckDashboardShared";

type LckRoundsDashboardTab = "standings" | "schedule" | "tournament";
function isLckRoundsDashboardTab(
  value: CompetitionSubPage | null | undefined,
): value is LckRoundsDashboardTab {
  return value === "standings" || value === "schedule" || value === "tournament";
}
function getRemainingSeriesByTeamId(competition: CompetitionState) {
  const remainingSeriesByTeamId = new Map(
    competition.standings.map((entry) => [entry.teamId, 0]),
  );

  competition.schedule.forEach((match) => {
    if (match.status !== "scheduled") {
      return;
    }

    remainingSeriesByTeamId.set(
      match.blueTeamId,
      (remainingSeriesByTeamId.get(match.blueTeamId) ?? 0) + 1,
    );
    remainingSeriesByTeamId.set(
      match.redTeamId,
      (remainingSeriesByTeamId.get(match.redTeamId) ?? 0) + 1,
    );
  });

  return remainingSeriesByTeamId;
}

function getPlayoffClinchedTeamIds(competition: CompetitionState, playoffSlots = 6) {
  const hasPlayoffSchedule = competition.schedule.some((match) =>
    isLckRounds12PlayoffStageName(match.stageName),
  );

  if (hasPlayoffSchedule || competition.completed) {
    return new Set(
      [...competition.standings]
        .sort((left, right) => left.rank - right.rank)
        .slice(0, playoffSlots)
        .map((entry) => entry.teamId),
    );
  }

  if (competition.qualifiedTeamIds.length >= playoffSlots) {
    return new Set(competition.qualifiedTeamIds.slice(0, playoffSlots));
  }

  const remainingSeriesByTeamId = getRemainingSeriesByTeamId(competition);

  return new Set(
    competition.standings
      .filter((entry) => {
        const teamsThatCanStillReachEntry = competition.standings.filter(
          (otherEntry) => {
            if (otherEntry.teamId === entry.teamId) {
              return true;
            }

            const maxPossibleWins =
              otherEntry.wins +
              (remainingSeriesByTeamId.get(otherEntry.teamId) ?? 0);

            return maxPossibleWins >= entry.wins;
          },
        ).length;

        return teamsThatCanStillReachEntry <= playoffSlots;
      })
      .map((entry) => entry.teamId),
  );
}

function getLckRoundsSeedSlots(
  competition: CompetitionState,
  table: StandingEntry[],
) {
  const qualifierIds = competition.qualifiedTeamIds;
  const qualifierNames = competition.qualifiedTeamNames;
  const hasConfirmedSeeds = qualifierIds.length >= 6;

  return Array.from({ length: 6 }, (_, index) => {
    const seed = index + 1;

    if (hasConfirmedSeeds) {
      const teamId = qualifierIds[index];
      const tableEntry = table.find((entry) => entry.teamId === teamId);
      const teamName = tableEntry?.teamName ?? qualifierNames[index] ?? `LCK ${seed}위`;

      return {
        label: `${seed}번 시드`,
        teamId,
        teamName,
        detail: `LCK ${seed}위`,
        isPlaceholder: false,
      };
    }

    return {
      label: `LCK ${seed}위`,
      teamName: `LCK ${seed}위`,
      detail: "정규시즌 종료 후 확정",
      isPlaceholder: true,
    };
  });
}

function getLckRoundsStageLabel(stageName: string) {
  const labels: Record<string, string> = {
    [lckRounds12PlayoffStageNames.round1]: "플레이오프 1라운드",
    [lckRounds12PlayoffStageNames.semifinals]: "준결승",
    [lckRounds12PlayoffStageNames.final]: "결승",
  };

  return labels[stageName] ?? stageName;
}

function getLckRoundsPlayoffMatches({
  competition,
  records,
  table,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  table: StandingEntry[];
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const matchIds = lckRounds12PlayoffMatchIds;
  const seedSlots = getLckRoundsSeedSlots(competition, table);
  const round1Seed36 = getPlayoffMatch(
    competition,
    matchIds.round1Seed3VsSeed6,
  );
  const round1Seed45 = getPlayoffMatch(
    competition,
    matchIds.round1Seed4VsSeed5,
  );
  const semifinalSeed1 = getPlayoffMatch(
    competition,
    matchIds.semifinalSeed1VsSeed45,
  );
  const semifinalSeed2 = getPlayoffMatch(
    competition,
    matchIds.semifinalSeed2VsSeed36,
  );
  const final = getPlayoffMatch(competition, matchIds.final);

  return [
    {
      id: "round-1",
      title: "1라운드",
      matches: [
        {
          id: "r1-a",
          stageName: lckRounds12PlayoffStageNames.round1,
          title: "1라운드 A",
          subtitle: "BO5 · 3위 vs 6위",
          slots: round1Seed36
            ? [
                createSlotFromMatchSide({
                  label: "3번 시드",
                  match: round1Seed36,
                  record: recordsByScheduleId.get(round1Seed36.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "6번 시드",
                  match: round1Seed36,
                  record: recordsByScheduleId.get(round1Seed36.id),
                  side: "red",
                }),
              ]
            : [seedSlots[2], seedSlots[5]],
        },
        {
          id: "r1-b",
          stageName: lckRounds12PlayoffStageNames.round1,
          title: "1라운드 B",
          subtitle: "BO5 · 4위 vs 5위",
          slots: round1Seed45
            ? [
                createSlotFromMatchSide({
                  label: "4번 시드",
                  match: round1Seed45,
                  record: recordsByScheduleId.get(round1Seed45.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "5번 시드",
                  match: round1Seed45,
                  record: recordsByScheduleId.get(round1Seed45.id),
                  side: "red",
                }),
              ]
            : [seedSlots[3], seedSlots[4]],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "semifinals",
      title: "준결승",
      matches: [
        {
          id: "sf-a",
          stageName: lckRounds12PlayoffStageNames.semifinals,
          title: "준결승 A",
          subtitle: "BO5 · 1위 vs 4/5 승자",
          slots: semifinalSeed1
            ? [
                createSlotFromMatchSide({
                  label: "1번 시드",
                  match: semifinalSeed1,
                  record: recordsByScheduleId.get(semifinalSeed1.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "1라운드 B 승자",
                  match: semifinalSeed1,
                  record: recordsByScheduleId.get(semifinalSeed1.id),
                  side: "red",
                }),
              ]
            : [seedSlots[0], createWinnerSlot("1라운드 B 승자")],
        },
        {
          id: "sf-b",
          stageName: lckRounds12PlayoffStageNames.semifinals,
          title: "준결승 B",
          subtitle: "BO5 · 2위 vs 3/6 승자",
          slots: semifinalSeed2
            ? [
                createSlotFromMatchSide({
                  label: "2번 시드",
                  match: semifinalSeed2,
                  record: recordsByScheduleId.get(semifinalSeed2.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "1라운드 A 승자",
                  match: semifinalSeed2,
                  record: recordsByScheduleId.get(semifinalSeed2.id),
                  side: "red",
                }),
              ]
            : [seedSlots[1], createWinnerSlot("1라운드 A 승자")],
        },
      ] satisfies LckPlayoffMatch[],
    },
    {
      id: "final",
      title: "결승",
      matches: [
        {
          id: "final-a",
          stageName: lckRounds12PlayoffStageNames.final,
          title: "결승",
          subtitle: "BO5 · 우승 결정전",
          slots: final
            ? [
                createSlotFromMatchSide({
                  label: "준결승 A 승자",
                  match: final,
                  record: recordsByScheduleId.get(final.id),
                  side: "blue",
                }),
                createSlotFromMatchSide({
                  label: "준결승 B 승자",
                  match: final,
                  record: recordsByScheduleId.get(final.id),
                  side: "red",
                }),
              ]
            : [
                createWinnerSlot("준결승 A 승자"),
                createWinnerSlot("준결승 B 승자"),
              ],
        },
      ] satisfies LckPlayoffMatch[],
    },
  ];
}

function LckRoundsSummary({
  career,
  competition,
}: {
  career: CareerSave;
  competition: CompetitionState;
}) {
  const [showFormatRules, setShowFormatRules] = useState(false);

  return (
    <section className="competition-summary-grid competition-summary-grid-compact">
      <article className="competition-summary-card competition-summary-card-wide">
        <p className="eyebrow">대회</p>
        <h1>{competition.name}</h1>
        <span>{career.seasonState.currentDateLabel}</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">단계</p>
        <strong>{getStatusText(competition)}</strong>
        <span>{competition.currentWeek}주차</span>
      </article>
      <article className="competition-summary-card">
        <p className="eyebrow">포맷</p>
        <button
          className="format-summary-button"
          onClick={() => setShowFormatRules(true)}
          type="button"
        >
          <strong>{getLckRoundsFormatTitle(competition)}</strong>
          <span>대회 포맷 상세 보기</span>
        </button>
      </article>
      <CompetitionFormatSummary competition={competition} />
      {showFormatRules && (
        <LckRoundsFormatModal
          competition={competition}
          onClose={() => setShowFormatRules(false)}
        />
      )}
    </section>
  );
}

function LckRoundsFormatModal({
  competition,
  onClose,
}: {
  competition: CompetitionState;
  onClose: () => void;
}) {
  const isRounds34 = isLckRounds34Competition(competition);
  const isRounds35 = isLckRounds35Competition(competition);
  const isLateRounds = isLateLckRoundsCompetition(competition);
  const lateRoundsLabel = getLckRoundsFormatTitle(competition);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="lck-rounds-format-title"
        aria-modal="true"
        className="competition-rules-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="modal-close-button"
          onClick={onClose}
          type="button"
        >
          x
        </button>
        <p className="eyebrow">대회 규정</p>
        <h2 id="lck-rounds-format-title">
          {getLckRoundsFormatTitle(competition)}
        </h2>
        <div className="competition-rules-list">
          {isLateRounds ? (
            <>
              <article>
                <strong>제1조 그룹 분리</strong>
                <p>
                  Rounds 1-2 최종 순위 기준 상위 5팀은 Legend 그룹, 하위 5팀은
                  Rise 그룹으로 편성한다.
                </p>
              </article>
              <article>
                <strong>제2조 기록 승계</strong>
                <p>
                  Rounds 1-2의 승패와 세트 기록은 초기화하지 않고 {lateRoundsLabel}
                  순위표에 그대로 이어진다.
                </p>
              </article>
              <article>
                <strong>제3조 경기 방식</strong>
                <p>
                  {isRounds35
                    ? "각 그룹은 그룹 내부 5팀 트리플 라운드로빈을 치른다. 각 팀은 12시리즈를 추가로 진행하며 모든 경기는 BO3 Fearless로 기록한다."
                    : "각 그룹은 그룹 내부 5팀 더블 라운드로빈을 치른다. 각 팀은 8시리즈를 추가로 진행하며 모든 경기는 BO3 Fearless로 기록한다."}
                </p>
              </article>
              <article>
                <strong>제4조 후속 경로</strong>
                <p>
                  Legend 1-2위는 플레이오프 2라운드, Legend 3-4위는 플레이오프
                  1라운드로 직행한다. Legend 5위와 Rise 1-3위는 시즌
                  플레이-인을 치르며, 모든 포스트시즌 경기는 BO5 Fearless로
                  기록한다.
                </p>
              </article>
              <article>
                <strong>제5조 Worlds 후보 저장</strong>
                <p>
                  포스트시즌 종료 후 최종 1~4위를 저장한다. 1~3위는 기본
                  Worlds 진출권 후보, 4위는 MSI 추가 시드 조건부 후보로 해석한다.
                  {isRounds34 ? " 아시안게임 시즌은 이후 Asian Games로 이동한다." : " 일반 시즌은 이후 Worlds로 바로 이동한다."}
                </p>
              </article>
            </>
          ) : (
            <>
              <article>
                <strong>제1조 참가팀</strong>
                <p>LCK 소속 10팀이 동일한 정규시즌 테이블에서 경쟁한다.</p>
              </article>
              <article>
                <strong>제2조 경기 방식</strong>
                <p>
                  각 팀은 9주 동안 총 18시리즈를 치른다. 모든 경기는 BO3
                  시리즈 단위로 기록하며, 시스템 내 AI 경기 역시 동일하게
                  처리한다.
                </p>
              </article>
              <article>
                <strong>제3조 순위 산정</strong>
                <p>
                  순위는 승수, 세트 득실, 세트 승수, 초기 시드순으로 산정한다.
                  별도 타이브레이커 경기는 1차 구현 범위에서 제외한다.
                </p>
              </article>
              <article>
                <strong>제4조 포스트시즌 진출</strong>
                <p>
                  정규시즌 종료 시 상위 6팀이 포스트시즌에 진출한다. 순위표의
                  PO 배지는 남은 경기 결과와 무관하게 진출이 산술적으로 확정된
                  팀에만 표시한다.
                </p>
              </article>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function LckRoundsTabs({
  activeTab,
  competition,
  onTabChange,
}: {
  activeTab: LckRoundsDashboardTab;
  competition: CompetitionState;
  onTabChange: (tab: LckRoundsDashboardTab) => void;
}) {
  const tournamentLabel = isLateLckRoundsCompetition(competition)
    ? "포스트시즌"
    : "토너먼트";

  return (
    <div className="competition-tabs" role="tablist">
      <button
        className={`competition-tab ${
          activeTab === "standings" ? "competition-tab-active" : ""
        }`}
        onClick={() => onTabChange("standings")}
        type="button"
      >
        순위표
      </button>
      <button
        className={`competition-tab ${
          activeTab === "schedule" ? "competition-tab-active" : ""
        }`}
        onClick={() => onTabChange("schedule")}
        type="button"
      >
        일정
      </button>
      <button
        className={`competition-tab ${
          activeTab === "tournament" ? "competition-tab-active" : ""
        }`}
        onClick={() => onTabChange("tournament")}
        type="button"
      >
        {tournamentLabel}
      </button>
    </div>
  );
}

function LckRoundsSidePanel({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const nextUserMatch = getNextUserMatch(competition, userTeamId);
  const recentUserRecord = getRecentUserRecord({
    competition,
    records,
    userTeamId,
  });
  const scheduleById = new Map(competition.schedule.map((match) => [match.id, match]));
  const recentUserMatch = recentUserRecord
    ? scheduleById.get(recentUserRecord.scheduleId)
    : undefined;

  return (
    <aside className="lck-rounds-side-panel">
      <article className="competition-panel lck-rounds-side-card">
        <p className="eyebrow">다음 우리 팀 경기</p>
        {nextUserMatch ? (
          <>
            <strong>{getMatchTitle(nextUserMatch)}</strong>
            <span>{getDateLabel(nextUserMatch.scheduledDate)}</span>
            <small>
              {nextUserMatch.stageName} · {getFormatLabel(nextUserMatch)}
            </small>
          </>
        ) : (
          <>
            <strong>예정 경기 없음</strong>
            <span>정규시즌 일정이 모두 처리되었습니다.</span>
          </>
        )}
      </article>
      <article className="competition-panel lck-rounds-side-card">
        <p className="eyebrow">최근 우리 팀 결과</p>
        {recentUserRecord ? (
          <>
            <strong>
              {recentUserMatch
                ? getMatchTitle(recentUserMatch)
                : recentUserRecord.winnerTeamName}
            </strong>
            <span>
              {getUserResultLabel(recentUserRecord)} ·{" "}
              {recentUserRecord.score.blueWins}-{recentUserRecord.score.redWins}
            </span>
            <small>승자: {recentUserRecord.winnerTeamName}</small>
          </>
        ) : (
          <>
            <strong>아직 결과 없음</strong>
            <span>첫 우리 팀 경기 후 결과가 표시됩니다.</span>
          </>
        )}
      </article>
    </aside>
  );
}

function LckRoundsStandingsTable({
  competition,
  onViewTeam,
  table,
  userTeamId,
}: {
  competition: CompetitionState;
  onViewTeam?: (teamId: string) => void;
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  const isLateRounds = isLateLckRoundsCompetition(competition);
  const playoffClinchedTeamIds = isLateRounds
    ? new Set<string>()
    : getPlayoffClinchedTeamIds(competition);
  const groupRankByTeamId = new Map<string, number>();

  if (isLateRounds) {
    table.forEach((entry) => {
      const groupRank =
        table.filter(
          (candidate) =>
            candidate.lckRoundsGroup === entry.lckRoundsGroup &&
            compareStandingEntries(candidate, entry) < 0,
        ).length + 1;

      groupRankByTeamId.set(entry.teamId, groupRank);
    });
  }

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">순위표</p>
          <h2>{getLckRoundsFormatTitle(competition)} 순위표</h2>
        </div>
        <span className="panel-note">
          {isLateRounds ? "R1-2 기록 승계 · 그룹 내 순위" : "타이브레이커 경기 제외"}
        </span>
      </div>
      <div className="lck-standings-table lck-standings-header">
        <span>순위</span>
        <span>팀명</span>
        <span>경기</span>
        <span>승</span>
        <span>패</span>
        <span>세트득실</span>
        <span>{isLateRounds ? "그룹" : "진출"}</span>
      </div>
      <div className="lck-standings-scroll">
        {table.map((entry, index) => {
          const isPlayoffClinched = playoffClinchedTeamIds.has(entry.teamId);
          const displayRank = isLateRounds
            ? groupRankByTeamId.get(entry.teamId) ?? index + 1
            : index + 1;

          return (
            <div key={entry.teamId}>
              <div
                className={`lck-standings-table ${
                  entry.teamId === userTeamId ? "lck-standings-user" : ""
                }`}
              >
                <span>{displayRank}</span>
                <TeamNameCell entry={entry} onViewTeam={onViewTeam} />
                <span>{getMatchCount(entry)}</span>
                <span>{entry.wins}</span>
                <span>{entry.losses}</span>
                <span>{getSetDiff(entry)}</span>
                {isLateRounds ? (
                  <b
                    className={`po-badge lck-rounds-group-badge lck-rounds-group-badge-${entry.lckRoundsGroup}`}
                  >
                    {getLckRounds34GroupLabel(entry.lckRoundsGroup)}
                  </b>
                ) : (
                  isPlayoffClinched && <b className="po-badge">PO</b>
                )}
              </div>
              {((isLateRounds && index === 4) ||
                (!isLateRounds && index === 5)) &&
                table.length > index + 1 && (
                <div
                  aria-label={isLateRounds ? "그룹 컷라인" : "포스트시즌 컷라인"}
                  className="playoff-cutline"
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="standings-footnote">
        {isLateRounds
          ? "Legend 1-2위는 플레이오프 2라운드, Legend 3-4위는 플레이오프 1라운드, Legend 5위와 Rise 1-3위는 시즌 플레이-인에 진출합니다. 최종 1~4위는 Worlds 후보로 저장됩니다."
          : "상위 6팀이 포스트시즌에 진출합니다. PO 배지는 진출이 산술적으로 확정된 팀에만 표시됩니다."}
      </p>
    </section>
  );
}

function LckRoundsScheduleView({
  competition,
  records,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  userTeamId: string | undefined;
}) {
  const recordsByScheduleId = getRecordByScheduleId(records);
  const groupedSchedule = groupMatchesByDate(competition.schedule);

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">일정</p>
          <h2>일정 / 결과</h2>
        </div>
        <span className="panel-note">날짜별 시리즈 · 우리 팀 경기 강조</span>
      </div>
      <div className="lck-schedule-scroll">
        {groupedSchedule.map(({ dateKey, matches }) => (
          <article className="lck-schedule-day" key={dateKey}>
            <header>
              <strong>{getDateLabel(dateKey)}</strong>
              <span>{matches.length}시리즈</span>
            </header>
            <div className="lck-schedule-day-list">
              {matches.map((match) => {
                const record = recordsByScheduleId.get(match.id);
                const isUserMatch =
                  match.blueTeamId === userTeamId || match.redTeamId === userTeamId;

                return (
                  <div
                    className={`lck-schedule-row ${
                      isUserMatch ? "lck-schedule-row-user" : ""
                    }`}
                    key={match.id}
                  >
                    <div>
                      <strong>{getMatchTitle(match)}</strong>
                      <span>
                        {getLckRoundsStageLabel(match.stageName)} ·{" "}
                        {getFormatLabel(match)}
                      </span>
                    </div>
                    <b
                      className={`schedule-status-badge ${
                        record
                          ? getScheduleStatusClass({ match, record, userTeamId })
                          : "schedule-status-scheduled"
                      }`}
                    >
                      {record ? getScoreLabel(record) : "예정"}
                    </b>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LckRoundsTournamentView({
  competition,
  records,
  table,
  userTeamId,
}: {
  competition: CompetitionState;
  records: MatchRecord[];
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  const playoffRounds = getLckRoundsPlayoffMatches({
    competition,
    records,
    table,
  });
  const finalists = getLckRounds12Finalists(competition, records);
  const currentPlayoffStageName = isLckRounds12PlayoffStageName(
    competition.currentStageName,
  )
    ? competition.currentStageName
    : null;
  const bracketStatus = competition.completed
    ? "포스트시즌 종료 · 우승/준우승 확정"
    : competition.schedule.some((match) =>
          isLckRounds12PlayoffStageName(match.stageName),
        )
      ? "포스트시즌 진행 중 · 승자가 다음 라운드로 진출"
      : "정규시즌 진행 중 · 슬롯은 최종 순위 기준으로 확정";
  const flowHints: Record<string, string> = {
    final: "승자는 LCK Rounds 1-2 우승팀으로 기록됩니다.",
    "round-1": "승자는 준결승에서 1·2번 시드와 만납니다.",
    semifinals: "승자는 결승으로 진출합니다.",
  };
  const bracketColumns: CompetitionBracketColumn[] = playoffRounds.map((round) => ({
    align: round.matches.length === 1 ? "center" : "spread",
    id: round.id,
    matches: round.matches.map((match) =>
      toCompetitionBracketMatch({
        flowHint: flowHints[round.id],
        isCurrent: match.stageName === currentPlayoffStageName,
        match,
      }),
    ),
    title: round.title,
  }));
  const resultCards = [
    {
      detail: finalists[1]
        ? `준우승: ${finalists[1].teamName}`
        : "결승 결과가 확정되면 우승팀과 준우승팀이 표시됩니다.",
      id: "lck-rounds-12-champion",
      label: "우승팀",
      title: "우승",
      tone: "gold" as const,
      value: competition.winnerTeamName ?? "우승팀 미정",
    },
  ];

  return (
    <section className="competition-panel lck-rounds-main-panel">
      <div className="panel-title-row">
        <div>
          <p className="eyebrow">토너먼트</p>
          <h2>LCK Rounds 1-2 포스트시즌</h2>
        </div>
        <span className="panel-note">{bracketStatus}</span>
      </div>
      <CompetitionBracket
        boardClassName="lck-rounds12-flow-board"
        columns={bracketColumns}
        minWidth="760px"
        resultCards={resultCards}
        resultTitle="우승"
        userTeamId={userTeamId}
      />
    </section>
  );
}

export function LckRoundsDashboard({
  career,
  competition,
  subPage,
  onSubPageChange,
  onViewTeam,
  records,
  table,
  userTeamId,
}: {
  career: CareerSave;
  competition: CompetitionState;
  subPage?: CompetitionSubPage | null;
  onSubPageChange?: (subPage: CompetitionSubPage) => void;
  onViewTeam?: (teamId: string) => void;
  records: MatchRecord[];
  table: StandingEntry[];
  userTeamId: string | undefined;
}) {
  const [fallbackTab, setFallbackTab] =
    useState<LckRoundsDashboardTab>("standings");
  const activeTab = isLckRoundsDashboardTab(subPage) ? subPage : fallbackTab;
  const handleTabChange = (nextTab: LckRoundsDashboardTab) => {
    if (onSubPageChange) {
      onSubPageChange(nextTab);
      return;
    }

    setFallbackTab(nextTab);
  };

  return (
    <section className="competition-dashboard lck-rounds-dashboard">
      <LckRoundsSummary career={career} competition={competition} />
      <LckRoundsTabs
        activeTab={activeTab}
        competition={competition}
        onTabChange={handleTabChange}
      />
      <div className="lck-rounds-content-grid">
        {activeTab === "standings" && (
          <LckRoundsStandingsTable
            competition={competition}
            onViewTeam={onViewTeam}
            table={table}
            userTeamId={userTeamId}
          />
        )}
        {activeTab === "schedule" && (
          <LckRoundsScheduleView
            competition={competition}
            records={records}
            userTeamId={userTeamId}
          />
        )}
        {activeTab === "tournament" && (
          isLateLckRoundsCompetition(competition) ? (
            <LckRounds34PostseasonPathView
              competition={competition}
              records={records}
              table={table}
              userTeamId={userTeamId}
              worldsQualification={career.seasonState.worldsQualification}
            />
          ) : (
            <LckRoundsTournamentView
              competition={competition}
              records={records}
              table={table}
              userTeamId={userTeamId}
            />
          )
        )}
        <LckRoundsSidePanel
          competition={competition}
          records={records}
          userTeamId={userTeamId}
        />
      </div>
    </section>
  );
}
