import type { Competition, SeasonTemplate } from "../types/game";

const lckCup: Competition = {
  id: "lck-cup",
  name: "LCK Cup",
  scope: "lck",
  order: 1,
  calendarType: "both",
  qualificationRule: "LCK Cup result decides the LCK First Stand representatives.",
  formatSummary:
    "Uses the official-current LCK Cup regular and postseason schedule as closely as possible.",
  entrantsSummary: "LCK teams",
  stages: [
    {
      name: "Regular stage",
      format: "Follow official-current LCK Cup regular schedule.",
      notes: "Exact match list will be modeled after the reference LCK season data.",
    },
    {
      name: "Postseason",
      format: "Follow official-current LCK Cup postseason schedule.",
      notes: "Top teams qualify toward First Stand slots.",
    },
  ],
  status: "available",
};

const firstStand: Competition = {
  id: "first-stand",
  name: "First Stand",
  scope: "international",
  order: 2,
  calendarType: "both",
  qualificationRule:
    "LCK top 2, LPL top 2, and one team each from the 3rd-6th ranked leagues.",
  formatSummary: "8-team custom First Stand format.",
  entrantsSummary:
    "LCK 2, LPL 2, other 3rd-6th ranked leagues 1 each, total 8 teams.",
  stages: [
    {
      name: "Group Stage",
      format: "Two groups of four teams.",
      entrants: 8,
      advancing: 4,
      notes: "Top two teams from each group advance.",
    },
    {
      name: "Semifinals and Final",
      format: "Four-team knockout bracket.",
      entrants: 4,
      advancing: 1,
      notes: "World Cup-style single elimination.",
    },
  ],
  status: "locked",
};

const lckRounds12: Competition = {
  id: "lck-rounds-1-2",
  name: "LCK Rounds 1-2",
  scope: "lck",
  order: 3,
  calendarType: "both",
  qualificationRule: "Determines MSI qualification and later LCK seeding.",
  formatSummary:
    "Uses the official-current LCK Rounds 1-2 regular and postseason schedule.",
  entrantsSummary: "LCK teams",
  stages: [
    {
      name: "Rounds 1-2 regular stage",
      format: "Follow official-current LCK Rounds 1-2 schedule.",
    },
    {
      name: "Road to MSI / postseason",
      format: "Follow official-current LCK postseason schedule for MSI qualification.",
    },
  ],
  status: "locked",
};

const msi: Competition = {
  id: "msi",
  name: "MSI",
  scope: "international",
  order: 4,
  calendarType: "both",
  qualificationRule:
    "Top two teams from each major league except CBLOL, plus the CBLOL champion. First Stand winner league grants its second seed a bracket bye.",
  formatSummary:
    "11-team 2026 MSI format with play-in and upper/lower bracket stage.",
  entrantsSummary:
    "LCK 2, LPL 2, LEC 2, LCS 2, LCP 2, CBLOL 1, total 11 teams.",
  stages: [
    {
      name: "Play-In Stage",
      format: "Four-team single elimination.",
      entrants: 4,
      advancing: 1,
      notes: "The winner joins seven direct bracket-stage teams.",
    },
    {
      name: "Bracket Stage",
      format: "Eight-team upper/lower bracket double elimination.",
      entrants: 8,
      advancing: 1,
      notes: "Play-in final, upper final, lower final, and Grand Finals are BO5.",
    },
  ],
  status: "locked",
};

const lckRounds35: Competition = {
  id: "lck-rounds-3-5",
  name: "LCK Rounds 3-5",
  scope: "lck",
  order: 5,
  calendarType: "normal",
  qualificationRule: "Determines Worlds qualification.",
  formatSummary:
    "2025-reference normal season path. Uses official-current LCK Rounds 3-5 regular and postseason schedule.",
  entrantsSummary: "LCK teams",
  stages: [
    {
      name: "Rounds 3-5 regular stage",
      format: "Follow official-current LCK Rounds 3-5 schedule.",
    },
    {
      name: "LCK Playoffs",
      format: "Follow official-current LCK Worlds qualification postseason schedule.",
    },
  ],
  status: "locked",
};

