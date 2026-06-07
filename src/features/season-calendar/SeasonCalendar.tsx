import { useMemo, useState, type CSSProperties } from "react";
import {
  createMonthGrid,
  formatDateRange,
  formatMonthTitle,
  getDefaultCalendarMonth,
  getMatchDisplayDate,
  getRoadmapWindows,
  getWeekdayLabels,
  toDateKey,
} from "../../domain/season-calendar/seasonCalendarDates";
import { Button } from "../../shared/ui/Button";
import type {
  CareerSave,
  Competition,
  CompetitionId,
  CompetitionState,
  MatchRecord,
  MatchSchedule,
} from "../../types/game";

type SeasonCalendarProps = {
  career: CareerSave;
  competitions: Competition[];
  viewMode?: CalendarViewMode | null;
  onViewModeChange?: (viewMode: CalendarViewMode) => void;
  onViewCompetition: (competitionId: CompetitionId) => void;
  onViewSummary: () => void;
};

type CalendarViewMode = "roadmap" | "calendar";

type UserCalendarMatch = {
  match: MatchSchedule;
  date: Date;
  dateKey: string;
  competitionName: string;
  opponentName: string;
  resultLabel: string;
  statusLabel: string;
};

const monthLabels = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

function getCompetitionStateById(competitions: CompetitionState[]) {
  return new Map(
    competitions.map((competition) => [competition.competitionId, competition]),
  );
}

function getUserTeamId(competitions: CompetitionState[]) {
  for (const competition of competitions) {
    const userEntry = competition.standings.find((entry) => entry.isUserTeam);

    if (userEntry) {
      return userEntry.teamId;
    }
  }

  return "user-team";
}

function getStatusLabel(competition: CompetitionState | undefined) {
  if (competition?.completed || competition?.status === "completed") {
    return "완료";
  }

  if (competition?.status === "active") {
    return "진행중";
  }

  return "예정";
}

function getStatusClass(competition: CompetitionState | undefined) {
  if (competition?.completed || competition?.status === "completed") {
    return "completed";
  }

  if (competition?.status === "active") {
    return "active";
  }

  return "upcoming";
}

function getScoreLabel(record: MatchRecord | undefined) {
  if (!record) {
    return "예정";
  }

  return `${record.score.blueWins}-${record.score.redWins}`;
}

function getResultLabel({
  match,
  record,
  userTeamId,
}: {
  match: MatchSchedule;
  record: MatchRecord | undefined;
  userTeamId: string;
}) {
  if (!record) {
    return `${match.format.toUpperCase()} 예정`;
  }

  const userIsBlue = match.blueTeamId === userTeamId;
  const userWins = userIsBlue ? record.score.blueWins : record.score.redWins;
  const opponentWins = userIsBlue ? record.score.redWins : record.score.blueWins;
  const result = record.userResult === "win" ? "승" : "패";

  return `${result} ${userWins}-${opponentWins}`;
}

function getOpponentName(match: MatchSchedule, userTeamId: string) {
  return match.blueTeamId === userTeamId ? match.redTeamName : match.blueTeamName;
}

function createMatchIndexByWeek(matches: MatchSchedule[]) {
  const buckets = new Map<string, MatchSchedule[]>();

  matches.forEach((match) => {
    const key = `${match.competitionId}:${match.week}`;
    const bucket = buckets.get(key) ?? [];

    bucket.push(match);
    buckets.set(key, bucket);
  });

  const indexById = new Map<string, number>();

  buckets.forEach((bucket) => {
    bucket
      .sort((left, right) => left.id.localeCompare(right.id))
      .forEach((match, index) => {
        indexById.set(match.id, index);
      });
  });

  return indexById;
}

