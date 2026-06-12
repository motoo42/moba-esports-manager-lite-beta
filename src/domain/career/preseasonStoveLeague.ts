import { findLckTeamSeed, getLckTeamProfile } from "../../data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../data/offseasonFreeAgents";
import type {
  CareerSave,
  OffseasonAiRenewalPlan,
  Player,
  PlayerContract,
  Role,
  SeasonState,
  Team,
} from "../../types/game";
import { createInitialSeasonState } from "../season/createInitialSeasonState";
import { createAiRenewalPlans } from "../season/offseason-market/aiRenewals";
import { formatSeasonDateLabel } from "../season/seasonScheduleDates";

const preseasonStartDateKey = "2025-12-17";
const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];

function normalizeTeamName(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getRosterSourceTeamName(userTeamName: string) {
  return findLckTeamSeed(userTeamName)?.name ?? "T1";
}

function isTeamPlayer(player: Player, teamName: string) {
  return normalizeTeamName(player.currentTeam) === normalizeTeamName(teamName);
}

function pickStarterForRole(players: Player[], role: Role) {
  return [...players]
    .filter((player) => player.role === role && player.availableForRoster)
    .sort((left, right) => {
      const tierDiff =
        (right.rosterTier === "main" ? 1 : 0) -
        (left.rosterTier === "main" ? 1 : 0);

      if (tierDiff !== 0) {
        return tierDiff;
      }

      const overallDiff = right.overall - left.overall;

      if (overallDiff !== 0) {
        return overallDiff;
      }

      return left.id.localeCompare(right.id);
    })[0];
}

function createStarterRoster(teamPlayers: Player[]) {
  return roleOrder.reduce<Partial<Record<Role, string>>>((roster, role) => {
    const starter = pickStarterForRole(teamPlayers, role);

    if (starter) {
      roster[role] = starter.id;
    }

    return roster;
  }, {});
}

function createExpiredContract(player: Player): PlayerContract {
  return {
    playerId: player.id,
    salary: player.salaryExpectation,
    type: "one-year",
    guaranteedYears: 1,
    remainingYears: 0,
  };
}

function mergePreseasonFreeAgents(players: Player[]) {
  const seenIds = new Set(players.map((player) => player.id));
  const seenNames = new Set(
    players.map((player) => player.name.trim().toLowerCase()),
  );

  return [
    ...players,
    ...offseasonFreeAgentSeeds.filter((player) => {
      const nameKey = player.name.trim().toLowerCase();

      return !seenIds.has(player.id) && !seenNames.has(nameKey);
    }),
  ];
}

function createPreseasonOffseasonState({
  seasonState,
  selectedTeamPlayerIds,
  marketPlayerIds,
  aiRenewalPlans,
}: {
  seasonState: SeasonState;
  selectedTeamPlayerIds: string[];
  marketPlayerIds: string[];
  aiRenewalPlans: OffseasonAiRenewalPlan[];
}): SeasonState {
  return {
    ...seasonState,
    phase: "offseason",
    currentCompetitionId: null,
    currentWeek: 1,
    currentDateKey: preseasonStartDateKey,
    currentDateLabel: formatSeasonDateLabel(preseasonStartDateKey),
    progressStatus: "idle",
    nextMatchIds: [],
    lastMatchRecordIds: [],
    offseason: {
      context: "preseason",
      status: "active",
      completedSeasonNumber: 0,
      nextSeasonNumber: 1,
      startedDateKey: preseasonStartDateKey,
      expiredContractPlayerIds: selectedTeamPlayerIds,
      renewedPlayerIds: [],
      summarySeasonNumber: 0,
      bridgeNote:
        "2026 preseason stove league. Resolve the selected team's expiring roster before LCK Cup.",
      currentDay: 1,
      currentWeek: 1,
      totalDays: 28,
      totalWeeks: 4,
      marketStatus: "renewal-week",
      freeAgentPlayerIds: marketPlayerIds,
      pendingOffers: [],
      resolvedOffers: [],
      releasedPlayerIds: [],
      signedPlayerIds: [],
      resolvedExpiredPlayerIds: [],
      retiredPlayerIds: [],
      militaryServicePlayerIds: [],
      aiRenewalPlans,
      validationErrors: [],
      logEntries: [
        {
          id: "preseason-log-1",
          day: 1,
          week: 1,
          type: "system",
          message:
            "2026 프리시즌 스토브리그가 시작됐습니다. 1주차에는 기존 선수단의 재계약 또는 방출을 결정합니다.",
        },
      ],
    },
  };
}

export function createPreseasonStoveLeagueCareer(
  career: CareerSave,
): CareerSave {
  const lckPlayers = mergePreseasonFreeAgents(career.lckPlayers);
  const userTeamProfile = getLckTeamProfile(career.userTeam.name);
  const sourceTeamName = getRosterSourceTeamName(career.userTeam.name);
  const selectedTeamPlayers = lckPlayers
    .filter((player) => isTeamPlayer(player, sourceTeamName))
    .sort((left, right) => left.id.localeCompare(right.id));
  const selectedTeamPlayerIds = selectedTeamPlayers.map((player) => player.id);
  const selectedTeamPlayerIdSet = new Set(selectedTeamPlayerIds);
  const roster = createStarterRoster(selectedTeamPlayers);
  const starterIds = new Set(Object.values(roster).filter(Boolean));
  const academyRosterPlayerIds = selectedTeamPlayerIds.filter(
    (playerId) => !starterIds.has(playerId),
  );
  const marketPlayerIds = lckPlayers
    .filter(
      (player) =>
        player.region === "lck" &&
        player.league === "LCK" &&
        player.availableForRoster &&
        !player.currentTeam &&
        !selectedTeamPlayerIdSet.has(player.id),
    )
    .map((player) => player.id);
  const seasonState = createInitialSeasonState({
    seasonNumber: 1,
    userTeamName: career.userTeam.name,
  });
  const userTeam: Team = {
    ...career.userTeam,
    budget: userTeamProfile?.budget ?? career.userTeam.budget,
    elo: userTeamProfile?.baseElo ?? career.userTeam.elo,
    rosterSettings: {
      ...career.userTeam.rosterSettings,
      minPlayers: 10,
      maxPlayers: 15,
      freeMovementBetweenMainAndAcademy: true,
      minMainRosterPlayers: 5,
      minAcademyRosterPlayers: 5,
    },
    roster,
    mainRosterPlayerIds: Object.values(roster).filter(
      (playerId): playerId is string => Boolean(playerId),
    ),
    academyRosterPlayerIds,
    contracts: selectedTeamPlayers.map(createExpiredContract),
    wins: 0,
    losses: 0,
  };

  return {
    ...career,
    currentSeason: 1,
    lckPlayers,
    userTeam,
    seasonState: createPreseasonOffseasonState({
      aiRenewalPlans: createAiRenewalPlans(lckPlayers, career.userTeam.name),
      seasonState,
      selectedTeamPlayerIds,
      marketPlayerIds,
    }),
  };
}

export function createBaseCareerWithPreseason({
  career,
  teamName,
}: {
  career: Omit<CareerSave, "seasonState"> & { seasonState?: SeasonState };
  teamName: string;
}): CareerSave {
  return createPreseasonStoveLeagueCareer({
    ...career,
    seasonState:
      career.seasonState ??
      createInitialSeasonState({
        seasonNumber: 1,
        userTeamName: teamName,
      }),
  });
}

export { preseasonStartDateKey };
