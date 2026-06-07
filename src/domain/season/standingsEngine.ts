import type {
  MatchRecord,
  MatchSchedule,
  SeriesScore,
  StandingEntry,
} from "../../types/game";

function updateEntryWithScore(
  entry: StandingEntry,
  score: SeriesScore,
  side: "blue" | "red",
  wonMatch: boolean,
) {
  const setWins = side === "blue" ? score.blueWins : score.redWins;
  const setLosses = side === "blue" ? score.redWins : score.blueWins;
  const wins = entry.wins + (wonMatch ? 1 : 0);
  const losses = entry.losses + (wonMatch ? 0 : 1);
  const totalMatches = wins + losses;

  return {
    ...entry,
    wins,
    losses,
    matchWins: wins,
    matchLosses: losses,
    setWins: entry.setWins + setWins,
    setLosses: entry.setLosses + setLosses,
    winRate: totalMatches > 0 ? wins / totalMatches : 0,
  };
}

export function sortStandings(standings: StandingEntry[]) {
  return [...standings]
    .sort((left, right) => {
      const winDiff = right.wins - left.wins;

      if (winDiff !== 0) {
        return winDiff;
      }

      const setDiffLeft = left.setWins - left.setLosses;
      const setDiffRight = right.setWins - right.setLosses;
      const setDiff = setDiffRight - setDiffLeft;

      if (setDiff !== 0) {
        return setDiff;
      }

      const setWinsDiff = right.setWins - left.setWins;

      if (setWinsDiff !== 0) {
        return setWinsDiff;
      }

      return left.initialSeed - right.initialSeed;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function applyRecordsToStandings({
  records,
  schedule,
  standings,
}: {
  records: MatchRecord[];
  schedule: MatchSchedule[];
  standings: StandingEntry[];
}) {
  if (standings.length === 0 || records.length === 0) {
    return standings;
  }

  const scheduleById = new Map(schedule.map((match) => [match.id, match]));

  const nextStandings = records.reduce<StandingEntry[]>((currentStandings, record) => {
    const match = scheduleById.get(record.scheduleId);

    if (!match) {
      return currentStandings;
    }

    return currentStandings.map((entry) => {
      if (entry.teamId === match.blueTeamId) {
        return updateEntryWithScore(
          entry,
          record.score,
          "blue",
          record.winnerSide === "blue",
        );
      }

      if (entry.teamId === match.redTeamId) {
        return updateEntryWithScore(
          entry,
          record.score,
          "red",
          record.winnerSide === "red",
        );
      }

      return entry;
    });
  }, standings);

  return sortStandings(nextStandings);
}