function getUserCalendarMatches(career: CareerSave): UserCalendarMatch[] {
  const userTeamId = getUserTeamId(career.seasonState.competitions);
  const recordsByScheduleId = new Map(
    career.seasonState.matchRecords.map((record) => [record.scheduleId, record]),
  );
  const allMatches = career.seasonState.competitions.flatMap(
    (competition) => competition.schedule,
  );
  const indexByWeek = createMatchIndexByWeek(allMatches);
  const competitionNameById = new Map(
    career.seasonState.competitions.map((competition) => [
      competition.competitionId,
      competition.name,
    ]),
  );

  return allMatches
    .filter(
      (match) =>
        match.blueTeamId === userTeamId || match.redTeamId === userTeamId,
    )
    .map((match) => {
      const record = recordsByScheduleId.get(match.id);
      const date = getMatchDisplayDate({
        calendarType: career.seasonState.calendarType,
        match,
        matchIndexInWeek: indexByWeek.get(match.id) ?? 0,
        year: career.seasonState.yearLabel,
      });

      return {
        match,
        date,
        dateKey: toDateKey(date),
        competitionName: competitionNameById.get(match.competitionId) ?? match.competitionId,
        opponentName: getOpponentName(match, userTeamId),
        resultLabel: getResultLabel({ match, record, userTeamId }),
        statusLabel: record ? getScoreLabel(record) : "예정",
      };
    })
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

function groupMatchesByDate(matches: UserCalendarMatch[]) {
  const matchesByDate = new Map<string, UserCalendarMatch[]>();

  matches.forEach((match) => {
    const list = matchesByDate.get(match.dateKey) ?? [];

    list.push(match);
    matchesByDate.set(match.dateKey, list);
  });

  return matchesByDate;
}

function RoadmapView({
  career,
  competitions,
  onViewCompetition,
}: {
  career: CareerSave;
  competitions: Competition[];
  onViewCompetition: (competitionId: CompetitionId) => void;
}) {
  const competitionStateById = getCompetitionStateById(
    career.seasonState.competitions,
  );
  const windows = getRoadmapWindows(career.seasonState.calendarType);
  const activeCompetition = career.seasonState.competitions.find(
    (competition) => competition.status === "active",
  );
  const completedCompetitions = career.seasonState.competitions.filter(
    (competition) => competition.completed || competition.status === "completed",
  );
  const nextCompetition =
    career.seasonState.competitions.find(
      (competition) =>
        competition.status === "available" || competition.status === "locked",
    ) ?? null;

  return (
    <section className="season-roadmap-view">
      <div className="season-roadmap-months">
        {monthLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="season-roadmap-track">
        {windows.map((window) => {
          const competition = competitions.find(
            (candidate) => candidate.id === window.competitionId,
          );

          if (!competition) {
            return null;
          }

          const state = competitionStateById.get(competition.id);
          const statusClass = getStatusClass(state);
          const style = {
            gridColumn: `${window.startMonth + 1} / ${window.endMonth + 2}`,
            gridRow: window.lane,
          } satisfies CSSProperties;

          return (
            <button
              className={`season-roadmap-card season-roadmap-card-${statusClass}`}
              key={competition.id}
              onClick={() => onViewCompetition(competition.id)}
              style={style}
              type="button"
            >
              <div className="roadmap-card-topline">
                <span>{window.shortLabel}</span>
              </div>
              <h2>{competition.name}</h2>
              <div className="roadmap-card-meta">
                <span>{formatDateRange(
                  career.seasonState.yearLabel,
                  competition.id,
                  career.seasonState.calendarType,
                )}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="season-roadmap-summary-grid">
        <article>
          <span>현재 대회</span>
          <strong>{activeCompetition?.name ?? "스토브리그"}</strong>
          <p>
            {activeCompetition
              ? `${activeCompetition.currentStageName} · ${activeCompetition.currentWeek}주차`
              : "로스터 확정 후 LCK Cup이 활성화됩니다."}
          </p>
        </article>
        <article>
          <span>다음 대회</span>
          <strong>{nextCompetition?.name ?? "예정 없음"}</strong>
          <p>
            {nextCompetition
              ? `${getStatusLabel(nextCompetition)} · 현황 화면에서 일정 생성 상태 확인`
              : "현재 시즌의 모든 대회를 완료했습니다."}
          </p>
        </article>
        <article>
          <span>완료 대회</span>
          <strong>{completedCompetitions.length}개</strong>
          <p>
            {completedCompetitions[0]
              ? `${completedCompetitions[0].name} 우승: ${
                  completedCompetitions[0].winnerTeamName ?? "미정"
                }`
              : "완료된 대회가 아직 없습니다."}
          </p>
        </article>
      </div>
    </section>
  );
}

function CalendarView({ career }: { career: CareerSave }) {
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getDefaultCalendarMonth(
      career.seasonState.yearLabel,
      career.seasonState.calendarType,
      career.seasonState.currentCompetitionId,
    ),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const userMatches = useMemo(() => getUserCalendarMatches(career), [career]);
  const matchesByDate = useMemo(
    () => groupMatchesByDate(userMatches),
    [userMatches],
  );
  const monthCells = useMemo(
    () =>
      createMonthGrid(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
      ),
    [calendarMonth],
  );
  const firstMatchInMonth = userMatches.find(
    (match) =>
      match.date.getFullYear() === calendarMonth.getFullYear() &&
      match.date.getMonth() === calendarMonth.getMonth(),
  );
  const activeDateKey = selectedDateKey ?? firstMatchInMonth?.dateKey ?? null;
  const activeDateMatches = activeDateKey
    ? matchesByDate.get(activeDateKey) ?? []
    : [];
  const nextMatch = userMatches.find(
    (match) => match.match.status === "scheduled",
  );

  function moveMonth(offset: -1 | 1) {
    const nextMonth = Math.min(
      11,
      Math.max(0, calendarMonth.getMonth() + offset),
    );

    setSelectedDateKey(null);
    setCalendarMonth(new Date(career.seasonState.yearLabel, nextMonth, 1));
  }

  return (
    <section className="season-calendar-grid-layout">
      <div className="calendar-month-panel">
        <div className="calendar-month-header">
          <div>
            <p className="eyebrow">Calendar</p>
            <h2>{formatMonthTitle(calendarMonth)}</h2>
          </div>
          <div className="calendar-month-controls">
            <Button
              disabled={calendarMonth.getMonth() === 0}
              onClick={() => moveMonth(-1)}
              variant="ghost"
            >
              이전 달
            </Button>
            <Button
              disabled={calendarMonth.getMonth() === 11}
              onClick={() => moveMonth(1)}
              variant="ghost"
            >
              다음 달
            </Button>
          </div>
        </div>
        <div className="month-calendar-grid">
          {getWeekdayLabels().map((weekday) => (
            <span className="calendar-weekday" key={weekday}>
              {weekday}
            </span>
          ))}
          {monthCells.map((cell) => {
            const matches = cell.date ? matchesByDate.get(cell.key) ?? [] : [];
            const isActive = activeDateKey === cell.key;

            return (
              <button
                className={`calendar-day-cell ${
                  cell.date ? "" : "calendar-day-empty"
                } ${matches.length > 0 ? "calendar-day-has-match" : ""} ${
                  isActive ? "calendar-day-active" : ""
                }`}
                disabled={!cell.date}
                key={cell.key}
                onClick={() => setSelectedDateKey(cell.key)}
                type="button"
              >
                <strong>{cell.date?.getDate() ?? ""}</strong>
                <div className="calendar-day-events">
                  {matches.slice(0, 2).map((match) => (
                    <span className="calendar-match-chip" key={match.match.id}>
                      {match.opponentName} · {match.resultLabel}
                    </span>
                  ))}
                  {matches.length > 2 && (
                    <span className="calendar-match-chip">+{matches.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <aside className="calendar-detail-panel">
        <div>
          <p className="eyebrow">Selected Day</p>
          <h2>{activeDateKey ?? "날짜 선택"}</h2>
        </div>
        <div className="calendar-match-list">
          {activeDateMatches.length === 0 && (
            <p className="muted">선택한 날짜에는 우리 팀 경기가 없습니다.</p>
          )}
          {activeDateMatches.map((match) => (
            <article className="calendar-match-row" key={match.match.id}>
              <div>
                <span>{match.competitionName}</span>
                <strong>{match.opponentName}</strong>
                <small>
                  {match.match.stageName} · {match.match.format.toUpperCase()}
                </small>
              </div>
              <b>{match.resultLabel}</b>
            </article>
          ))}
        </div>
        <div className="calendar-next-match-card">
          <span>다음 우리 팀 경기</span>
          <strong>{nextMatch?.opponentName ?? "예정 경기 없음"}</strong>
          <p>
            {nextMatch
              ? `${nextMatch.dateKey} · ${nextMatch.competitionName} · ${nextMatch.match.stageName}`
              : "현재 생성된 일정 안에는 남은 우리 팀 경기가 없습니다."}
          </p>
        </div>
      </aside>
    </section>
  );
}

export function SeasonCalendar({
  career,
  competitions,
  viewMode,
  onViewModeChange,
  onViewCompetition,
  onViewSummary,
}: SeasonCalendarProps) {
  const [fallbackViewMode, setFallbackViewMode] =
    useState<CalendarViewMode>("roadmap");
  const activeViewMode = viewMode ?? fallbackViewMode;

  function handleViewModeChange(nextViewMode: CalendarViewMode) {
    if (onViewModeChange) {
      onViewModeChange(nextViewMode);
      return;
    }

    setFallbackViewMode(nextViewMode);
  }

  return (
    <section className="season-calendar">
      <header className="season-calendar-header">
        <div>
          <p className="eyebrow">Season Calendar</p>
          <h1>{career.seasonState.yearLabel} 시즌 로드맵</h1>
          <p className="muted">
            로드맵은 시즌 전체 구조를, 달력은 우리 팀 경기일을 확인하는
            화면입니다.
          </p>
        </div>
        <div className="season-calendar-actions">
          <div className="season-calendar-tabs" role="tablist">
            <button
              className={`season-calendar-tab ${
                activeViewMode === "roadmap" ? "season-calendar-tab-active" : ""
              }`}
              onClick={() => handleViewModeChange("roadmap")}
              type="button"
            >
              로드맵
            </button>
            <button
              className={`season-calendar-tab ${
                activeViewMode === "calendar" ? "season-calendar-tab-active" : ""
              }`}
              onClick={() => handleViewModeChange("calendar")}
              type="button"
            >
              달력
            </button>
          </div>
          <Button onClick={onViewSummary} variant="ghost">
            시즌 요약
          </Button>
        </div>
      </header>

      {activeViewMode === "roadmap" ? (
        <RoadmapView
          career={career}
          competitions={competitions}
          onViewCompetition={onViewCompetition}
        />
      ) : (
        <CalendarView career={career} />
      )}
    </section>
  );
}
