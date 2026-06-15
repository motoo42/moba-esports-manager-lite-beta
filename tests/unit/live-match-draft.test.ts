import { describe, expect, it } from "vitest";
import {
  applyDraftToLiveMatchTeams,
  createLiveMatchDraftFromSummary,
} from "../../src/domain/live-match/draftAdapter";
import { getLiveMatchChampionSummary } from "../../src/domain/live-match/mockDraft";
import type {
  LiveMatchTeamPresentation,
} from "../../src/domain/live-match/types";
import type { MatchDraftSummary, Role } from "../../src/types/game";

const roles: Role[] = ["top", "jungle", "mid", "bot", "support"];

function createTeam(name: string): LiveMatchTeamPresentation {
  return {
    gold: "0",
    id: name.toLowerCase(),
    kills: 0,
    name,
    objectives: {
      barons: 0,
      dragons: 0,
      dragonTypes: [],
      heralds: 0,
      towers: 0,
    },
    players: roles.map((role) => ({
      champion: getLiveMatchChampionSummary("aatrox"),
      name: `${name} ${role}`,
      role,
      stats: {
        assists: 0,
        deaths: 0,
        gold: "0",
        itemSlots: [],
        kills: 0,
        level: 1,
      },
    })),
    shortName: name.slice(0, 3).toUpperCase(),
  };
}

const draft: MatchDraftSummary = {
  blueBanIds: ["ksante", "varus", "xayah", "rakan", "nidalee"],
  blueBans: ["K'Sante", "Varus", "Xayah", "Rakan", "Nidalee"],
  blueDraftPower: 80,
  bluePicks: {
    bot: { championId: "ashe", championName: "Ashe", fitScore: 90, reasons: [] },
    jungle: { championId: "vi", championName: "Vi", fitScore: 90, reasons: [] },
    mid: { championId: "ahri", championName: "Ahri", fitScore: 90, reasons: [] },
    support: { championId: "rell", championName: "Rell", fitScore: 90, reasons: [] },
    top: { championId: "aatrox", championName: "Aatrox", fitScore: 90, reasons: [] },
  },
  netDraftPower: 1,
  notes: [],
  redBanIds: ["orianna", "azir", "jinx", "gnar", "zeri"],
  redBans: ["Orianna", "Azir", "Jinx", "Gnar", "Zeri"],
  redDraftPower: 76,
  redPicks: {
    bot: { championId: "senna", championName: "Senna", fitScore: 90, reasons: [] },
    jungle: { championId: "lee-sin", championName: "Lee Sin", fitScore: 90, reasons: [] },
    mid: { championId: "corki", championName: "Corki", fitScore: 90, reasons: [] },
    support: { championId: "lulu", championName: "Lulu", fitScore: 90, reasons: [] },
    top: { championId: "rumble", championName: "Rumble", fitScore: 90, reasons: [] },
  },
  usedChampionIds: [],
};

describe("live match draft adapter", () => {
  it("maps draft bans, fearless rows, and team picks to live presentation data", () => {
    const liveDraft = createLiveMatchDraftFromSummary({
      draft,
      format: "bo3",
      usedChampionIdsByGame: [
        ["aatrox", "rumble", "vi", "lee-sin", "ahri", "corki", "ashe", "senna", "rell", "lulu"],
      ],
    });

    const teams = applyDraftToLiveMatchTeams({
      blueTeam: createTeam("T1"),
      draft,
      redTeam: createTeam("GEN"),
    });

    expect(liveDraft.blueBans).toHaveLength(5);
    expect(liveDraft.redBans).toHaveLength(5);
    expect(liveDraft.fearlessRows).toHaveLength(3);
    expect(liveDraft.fearlessRows[0].champions).toHaveLength(10);
    expect(teams.blueTeam.players.map((player) => player.champion.id)).toEqual([
      "aatrox",
      "vi",
      "ahri",
      "ashe",
      "rell",
    ]);
    expect(teams.redTeam.players.map((player) => player.champion.id)).toEqual([
      "rumble",
      "lee-sin",
      "corki",
      "senna",
      "lulu",
    ]);
  });
});
