import type { CompetitionId, MatchSchedule, SeasonCalendarType } from "../../types/game";
import {
  getCompetitionStartDate,
  toDateKey,
} from "../season-calendar/seasonCalendarDates";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getFirstWeekdayOnOrAfter(date: Date, weekday: number) {
  const offset = (weekday - date.getDay() + 7) % 7;

  return addDays(date, offset);
}

export function dateKeyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function addDaysToDateKey(dateKey: string, days: number) {
  return toDateKey(addDays(dateKeyToDate(dateKey), days));
}

export function formatSeasonDateLabel(dateKey: string) {
  const date = dateKeyToDate(dateKey);
  const weekday = weekdayLabels[date.getDay()];

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export function getDateWeekday(dateKey: string) {
  return dateKeyToDate(dateKey).getDay();
}

export function isLineupEditableDate(dateKey: string) {
  const weekday = getDateWeekday(dateKey);

  return weekday === 1 || weekday === 2;
}

export function getDomesticMatchDateKey({
  calendarType,
  competitionId,
  matchIndexInWeek,
  week,
  year,
}: {
  calendarType: SeasonCalendarType;
  competitionId: CompetitionId;
  matchIndexInWeek: number;
  week: number;
  year: number;
}) {
  const start = getCompetitionStartDate(year, competitionId, calendarType);
  const firstMatchDate = getFirstWeekdayOnOrAfter(start, 3);
  const weekOffset = (week - 1) * 7;
  const dayOffset = Math.min(matchIndexInWeek, 4);

  return toDateKey(addDays(firstMatchDate, weekOffset + dayOffset));
}

export function getFirstScheduledDateKey(schedule: MatchSchedule[]) {
  return [...schedule]
    .filter((match) => match.status === "scheduled" && match.scheduledDate)
    .sort((left, right) =>
      (left.scheduledDate ?? "").localeCompare(right.scheduledDate ?? ""),
    )[0]?.scheduledDate;
}
