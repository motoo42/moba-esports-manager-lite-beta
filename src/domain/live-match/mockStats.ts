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
  // Six real items per build: five completed items plus one pair of boots, so the
  // five item slots and the boot slot are all filled (no empty sample slot).
  blue: {
    top: ["3071", "3161", "6333", "3053", "3065", "3047"],
    jungle: ["6631", "3078", "6333", "6692", "3053", "3158"],
    mid: ["6655", "3089", "3157", "3135", "4645", "3020"],
    bot: ["3031", "6672", "3094", "3036", "6676", "3006"],
    support: ["3869", "3190", "3109", "3107", "3222", "3047"],
  },
  red: {
    top: ["6662", "3071", "3053", "3065", "3075", "3111"],
    jungle: ["3068", "3075", "6665", "2502", "6664", "3158"],
    mid: ["3003", "4645", "3089", "3157", "3135", "3020"],
    bot: ["3031", "6676", "6673", "3036", "3094", "3006"],
    support: ["3876", "3109", "3190", "3222", "3504", "3111"],
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
