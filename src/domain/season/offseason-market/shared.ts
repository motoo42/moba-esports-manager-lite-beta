import type {
  CareerSave,
  OffseasonLogEntry,
  OffseasonMarketStatus,
} from "../../../types/game";

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

export function removeValue(values: string[], value: string) {
  return values.filter((candidate) => candidate !== value);
}

export function getCurrentOffseasonDay(career: CareerSave) {
  return career.seasonState.offseason?.currentDay ?? 1;
}

export function getCurrentOffseasonWeek(day: number) {
  return Math.min(4, Math.max(1, Math.ceil(day / 7)));
}

export function getMarketStatusForDay(day: number): OffseasonMarketStatus {
  if (day >= 28) {
    return "final-day";
  }

  if (day >= 8) {
    return "free-agency";
  }

  return "renewal-week";
}

export function createLogEntry({
  career,
  isUserTeamRelated,
  message,
  relatedTeamNames,
  type,
}: {
  career: CareerSave;
  isUserTeamRelated?: boolean;
  message: string;
  relatedTeamNames?: string[];
  type: OffseasonLogEntry["type"];
}): OffseasonLogEntry {
  const day = getCurrentOffseasonDay(career);
  const week = getCurrentOffseasonWeek(day);
  const count = career.seasonState.offseason?.logEntries?.length ?? 0;

  return {
    id: `offseason-log-${day}-${count + 1}`,
    day,
    week,
    type,
    message,
    isUserTeamRelated,
    relatedTeamNames,
  };
}

export function appendLog(
  career: CareerSave,
  type: OffseasonLogEntry["type"],
  message: string,
  options: { isUserTeamRelated?: boolean; relatedTeamNames?: string[] } = {},
): CareerSave {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        logEntries: [
          ...(offseason.logEntries ?? []),
          createLogEntry({
            career,
            isUserTeamRelated: options.isUserTeamRelated,
            relatedTeamNames: options.relatedTeamNames,
            type,
            message,
          }),
        ],
      },
    },
  };
}

export function setOffseasonState(
  career: CareerSave,
  update: NonNullable<CareerSave["seasonState"]["offseason"]>,
): CareerSave {
  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: update,
    },
  };
}
