import { lck2026Teams } from "./lckTeams";
import { lck2026RatingOverrides } from "./lck2026RatingOverrides";
import { lck2026RosterSeeds, type Lck2026RosterSeed } from "./lck2026RosterSeeds";
import { samplePlayers } from "./samplePlayers";
import type { Player, PlayerChampionProfile, Role } from "../types/game";

type NumericRatingKey =
  | "ability"
  | "potential"
  | "overall"
  | "mechanics"
  | "macro"
  | "laning"
  | "teamfight"
  | "mental"
  | "championPool"
  | "salaryExpectation";

const numericRatingKeys: NumericRatingKey[] = [
  "ability",
  "potential",
  "overall",
  "mechanics",
  "macro",
  "laning",
  "teamfight",
  "mental",
  "championPool",
  "salaryExpectation",
];

const roleTraits: Record<Role, string[]> = {
  top: ["side lane", "frontline"],
  jungle: ["tempo jungle", "objective setup"],
  mid: ["lane control", "teamfight setup"],
  bot: ["carry threat", "teamfight positioning"],
  support: ["vision control", "engage timing"],
};

const roleStatOffsets: Record<
  Role,
  Pick<Player, "mechanics" | "macro" | "laning" | "teamfight" | "mental" | "championPool">
> = {
  top: {
    mechanics: 2,
    macro: 0,
    laning: 4,
    teamfight: 1,
    mental: 0,
    championPool: 0,
  },
  jungle: {
    mechanics: 1,
    macro: 4,
    laning: -11,
    teamfight: 1,
    mental: 1,
    championPool: 2,
  },
  mid: {
    mechanics: 3,
    macro: 1,
    laning: 3,
    teamfight: 1,
    mental: 0,
    championPool: 3,
  },
  bot: {
    mechanics: 3,
    macro: -2,
    laning: 2,
    teamfight: 4,
    mental: 0,
    championPool: 1,
  },
  support: {
    mechanics: -3,
    macro: 4,
    laning: 0,
    teamfight: 2,
    mental: 2,
    championPool: 1,
  },
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashSeed(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTeamStrength(teamName: string) {
  return lck2026Teams.find((team) => team.name === teamName)?.strength ?? 72;
}

function getBaseOverall(seed: Lck2026RosterSeed) {
  const teamStrength = getTeamStrength(seed.teamName);
  const variance = (hashSeed(seed.name + seed.teamName) % 5) - 2;
  const tierOffset = seed.rosterTier === "main" ? -4 : -15;
  const min = seed.rosterTier === "main" ? 66 : 55;
  const max = seed.rosterTier === "main" ? 88 : 73;

  return clamp(teamStrength + tierOffset + variance, min, max);
}

function getPotential(seed: Lck2026RosterSeed, overall: number) {
  const ageBonus = seed.age <= 18 ? 9 : seed.age <= 20 ? 7 : seed.age <= 22 ? 5 : 2;
  const tierBonus = seed.rosterTier === "academy" ? 4 : 1;
  const variance = hashSeed(`${seed.name}:potential`) % 4;

  return clamp(overall + ageBonus + tierBonus + variance, overall + 1, 93);
}

function getSalaryExpectation(seed: Lck2026RosterSeed, overall: number) {
  const tierMultiplier = seed.rosterTier === "main" ? 4.1 : 3.2;
  const base = Math.round((overall - 50) * tierMultiplier + 16);
  const variance = (hashSeed(`${seed.name}:salary`) % 9) - 4;

  return clamp(base + variance, 35, 145);
}

function createChampionProfile(seed: Lck2026RosterSeed, traits: string[]): PlayerChampionProfile {
  return {
    preferredChampionIds: [],
    dislikedChampionIds: [],
    signatureChampionIds: [],
    masteryOverrides: {},
    preferredArchetypes: traits,
  };
}

function createGeneratedPlayer(seed: Lck2026RosterSeed): Player {
  const overall = getBaseOverall(seed);
  const potential = getPotential(seed, overall);
  const roleOffsets = roleStatOffsets[seed.role];
  const variance = (hashSeed(seed.name) % 5) - 2;
  const traits = [
    ...roleTraits[seed.role],
    seed.rosterTier === "academy" ? "prospect" : "main roster",
  ];

  const input: Player = {
    id: `lck-2026-${createSlug(seed.teamName)}-${createSlug(seed.name)}`,
    name: seed.name,
    realName: seed.realName,
    role: seed.role,
    secondaryRoles: [],
    region: "lck",
    league: "LCK",
    currentTeam: seed.teamName,
    rosterTier: seed.rosterTier,
    source: seed.source,
    availableForRoster: true,
    age: seed.age,
    cost: getSalaryExpectation(seed, overall),
    salaryExpectation: getSalaryExpectation(seed, overall),
    ability: clamp(overall - 1 + variance, 50, 90),
    potential,
    overall,
    mechanics: clamp(overall + roleOffsets.mechanics + variance, 45, 95),
    macro: clamp(overall + roleOffsets.macro - variance, 45, 95),
    laning: clamp(overall + roleOffsets.laning + variance, 45, 95),
    teamfight: clamp(overall + roleOffsets.teamfight - variance, 45, 95),
    mental: clamp(overall + roleOffsets.mental, 45, 95),
    championPool: clamp(overall + roleOffsets.championPool, 45, 95),
    status: {
      form: seed.rosterTier === "main" ? 70 : 64,
      fatigue: seed.rosterTier === "main" ? 18 : 10,
      morale: "neutral",
      condition: seed.rosterTier === "main" ? 88 : 92,
      injuryRisk: seed.rosterTier === "main" ? 12 : 8,
    },
    mindset: {
      pressureResistance: clamp(overall + roleOffsets.mental, 45, 95),
      clutch: clamp(Math.round((overall + roleOffsets.teamfight + overall) / 2), 45, 95),
      consistency: clamp(Math.round((overall + potential) / 2), 45, 95),
      tiltControl: clamp(overall + roleOffsets.mental - 1, 45, 95),
      leadership: seed.role === "mid" || seed.role === "support" ? 78 : 68,
      teamwork: clamp(Math.round((overall + roleOffsets.macro + overall) / 2), 45, 95),
      communication: seed.role === "jungle" || seed.role === "support" ? 80 : 72,
      affinity: 72,
      professionalism: 77,
      ambition: clamp(potential - 4, 55, 95),
    },
    adaptability: {
      metaAdaptability: clamp(Math.round((overall + roleOffsets.macro + overall) / 2), 45, 95),
      patchAdaptability: clamp(Math.round((overall + potential) / 2), 45, 95),
      roleFlexibility: 58,
      championLearning: clamp(Math.round((overall + potential) / 2), 45, 95),
      internationalAdaptability: clamp(Math.round((overall + roleOffsets.macro) / 2), 45, 95),
    },
    chemistryProfile: {
      preferredTeammates: [],
      dislikedTeammates: [],
      synergyTags: traits.slice(0, 2),
      playstyleTags: traits,
      personalityTags: seed.role === "support" ? ["connector"] : ["competitive"],
      languageTags: ["Korean"],
    },
    championProfile: createChampionProfile(seed, traits),
    development: {
      growthRate: Math.max(35, potential - overall + 45),
      peakAgeStart: 22,
      peakAgeEnd: 27,
      declineRate: seed.age >= 27 ? 10 : 8,
      prospectTier: seed.rosterTier === "academy" || seed.age <= 19 ? "B" : undefined,
    },
    marketProfile: {
      marketability: Math.round((overall + inputMental(seed, overall)) / 2),
      fanbase: Math.round((overall + inputAbility(overall, variance)) / 2),
      brandRisk: 8,
    },
    traits,
  };

  return applyRatingOverride(input);
}

function inputAbility(overall: number, variance: number) {
  return clamp(overall - 1 + variance, 50, 90);
}

function inputMental(seed: Lck2026RosterSeed, overall: number) {
  return clamp(overall + roleStatOffsets[seed.role].mental, 45, 95);
}

function applyRatingOverride(player: Player): Player {
  const override = lck2026RatingOverrides[player.name];

  if (!override) {
    return player;
  }

  const next: Player = {
    ...player,
    traits: override.traits ?? player.traits,
  };

  for (const key of numericRatingKeys) {
    const value = override[key];

    if (typeof value === "number") {
      next[key] = value;
    }
  }

  next.cost = next.salaryExpectation;
  next.championProfile = {
    ...next.championProfile,
    preferredArchetypes: next.traits,
  };

  return next;
}

function createPlayerFromSeed(seed: Lck2026RosterSeed, samplePlayer?: Player): Player {
  const player = samplePlayer
    ? {
        ...samplePlayer,
        realName: seed.realName ?? samplePlayer.realName,
        age: seed.age,
        currentTeam: seed.teamName,
        rosterTier: seed.rosterTier,
        source: seed.source,
      }
    : createGeneratedPlayer(seed);

  return applyRatingOverride(player);
}

function createLck2026Players() {
  const sampleByName = new Map(
    samplePlayers.map((player) => [normalizeName(player.name), player]),
  );
  const seenNames = new Set<string>();
  const players: Player[] = [];

  for (const seed of lck2026RosterSeeds) {
    const nameKey = normalizeName(seed.name);

    if (seenNames.has(nameKey)) {
      continue;
    }

    seenNames.add(nameKey);
    players.push(createPlayerFromSeed(seed, sampleByName.get(nameKey)));
  }

  return players.sort((a, b) => {
    const teamCompare = (a.currentTeam ?? "").localeCompare(b.currentTeam ?? "");

    if (teamCompare !== 0) {
      return teamCompare;
    }

    const tierCompare = (a.rosterTier ?? "").localeCompare(b.rosterTier ?? "");

    if (tierCompare !== 0) {
      return tierCompare;
    }

    return b.overall - a.overall || a.name.localeCompare(b.name);
  });
}

export const lck2026Players: Player[] = createLck2026Players();
