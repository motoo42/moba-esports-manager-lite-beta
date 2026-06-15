import { championPool } from "../champions";
import {
  createOpponentDraftPlayers,
  getRosterPlayersByRole,
  mapOpponentStyleToStrategy,
  runSimpleDraft,
} from "../draft";
import { simulateMatch } from "../match-simulation";
import type { SeriesFormat } from "../draft";
import type { SimulateSeriesInput, SeriesResult } from "./seriesTypes";

const winsNeededByFormat: Record<SeriesFormat, number> = {
  bo1: 1,
  bo3: 2,
  bo5: 3,
};

const maxGamesByFormat: Record<SeriesFormat, number> = {
  bo1: 1,
  bo3: 3,
  bo5: 5,
};

export function simulateSeries(input: SimulateSeriesInput): SeriesResult {
  const champions = input.champions ?? championPool;
  const winsNeeded = winsNeededByFormat[input.format];
  const maxGames = maxGamesByFormat[input.format];
  const bluePlayers = getRosterPlayersByRole(input.team, input.players);
  const redPlayers = createOpponentDraftPlayers(input.opponent);
  const opponentStrategy = mapOpponentStyleToStrategy(input.opponent.style);
  const usedChampionIds: string[] = [];
  const games: SeriesResult["games"] = [];
  let userWins = 0;
  let opponentWins = 0;

  for (let gameNumber = 1; gameNumber <= maxGames; gameNumber += 1) {
    const draft = runSimpleDraft({
      blueTeam: {
        name: input.team.name,
        players: bluePlayers,
        strategy: input.strategy,
      },
      redTeam: {
        name: input.opponent.name,
        players: redPlayers,
        strategy: opponentStrategy,
      },
      champions,
      context: {
        banCount: 5,
        format: input.format,
        gameNumber,
        fearlessEnabled: input.fearlessEnabled,
        unavailableChampionIds: usedChampionIds,
      },
    });

    const result = simulateMatch({
      team: input.team,
      players: input.players,
      opponent: input.opponent,
      strategy: input.strategy,
      trainingIntensity: input.trainingIntensity,
      seed: `${input.seed}-game-${gameNumber}`,
      draft,
    });

    games.push({ gameNumber, result });
    usedChampionIds.push(...draft.usedChampionIds);

    if (result.winner === "user") {
      userWins += 1;
    } else {
      opponentWins += 1;
    }

    if (userWins === winsNeeded || opponentWins === winsNeeded) {
      break;
    }
  }

  return {
    winner: userWins > opponentWins ? "user" : "opponent",
    userWins,
    opponentWins,
    format: input.format,
    games,
    usedChampionIds,
  };
}
