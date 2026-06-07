import { SeasonSummary } from "../features/season-summary";
import { useGame } from "../app/GameProvider";

export function SeasonSummaryPage() {
  const { state, dispatch } = useGame();

  if (!state.career) {
    return null;
  }

  return (
    <SeasonSummary
      career={state.career}
      onStartOffseason={() => dispatch({ type: "start-offseason-market" })}
      onViewRoster={() => dispatch({ type: "go-to", route: "roster-builder" })}
    />
  );
}
