import { SeasonCalendar } from "../features/season-calendar";
import {
  asianGamesSeasonCompetitions,
  normalSeasonCompetitions,
} from "../data/competitions";
import { useGame } from "../app/GameProvider";
import type { CalendarSubPage } from "../app/routes";

type SeasonCalendarPageProps = {
  subPage?: CalendarSubPage | null;
  onSubPageChange?: (subPage: CalendarSubPage) => void;
};

export function SeasonCalendarPage({
  subPage,
  onSubPageChange,
}: SeasonCalendarPageProps) {
  const { state, dispatch } = useGame();

  if (!state.career) {
    return null;
  }

  const { career } = state;
  const baseCompetitions =
    career.seasonState.calendarType === "asian-games"
      ? asianGamesSeasonCompetitions
      : normalSeasonCompetitions;
  const competitions = baseCompetitions.map((competition) => {
    const competitionState = career.seasonState.competitions.find(
      (candidate) => candidate.competitionId === competition.id,
    );

    return competitionState
      ? {
          ...competition,
          status: competitionState.status,
        }
      : competition;
  });

  return (
    <SeasonCalendar
      career={career}
      competitions={competitions}
      viewMode={subPage}
      onViewModeChange={onSubPageChange}
      onViewCompetition={(competitionId) =>
        dispatch({ type: "view-competition", competitionId })
      }
      onViewSummary={() => dispatch({ type: "go-to", route: "season-summary" })}
    />
  );
}
