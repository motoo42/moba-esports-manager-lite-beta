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

export type LeagueCode = "LCK" | "LPL" | "LEC" | "LCS" | "LCP" | "CBLOL";

export type Player = {
  id: string;
  name: string;
  realName?: string;
  nativeName?: string;
  role: Role;
  secondaryRoles: Role[];
  region: Region;
  league: LeagueCode;
  currentTeam?: string;
  rosterTier?: "main" | "academy" | "free-agent";
  portraitUrl?: string;
  portraitSourceUrl?: string;
  source?:
    | "lck-2026-rounds-1-2"
    | "lck-cl-2026-rounds-1-2"
    | "manual-balance";
  availableForRoster: boolean;
  age: number;
  retirementAge?: number;
  retirementCandidate?: boolean;
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

export type TeamBalanceTier = "S" | "A" | "B" | "C";

export type TeamBalanceAdjustment = {
  teamId: string;
  teamName: string;
  expectedRank: number;
  resultRank: number;
  baseEloDelta: number;
  strengthDelta: number;
  budgetDelta: number;
  reason: string;
};

export type TeamRosterSettings = {
  minPlayers: 10;
  maxPlayers: 15;
  freeMovementBetweenMainAndAcademy: boolean;
  minMainRosterPlayers?: number;
  minAcademyRosterPlayers?: number;
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

export type LateSeasonCompetitionId = "lck-rounds-3-5" | "lck-rounds-3-4";

export type SeasonProfile = {
  seasonNumber: number;
  yearLabel: number;
  calendarType: SeasonCalendarType;
  templateId: SeasonTemplate["id"];
  hasAsianGames: boolean;
  postMsiCompetitionId: LateSeasonCompetitionId;
  lateSeasonCompetitionId: LateSeasonCompetitionId;
  competitionIds: CompetitionId[];
};

export type SeasonSummary = {
  seasonNumber: number;
  yearLabel?: number;
  calendarType: SeasonCalendarType;
  lckResult: string;
  internationalResult?: string;
  asianGamesResult?: string;
  finalElo: number;
  completedDateKey?: string;
  finalRecord?: {
    wins: number;
    losses: number;
  };
  competitionResults?: SeasonCompetitionSummary[];
  worldsChampionTeamName?: string;
  expiredContractPlayerIds?: string[];
  offseasonSummary?: SeasonOffseasonSummary;
  nextSeasonNumber?: number;
};

export type SeasonOffseasonSummary = {
  renewedPlayerIds?: string[];
  releasedPlayerIds?: string[];
  signedPlayerIds?: string[];
  aiSigningCount?: number;
  retiredPlayerIds?: string[];
  militaryServicePlayerIds?: string[];
  notableLogEntries?: OffseasonLogEntry[];
};

export type SeasonCompetitionSummary = {
  competitionId: CompetitionId;
  competitionName: string;
  resultLabel: string;
  winnerTeamName?: string;
  userResultLabel?: string;
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

export type SeasonProgressActionLabel = "진행" | "플레이" | "계속" | "다음날";

export type LckCupGroupName = "baron" | "elder";

export type LckRoundsGroupName = "legend" | "rise";

export type AsianGamesCountryCode =
  | "KOR"
  | "CHN"
  | "TPE"
  | "JPN"
  | "HKG"
  | "VIE"
  | "IND"
  | "MAC";

export type AsianGamesPlayMode = "undecided" | "manual" | "auto";

export type AsianGamesStatus =
  | "pending"
  | "roster-selected"
  | "decision-pending"
  | "active"
  | "completed";

export type AsianGamesRosterMember = {
  playerId: string;
  playerName: string;
  role: Role;
  isStarter: boolean;
  selectionReason: "role-best-form" | "sixth-best-form";
  formAtSelection: number;
  overallAtSelection: number;
};

export type AsianGamesMedalResult = {
  goldTeamId: string;
  goldTeamName: string;
  silverTeamId: string;
  silverTeamName: string;
  bronzeTeamId: string;
  bronzeTeamName: string;
};

export type AsianGamesState = {
  status: AsianGamesStatus;
  playMode: AsianGamesPlayMode;
  rosterSelectedDateKey?: string;
  playChoiceDateKey?: string;
  tournamentStartDateKey?: string;
  roster: AsianGamesRosterMember[];
  medals?: AsianGamesMedalResult;
};

export type WorldsQualificationStatus =
  | "pending-msi"
  | "msi-seeds-decided"
  | "lck-seeds-decided";

export type MsiWorldsLeagueResult = {
  leagueLabel: LeagueCode;
  rank: number;
  bestTeamId: string;
  bestTeamName: string;
  resultLabel: string;
  initialSeed: number;
};

export type LckWorldsSeedStatus = "qualified" | "conditional-missed";

export type LckWorldsSeed = {
  seed: 1 | 2 | 3 | 4;
  teamId: string;
  teamName: string;
  status: LckWorldsSeedStatus;
  sourceLabel: string;
};

export type WorldsEntrantSource =
  | "regional-base"
  | "msi-bonus"
  | "lcq-placeholder";

export type WorldsEntrant = {
  teamId: string;
  teamName: string;
  leagueLabel: LeagueCode | "LCQ";
  seed: number;
  slotLabel: string;
  source: WorldsEntrantSource;
  isPlaceholder: boolean;
};

export type WorldsQualificationState = {
  status: WorldsQualificationStatus;
  sourceCompetitionId: "msi";
  decidedAtDateKey?: string;
  bonusLeagueLabels: LeagueCode[];
  msiLeagueResults: MsiWorldsLeagueResult[];
  lckSeeds: LckWorldsSeed[];
  entrants: WorldsEntrant[];
  totalEntrants: number;
};

export type WorldsStatus =
  | "pending"
  | "play-in"
  | "group-stage"
  | "knockout"
  | "completed";

export type WorldsGroupStage = "play-in" | "group-stage";

export type WorldsGroupId =
  | "play-in-a"
  | "play-in-b"
  | "group-a"
  | "group-b"
  | "group-c"
  | "group-d";

export type WorldsGroupAssignment = {
  stage: WorldsGroupStage;
  groupId: WorldsGroupId;
  teamId: string;
  teamName: string;
  leagueLabel: LeagueCode | "LCQ";
  initialSeed: number;
};

export type WorldsState = {
  status: WorldsStatus;
  startDateKey?: string;
  playInGroups: WorldsGroupAssignment[];
  groupStageGroups: WorldsGroupAssignment[];
  knockoutTeamIds: string[];
  knockoutTeamNames: string[];
  finalistTeamIds?: string[];
  finalistTeamNames?: string[];
  championTeamId?: string;
  championTeamName?: string;
  runnerUpTeamId?: string;
  runnerUpTeamName?: string;
  semifinalistTeamIds?: string[];
  semifinalistTeamNames?: string[];
};

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
  lckRoundsGroup?: LckRoundsGroupName;
  worldsGroup?: WorldsGroupId;
  worldsStage?: WorldsGroupStage;
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

export type OffseasonStatus =
  | "summary"
  | "renewal-bridge"
  | "active"
  | "ready-for-next-season"
  | "career-completed";

export type OffseasonMarketStatus =
  | "not-started"
  | "renewal-week"
  | "free-agency"
  | "final-day"
  | "blocked"
  | "completed";

export type OffseasonContext = "preseason" | "postseason";

export type OffseasonOfferKind = "contract" | "transfer";

export type OffseasonNegotiationContext =
  | "renewal"
  | "free-agent"
  | "ai-depth";

export type OffseasonOfferStatus =
  | "pending"
  | "confirmation-pending"
  | "accepted"
  | "rejected"
  | "lost"
  | "withdrawn";

export type OffseasonRequestedRosterRole =
  | "starter"
  | "sixth-man"
  | "academy";

export type OffseasonOffer = {
  id: string;
  kind: OffseasonOfferKind;
  fromTeamName: string;
  toTeamName: string;
  playerIds: string[];
  salaryOffer: number;
  contractType?: ContractType;
  status: OffseasonOfferStatus;
  createdDay: number;
  resolvedDay?: number;
  score?: number;
  negotiationContext?: OffseasonNegotiationContext;
  minAcceptableSalary?: number;
  visibleDemand?: number;
  moodScore?: number;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  rejectionReason?: string;
};

export type OffseasonLogType =
  | "system"
  | "renewal"
  | "release"
  | "signing"
  | "ai-signing"
  | "rejection"
  | "retirement"
  | "military"
  | "blocked";

export type OffseasonLogEntry = {
  id: string;
  day: number;
  week: number;
  type: OffseasonLogType;
  message: string;
  isUserTeamRelated?: boolean;
};

export type OffseasonState = {
  context?: OffseasonContext;
  status: OffseasonStatus;
  completedSeasonNumber: number;
  nextSeasonNumber?: number;
  startedDateKey: string;
  expiredContractPlayerIds: string[];
  renewedPlayerIds: string[];
  summarySeasonNumber: number;
  bridgeNote?: string;
  currentDay?: number;
  currentWeek?: number;
  totalDays?: number;
  totalWeeks?: number;
  marketStatus?: OffseasonMarketStatus;
  freeAgentPlayerIds?: string[];
  pendingOffers?: OffseasonOffer[];
  resolvedOffers?: OffseasonOffer[];
  releasedPlayerIds?: string[];
  signedPlayerIds?: string[];
  resolvedExpiredPlayerIds?: string[];
  retiredPlayerIds?: string[];
  militaryServicePlayerIds?: string[];
  logEntries?: OffseasonLogEntry[];
  validationErrors?: string[];
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
  asianGames?: AsianGamesState;
  worlds?: WorldsState;
  worldsQualification?: WorldsQualificationState;
  offseason?: OffseasonState;
  teamBalanceAdjustments?: TeamBalanceAdjustment[];
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
