export type Region = "lck" | "international";

export type Role = "top" | "jungle" | "mid" | "bot" | "support";

export type CompetitionScope = "lck" | "international" | "special";

export type SeasonCalendarType = "normal" | "asian-games";

export type CompetitionId =
  | "lck-cup"
  | "first-stand"
  | "lck-rounds-1-2"
  | "msi"
  | "lck-rounds-3-5"
  | "lck-rounds-3-4"
  | "worlds"
  | "asian-games";

export type LeagueCode = "LCK" | "LPL" | "LEC" | "LTA" | "LCP" | "CBLOL";

export type Player = {
  id: string;
  name: string;
  role: Role;
  secondaryRoles: Role[];
  region: Region;
  league: LeagueCode;
  currentTeam?: string;
  availableForRoster: boolean;
  age: number;
  retirementAge?: number;
  militaryServiceStatus?: "none" | "pending" | "serving" | "completed";
  cost: number;
  salaryExpectation: number;
  ability: number;
  potential: number;
  overall: number;
  mechanics: number;
  macro: number;
  laning: number;
  teamfight: number;
  mental: number;
  championPool: number;
  status: PlayerStatus;
  mindset: PlayerMindset;
  adaptability: PlayerAdaptability;
  chemistryProfile: PlayerChemistryProfile;
  championProfile: PlayerChampionProfile;
  development: PlayerDevelopment;
  marketProfile: PlayerMarketProfile;
  traits: string[];
};

export type PlayerStatus = {
  form: number;
  fatigue: number;
  morale: MoraleLevel;
  condition: number;
  injuryRisk: number;
};

export type MoraleLevel = "very-high" | "high" | "neutral" | "low" | "very-low";

export type PlayerMindset = {
  pressureResistance: number;
  clutch: number;
  consistency: number;
  tiltControl: number;
  leadership: number;
  teamwork: number;
  communication: number;
  affinity: number;
  professionalism: number;
  ambition: number;
};

export type PlayerAdaptability = {
  metaAdaptability: number;
  patchAdaptability: number;
  roleFlexibility: number;
  championLearning: number;
  internationalAdaptability: number;
};

export type PlayerChemistryProfile = {
  preferredTeammates: string[];
  dislikedTeammates: string[];
  synergyTags: string[];
  playstyleTags: string[];
  personalityTags: string[];
  languageTags: string[];
};

export type PlayerChampionProfile = {
  preferredChampionIds: string[];
  dislikedChampionIds: string[];
  signatureChampionIds: string[];
  masteryOverrides: Record<string, number>;
  preferredArchetypes: string[];
};

export type PlayerDevelopment = {
  growthRate: number;
  peakAgeStart: number;
  peakAgeEnd: number;
  declineRate: number;
  prospectTier?: "S" | "A" | "B" | "C";
};

export type PlayerMarketProfile = {
  marketability: number;
  fanbase: number;
  brandRisk: number;
  buyoutEstimate?: number;
};

export type ContractType = "one-year" | "two-year" | "one-plus-one";

export type PlayerContract = {
  playerId: string;
  salary: number;
  type: ContractType;
  guaranteedYears: 1 | 2;
  optionYear?: boolean;
  remainingYears: number;
};

export type Team = {
  name: string;
  region: Region;
  budget: number;
  rosterSettings: TeamRosterSettings;
  roster: Partial<Record<Role, string>>;
  mainRosterPlayerIds: string[];
  academyRosterPlayerIds: string[];
  contracts: PlayerContract[];
  wins: number;
  losses: number;
  elo: number;
};

export type TeamRosterSettings = {
  minPlayers: 10;
  maxPlayers: 15;
  freeMovementBetweenMainAndAcademy: boolean;
};

export type Competition = {
  id: CompetitionId;
  name: string;
  scope: CompetitionScope;
  order: number;
  calendarType: SeasonCalendarType | "both";
  qualificationRule?: string;
  formatSummary: string;
  entrantsSummary?: string;
  stages: TournamentStage[];
  status: "locked" | "available" | "active" | "completed";
};

export type TournamentStage = {
  name: string;
  format: string;
  entrants?: number;
  advancing?: number;
  notes?: string;
};

export type SeasonCalendar = {
  seasonNumber: number;
  yearLabel?: number;
  type: SeasonCalendarType;
  competitions: Competition[];
};

export type SeasonTemplate = {
  id: "lck-2025-reference" | "lck-2026-asian-games-reference";
  name: string;
  referenceSeason: 2025 | 2026;
  type: SeasonCalendarType;
  description: string;
  competitions: Competition[];
};

