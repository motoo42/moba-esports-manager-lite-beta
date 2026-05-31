import type {
  CompetitionId,
  MatchSchedule,
  SeasonCalendarType,
} from "../../types/game";

export type RoadmapWindow = {
  competitionId: CompetitionId;
  startMonth: number;
  endMonth: number;
  startDay: number;
  endDay: number;
  lane: 1 | 2;
  shortLabel: string;
};

export type CalendarDayCell = {
  date: Date | null;
  key: string;
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

const roadmapWindows: Record<SeasonCalendarType, RoadmapWindow[]> = {
  normal: [
    {
      competitionId: "lck-cup",
      startMonth: 0,
      endMonth: 1,
      startDay: 14,
      endDay: 23,
      lane: 1,
      shortLabel: "Cup",
    },
    {
      competitionId: "first-stand",
      startMonth: 2,
      endMonth: 2,
      startDay: 10,
      endDay: 23,
      lane: 2,
      shortLabel: "First",
    },
    {
      competitionId: "lck-rounds-1-2",
      startMonth: 3,
      endMonth: 4,
      startDay: 1,
      endDay: 31,
      lane: 1,
      shortLabel: "R1-2",
    },
    {
      competitionId: "msi",
      startMonth: 5,
      endMonth: 5,
      startDay: 8,
      endDay: 22,
      lane: 2,
      shortLabel: "MSI",
    },
    {
      competitionId: "lck-rounds-3-5",
      startMonth: 6,
      endMonth: 8,
      startDay: 3,
      endDay: 21,
      lane: 1,
      shortLabel: "R3-5",
    },
    {
      competitionId: "worlds",
      startMonth: 9,
      endMonth: 10,
      startDay: 6,
      endDay: 23,
      lane: 2,
      shortLabel: "Worlds",
    },
  ],
  "asian-games": [
    {
      competitionId: "lck-cup",
      startMonth: 0,
      endMonth: 1,
      startDay: 14,
      endDay: 23,
      lane: 1,
      shortLabel: "Cup",
    },
    {
      competitionId: "first-stand",
      startMonth: 2,
      endMonth: 2,
      startDay: 10,
      endDay: 23,
      lane: 2,
      shortLabel: "First",
    },
    {
      competitionId: "lck-rounds-1-2",
      startMonth: 3,
      endMonth: 4,
      startDay: 1,
      endDay: 31,
      lane: 1,
      shortLabel: "R1-2",
    },
    {
      competitionId: "msi",
      startMonth: 5,
      endMonth: 5,
      startDay: 8,
      endDay: 22,
      lane: 2,
      shortLabel: "MSI",
    },
    {
      competitionId: "lck-rounds-3-4",
      startMonth: 6,
      endMonth: 7,
      startDay: 3,
      endDay: 24,
      lane: 1,
      shortLabel: "R3-4",
    },
    {
      competitionId: "asian-games",
      startMonth: 8,
      endMonth: 8,
      startDay: 8,
      endDay: 24,
      lane: 2,
      shortLabel: "AG",
    },
    {
      competitionId: "worlds",
      startMonth: 9,
      endMonth: 10,
      startDay: 6,
      endDay: 23,
      lane: 2,
      shortLabel: "Worlds",
    },
  ],
};

export function getRoadmapWindows(calendarType: SeasonCalendarType) {
  return roadmapWindows[calendarType];
}

export function getRoadmapWindow(
  competitionId: CompetitionId,
  calendarType: SeasonCalendarType,
) {
  return getRoadmapWindows(calendarType).find(
    (window) => window.competitionId === competitionId,
  );
}

export function getCompetitionStartDate(
  year: number,
  competitionId: CompetitionId,
  calendarType: SeasonCalendarType,
) {
  const window = getRoadmapWindow(competitionId, calendarType);

  if (!window) {
    return new Date(year, 0, 1);
  }

  return new Date(year, window.startMonth, window.startDay);
}

export function getCompetitionEndDate(
  year: number,
  competitionId: CompetitionId,
  calendarType: SeasonCalendarType,
) {
  const window = getRoadmapWindow(competitionId, calendarType);

  if (!window) {
    return new Date(year, 11, 31);
  }

  return new Date(year, window.endMonth, window.endDay);
}

export function getDefaultCalendarMonth(
  year: number,
  calendarType: SeasonCalendarType,
  competitionId: CompetitionId | null,
) {
  if (!competitionId) {
    return new Date(year, 0, 1);
  }

  return getCompetitionStartDate(year, competitionId, calendarType);
}

export function createMonthGrid(year: number, monthIndex: number): CalendarDayCell[] {
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarDayCell[] = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ date: null, key: `blank-start-${index}` });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({ date, key: toDateKey(date) });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `blank-end-${cells.length}` });
  }

  return cells;
}

export function getWeekdayLabels() {
  return weekdayLabels;
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateRange(
  year: number,
  competitionId: CompetitionId,
  calendarType: SeasonCalendarType,
) {
  const start = getCompetitionStartDate(year, competitionId, calendarType);
  const end = getCompetitionEndDate(year, competitionId, calendarType);

  return `${start.getMonth() + 1}/${start.getDate()} - ${
    end.getMonth() + 1
  }/${end.getDate()}`;
}

export function getMatchDisplayDate({
  calendarType,
  match,
  matchIndexInWeek,
  year,
}: {
  calendarType: SeasonCalendarType;
  match: MatchSchedule;
  matchIndexInWeek: number;
  year: number;
}) {
  if (match.scheduledDate) {
    return dateKeyToDate(match.scheduledDate);
  }

  const start = getCompetitionStartDate(year, match.competitionId, calendarType);
  const firstDomesticMatchDate = getFirstWeekdayOnOrAfter(start, 3);
  const weekOffset = (match.week - 1) * 7;
  const dayOffset = Math.min(matchIndexInWeek, 4);

  return addDays(firstDomesticMatchDate, weekOffset + dayOffset);
}

export function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dateKeyToDate(dateKey: string) {
  const [dateYear, month, day] = dateKey.split("-").map(Number);

  return new Date(dateYear, month - 1, day);
}

function getFirstWeekdayOnOrAfter(date: Date, weekday: number) {
  const offset = (weekday - date.getDay() + 7) % 7;

  return addDays(date, offset);
}
