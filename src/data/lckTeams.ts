export type LckTeamSeed = {
  id: string;
  name: string;
  shortName: string;
  baseElo: number;
  strength: number;
  previousSeasonRank: number;
};

export const lck2026Teams: LckTeamSeed[] = [
  {
    id: "gen-g",
    name: "Gen.G",
    shortName: "GEN",
    baseElo: 1680,
    strength: 88,
    previousSeasonRank: 1,
  },
  {
    id: "hanwha-life-esports",
    name: "Hanwha Life Esports",
    shortName: "HLE",
    baseElo: 1665,
    strength: 87,
    previousSeasonRank: 2,
  },
  {
    id: "t1",
    name: "T1",
    shortName: "T1",
    baseElo: 1650,
    strength: 86,
    previousSeasonRank: 3,
  },
  {
    id: "kt-rolster",
    name: "KT Rolster",
    shortName: "KT",
    baseElo: 1605,
    strength: 82,
    previousSeasonRank: 4,
  },
  {
    id: "dplus-kia",
    name: "Dplus KIA",
    shortName: "DK",
    baseElo: 1585,
    strength: 80,
    previousSeasonRank: 5,
  },
  {
    id: "hanjin-brion",
    name: "Hanjin BRION",
    shortName: "BRO",
    baseElo: 1535,
    strength: 75,
    previousSeasonRank: 6,
  },
  {
    id: "bnk-fearx",
    name: "BNK FEARX",
    shortName: "BFX",
    baseElo: 1515,
    strength: 73,
    previousSeasonRank: 7,
  },
  {
    id: "nongshim-redforce",
    name: "Nongshim RedForce",
    shortName: "NS",
    baseElo: 1510,
    strength: 72,
    previousSeasonRank: 8,
  },
  {
    id: "kiwoom-drx",
    name: "Kiwoom DRX",
    shortName: "DRX",
    baseElo: 1495,
    strength: 71,
    previousSeasonRank: 9,
  },
  {
    id: "dn-soopers",
    name: "DN SOOPers",
    shortName: "DNF",
    baseElo: 1450,
    strength: 67,
    previousSeasonRank: 10,
  },
];

export function createPlayableLckTeams(userTeamName: string) {
  const normalizedUserTeamName = userTeamName.trim().toLowerCase();
  const matchedTeam = lck2026Teams.find(
    (team) =>
      team.name.toLowerCase() === normalizedUserTeamName ||
      team.shortName.toLowerCase() === normalizedUserTeamName,
  );

  if (matchedTeam) {
    return lck2026Teams;
  }

  return lck2026Teams.map((team) =>
    team.id === "t1"
      ? {
          ...team,
          id: "user-team",
          name: userTeamName.trim() || "T1",
          shortName: "USER",
        }
      : team,
  );
}
