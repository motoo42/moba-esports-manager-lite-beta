import type {
  CompetitionState,
  LeagueCode,
  MatchRecord,
  SeasonState,
  WorldsEntrant,
  WorldsQualificationState,
} from "../../types/game";

type TeamLike = {
  teamId: string;
  teamName: string;
};

type MsiTeamPlacement = TeamLike & {
  initialSeed: number;
  leagueLabel: LeagueCode;
  rank: number;
  resultLabel: string;
};

const leagueCodes: LeagueCode[] = ["LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL"];

const msiWorldsMatchIds = {
  playInSemifinal1: "msi-play-in-semifinal-1",
  playInSemifinal2: "msi-play-in-semifinal-2",
  playInFinal: "msi-play-in-final",
  lowerRound1A: "msi-lower-round-1-a",
  lowerRound1B: "msi-lower-round-1-b",
  lowerRound2A: "msi-lower-round-2-a",
  lowerRound2B: "msi-lower-round-2-b",
  lowerRound3: "msi-lower-round-3",
  lowerFinal: "msi-lower-final",
  grandFinal: "msi-grand-final",
} as const;

const worldsBaseSlots: Record<LeagueCode, number> = {
  LCK: 3,
  LPL: 3,
  LEC: 3,
  LCS: 3,
  LCP: 2,
  CBLOL: 2,
};

export function normalizeLeagueCode(
  leagueLabel: string | undefined,
  fallback: LeagueCode = "LEC",
): LeagueCode {
  const normalized = leagueLabel?.trim().toUpperCase();

  if (normalized === "LTA") {
    return "LCS";
  }

  return leagueCodes.includes(normalized as LeagueCode)
    ? (normalized as LeagueCode)
    : fallback;
}

function getMsiLeagueForTeamId(teamId: string): LeagueCode {
  if (teamId.startsWith("msi-lpl")) {
    return "LPL";
  }

  if (teamId.startsWith("msi-lec")) {
    return "LEC";
  }

  if (teamId.startsWith("msi-lcs") || teamId.startsWith("msi-lta")) {
    return "LCS";
  }

  if (teamId.startsWith("msi-lcp")) {
    return "LCP";
  }

  if (teamId.startsWith("msi-cblol")) {
    return "CBLOL";
  }

  return "LCK";
}

function getTeam(competition: CompetitionState, teamId: string) {
  const entry = competition.standings.find((candidate) => candidate.teamId === teamId);

  if (!entry) {
    return undefined;
  }

  return {
    teamId: entry.teamId,
    teamName: entry.teamName,
    initialSeed: entry.initialSeed,
    leagueLabel: getMsiLeagueForTeamId(entry.teamId),
  };
}

function getRecord(records: MatchRecord[], scheduleId: string) {
  return records.find((record) => record.scheduleId === scheduleId);
}

function getSchedule(competition: CompetitionState, scheduleId: string) {
  return competition.schedule.find((match) => match.id === scheduleId);
}

function getWinner(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
) {
  const record = getRecord(records, scheduleId);

  return record ? getTeam(competition, record.winnerTeamId) : undefined;
}

function getLoser(
  competition: CompetitionState,
  records: MatchRecord[],
  scheduleId: string,
) {
  const record = getRecord(records, scheduleId);
  const schedule = getSchedule(competition, scheduleId);

  if (!record || !schedule) {
    return undefined;
  }

  const loserTeamId =
    record.winnerTeamId === schedule.blueTeamId
      ? schedule.redTeamId
      : schedule.blueTeamId;

  return getTeam(competition, loserTeamId);
}

function appendPlacements(
  placements: MsiTeamPlacement[],
  teams: Array<ReturnType<typeof getTeam> | undefined>,
  resultLabel: string,
) {
  teams
    .flatMap((team) => (team ? [team] : []))
    .sort((left, right) => left.initialSeed - right.initialSeed)
    .forEach((team) => {
      placements.push({
        ...team,
        rank: placements.length + 1,
        resultLabel,
      });
    });
}

