import type { TeamBalanceAdjustment, TeamBalanceTier } from "../types/game";

export type LckTeamSeed = {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  logoSourceUrl?: string;
  tier: TeamBalanceTier;
  baseElo: number;
  strength: number;
  budget: number;
  salaryMultiplier: number;
  appealModifier: number;
  previousSeasonRank: number;
};

const lckTeamLogoBasePath = "/assets/logos/lck/teams/2026";

export const lckLeagueLogo = {
  logoUrl: "/assets/logos/lck/lck-logo.svg",
  logoSourceUrl:
    "https://commons.wikimedia.org/wiki/File:League_of_Legends_Champions_Korea_logo.svg",
};

export const lck2026Teams: LckTeamSeed[] = [
  {
    id: "gen-g",
    name: "Gen.G",
    shortName: "GEN",
    logoUrl: `${lckTeamLogoBasePath}/gen-g.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:Gen.Glogo_std.png",
    tier: "S",
    baseElo: 1690,
    strength: 89,
    budget: 880,
    salaryMultiplier: 1.12,
    appealModifier: 4,
    previousSeasonRank: 1,
  },
  {
    id: "hanwha-life-esports",
    name: "Hanwha Life Esports",
    shortName: "HLE",
    logoUrl: `${lckTeamLogoBasePath}/hanwha-life-esports.webp`,
    logoSourceUrl:
      "https://lol.fandom.com/wiki/File:Hanwha_Life_Esportslogo_std.png",
    tier: "S",
    baseElo: 1680,
    strength: 88,
    budget: 900,
    salaryMultiplier: 1.12,
    appealModifier: 4,
    previousSeasonRank: 2,
  },
  {
    id: "t1",
    name: "T1",
    shortName: "T1",
    logoUrl: `${lckTeamLogoBasePath}/t1.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:T1logo_std.png",
    tier: "S",
    baseElo: 1670,
    strength: 87,
    budget: 900,
    salaryMultiplier: 1.15,
    appealModifier: 5,
    previousSeasonRank: 3,
  },
  {
    id: "kt-rolster",
    name: "KT Rolster",
    shortName: "KT",
    logoUrl: `${lckTeamLogoBasePath}/kt-rolster.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:KT_Rolsterlogo_std.png",
    tier: "A",
    baseElo: 1615,
    strength: 82,
    budget: 550,
    salaryMultiplier: 1.03,
    appealModifier: 1,
    previousSeasonRank: 4,
  },
  {
    id: "dplus-kia",
    name: "Dplus KIA",
    shortName: "DK",
    logoUrl: `${lckTeamLogoBasePath}/dplus-kia.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:Dplus_Kialogo_std.png",
    tier: "A",
    baseElo: 1605,
    strength: 81,
    budget: 480,
    salaryMultiplier: 1.02,
    appealModifier: 1,
    previousSeasonRank: 5,
  },
  {
    id: "hanjin-brion",
    name: "Hanjin BRION",
    shortName: "BRO",
    logoUrl: `${lckTeamLogoBasePath}/hanjin-brion.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:BRIONlogo_std.png",
    tier: "B",
    baseElo: 1535,
    strength: 75,
    budget: 370,
    salaryMultiplier: 0.94,
    appealModifier: -1,
    previousSeasonRank: 6,
  },
  {
    id: "bnk-fearx",
    name: "BNK FEARX",
    shortName: "BFX",
    logoUrl: `${lckTeamLogoBasePath}/bnk-fearx.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:FearXlogo_std.png",
    tier: "B",
    baseElo: 1515,
    strength: 73,
    budget: 350,
    salaryMultiplier: 0.92,
    appealModifier: -1,
    previousSeasonRank: 7,
  },
  {
    id: "nongshim-redforce",
    name: "Nongshim RedForce",
    shortName: "NS",
    logoUrl: `${lckTeamLogoBasePath}/nongshim-redforce.webp`,
    logoSourceUrl:
      "https://lol.fandom.com/wiki/File:Nongshim_RedForcelogo_std.png",
    tier: "B",
    baseElo: 1530,
    strength: 75,
    budget: 430,
    salaryMultiplier: 0.96,
    appealModifier: 0,
    previousSeasonRank: 8,
  },
  {
    id: "kiwoom-drx",
    name: "Kiwoom DRX",
    shortName: "DRX",
    logoUrl: `${lckTeamLogoBasePath}/kiwoom-drx.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:Kiwoom_DRXlogo_std.png",
    tier: "C",
    baseElo: 1490,
    strength: 72,
    budget: 330,
    salaryMultiplier: 0.89,
    appealModifier: -2,
    previousSeasonRank: 9,
  },
  {
    id: "dn-soopers",
    name: "DN SOOPers",
    shortName: "DNF",
    logoUrl: `${lckTeamLogoBasePath}/dn-soopers.webp`,
    logoSourceUrl: "https://lol.fandom.com/wiki/File:DN_SOOPerslogo_std.png",
    tier: "C",
    baseElo: 1460,
    strength: 69,
    budget: 370,
    salaryMultiplier: 0.87,
    appealModifier: -3,
    previousSeasonRank: 10,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTeamName(value: string) {
  return value.trim().toLowerCase();
}

function getAdjustmentForTeam(
  team: LckTeamSeed,
  adjustments: TeamBalanceAdjustment[] = [],
) {
  const normalizedName = normalizeTeamName(team.name);
  const normalizedShortName = normalizeTeamName(team.shortName);

  return adjustments.find(
    (adjustment) =>
      adjustment.teamId === team.id ||
      normalizeTeamName(adjustment.teamName) === normalizedName ||
      normalizeTeamName(adjustment.teamName) === normalizedShortName,
  );
}

export function applyTeamBalanceAdjustment(
  team: LckTeamSeed,
  adjustments: TeamBalanceAdjustment[] = [],
): LckTeamSeed {
  const adjustment = getAdjustmentForTeam(team, adjustments);

  if (!adjustment) {
    return team;
  }

  return {
    ...team,
    baseElo: clamp(team.baseElo + adjustment.baseEloDelta, 1350, 1900),
    strength: clamp(team.strength + adjustment.strengthDelta, 60, 95),
    budget: clamp(team.budget + adjustment.budgetDelta, 250, 1100),
  };
}

export function findLckTeamSeed(value: string) {
  const normalizedValue = normalizeTeamName(value);

  return lck2026Teams.find(
    (team) =>
      normalizeTeamName(team.name) === normalizedValue ||
      normalizeTeamName(team.shortName) === normalizedValue ||
      team.id === normalizedValue,
  );
}

export function getLckTeamProfile(
  value: string,
  adjustments: TeamBalanceAdjustment[] = [],
) {
  const matchedTeam = findLckTeamSeed(value);
  const fallbackTeam = findLckTeamSeed("T1");
  const baseTeam =
    matchedTeam ??
    (fallbackTeam
      ? {
          ...fallbackTeam,
          id: "user-team",
          name: value.trim() || "T1",
          shortName: "USER",
        }
      : undefined);

  return baseTeam ? applyTeamBalanceAdjustment(baseTeam, adjustments) : undefined;
}

export function createPlayableLckTeams(
  userTeamName: string,
  adjustments: TeamBalanceAdjustment[] = [],
) {
  const normalizedUserTeamName = userTeamName.trim().toLowerCase();
  const matchedTeam = lck2026Teams.find(
    (team) =>
      team.name.toLowerCase() === normalizedUserTeamName ||
      team.shortName.toLowerCase() === normalizedUserTeamName,
  );
  const adjustedTeams = lck2026Teams.map((team) =>
    applyTeamBalanceAdjustment(team, adjustments),
  );

  if (matchedTeam) {
    return adjustedTeams;
  }

  return adjustedTeams.map((team) => {
    if (team.id !== "t1") {
      return team;
    }

    const customTeam = {
      ...team,
      id: "user-team",
      name: userTeamName.trim() || "T1",
      shortName: "USER",
    };

    const customAdjustment = adjustments.find(
      (adjustment) => adjustment.teamId === "user-team",
    );

    return customAdjustment
      ? applyTeamBalanceAdjustment(customTeam, [customAdjustment])
      : customTeam;
  });
}
