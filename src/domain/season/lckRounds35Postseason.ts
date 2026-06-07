import type {
  CompetitionState,
  MatchRecord,
  MatchSchedule,
} from "../../types/game";
import {
  createLckRounds34SeasonPlayInOpeningSchedule,
  getLckRounds34FinalPlacements,
  getLckRounds34PostseasonSeeds,
  getNextLckRounds34PostseasonSchedule,
  isLckRounds34PostseasonStageName,
  lckRounds34PostseasonMatchIds,
  lckRounds34PostseasonStageNames,
  type LckRounds34PostseasonTeam,
} from "./lckRounds34Postseason";

export const lckRounds35PostseasonStageNames = lckRounds34PostseasonStageNames;

export const lckRounds35PostseasonMatchIds = {
  playInFirstQualifier: "lck-r35-season-play-in-first-qualifier",
  playInElimination: "lck-r35-season-play-in-elimination",
  playInSecondQualifier: "lck-r35-season-play-in-second-qualifier",
  playoffsRound1Legend3VsPlayIn2:
    "lck-r35-playoffs-r1-legend-3-vs-play-in-2",
  playoffsRound1Legend4VsPlayIn1:
    "lck-r35-playoffs-r1-legend-4-vs-play-in-1",
  playoffsRound2Legend1VsRound1B:
    "lck-r35-playoffs-r2-legend-1-vs-r1-b-winner",
  playoffsRound2Legend2VsRound1A:
    "lck-r35-playoffs-r2-legend-2-vs-r1-a-winner",
  lowerRound1A: "lck-r35-lower-r1-r2-a-loser-vs-r1-a-loser",
  lowerRound1B: "lck-r35-lower-r1-r2-b-loser-vs-r1-b-loser",
  playoffsRound3: "lck-r35-playoffs-r3-upper-final",
  lowerRound2: "lck-r35-lower-r2",
  lowerFinal: "lck-r35-lower-final",
  grandFinal: "lck-r35-grand-final",
} as const;

export type LckRounds35PostseasonTeam = LckRounds34PostseasonTeam;

type PostseasonScheduleOptions = {
  startDateKey: string;
};

const r34ToR35ScheduleId = new Map<string, string>(
  Object.keys(lckRounds34PostseasonMatchIds).map((key) => [
    lckRounds34PostseasonMatchIds[
      key as keyof typeof lckRounds34PostseasonMatchIds
    ],
    lckRounds35PostseasonMatchIds[
      key as keyof typeof lckRounds35PostseasonMatchIds
    ],
  ]),
);
const r35ToR34ScheduleId = new Map<string, string>(
  [...r34ToR35ScheduleId.entries()].map(([r34Id, r35Id]) => [r35Id, r34Id]),
);

function toRounds34ScheduleId(scheduleId: string) {
  return (
    r35ToR34ScheduleId.get(scheduleId) ??
    scheduleId.replace("lck-r35", "lck-r34")
  );
}

function toRounds35ScheduleId(scheduleId: string) {
  return (
    r34ToR35ScheduleId.get(scheduleId) ??
    scheduleId.replace("lck-r34", "lck-r35")
  );
}

function toRounds34Competition(competition: CompetitionState): CompetitionState {
  return {
    ...competition,
    competitionId: "lck-rounds-3-4",
    schedule: competition.schedule.map((match) => ({
      ...match,
      id: toRounds34ScheduleId(match.id),
      competitionId: "lck-rounds-3-4",
    })),
  };
}

function toRounds34Records(records: MatchRecord[]): MatchRecord[] {
  return records.map((record) => ({
    ...record,
    scheduleId: toRounds34ScheduleId(record.scheduleId),
    competitionId:
      record.competitionId === "lck-rounds-3-5"
        ? "lck-rounds-3-4"
        : record.competitionId,
  }));
}

function toRounds35Schedule(match: MatchSchedule): MatchSchedule {
  return {
    ...match,
    id: toRounds35ScheduleId(match.id),
    competitionId: "lck-rounds-3-5",
  };
}

export function getLckRounds35PostseasonSeeds(
  competition: CompetitionState,
): LckRounds35PostseasonTeam[] {
  return getLckRounds34PostseasonSeeds(competition);
}

export function isLckRounds35PostseasonStageName(stageName: string) {
  return isLckRounds34PostseasonStageName(stageName);
}

export function createLckRounds35SeasonPlayInOpeningSchedule(
  competition: CompetitionState,
  options: PostseasonScheduleOptions,
): MatchSchedule[] {
  return createLckRounds34SeasonPlayInOpeningSchedule(
    toRounds34Competition(competition),
    options,
  ).map(toRounds35Schedule);
}

export function getNextLckRounds35PostseasonSchedule(
  competition: CompetitionState,
  records: MatchRecord[],
): MatchSchedule[] {
  return getNextLckRounds34PostseasonSchedule(
    toRounds34Competition(competition),
    toRounds34Records(records),
  ).map(toRounds35Schedule);
}

export function getLckRounds35FinalPlacements(
  competition: CompetitionState,
  records: MatchRecord[],
): LckRounds35PostseasonTeam[] {
  return getLckRounds34FinalPlacements(
    toRounds34Competition(competition),
    toRounds34Records(records),
  );
}
