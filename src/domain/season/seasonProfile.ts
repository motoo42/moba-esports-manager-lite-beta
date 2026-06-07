import {
  asianGamesSeasonCompetitions,
  normalSeasonCompetitions,
} from "../../data/competitions";
import type {
  Competition,
  CompetitionId,
  LateSeasonCompetitionId,
  SeasonCalendarType,
  SeasonProfile,
  SeasonState,
  SeasonTemplate,
} from "../../types/game";

export const firstSeasonYear = 2026;

export function getSeasonYearLabel(seasonNumber: number) {
  return firstSeasonYear + seasonNumber - 1;
}

export function isAsianGamesSeasonYear(yearLabel: number) {
  return (yearLabel - firstSeasonYear) % 4 === 0;
}

function getCalendarTypeForYear(yearLabel: number): SeasonCalendarType {
  return isAsianGamesSeasonYear(yearLabel) ? "asian-games" : "normal";
}

function getTemplateId(
  calendarType: SeasonCalendarType,
): SeasonTemplate["id"] {
  return calendarType === "asian-games"
    ? "lck-2026-asian-games-reference"
    : "lck-2025-reference";
}

function getLateSeasonCompetitionId(
  calendarType: SeasonCalendarType,
): LateSeasonCompetitionId {
  return calendarType === "asian-games" ? "lck-rounds-3-4" : "lck-rounds-3-5";
}

export function getSeasonProfile(seasonNumber: number): SeasonProfile {
  const yearLabel = getSeasonYearLabel(seasonNumber);
  const calendarType = getCalendarTypeForYear(yearLabel);
  const lateSeasonCompetitionId = getLateSeasonCompetitionId(calendarType);
  const competitionIds = getSeasonCompetitionsByCalendarType(calendarType).map(
    (competition) => competition.id,
  );

  return {
    seasonNumber,
    yearLabel,
    calendarType,
    templateId: getTemplateId(calendarType),
    hasAsianGames: calendarType === "asian-games",
    postMsiCompetitionId: lateSeasonCompetitionId,
    lateSeasonCompetitionId,
    competitionIds,
  };
}

export function getSeasonProfileForState(
  seasonState: Pick<SeasonState, "seasonNumber">,
) {
  return getSeasonProfile(seasonState.seasonNumber);
}

export function getSeasonCompetitionsByCalendarType(
  calendarType: SeasonCalendarType,
): Competition[] {
  return calendarType === "asian-games"
    ? asianGamesSeasonCompetitions
    : normalSeasonCompetitions;
}

export function getSeasonCompetitionsForProfile(
  profile: SeasonProfile,
): Competition[] {
  return getSeasonCompetitionsByCalendarType(profile.calendarType);
}

export function isCompetitionInSeasonProfile(
  competitionId: CompetitionId,
  profile: SeasonProfile,
) {
  return profile.competitionIds.includes(competitionId);
}
