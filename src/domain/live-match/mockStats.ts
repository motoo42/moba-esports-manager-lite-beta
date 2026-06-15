import type { Role } from "../../types/game";
import { getMatchItems } from "../items";
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

const itemIdsBySideAndRole: Record<
  LiveMatchSide,
  Record<Role, Array<string | null>>
> = {
  blue: {
    top: ["3071", "3161", "6333", "3053", "3047", null],
    jungle: ["6631", "3078", "6333", "3158", "6692", null],
    mid: ["6655", "3089", "3157", "3020", "3135", null],
    bot: ["3031", "6672", "3094", "3006", "3036", null],
    support: ["3869", "3190", "3109", "3047", "3107", null],
  },
  red: {
    top: ["6662", "3071", "3053", "3111", "3065", null],
    jungle: ["3068", "3075", "6665", "3158", "2502", null],
    mid: ["3003", "4645", "3089", "3020", "3157", null],
    bot: ["3031", "6676", "6673", "3006", "3036", null],
    support: ["3876", "3109", "3190", "3111", "3222", null],
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

export function getMockLiveMatchItemSlots(side: LiveMatchSide, role: Role) {
  return getMatchItems(itemIdsBySideAndRole[side][role]);
}