const lckRounds34: Competition = {
  id: "lck-rounds-3-4",
  name: "LCK Rounds 3-4",
  scope: "lck",
  order: 5,
  calendarType: "asian-games",
  qualificationRule: "Determines Worlds qualification path in Asian Games seasons.",
  formatSummary:
    "2026-reference Asian Games path. Rounds 3-5 are shortened to Rounds 3-4 before Asian Games.",
  entrantsSummary: "LCK teams",
  stages: [
    {
      name: "Rounds 3-4 regular stage",
      format: "Follow official-current shortened LCK Rounds 3-4 schedule.",
    },
    {
      name: "LCK Playoffs",
      format:
        "Season Play-In followed by upper/lower bracket LCK Playoffs, all BO5 Fearless.",
      notes:
        "Final 1-3 are basic Worlds candidates; final 4th is kept for MSI extra-seed scenarios.",
    },
  ],
  status: "locked",
};

const asianGames: Competition = {
  id: "asian-games",
  name: "Asian Games",
  scope: "special",
  order: 6,
  calendarType: "asian-games",
  qualificationRule: "National team selection from the LCK player pool.",
  formatSummary: "Special international national-team event inserted before Worlds.",
  entrantsSummary: "National teams",
  stages: [
    {
      name: "National team event",
      format: "Compressed Asian Games event.",
      notes: "Selection rules, fatigue, morale, and reward effects are still open.",
    },
  ],
  status: "locked",
};

const worldsNormal: Competition = {
  id: "worlds",
  name: "Worlds",
  scope: "international",
  order: 6,
  calendarType: "normal",
  qualificationRule: "Based on final regional placements.",
  formatSummary: "20-team custom Worlds format.",
  entrantsSummary:
    "LCK/LPL/LCS/LEC base 3, LCP/CBLOL base 2, MSI bonus 2, LCQ 2, total 20 teams.",
  stages: [
    {
      name: "Qualification Pool",
      format: "Participant pool finalized first; play-in structure is implemented later.",
      entrants: 20,
      notes:
        "The 20-team pool is stored after MSI bonus seeds and regional results are known.",
    },
    {
      name: "Group Stage",
      format: "Four groups of four teams.",
      entrants: 16,
      advancing: 8,
      notes: "Top two teams from each group advance.",
    },
    {
      name: "Knockout Stage",
      format: "Eight-team World Cup-style knockout bracket.",
      entrants: 8,
      advancing: 1,
      notes: "Quarterfinals, semifinals, final.",
    },
  ],
  status: "locked",
};

const worldsAsianGames: Competition = {
  ...worldsNormal,
  order: 7,
  calendarType: "asian-games",
};

export const normalSeasonCompetitions: Competition[] = [
  lckCup,
  firstStand,
  lckRounds12,
  msi,
  lckRounds35,
  worldsNormal,
];

export const asianGamesSeasonCompetitions: Competition[] = [
  lckCup,
  firstStand,
  lckRounds12,
  msi,
  lckRounds34,
  asianGames,
  worldsAsianGames,
];

export const seasonTemplates: SeasonTemplate[] = [
  {
    id: "lck-2025-reference",
    name: "Normal LoL Esports Season",
    referenceSeason: 2025,
    type: "normal",
    description:
      "LCK Cup -> First Stand -> LCK Rounds 1-2 -> MSI -> LCK Rounds 3-5 -> Worlds.",
    competitions: normalSeasonCompetitions,
  },
  {
    id: "lck-2026-asian-games-reference",
    name: "Asian Games LoL Esports Season",
    referenceSeason: 2026,
    type: "asian-games",
    description:
      "LCK Cup -> First Stand -> LCK Rounds 1-2 -> MSI -> LCK Rounds 3-4 -> Asian Games -> Worlds.",
    competitions: asianGamesSeasonCompetitions,
  },
];
