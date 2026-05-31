import type { Opponent } from "../types/game";

export const sampleOpponents: Opponent[] = [
  {
    id: "lec-team-01",
    name: "G2 Esports",
    region: "international",
    leagueLabel: "LEC",
    appearsIn: ["first-stand", "msi", "worlds"],
    strength: 82,
    style: "macro",
  },
  {
    id: "lpl-team-01",
    name: "Bilibili Gaming",
    region: "international",
    leagueLabel: "LPL",
    appearsIn: ["msi", "worlds"],
    strength: 86,
    style: "aggressive",
  },
];