export type SeasonSummary = {
  seasonNumber: number;
  calendarType: SeasonCalendarType;
  lckResult: string;
  internationalResult?: string;
  asianGamesResult?: string;
  finalElo: number;
};

export type Opponent = {
  id: string;
  name: string;
  region: Region;
  leagueLabel: string;
  appearsIn: CompetitionId[];
  strength: number;
  style: StrategyId;
};

export type StrategyId =
  | "aggressive"
  | "tempo"
  | "macro"
  | "vision"
  | "scaling"
  | "balanced";

export type TrainingIntensity = "high" | "normal" | "light" | "rest";

export type WeeklyPlan = {
  strategy: StrategyId;
  trainingIntensity: TrainingIntensity;
};

export type MatchResult = {
  winner: "user" | "opponent";
  winProbability: number;
  teamPower: number;
  opponentPower: number;
  draftPower: number;
  draft?: MatchDraftSummary;
  log: string[];
};

export type MatchDraftSummary = {
  bluePicks: Partial<Record<Role, DraftPickSummary>>;
  redPicks: Partial<Record<Role, DraftPickSummary>>;
  blueBans: string[];
  redBans: string[];
  blueDraftPower: number;
  redDraftPower: number;
  netDraftPower: number;
  notes: string[];
  usedChampionIds: string[];
};

export type DraftPickSummary = {
  championId: string;
  championName: string;
  fitScore: number;
  reasons: string[];
};

export type SeasonPhase = "stove-league" | "competition" | "offseason" | "completed";

export type CompetitionStateStatus = Competition["status"];

export type MatchFormat = "bo1" | "bo3" | "bo5";

export type MatchScheduleStatus = "scheduled" | "completed";

export type SeasonProgressStatus = "idle" | "match-preview" | "match-review";

export type SeasonProgressActionLabel = "진행" | "플레이" | "계속";

export type LckCupGroupName = "baron" | "elder";

export type SeriesScore = {
  blueWins: number;
  redWins: number;
};

export type StandingEntry = {
  teamId: string;
  teamName: string;
  rank: number;
  initialSeed: number;
  wins: number;
  losses: number;
  matchWins: number;
  matchLosses: number;
  setWins: number;
  setLosses: number;
  winRate: number;
  isUserTeam: boolean;
  lckCupGroup?: LckCupGroupName;
};

export type MatchSchedule = {
  id: string;
  competitionId: CompetitionId;
  week: number;
  scheduledDate?: string;
  stageName: string;
  blueTeamId: string;
  blueTeamName: string;
  redTeamId: string;
  redTeamName: string;
  format: MatchFormat;
  status: MatchScheduleStatus;
  fearlessEnabled: boolean;
  recordId?: string;
};

export type MatchRecord = {
  id: string;
  scheduleId: string;
  competitionId: CompetitionId;
  week: number;
  stageName: string;
  winnerSide: "blue" | "red";
  winnerTeamId: string;
  winnerTeamName: string;
  score: SeriesScore;
  userResult: "win" | "loss" | "none";
  winProbability?: number;
  draft?: MatchDraftSummary;
  log: string[];
  createdAtTurn: number;
};

export type CompetitionState = {
  competitionId: CompetitionId;
  name: string;
  status: CompetitionStateStatus;
  currentStageName: string;
  currentWeek: number;
  standings: StandingEntry[];
  schedule: MatchSchedule[];
  qualifiedTeamIds: string[];
  qualifiedTeamNames: string[];
  winnerTeamId?: string;
  winnerTeamName?: string;
  completed: boolean;
};

export type StoveLeagueState = {
  status: "active" | "completed";
  currentWeek: number;
  totalWeeks: number;
  completed: boolean;
};

export type SeasonState = {
  seasonNumber: number;
  yearLabel: number;
  calendarType: SeasonCalendarType;
  phase: SeasonPhase;
  currentCompetitionId: CompetitionId | null;
  currentWeek: number;
  currentTurn: number;
  currentDateKey: string;
  currentDateLabel: string;
  progressStatus: SeasonProgressStatus;
  stoveLeague: StoveLeagueState;
  competitions: CompetitionState[];
  scheduledMatches: MatchSchedule[];
  matchRecords: MatchRecord[];
  nextMatchIds: string[];
  lastMatchRecordIds: string[];
};

export type CareerSave = {
  currentSeason: number;
  maxSeason: 20;
  userTeam: Team;
  lckPlayers: Player[];
  internationalOpponents: Opponent[];
  weeklyPlan: WeeklyPlan;
  seasonState: SeasonState;
  seasonHistory: SeasonSummary[];
};