export function calculateMsiWorldsSeedAllocation(
  competition: CompetitionState,
  records: MatchRecord[],
) {
  const placements: MsiTeamPlacement[] = [];

  appendPlacements(
    placements,
    [getWinner(competition, records, msiWorldsMatchIds.grandFinal)],
    "MSI 우승",
  );
  appendPlacements(
    placements,
    [getLoser(competition, records, msiWorldsMatchIds.grandFinal)],
    "MSI 준우승",
  );
  appendPlacements(
    placements,
    [getLoser(competition, records, msiWorldsMatchIds.lowerFinal)],
    "Lower Final 탈락",
  );
  appendPlacements(
    placements,
    [getLoser(competition, records, msiWorldsMatchIds.lowerRound3)],
    "Lower Round 3 탈락",
  );
  appendPlacements(
    placements,
    [
      getLoser(competition, records, msiWorldsMatchIds.lowerRound2A),
      getLoser(competition, records, msiWorldsMatchIds.lowerRound2B),
    ],
    "Lower Round 2 탈락",
  );
  appendPlacements(
    placements,
    [
      getLoser(competition, records, msiWorldsMatchIds.lowerRound1A),
      getLoser(competition, records, msiWorldsMatchIds.lowerRound1B),
    ],
    "Lower Round 1 탈락",
  );
  appendPlacements(
    placements,
    [getLoser(competition, records, msiWorldsMatchIds.playInFinal)],
    "Play-In Final 탈락",
  );
  appendPlacements(
    placements,
    [
      getLoser(competition, records, msiWorldsMatchIds.playInSemifinal1),
      getLoser(competition, records, msiWorldsMatchIds.playInSemifinal2),
    ],
    "Play-In Semifinal 탈락",
  );

  const bestResultByLeague = placements.reduce<Map<LeagueCode, MsiTeamPlacement>>(
    (result, placement) => {
      const previous = result.get(placement.leagueLabel);

      if (!previous || placement.rank < previous.rank) {
        result.set(placement.leagueLabel, placement);
      }

      return result;
    },
    new Map(),
  );
  const msiLeagueResults = [...bestResultByLeague.values()]
    .sort((left, right) => left.rank - right.rank)
    .map((placement) => ({
      leagueLabel: placement.leagueLabel,
      rank: placement.rank,
      bestTeamId: placement.teamId,
      bestTeamName: placement.teamName,
      resultLabel: placement.resultLabel,
      initialSeed: placement.initialSeed,
    }));

  return {
    teamPlacements: placements,
    msiLeagueResults,
    bonusLeagueLabels: msiLeagueResults.slice(0, 2).map((result) => result.leagueLabel),
  };
}

function createPlaceholderLckSeeds(bonusLeagueLabels: LeagueCode[]) {
  const lckHasBonusSeed = bonusLeagueLabels.includes("LCK");
  const seedCount = lckHasBonusSeed ? 4 : 3;

  return Array.from({ length: 4 }, (_, index) => {
    const seed = (index + 1) as 1 | 2 | 3 | 4;
    const isQualified = index < seedCount;

    return {
      seed,
      teamId: `worlds-lck-${seed}`,
      teamName: `LCK ${seed}시드 미정`,
      status: isQualified ? "qualified" as const : "conditional-missed" as const,
      sourceLabel:
        seed === 4
          ? isQualified
            ? "MSI 추가 시드"
            : "MSI 추가 시드 조건 미충족"
          : "LCK 기본 시드",
    };
  });
}

export function createLckWorldsSeeds(
  finalPlacements: TeamLike[],
  bonusLeagueLabels: LeagueCode[],
) {
  const lckHasBonusSeed = bonusLeagueLabels.includes("LCK");

  return finalPlacements.slice(0, 4).map((team, index) => {
    const seed = (index + 1) as 1 | 2 | 3 | 4;
    const isQualified = index < 3 || (index === 3 && lckHasBonusSeed);

    return {
      seed,
      teamId: team.teamId,
      teamName: team.teamName,
      status: isQualified ? "qualified" as const : "conditional-missed" as const,
      sourceLabel:
        seed === 4
          ? isQualified
            ? "MSI 추가 시드"
            : "MSI 추가 시드 조건 미충족"
          : "LCK 기본 시드",
    };
  });
}

function createPlaceholderEntrant({
  leagueLabel,
  seed,
  source,
}: {
  leagueLabel: LeagueCode | "LCQ";
  seed: number;
  source: WorldsEntrant["source"];
}): WorldsEntrant {
  return {
    teamId: `worlds-${leagueLabel.toLowerCase()}-${seed}`,
    teamName: `${leagueLabel} ${seed}시드 미정`,
    leagueLabel,
    seed,
    slotLabel: `${leagueLabel} ${seed}`,
    source,
    isPlaceholder: true,
  };
}

