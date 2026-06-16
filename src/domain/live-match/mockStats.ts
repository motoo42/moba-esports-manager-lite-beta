import type { Role } from "../../types/game";
import type {
  LiveMatchObjectiveSnapshot,
  LiveMatchPlayerStats,
  LiveMatchSide,
} from "./types";

const playerStatsBySide: Record<
  LiveMatchSide,
  Record<Role, Omit<LiveMatchPlayerStats, "itemSlots">>
> = {
  blue: {
    top: { kills: 2, deaths: 1, assists: 5, level: 15, gold: "11.4K" },
    jungle: { kills: 1, deaths: 2, assists: 9, level: 14, gold: "10.2K" },
    mid: { kills: 5, deaths: 1, assists: 6, level: 16, gold: "13.1K" },
    bot: { kills: 4, deaths: 2, assists: 4, level: 15, gold: "12.8K" },
    support: { kills: 0, deaths: 3, assists: 12, level: 12, gold: "7.6K" },
  },
  red: {
    top: { kills: 1, deaths: 2, assists: 4, level: 14, gold: "10.5K" },
    jungle: { kills: 2, deaths: 3, assists: 7, level: 13, gold: "9.8K" },
    mid: { kills: 3, deaths: 3, assists: 5, level: 15, gold: "11.9K" },
    bot: { kills: 4, deaths: 2, assists: 3, level: 15, gold: "12.3K" },
    support: { kills: 0, deaths: 2, assists: 10, level: 12, gold: "7.1K" },
  },
};

const teamStatsBySide: Record<
  LiveMatchSide,
  {
    gold: string;
    kills: number;
    objectives: LiveMatchObjectiveSnapshot;
  }
> = {
  blue: {
    gold: "55.1K",
    kills: 12,
    objectives: { dragons: 3, dragonTypes: [], heralds: 1, barons: 1, towers: 8 },
  },
  red: {
    gold: "51.6K",
    kills: 10,
    objectives: { dragons: 1, dragonTypes: [], heralds: 0, barons: 0, towers: 5 },
  },
};

export function getMockLiveMatchPlayerBaseStats(
  side: LiveMatchSide,
  role: Role,
) {
  return playerStatsBySide[side][role];
}

export function getMockLiveMatchTeamStats(side: LiveMatchSide) {
  return teamStatsBySide[side];
}
