import type {
  LeagueCode,
  Opponent,
  Player,
  PlayerChampionProfile,
  Role,
  StrategyId,
  Team,
} from "../../types/game";
import { normalizeLeagueCode } from "../season/worldsQualification";

export const draftRoles: Role[] = ["top", "jungle", "mid", "bot", "support"];

const leagueCodes: LeagueCode[] = ["LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL"];

const styleChampionPreferences: Record<Opponent["style"], Record<Role, string[]>> = {
  aggressive: {
    top: ["renekton", "rumble", "aatrox"],
    jungle: ["lee-sin", "vi", "nidalee"],
    mid: ["ahri", "taliyah", "corki"],
    bot: ["kalista", "varus", "xayah"],
    support: ["nautilus", "rakan", "rell"],
  },
  tempo: {
    top: ["renekton", "gnar", "rumble"],
    jungle: ["lee-sin", "nidalee", "vi"],
    mid: ["taliyah", "ahri", "corki"],
    bot: ["kalista", "varus", "xayah"],
    support: ["nautilus", "rakan", "rell"],
  },
  scaling: {
    top: ["ksante", "gnar", "aatrox"],
    jungle: ["sejuani", "maokai", "vi"],
    mid: ["azir", "orianna", "corki"],
    bot: ["jinx", "zeri", "xayah"],
    support: ["lulu", "rakan", "alistar"],
  },
  macro: {
    top: ["gnar", "ksante", "rumble"],
    jungle: ["maokai", "sejuani", "taliyah"],
    mid: ["taliyah", "orianna", "ahri"],
    bot: ["varus", "xayah", "jinx"],
    support: ["rakan", "lulu", "nautilus"],
  },
  vision: {
    top: ["ksante", "gnar", "rumble"],
    jungle: ["maokai", "sejuani", "taliyah"],
    mid: ["orianna", "taliyah", "azir"],
    bot: ["varus", "xayah", "jinx"],
    support: ["rakan", "lulu", "nautilus"],
  },
  balanced: {
    top: ["ksante", "aatrox", "gnar"],
    jungle: ["vi", "sejuani", "maokai"],
    mid: ["azir", "orianna", "ahri"],
    bot: ["xayah", "varus", "jinx"],
    support: ["rakan", "nautilus", "lulu"],
  },
};

const styleArchetypes: Record<Opponent["style"], string[]> = {
  aggressive: ["lane-bully", "dive", "pick", "skirmish", "engage"],
  tempo: ["skirmish", "dive", "global", "pick"],
  scaling: ["scaling", "carry", "frontline", "enchanter"],
  macro: ["global", "utility", "poke", "blind-pick"],
  vision: ["utility", "poke", "pick", "enchanter"],
  balanced: ["blind-pick", "teamfight", "utility", "frontline"],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toLeagueCode(leagueLabel: string): LeagueCode {
  const normalizedLeagueLabel = normalizeLeagueCode(leagueLabel);

  return leagueCodes.includes(normalizedLeagueLabel)
    ? normalizedLeagueLabel
    : "LEC";
}

export function mapOpponentStyleToStrategy(style: Opponent["style"]): StrategyId {
  return style;
}

export function getRosterPlayersByRole(
  team: Team,
  players: Player[],
): Partial<Record<Role, Player>> {
  return draftRoles.reduce<Partial<Record<Role, Player>>>((result, role) => {
    const playerId = team.roster[role];
    const player = playerId
      ? players.find((candidate) => candidate.id === playerId)
      : undefined;

    if (player) {
      result[role] = player;
    }

    return result;
  }, {});
}

function createOpponentChampionProfile(
  opponent: Opponent,
  role: Role,
): PlayerChampionProfile {
  const preferredChampionIds = styleChampionPreferences[opponent.style][role];

  return {
    preferredChampionIds,
    dislikedChampionIds: [],
    signatureChampionIds: preferredChampionIds.slice(0, 1),
    masteryOverrides: Object.fromEntries(
      preferredChampionIds.map((championId, index) => [
        championId,
        clamp(opponent.strength + 8 - index * 3, 55, 95),
      ]),
    ),
    preferredArchetypes: styleArchetypes[opponent.style],
  };
}

function createOpponentPlayer(opponent: Opponent, role: Role): Player {
  const base = clamp(opponent.strength, 55, 94);
  const isCarryRole = role === "mid" || role === "bot";
  const isMapRole = role === "jungle" || role === "support";

  return {
    id: `${opponent.id}-${role}`,
    name: `${opponent.name} ${role}`,
    role,
    secondaryRoles: [],
    region: opponent.region,
    league: toLeagueCode(opponent.leagueLabel),
    currentTeam: opponent.name,
    availableForRoster: false,
    age: 23,
    cost: 0,
    salaryExpectation: 0,
    ability: base,
    potential: clamp(base + 3, 55, 97),
    overall: base,
    mechanics: clamp(base + (isCarryRole ? 3 : 0), 55, 97),
    macro: clamp(base + (isMapRole ? 4 : 1), 55, 97),
    laning: clamp(base + (role === "top" || role === "bot" || role === "mid" ? 3 : -4), 45, 97),
    teamfight: clamp(base + (opponent.style === "balanced" ? 4 : 1), 55, 98),
    mental: clamp(base + 1, 55, 96),
    championPool: clamp(base + 2, 55, 96),
    status: {
      form: 72,
      fatigue: 20,
      morale: "neutral",
      condition: 86,
      injuryRisk: 10,
    },
    mindset: {
      pressureResistance: clamp(base + 2, 55, 98),
      clutch: clamp(base + 1, 55, 97),
      consistency: clamp(base, 55, 96),
      tiltControl: clamp(base, 55, 96),
      leadership: isMapRole ? 80 : 68,
      teamwork: clamp(base + 2, 55, 97),
      communication: isMapRole ? 82 : 72,
      affinity: 72,
      professionalism: 78,
      ambition: 76,
    },
    adaptability: {
      metaAdaptability: clamp(base + 2, 55, 97),
      patchAdaptability: clamp(base + 1, 55, 97),
      roleFlexibility: 54,
      championLearning: clamp(base + 2, 55, 97),
      internationalAdaptability: clamp(base + 3, 55, 98),
    },
    chemistryProfile: {
      preferredTeammates: [],
      dislikedTeammates: [],
      synergyTags: styleArchetypes[opponent.style].slice(0, 2),
      playstyleTags: styleArchetypes[opponent.style],
      personalityTags: ["scouted-opponent"],
      languageTags: ["English"],
    },
    championProfile: createOpponentChampionProfile(opponent, role),
    development: {
      growthRate: 45,
      peakAgeStart: 22,
      peakAgeEnd: 27,
      declineRate: 8,
    },
    marketProfile: {
      marketability: base,
      fanbase: base,
      brandRisk: 8,
    },
    traits: styleArchetypes[opponent.style],
  };
}

export function createOpponentDraftPlayers(
  opponent: Opponent,
): Partial<Record<Role, Player>> {
  return draftRoles.reduce<Partial<Record<Role, Player>>>((result, role) => {
    result[role] = createOpponentPlayer(opponent, role);
    return result;
  }, {});
}