export function createWorldsEntrants({
  bonusLeagueLabels,
  lckSeeds,
}: {
  bonusLeagueLabels: LeagueCode[];
  lckSeeds: WorldsQualificationState["lckSeeds"];
}) {
  const lckEntrants: WorldsEntrant[] = lckSeeds
    .filter((seed) => seed.status === "qualified")
    .map((seed) => ({
      teamId: seed.teamId,
      teamName: seed.teamName,
      leagueLabel: "LCK" as const,
      seed: seed.seed,
      slotLabel: `LCK ${seed.seed}`,
      source: seed.seed === 4 ? "msi-bonus" as const : "regional-base" as const,
      isPlaceholder: seed.teamId.startsWith("worlds-lck-"),
    }));
  const regionalEntrants = leagueCodes
    .filter((leagueLabel) => leagueLabel !== "LCK")
    .flatMap((leagueLabel) =>
      Array.from({ length: worldsBaseSlots[leagueLabel] }, (_, index) =>
        createPlaceholderEntrant({
          leagueLabel,
          seed: index + 1,
          source: "regional-base",
        }),
      ),
    );
  const bonusEntrants = bonusLeagueLabels
    .filter((leagueLabel) => leagueLabel !== "LCK")
    .map((leagueLabel) =>
      createPlaceholderEntrant({
        leagueLabel,
        seed: worldsBaseSlots[leagueLabel] + 1,
        source: "msi-bonus",
      }),
    );
  const lcqEntrants = [1, 2].map((seed) =>
    createPlaceholderEntrant({
      leagueLabel: "LCQ",
      seed,
      source: "lcq-placeholder",
    }),
  );

  return [...lckEntrants, ...regionalEntrants, ...bonusEntrants, ...lcqEntrants];
}

function createQualificationState({
  bonusLeagueLabels,
  decidedAtDateKey,
  lckSeeds,
  msiLeagueResults,
  status,
}: {
  bonusLeagueLabels: LeagueCode[];
  decidedAtDateKey?: string;
  lckSeeds?: WorldsQualificationState["lckSeeds"];
  msiLeagueResults: WorldsQualificationState["msiLeagueResults"];
  status: WorldsQualificationState["status"];
}): WorldsQualificationState {
  const resolvedLckSeeds = lckSeeds ?? createPlaceholderLckSeeds(bonusLeagueLabels);
  const entrants = createWorldsEntrants({
    bonusLeagueLabels,
    lckSeeds: resolvedLckSeeds,
  });

  return {
    status,
    sourceCompetitionId: "msi",
    decidedAtDateKey,
    bonusLeagueLabels,
    msiLeagueResults,
    lckSeeds: resolvedLckSeeds,
    entrants,
    totalEntrants: entrants.length,
  };
}

function withWorldsQualification(
  seasonState: SeasonState,
  qualification: WorldsQualificationState,
): SeasonState {
  return {
    ...seasonState,
    worldsQualification: qualification,
    competitions: seasonState.competitions.map((competition) =>
      competition.competitionId === "worlds"
        ? {
            ...competition,
            qualifiedTeamIds: qualification.entrants.map((entrant) => entrant.teamId),
            qualifiedTeamNames: qualification.entrants.map(
              (entrant) => entrant.teamName,
            ),
          }
        : competition,
    ),
  };
}

export function applyMsiWorldsQualification(
  seasonState: SeasonState,
  competition: CompetitionState,
): SeasonState {
  const allocation = calculateMsiWorldsSeedAllocation(
    competition,
    seasonState.matchRecords,
  );

  if (allocation.bonusLeagueLabels.length < 2) {
    return seasonState;
  }

  return withWorldsQualification(
    seasonState,
    createQualificationState({
      bonusLeagueLabels: allocation.bonusLeagueLabels,
      decidedAtDateKey: seasonState.currentDateKey,
      msiLeagueResults: allocation.msiLeagueResults,
      status: "msi-seeds-decided",
    }),
  );
}

export function applyLckWorldsQualification(
  seasonState: SeasonState,
  finalPlacements: TeamLike[],
): SeasonState {
  const previous = seasonState.worldsQualification;
  const bonusLeagueLabels = previous?.bonusLeagueLabels ?? [];
  const lckSeeds = createLckWorldsSeeds(finalPlacements, bonusLeagueLabels);

  return withWorldsQualification(
    seasonState,
    createQualificationState({
      bonusLeagueLabels,
      decidedAtDateKey: previous?.decidedAtDateKey,
      lckSeeds,
      msiLeagueResults: previous?.msiLeagueResults ?? [],
      status: "lck-seeds-decided",
    }),
  );
}
