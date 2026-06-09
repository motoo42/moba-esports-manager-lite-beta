import { getLckTeamProfile, lck2026Teams } from "../../data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../data/offseasonFreeAgents";
import type {
  CareerSave,
  ContractType,
  OffseasonLogEntry,
  OffseasonMarketStatus,
  OffseasonNegotiationContext,
  OffseasonOffer,
  OffseasonOfferStatus,
  OffseasonRequestedRosterRole,
  Player,
  PlayerContract,
  Role,
  Team,
} from "../../types/game";
import {
  createPlayerContract,
  getContractTypeScoreBonus,
  getPlayerContractDemand,
} from "../players";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "./seasonScheduleDates";
import { completeStoveLeague } from "./createInitialSeasonState";
import { startNextSeasonFromOffseason } from "./seasonEnd";

export type OffseasonContractOfferInput = {
  playerId: string;
  contractType: ContractType;
  salaryOffer: number;
  requestedRosterRole?: OffseasonRequestedRosterRole;
};

export type OffseasonRosterValidation = {
  isValid: boolean;
  errors: string[];
  contractedPlayerIds: string[];
  academyPlayerIds: string[];
  mainRosterPlayerIds: string[];
  starterPlayerIds: string[];
  yearlySalary: number;
};

const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];
const maxPlayersPerRolePerTeam = 3;

function createContract({
  contractType,
  playerId,
  salaryOffer,
}: OffseasonContractOfferInput): PlayerContract {
  return createPlayerContract({
    playerId,
    contractType,
    salaryOffer,
  });
}

export function getOffseasonContractDemand(
  player: Player,
  contractType: ContractType,
) {
  return getPlayerContractDemand(player, contractType);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getRenewalDemandMultiplier(day: number) {
  if (day >= 7) {
    return 0.9;
  }

  if (day >= 5) {
    return 0.94;
  }

  if (day >= 3) {
    return 0.97;
  }

  return 1;
}

function getFreeAgentDemandMultiplier(day: number) {
  if (day >= 27) {
    return 0.88;
  }

  if (day >= 22) {
    return 0.92;
  }

  if (day >= 15) {
    return 0.96;
  }

  return 1;
}

function getDemandMultiplier({
  context,
  day,
}: {
  context: OffseasonNegotiationContext;
  day: number;
}) {
  return context === "renewal"
    ? getRenewalDemandMultiplier(day)
    : getFreeAgentDemandMultiplier(day);
}

export function getOffseasonMinimumAcceptableSalary({
  context,
  contractType,
  day,
  player,
}: {
  context: OffseasonNegotiationContext;
  contractType: ContractType;
  day: number;
  player: Player;
}) {
  const demand = getOffseasonContractDemand(player, contractType);
  const multiplier = getDemandMultiplier({ context, day });

  return Math.ceil(demand * multiplier);
}

export function getOffseasonVisibleDemandSalary({
  context,
  contractType,
  day,
  player,
}: {
  context: OffseasonNegotiationContext;
  contractType: ContractType;
  day: number;
  player: Player;
}) {
  const demand = getOffseasonContractDemand(player, contractType);
  const minimumSalary = getOffseasonMinimumAcceptableSalary({
    context,
    contractType,
    day,
    player,
  });
  const visibleDemand = Math.ceil(
    demand * (getDemandMultiplier({ context, day }) + 0.08),
  );

  return Math.max(minimumSalary + 5, visibleDemand);
}

function getNegotiationHistory({
  career,
  context,
  playerId,
  teamName,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  playerId: string;
  teamName: string;
}) {
  return (career.seasonState.offseason?.resolvedOffers ?? []).filter(
    (offer) =>
      offer.fromTeamName === teamName &&
      offer.playerIds.includes(playerId) &&
      (offer.negotiationContext ?? "free-agent") === context,
  );
}

function getHistoryMoodModifier({
  career,
  context,
  playerId,
  teamName,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  playerId: string;
  teamName: string;
}) {
  const history = getNegotiationHistory({
    career,
    context,
    playerId,
    teamName,
  });
  const modifier = history.reduce((total, offer) => {
    if (offer.status === "accepted") {
      return total + 8;
    }

    if (offer.status === "lost") {
      return total - 6;
    }

    if (offer.status !== "rejected") {
      return total - 3;
    }

    const referenceSalary = offer.minAcceptableSalary ?? offer.visibleDemand;
    const ratio =
      referenceSalary && referenceSalary > 0
        ? offer.salaryOffer / referenceSalary
        : 0;

    if (ratio >= 0.98) {
      return total + 4;
    }

    if (ratio >= 0.94) {
      return total - 2;
    }

    if (ratio >= 0.86) {
      return total - 8;
    }

    return total - 14;
  }, 0);

  return clampNumber(modifier, -34, 14);
}

function getBaseMoodScore({
  baseMinimumSalary,
  salaryOffer,
  visibleDemand,
}: {
  baseMinimumSalary: number;
  salaryOffer: number;
  visibleDemand: number;
}) {
  const salary = Math.max(0, salaryOffer);

  if (salary >= visibleDemand) {
    return 100;
  }

  if (salary >= baseMinimumSalary) {
    const spread = Math.max(1, visibleDemand - baseMinimumSalary);

    return 72 + ((salary - baseMinimumSalary) / spread) * 24;
  }

  const ratio =
    baseMinimumSalary > 0 ? salary / baseMinimumSalary : salary > 0 ? 1 : 0;

  if (ratio >= 0.98) {
    return 69;
  }

  if (ratio >= 0.94) {
    return 62 + ((ratio - 0.94) / 0.04) * 6;
  }

  if (ratio >= 0.86) {
    return 47 + ((ratio - 0.86) / 0.08) * 13;
  }

  if (ratio >= 0.7) {
    return 25 + ((ratio - 0.7) / 0.16) * 20;
  }

  return (ratio / 0.7) * 24;
}

function getMoodMinimumMultiplier(moodScore: number) {
  if (moodScore >= 50) {
    return 1 - ((moodScore - 50) / 50) * 0.04;
  }

  return 1 + ((50 - moodScore) / 50) * 0.06;
}

export function getOffseasonNegotiationSnapshot({
  career,
  context,
  contractType,
  player,
  salaryOffer,
  teamName = career.userTeam.name,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  contractType: ContractType;
  player: Player;
  salaryOffer: number;
  teamName?: string;
}) {
  const day = getCurrentOffseasonDay(career);
  const baseMinimumSalary = getOffseasonMinimumAcceptableSalary({
    context,
    contractType,
    day,
    player,
  });
  const visibleDemand = getOffseasonVisibleDemandSalary({
    context,
    contractType,
    day,
    player,
  });
  const moodScore = Math.round(
    clampNumber(
      getBaseMoodScore({
        baseMinimumSalary,
        salaryOffer,
        visibleDemand,
      }) +
        getHistoryMoodModifier({
          career,
          context,
          playerId: player.id,
          teamName,
        }),
      0,
      100,
    ),
  );
  const minAcceptableSalary = Math.ceil(
    baseMinimumSalary * getMoodMinimumMultiplier(moodScore),
  );

  return {
    baseMinimumSalary,
    minAcceptableSalary,
    moodColor: getOffseasonMoodColor(moodScore),
    moodScore,
    visibleDemand,
  };
}

function mixColor(
  from: [number, number, number],
  to: [number, number, number],
  ratio: number,
) {
  return from.map((value, index) =>
    Math.round(value + (to[index] - value) * ratio),
  ) as [number, number, number];
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

export function getOffseasonMoodColor(moodScore: number) {
  const score = clampNumber(moodScore, 0, 100);
  const red: [number, number, number] = [0xef, 0x44, 0x44];
  const white: [number, number, number] = [0xf8, 0xfa, 0xfc];
  const green: [number, number, number] = [0x22, 0xc5, 0x5e];
  const [r, g, b] =
    score <= 50
      ? mixColor(red, white, score / 50)
      : mixColor(white, green, (score - 50) / 50);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function removeValue(values: string[], value: string) {
  return values.filter((candidate) => candidate !== value);
}

function getCurrentOffseasonDay(career: CareerSave) {
  return career.seasonState.offseason?.currentDay ?? 1;
}

function getCurrentOffseasonWeek(day: number) {
  return Math.min(4, Math.max(1, Math.ceil(day / 7)));
}

function getMarketStatusForDay(day: number): OffseasonMarketStatus {
  if (day >= 28) {
    return "final-day";
  }

  if (day >= 8) {
    return "free-agency";
  }

  return "renewal-week";
}

function createLogEntry({
  career,
  isUserTeamRelated,
  message,
  type,
}: {
  career: CareerSave;
  isUserTeamRelated?: boolean;
  message: string;
  type: OffseasonLogEntry["type"];
}): OffseasonLogEntry {
  const day = getCurrentOffseasonDay(career);
  const week = getCurrentOffseasonWeek(day);
  const count = career.seasonState.offseason?.logEntries?.length ?? 0;

  return {
    id: `offseason-log-${day}-${count + 1}`,
    day,
    week,
    type,
    message,
    isUserTeamRelated,
  };
}

function appendLog(
  career: CareerSave,
  type: OffseasonLogEntry["type"],
  message: string,
  options: { isUserTeamRelated?: boolean } = {},
): CareerSave {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        logEntries: [
          ...(offseason.logEntries ?? []),
          createLogEntry({
            career,
            isUserTeamRelated: options.isUserTeamRelated,
            type,
            message,
          }),
        ],
      },
    },
  };
}

function getPlayer(career: CareerSave, playerId: string) {
  return career.lckPlayers.find((player) => player.id === playerId);
}

function updatePlayer(
  players: Player[],
  playerId: string,
  update: (player: Player) => Player,
) {
  return players.map((player) =>
    player.id === playerId ? update(player) : player,
  );
}

function setPlayerCurrentTeam(
  players: Player[],
  playerId: string,
  currentTeam: string | undefined,
) {
  return updatePlayer(players, playerId, (player) => ({
    ...player,
    currentTeam,
  }));
}

function mergeOffseasonFreeAgents(players: Player[]) {
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

function normalizeUserContractedPlayers(career: CareerSave, players: Player[]) {
  const contractedIds = new Set(
    career.userTeam.contracts.map((contract) => contract.playerId),
  );

  return players.map((player) =>
    contractedIds.has(player.id)
      ? {
          ...player,
          currentTeam: career.userTeam.name,
        }
      : player,
  );
}

function getInitialFreeAgentIds(players: Player[], extraIds: string[] = []) {
  const freeAgentIds = players
    .filter(
      (player) =>
        player.region === "lck" &&
        player.league === "LCK" &&
        player.availableForRoster &&
        !player.currentTeam,
    )
    .map((player) => player.id);

  return [...new Set([...freeAgentIds, ...extraIds])];
}

function getResolvedExpiredPlayerIds(career: CareerSave) {
  const offseason = career.seasonState.offseason;

  return new Set([
    ...(offseason?.resolvedExpiredPlayerIds ?? []),
    ...(offseason?.renewedPlayerIds ?? []),
    ...(offseason?.releasedPlayerIds ?? []),
  ]);
}

export function getUnresolvedExpiredPlayerIds(career: CareerSave) {
  const resolvedIds = getResolvedExpiredPlayerIds(career);

  return (career.seasonState.offseason?.expiredContractPlayerIds ?? []).filter(
    (playerId) => !resolvedIds.has(playerId),
  );
}

function replaceContract(team: Team, contract: PlayerContract): Team {
  const hasExistingContract = team.contracts.some(
    (candidate) => candidate.playerId === contract.playerId,
  );

  return {
    ...team,
    contracts: hasExistingContract
      ? team.contracts.map((candidate) =>
          candidate.playerId === contract.playerId ? contract : candidate,
        )
      : [...team.contracts, contract],
  };
}

function removePlayerFromRosterPlacement(team: Team, playerId: string): Team {
  const nextRoster = { ...team.roster };

  Object.entries(nextRoster).forEach(([role, starterId]) => {
    if (starterId === playerId) {
      delete nextRoster[role as Role];
    }
  });

  return {
    ...team,
    roster: nextRoster,
    mainRosterPlayerIds: team.mainRosterPlayerIds.filter((id) => id !== playerId),
    academyRosterPlayerIds: team.academyRosterPlayerIds.filter(
      (id) => id !== playerId,
    ),
  };
}

function addUniqueValue(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function getRequestedRosterRole(
  requestedRosterRole?: OffseasonRequestedRosterRole,
) {
  return requestedRosterRole ?? "academy";
}

function getRequestedRosterRoleLabel(
  requestedRosterRole?: OffseasonRequestedRosterRole,
) {
  const rosterRole = getRequestedRosterRole(requestedRosterRole);

  if (rosterRole === "starter") {
    return "1군 주전";
  }

  if (rosterRole === "sixth-man") {
    return "식스맨";
  }

  return "2군";
}

function getRosterRoleForPlacement({
  player,
  requestedRosterRole,
  team,
}: {
  player: Player;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  team: Team;
}) {
  if (requestedRosterRole) {
    return requestedRosterRole;
  }

  if (team.roster[player.role] === player.id) {
    return "starter";
  }

  if (team.mainRosterPlayerIds.includes(player.id)) {
    return "sixth-man";
  }

  return "academy";
}

function applyRequestedRosterRole({
  player,
  requestedRosterRole,
  team,
}: {
  player: Player;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  team: Team;
}): Team {
  const placement = getRosterRoleForPlacement({
    player,
    requestedRosterRole,
    team,
  });
  const previousStarterId = team.roster[player.role];
  const baseTeam = removePlayerFromRosterPlacement(team, player.id);

  if (placement === "starter") {
    return {
      ...baseTeam,
      roster: {
        ...baseTeam.roster,
        [player.role]: player.id,
      },
      mainRosterPlayerIds: addUniqueValue(
        previousStarterId && previousStarterId !== player.id
          ? addUniqueValue(baseTeam.mainRosterPlayerIds, previousStarterId)
          : baseTeam.mainRosterPlayerIds,
        player.id,
      ),
    };
  }

  if (placement === "sixth-man") {
    return {
      ...baseTeam,
      mainRosterPlayerIds: addUniqueValue(baseTeam.mainRosterPlayerIds, player.id),
    };
  }

  return {
    ...baseTeam,
    academyRosterPlayerIds: addUniqueValue(
      baseTeam.academyRosterPlayerIds,
      player.id,
    ),
  };
}

function removePlayerFromUserTeam(team: Team, playerId: string): Team {
  const nextRoster = { ...team.roster };

  Object.entries(nextRoster).forEach(([role, starterId]) => {
    if (starterId === playerId) {
      delete nextRoster[role as Role];
    }
  });

  return {
    ...team,
    roster: nextRoster,
    mainRosterPlayerIds: team.mainRosterPlayerIds.filter((id) => id !== playerId),
    academyRosterPlayerIds: team.academyRosterPlayerIds.filter(
      (id) => id !== playerId,
    ),
    contracts: team.contracts.filter((contract) => contract.playerId !== playerId),
  };
}

function removePlayersFromUserTeam(team: Team, playerIds: string[]) {
  return playerIds.reduce(
    (currentTeam, playerId) => removePlayerFromUserTeam(currentTeam, playerId),
    team,
  );
}

function shouldRetireThisOffseason(player: Player) {
  return (
    player.availableForRoster &&
    (Boolean(player.retirementCandidate) ||
      (player.retirementAge !== undefined && player.age >= player.retirementAge))
  );
}

function shouldEnterMilitaryService(player: Player) {
  return (
    player.availableForRoster &&
    player.militaryServiceStatus === "pending"
  );
}

function applyOffseasonDepartures(career: CareerSave, players: Player[]) {
  const retiredPlayerIds = players
    .filter(shouldRetireThisOffseason)
    .map((player) => player.id);
  const retiredIdSet = new Set(retiredPlayerIds);
  const militaryServicePlayerIds = players
    .filter(
      (player) =>
        !retiredIdSet.has(player.id) && shouldEnterMilitaryService(player),
    )
    .map((player) => player.id);
  const militaryIdSet = new Set(militaryServicePlayerIds);
  const unavailablePlayerIds = [...retiredPlayerIds, ...militaryServicePlayerIds];
  const nextPlayers = players.map((player) => {
    if (retiredIdSet.has(player.id)) {
      return {
        ...player,
        availableForRoster: false,
        currentTeam: undefined,
        rosterTier: undefined,
        retirementCandidate: true,
      };
    }

    if (militaryIdSet.has(player.id)) {
      return {
        ...player,
        availableForRoster: false,
        currentTeam: undefined,
        rosterTier: undefined,
        militaryServiceStatus: "serving" as const,
      };
    }

    return player;
  });

  return {
    lckPlayers: nextPlayers,
    userTeam: removePlayersFromUserTeam(career.userTeam, unavailablePlayerIds),
    retiredPlayerIds,
    militaryServicePlayerIds,
  };
}

function getPlayerNamesById(players: Player[], playerIds: string[]) {
  return playerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.name)
    .filter((name): name is string => Boolean(name));
}

function appendDepartureLogs(
  career: CareerSave,
  departures: {
    retiredPlayerIds: string[];
    militaryServicePlayerIds: string[];
  },
) {
  let nextCareer = career;
  const retiredNames = getPlayerNamesById(
    career.lckPlayers,
    departures.retiredPlayerIds,
  );
  const militaryNames = getPlayerNamesById(
    career.lckPlayers,
    departures.militaryServicePlayerIds,
  );

  if (retiredNames.length > 0) {
    nextCareer = appendLog(
      nextCareer,
      "retirement",
      `은퇴 대상 선수 ${retiredNames.join(", ")}이 로스터와 FA 시장에서 제외됐습니다.`,
    );
  }

  if (militaryNames.length > 0) {
    nextCareer = appendLog(
      nextCareer,
      "military",
      `병역 이탈 선수 ${militaryNames.join(", ")}이 로스터와 FA 시장에서 제외됐습니다.`,
    );
  }

  return nextCareer;
}

function createOffer({
  career,
  contractType,
  fromTeamName,
  negotiationContext,
  playerId,
  minAcceptableSalary,
  moodScore,
  rejectionReason,
  requestedRosterRole,
  salaryOffer,
  status,
  toTeamName = "Free Agent",
  visibleDemand,
}: {
  career: CareerSave;
  contractType: ContractType;
  fromTeamName: string;
  negotiationContext: OffseasonNegotiationContext;
  playerId: string;
  minAcceptableSalary?: number;
  moodScore?: number;
  rejectionReason?: string;
  requestedRosterRole?: OffseasonRequestedRosterRole;
  salaryOffer: number;
  status: OffseasonOfferStatus;
  toTeamName?: string;
  visibleDemand?: number;
}): OffseasonOffer {
  const offseason = career.seasonState.offseason;
  const currentDay = getCurrentOffseasonDay(career);
  const totalOffers =
    (offseason?.pendingOffers?.length ?? 0) +
    (offseason?.resolvedOffers?.length ?? 0);

  return {
    id: `offseason-offer-${currentDay}-${totalOffers + 1}`,
    kind: "contract",
    fromTeamName,
    toTeamName,
    playerIds: [playerId],
    salaryOffer: Math.max(0, Math.round(salaryOffer)),
    contractType,
    status,
    createdDay: currentDay,
    negotiationContext,
    minAcceptableSalary,
    moodScore,
    rejectionReason,
    requestedRosterRole,
    visibleDemand,
  };
}

function setOffseasonState(
  career: CareerSave,
  update: NonNullable<CareerSave["seasonState"]["offseason"]>,
): CareerSave {
  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: update,
    },
  };
}

export function initializeOffseasonMarket(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status === "career-completed"
  ) {
    return career;
  }

  if (offseason.status === "active") {
    return career;
  }

  const startedDateKey = addDaysToDateKey(offseason.startedDateKey, 1);
  const lckPlayers = normalizeUserContractedPlayers(
    career,
    mergeOffseasonFreeAgents(career.lckPlayers),
  );
  const departures = applyOffseasonDepartures(career, lckPlayers);
  const departedIdSet = new Set([
    ...departures.retiredPlayerIds,
    ...departures.militaryServicePlayerIds,
  ]);
  const expiredContractPlayerIds = offseason.expiredContractPlayerIds.filter(
    (playerId) => !departedIdSet.has(playerId),
  );
  const freeAgentPlayerIds = getInitialFreeAgentIds(
    departures.lckPlayers,
    offseason.freeAgentPlayerIds ?? [],
  ).filter((playerId) => {
    const player = departures.lckPlayers.find(
      (candidate) => candidate.id === playerId,
    );

    return Boolean(player?.availableForRoster) && !departedIdSet.has(playerId);
  });
  const resolvedExpiredPlayerIds =
    expiredContractPlayerIds.length === 0
      ? []
      : offseason.resolvedExpiredPlayerIds ?? [];
  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: departures.lckPlayers,
    userTeam: departures.userTeam,
    seasonState: {
      ...career.seasonState,
      currentDateKey: startedDateKey,
      currentDateLabel: formatSeasonDateLabel(startedDateKey),
      progressStatus: "idle" as const,
      nextMatchIds: [],
      lastMatchRecordIds: [],
      offseason: {
        ...offseason,
        context: offseason.context ?? "postseason",
        status: "active",
        expiredContractPlayerIds,
        currentDay: 1,
        currentWeek: 1,
        totalDays: 28,
        totalWeeks: 4,
        marketStatus: "renewal-week",
        freeAgentPlayerIds,
        pendingOffers: [],
        resolvedOffers: [],
        releasedPlayerIds: offseason.releasedPlayerIds ?? [],
        signedPlayerIds: offseason.signedPlayerIds ?? [],
        retiredPlayerIds: [
          ...(offseason.retiredPlayerIds ?? []),
          ...departures.retiredPlayerIds,
        ],
        militaryServicePlayerIds: [
          ...(offseason.militaryServicePlayerIds ?? []),
          ...departures.militaryServicePlayerIds,
        ],
        resolvedExpiredPlayerIds,
        logEntries: [],
        validationErrors: [],
        bridgeNote:
          "Advanced stove league market initialized for daily offseason progress.",
      },
    },
  };

  return appendLog(
    appendDepartureLogs(nextCareer, departures),
    "system",
    "스토브리그가 시작됐습니다. 1주차에는 계약 만료 선수의 재계약 또는 방출을 결정해야 합니다.",
  );
}

export function submitOffseasonRenewalOffer(
  career: CareerSave,
  offerInput: OffseasonContractOfferInput,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const player = getPlayer(career, offerInput.playerId);

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    (offseason.currentWeek ?? 1) !== 1 ||
    !player ||
    !player.availableForRoster ||
    !offseason.expiredContractPlayerIds.includes(offerInput.playerId)
  ) {
    return career;
  }

  const hasPendingOffer = (offseason.pendingOffers ?? []).some(
    (offer) =>
      offer.status === "pending" &&
      offer.negotiationContext === "renewal" &&
      offer.fromTeamName === career.userTeam.name &&
      offer.playerIds.includes(player.id),
  );

  if (hasPendingOffer) {
    return career;
  }

  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context: "renewal",
    contractType: offerInput.contractType,
    player,
    salaryOffer: offerInput.salaryOffer,
  });
  const pendingOffer = createOffer({
    career,
    contractType: offerInput.contractType,
    fromTeamName: career.userTeam.name,
    minAcceptableSalary: snapshot.minAcceptableSalary,
    moodScore: snapshot.moodScore,
    negotiationContext: "renewal",
    playerId: offerInput.playerId,
    requestedRosterRole: offerInput.requestedRosterRole,
    salaryOffer: offerInput.salaryOffer,
    status: "pending",
    toTeamName: career.userTeam.name,
    visibleDemand: snapshot.visibleDemand,
  });
  const nextCareer: CareerSave = {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        marketStatus: "renewal-week",
        pendingOffers: [...(offseason.pendingOffers ?? []), pendingOffer],
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "renewal",
    `${player.name}에게 ${Math.round(offerInput.salaryOffer)} 규모의 ${getRequestedRosterRoleLabel(
      offerInput.requestedRosterRole,
    )} 재계약을 제안했습니다. 다음날 수락 여부를 확인합니다.`,
    { isUserTeamRelated: true },
  );
}

export function releaseExpiredOffseasonPlayer(
  career: CareerSave,
  playerId: string,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const player = getPlayer(career, playerId);

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    (offseason.currentWeek ?? 1) !== 1 ||
    !player ||
    !offseason.expiredContractPlayerIds.includes(playerId)
  ) {
    return career;
  }

  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: setPlayerCurrentTeam(career.lckPlayers, playerId, undefined),
    userTeam: removePlayerFromUserTeam(career.userTeam, playerId),
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        marketStatus: "renewal-week",
        pendingOffers: (offseason.pendingOffers ?? []).filter(
          (offer) => !offer.playerIds.includes(playerId),
        ),
        releasedPlayerIds: addUnique(offseason.releasedPlayerIds ?? [], playerId),
        resolvedExpiredPlayerIds: addUnique(
          offseason.resolvedExpiredPlayerIds ?? [],
          playerId,
        ),
        freeAgentPlayerIds: addUnique(
          offseason.freeAgentPlayerIds ?? [],
          playerId,
        ),
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "release",
    `${player.name}을 방출했습니다. 해당 선수는 FA 시장에 등록됐습니다.`,
    { isUserTeamRelated: true },
  );
}

function getContractedRoleCount(career: CareerSave, role: Role) {
  const contractedIds = new Set(
    career.userTeam.contracts.map((contract) => contract.playerId),
  );

  return career.lckPlayers.filter(
    (player) =>
      player.role === role &&
      player.availableForRoster &&
      contractedIds.has(player.id),
  ).length;
}

function getAiRoleCount(players: Player[], teamName: string, role: Role) {
  return players.filter(
    (player) =>
      player.currentTeam === teamName &&
      player.role === role &&
      player.availableForRoster,
  ).length;
}

function hashString(value: string) {
  return [...value].reduce(
    (total, char) => (total * 31 + char.charCodeAt(0)) % 100000,
    17,
  );
}

function getTeamNeedScore({
  career,
  player,
  teamName,
}: {
  career: CareerSave;
  player: Player;
  teamName: string;
}) {
  const roleCount =
    teamName === career.userTeam.name
      ? getContractedRoleCount(career, player.role)
      : getAiRoleCount(career.lckPlayers, teamName, player.role);

  if (roleCount >= maxPlayersPerRolePerTeam) {
    return 0;
  }

  if (roleCount === 0) {
    return 18;
  }

  if (roleCount === 1) {
    return 12;
  }

  if (roleCount === 2) {
    return 5;
  }

  return 0;
}

function getTeamAppeal(career: CareerSave, teamName: string) {
  if (teamName === career.userTeam.name) {
    return Math.min(92, Math.max(65, career.userTeam.elo / 20));
  }

  const profile = getLckTeamProfile(
    teamName,
    career.seasonState.teamBalanceAdjustments,
  );

  return Math.min(
    95,
    Math.max(60, (profile?.strength ?? 72) + (profile?.appealModifier ?? 0)),
  );
}

function getOfferScore({
  career,
  contractType,
  player,
  salaryOffer,
  teamName,
}: {
  career: CareerSave;
  contractType: ContractType;
  player: Player;
  salaryOffer: number;
  teamName: string;
}) {
  const demand = getOffseasonContractDemand(player, contractType);
  const salaryRatio = demand > 0 ? salaryOffer / demand : 1;

  return (
    salaryRatio * 70 +
    getContractTypeScoreBonus(contractType) +
    getTeamAppeal(career, teamName) * 0.16 +
    getTeamNeedScore({ career, player, teamName })
  );
}

function getAiCandidateTeams(career: CareerSave, player: Player) {
  const userTeamName = career.userTeam.name.trim().toLowerCase();

  return lck2026Teams
    .filter((team) => team.name.trim().toLowerCase() !== userTeamName)
    .map((team) => ({
      team,
      needScore: getTeamNeedScore({
        career,
        player,
        teamName: team.name,
      }),
    }))
    .filter(({ needScore }) => needScore > 0)
    .sort((left, right) => {
      const needDiff = right.needScore - left.needScore;

      if (needDiff !== 0) {
        return needDiff;
      }

      return left.team.previousSeasonRank - right.team.previousSeasonRank;
    })
    .slice(0, 3);
}

function createAiOffer({
  career,
  context = "free-agent",
  player,
  teamName,
}: {
  career: CareerSave;
  context?: OffseasonNegotiationContext;
  player: Player;
  teamName: string;
}) {
  const currentDay = getCurrentOffseasonDay(career);
  const hash = hashString(`${player.id}:${teamName}:${currentDay}`);
  const contractType: ContractType = hash % 3 === 0 ? "two-year" : "one-year";
  const demand = getOffseasonContractDemand(player, contractType);
  const salaryOffer = Math.round(demand * (0.92 + (hash % 24) / 100));
  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context,
    contractType,
    player,
    salaryOffer,
    teamName,
  });
  const offer = createOffer({
    career,
    contractType,
    fromTeamName: teamName,
    minAcceptableSalary: snapshot.minAcceptableSalary,
    moodScore: snapshot.moodScore,
    negotiationContext: context,
    playerId: player.id,
    salaryOffer,
    status: "pending",
    visibleDemand: snapshot.visibleDemand,
  });

  return {
    ...offer,
    id: `${offer.id}-${hashString(teamName)}`,
    score: getOfferScore({
      career,
      contractType,
      player,
      salaryOffer,
      teamName,
    }),
  };
}

function evaluateOffer({
  career,
  context,
  offer,
  player,
}: {
  career: CareerSave;
  context: OffseasonNegotiationContext;
  offer: OffseasonOffer;
  player: Player;
}) {
  const contractType = offer.contractType ?? "one-year";
  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context,
    contractType,
    player,
    salaryOffer: offer.salaryOffer,
    teamName: offer.fromTeamName,
  });
  const score = getOfferScore({
    career,
    contractType,
    player,
    salaryOffer: offer.salaryOffer,
    teamName: offer.fromTeamName,
  });

  return {
    ...offer,
    minAcceptableSalary: snapshot.minAcceptableSalary,
    moodScore: snapshot.moodScore,
    score,
    visibleDemand: snapshot.visibleDemand,
    isAcceptable: offer.salaryOffer >= snapshot.minAcceptableSalary,
  };
}

function getPendingRenewalOffersToResolve(career: CareerSave) {
  const currentDay = getCurrentOffseasonDay(career);

  return (career.seasonState.offseason?.pendingOffers ?? []).filter(
    (offer) =>
      offer.kind === "contract" &&
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      offer.negotiationContext === "renewal" &&
      (offer.createdDay < currentDay || currentDay >= 7),
  );
}

function getPendingFreeAgentOffersToResolve(career: CareerSave) {
  const currentDay = getCurrentOffseasonDay(career);

  return (career.seasonState.offseason?.pendingOffers ?? []).filter(
    (offer) =>
      offer.kind === "contract" &&
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent" &&
      offer.createdDay < currentDay,
  );
}

function getPendingOfferPlayerIdsToResolve(career: CareerSave) {
  return new Set(
    [
      ...getPendingRenewalOffersToResolve(career),
      ...getPendingFreeAgentOffersToResolve(career),
    ].flatMap((offer) => offer.playerIds),
  );
}

function resolveRenewalOffers(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;
  const offersToResolve = getPendingRenewalOffersToResolve(career);

  if (!offseason || offersToResolve.length === 0) {
    return career;
  }

  return offersToResolve.reduce((currentCareer, userOffer) => {
    const currentOffseason = currentCareer.seasonState.offseason;
    const playerId = userOffer.playerIds[0];
    const player = getPlayer(currentCareer, playerId);

    if (
      !currentOffseason ||
      !player ||
      !currentOffseason.expiredContractPlayerIds.includes(playerId)
    ) {
      return currentCareer;
    }

    const evaluated = evaluateOffer({
      career: currentCareer,
      context: "renewal",
      offer: userOffer,
      player,
    });
    const remainingPendingOffers = (currentOffseason.pendingOffers ?? []).filter(
      (offer) => offer.id !== userOffer.id,
    );
    const resolvedUserOffer: OffseasonOffer = {
      ...userOffer,
      status: evaluated.isAcceptable ? "accepted" : "rejected",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
      score: evaluated.score,
      minAcceptableSalary: evaluated.minAcceptableSalary,
      moodScore: evaluated.moodScore,
      rejectionReason: evaluated.isAcceptable
        ? undefined
        : "minimum-salary-not-met",
      visibleDemand: evaluated.visibleDemand,
    };

    if (!evaluated.isAcceptable) {
      const nextCareer = setOffseasonState(currentCareer, {
        ...currentOffseason,
        pendingOffers: remainingPendingOffers,
        resolvedOffers: [
          ...(currentOffseason.resolvedOffers ?? []),
          resolvedUserOffer,
        ],
        validationErrors: [],
      });

      return appendLog(
        nextCareer,
        "rejection",
        `${player.name}이 재계약 제안을 거절했습니다. 협상 분위기 ${evaluated.moodScore}%입니다.`,
        { isUserTeamRelated: true },
      );
    }

    const contractType = userOffer.contractType ?? "one-year";
    const nextContract = createContract({
      playerId,
      contractType,
      salaryOffer: userOffer.salaryOffer,
    });
    const nextCareer: CareerSave = {
      ...currentCareer,
      lckPlayers: setPlayerCurrentTeam(
        currentCareer.lckPlayers,
        player.id,
        currentCareer.userTeam.name,
      ),
      userTeam: applyRequestedRosterRole({
        player,
        requestedRosterRole: userOffer.requestedRosterRole,
        team: replaceContract(currentCareer.userTeam, nextContract),
      }),
      seasonState: {
        ...currentCareer.seasonState,
        offseason: {
          ...currentOffseason,
          pendingOffers: remainingPendingOffers,
          resolvedOffers: [
            ...(currentOffseason.resolvedOffers ?? []),
            resolvedUserOffer,
          ],
          renewedPlayerIds: addUnique(
            currentOffseason.renewedPlayerIds,
            player.id,
          ),
          resolvedExpiredPlayerIds: addUnique(
            currentOffseason.resolvedExpiredPlayerIds ?? [],
            player.id,
          ),
          validationErrors: [],
        },
      },
    };

    return appendLog(
      nextCareer,
      "renewal",
      `${player.name}과 ${Math.round(userOffer.salaryOffer)} 규모의 ${contractType} 재계약에 합의했습니다. 역할: ${getRequestedRosterRoleLabel(
        userOffer.requestedRosterRole,
      )}.`,
      { isUserTeamRelated: true },
    );
  }, career);
}

function resolveFreeAgentOffers(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;
  const offersToResolve = getPendingFreeAgentOffersToResolve(career);

  if (!offseason || offersToResolve.length === 0) {
    return career;
  }

  return offersToResolve.reduce((currentCareer, userOffer) => {
    const currentOffseason = currentCareer.seasonState.offseason;
    const playerId = userOffer.playerIds[0];
    const player = getPlayer(currentCareer, playerId);

    if (
      !currentOffseason ||
      !player ||
      !(currentOffseason.freeAgentPlayerIds ?? []).includes(playerId)
    ) {
      return currentCareer;
    }

    const evaluatedUserOffer = evaluateOffer({
      career: currentCareer,
      context: "free-agent",
      offer: userOffer,
      player,
    });
    const aiOffers = getAiCandidateTeams(currentCareer, player).map(({ team }) =>
      createAiOffer({
        career: currentCareer,
        player,
        teamName: team.name,
      }),
    );
    const evaluatedAiOffers = aiOffers.map((offer) =>
      evaluateOffer({
        career: currentCareer,
        context: "free-agent",
        offer,
        player,
      }),
    );
    const acceptableOffers = [
      evaluatedUserOffer,
      ...evaluatedAiOffers,
    ].filter((offer) => offer.isAcceptable);
    const winningOffer = acceptableOffers.sort(
      (left, right) => (right.score ?? 0) - (left.score ?? 0),
    )[0];
    const userWins = winningOffer?.id === userOffer.id;
    const resolvedUserOffer: OffseasonOffer = {
      ...userOffer,
      status: !winningOffer
        ? "rejected"
        : userWins
          ? "confirmation-pending"
          : evaluatedUserOffer.isAcceptable
            ? "lost"
            : "rejected",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
      score: evaluatedUserOffer.score,
      minAcceptableSalary: evaluatedUserOffer.minAcceptableSalary,
      moodScore: evaluatedUserOffer.moodScore,
      rejectionReason:
        winningOffer && evaluatedUserOffer.isAcceptable
          ? undefined
          : "minimum-salary-not-met",
      visibleDemand: evaluatedUserOffer.visibleDemand,
    };
    const rejectedAiOffers: OffseasonOffer[] = evaluatedAiOffers
      .filter((offer) => offer.id !== winningOffer?.id)
      .map((offer) => ({
        ...offer,
        status: "rejected",
        resolvedDay: getCurrentOffseasonDay(currentCareer),
        rejectionReason: "minimum-salary-not-met",
      }));
    const remainingPendingOffers = (currentOffseason.pendingOffers ?? []).filter(
      (offer) => offer.id !== userOffer.id,
    );

    if (!winningOffer) {
      const nextCareer = setOffseasonState(currentCareer, {
        ...currentOffseason,
        pendingOffers: remainingPendingOffers,
        resolvedOffers: [
          ...(currentOffseason.resolvedOffers ?? []),
          resolvedUserOffer,
          ...rejectedAiOffers,
        ],
        validationErrors: [],
      });

      return appendLog(
        nextCareer,
        "rejection",
        `${player.name}이 모든 제안을 거절했습니다. 협상 분위기 ${evaluatedUserOffer.moodScore}%입니다.`,
        { isUserTeamRelated: true },
      );
    }

    if (userWins) {
      const nextCareer: CareerSave = {
        ...currentCareer,
        seasonState: {
          ...currentCareer.seasonState,
          offseason: {
            ...currentOffseason,
            pendingOffers: remainingPendingOffers,
            resolvedOffers: [
              ...(currentOffseason.resolvedOffers ?? []),
              resolvedUserOffer,
              ...rejectedAiOffers,
            ],
            validationErrors: [],
          },
        },
      };

      return appendLog(
        nextCareer,
        "signing",
        `${player.name} 영입 경쟁에서 승리했습니다. 제안 연봉 ${Math.round(
          userOffer.salaryOffer,
        )}, 역할 ${getRequestedRosterRoleLabel(
          userOffer.requestedRosterRole,
        )}. 최종 영입 확정을 기다립니다.`,
        { isUserTeamRelated: true },
      );
    }

    const acceptedAiOffer: OffseasonOffer = {
      ...winningOffer,
      id: `${winningOffer.id}-ai-win`,
      status: "accepted",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
    };
    const aiTeamName = acceptedAiOffer.fromTeamName;
    const nextCareer: CareerSave = {
      ...currentCareer,
      lckPlayers: setPlayerCurrentTeam(
        currentCareer.lckPlayers,
        playerId,
        aiTeamName,
      ),
      seasonState: {
        ...currentCareer.seasonState,
        offseason: {
          ...currentOffseason,
          pendingOffers: remainingPendingOffers,
          resolvedOffers: [
            ...(currentOffseason.resolvedOffers ?? []),
            resolvedUserOffer,
            acceptedAiOffer,
            ...rejectedAiOffers,
          ],
          freeAgentPlayerIds: removeValue(
            currentOffseason.freeAgentPlayerIds ?? [],
            playerId,
          ),
          validationErrors: [],
        },
      },
    };

    return appendLog(
      nextCareer,
      "ai-signing",
      `${player.name} 영입 경쟁에서 ${aiTeamName}이 승리했습니다.`,
      { isUserTeamRelated: true },
    );
  }, career);
}

function getAvailableFreeAgentPlayers(
  career: CareerSave,
  excludedPlayerIds: Set<string>,
) {
  const freeAgentIds = new Set(
    career.seasonState.offseason?.freeAgentPlayerIds ?? [],
  );
  const confirmationPendingIds = getConfirmationPendingPlayerIds(career);

  return career.lckPlayers.filter(
    (player) =>
      player.availableForRoster &&
      freeAgentIds.has(player.id) &&
      !confirmationPendingIds.has(player.id) &&
      !excludedPlayerIds.has(player.id),
  );
}

function getAiDepthTarget(career: CareerSave, teamName: string) {
  return roleOrder.find(
    (role) => getAiRoleCount(career.lckPlayers, teamName, role) < 2,
  );
}

function pickAiDepthCandidate({
  career,
  excludedPlayerIds,
  role,
}: {
  career: CareerSave;
  excludedPlayerIds: Set<string>;
  role: Role;
}) {
  return getAvailableFreeAgentPlayers(career, excludedPlayerIds)
    .filter((player) => player.role === role)
    .sort((left, right) => {
      const rightScore = right.overall * 1.5 + right.potential * 0.35;
      const leftScore = left.overall * 1.5 + left.potential * 0.35;
      const scoreDiff = rightScore - leftScore;

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return left.id.localeCompare(right.id);
    })[0];
}

function resolveAiDepthSignings(
  career: CareerSave,
  excludedPlayerIds: Set<string>,
) {
  const offseason = career.seasonState.offseason;
  const currentDay = getCurrentOffseasonDay(career);

  if (!offseason || currentDay < 8 || currentDay >= 28) {
    return career;
  }

  const userTeamName = career.userTeam.name.trim().toLowerCase();
  const maxSigningsPerDay = 3;
  let nextCareer = career;
  let signingCount = 0;
  const claimedPlayerIds = new Set(excludedPlayerIds);

  for (const team of [...lck2026Teams].sort(
    (left, right) => left.previousSeasonRank - right.previousSeasonRank,
  )) {
    if (signingCount >= maxSigningsPerDay) {
      break;
    }

    if (team.name.trim().toLowerCase() === userTeamName) {
      continue;
    }

    const targetRole = getAiDepthTarget(nextCareer, team.name);

    if (!targetRole) {
      continue;
    }

    const player = pickAiDepthCandidate({
      career: nextCareer,
      excludedPlayerIds: claimedPlayerIds,
      role: targetRole,
    });

    if (!player) {
      continue;
    }

    const offer = createAiOffer({
      career: nextCareer,
      context: "ai-depth",
      player,
      teamName: team.name,
    });
    const evaluatedOffer = evaluateOffer({
      career: nextCareer,
      context: "ai-depth",
      offer,
      player,
    });

    if (!evaluatedOffer.isAcceptable) {
      continue;
    }

    const currentOffseason = nextCareer.seasonState.offseason;

    if (!currentOffseason) {
      break;
    }

    const acceptedAiOffer: OffseasonOffer = {
      ...evaluatedOffer,
      status: "accepted",
      resolvedDay: getCurrentOffseasonDay(nextCareer),
    };
    nextCareer = {
      ...nextCareer,
      lckPlayers: setPlayerCurrentTeam(
        nextCareer.lckPlayers,
        player.id,
        team.name,
      ),
      seasonState: {
        ...nextCareer.seasonState,
        offseason: {
          ...currentOffseason,
          resolvedOffers: [
            ...(currentOffseason.resolvedOffers ?? []),
            acceptedAiOffer,
          ],
          freeAgentPlayerIds: removeValue(
            currentOffseason.freeAgentPlayerIds ?? [],
            player.id,
          ),
          validationErrors: [],
        },
      },
    };
    nextCareer = appendLog(
      nextCareer,
      "ai-signing",
      `${team.name}이 ${targetRole.toUpperCase()} 보강을 위해 ${player.name}을 영입했습니다.`,
    );
    claimedPlayerIds.add(player.id);
    signingCount += 1;
  }

  return nextCareer;
}

function getConfirmationPendingOffer(career: CareerSave, offerId: string) {
  return (career.seasonState.offseason?.resolvedOffers ?? []).find(
    (offer) =>
      offer.id === offerId &&
      offer.status === "confirmation-pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent",
  );
}

function getConfirmationPendingPlayerIds(career: CareerSave) {
  return new Set(
    (career.seasonState.offseason?.resolvedOffers ?? [])
      .filter((offer) => offer.status === "confirmation-pending")
      .flatMap((offer) => offer.playerIds),
  );
}

function getRoleLimitError(career: CareerSave, player: Player) {
  const roleCount = getContractedRoleCount(career, player.role);

  if (roleCount >= maxPlayersPerRolePerTeam) {
    return `${player.role.toUpperCase()} 포지션은 1군과 2군을 합쳐 최대 ${maxPlayersPerRolePerTeam}명까지만 보유할 수 있습니다.`;
  }

  return null;
}

function getBudgetLimitError(career: CareerSave, salaryOffer: number) {
  const nextSalaryTotal = getContractSalaryTotal(career.userTeam) + salaryOffer;

  if (nextSalaryTotal > career.userTeam.budget) {
    return `예산 초과: 현재 연봉 여유 금액을 초과해 영입할 수 없습니다.`;
  }

  return null;
}

function setOffseasonValidationErrors(career: CareerSave, errors: string[]) {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        validationErrors: errors,
      },
    },
  };
}

export function confirmFreeAgentSigning(
  career: CareerSave,
  offerId: string,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const offer = getConfirmationPendingOffer(career, offerId);
  const playerId = offer?.playerIds[0];
  const player = playerId ? getPlayer(career, playerId) : undefined;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    !offer ||
    !player ||
    !player.availableForRoster ||
    !(offseason.freeAgentPlayerIds ?? []).includes(player.id)
  ) {
    return career;
  }

  const errors = [
    getBudgetLimitError(career, offer.salaryOffer),
    getRoleLimitError(career, player),
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    return appendLog(
      setOffseasonValidationErrors(career, errors),
      "blocked",
      `${player.name} 영입 확정에 실패했습니다. ${errors[0]}`,
      { isUserTeamRelated: true },
    );
  }

  const contractType = offer.contractType ?? "one-year";
  const nextContract = createContract({
    playerId: player.id,
    contractType,
    salaryOffer: offer.salaryOffer,
  });
  const updatedOffer: OffseasonOffer = {
    ...offer,
    status: "accepted",
    resolvedDay: getCurrentOffseasonDay(career),
  };
  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: setPlayerCurrentTeam(
      career.lckPlayers,
      player.id,
      career.userTeam.name,
    ),
    userTeam: applyRequestedRosterRole({
      player,
      requestedRosterRole: offer.requestedRosterRole,
      team: replaceContract(career.userTeam, nextContract),
    }),
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        resolvedOffers: (offseason.resolvedOffers ?? []).map((candidate) =>
          candidate.id === offer.id ? updatedOffer : candidate,
        ),
        freeAgentPlayerIds: removeValue(
          offseason.freeAgentPlayerIds ?? [],
          player.id,
        ),
        signedPlayerIds: addUnique(offseason.signedPlayerIds ?? [], player.id),
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "signing",
    `${player.name} 영입을 확정했습니다. 역할: ${getRequestedRosterRoleLabel(
      offer.requestedRosterRole,
    )}.`,
    { isUserTeamRelated: true },
  );
}

export function cancelFreeAgentSigning(
  career: CareerSave,
  offerId: string,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const offer = getConfirmationPendingOffer(career, offerId);
  const playerId = offer?.playerIds[0];
  const player = playerId ? getPlayer(career, playerId) : undefined;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    !offer
  ) {
    return career;
  }

  const updatedOffer: OffseasonOffer = {
    ...offer,
    status: "withdrawn",
    resolvedDay: getCurrentOffseasonDay(career),
    rejectionReason: "user-cancelled-confirmation",
  };
  const nextCareer = setOffseasonState(career, {
    ...offseason,
    resolvedOffers: (offseason.resolvedOffers ?? []).map((candidate) =>
      candidate.id === offer.id ? updatedOffer : candidate,
    ),
    validationErrors: [],
  });

  return appendLog(
    nextCareer,
    "signing",
    `${player?.name ?? playerId ?? "선수"} 영입을 취소했습니다. 해당 선수는 FA 시장에 남습니다.`,
    { isUserTeamRelated: true },
  );
}

export function submitFreeAgentOffer(
  career: CareerSave,
  offerInput: OffseasonContractOfferInput,
): CareerSave {
  const offseason = career.seasonState.offseason;
  const player = getPlayer(career, offerInput.playerId);
  const currentDay = getCurrentOffseasonDay(career);

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active" ||
    currentDay < 8 ||
    currentDay >= 28 ||
    !player ||
    !player.availableForRoster ||
    !(offseason.freeAgentPlayerIds ?? []).includes(player.id)
  ) {
    return career;
  }

  const hasPendingOffer = (offseason.pendingOffers ?? []).some(
    (offer) =>
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent" &&
      offer.playerIds.includes(player.id),
  );
  const hasConfirmationPendingOffer = (offseason.resolvedOffers ?? []).some(
    (offer) =>
      offer.status === "confirmation-pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent" &&
      offer.playerIds.includes(player.id),
  );

  if (hasPendingOffer || hasConfirmationPendingOffer) {
    return career;
  }

  const snapshot = getOffseasonNegotiationSnapshot({
    career,
    context: "free-agent",
    contractType: offerInput.contractType,
    player,
    salaryOffer: offerInput.salaryOffer,
  });
  const pendingOffer = createOffer({
    career,
    contractType: offerInput.contractType,
    fromTeamName: career.userTeam.name,
    minAcceptableSalary: snapshot.minAcceptableSalary,
    moodScore: snapshot.moodScore,
    negotiationContext: "free-agent",
    playerId: player.id,
    requestedRosterRole: offerInput.requestedRosterRole,
    salaryOffer: offerInput.salaryOffer,
    status: "pending",
    visibleDemand: snapshot.visibleDemand,
  });
  const nextCareer: CareerSave = {
    ...career,
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...offseason,
        pendingOffers: [...(offseason.pendingOffers ?? []), pendingOffer],
        validationErrors: [],
      },
    },
  };

  return appendLog(
    nextCareer,
    "signing",
    `${player.name}에게 ${Math.round(offerInput.salaryOffer)} 규모의 FA 계약을 제안했습니다. 제안 역할: ${getRequestedRosterRoleLabel(
      offerInput.requestedRosterRole,
    )}. 다음날 AI 경쟁 제안과 함께 결과가 확정됩니다.`,
    { isUserTeamRelated: true },
  );
}

function getContractSalaryTotal(team: Team) {
  return team.contracts
    .filter((contract) => contract.remainingYears > 0)
    .reduce((total, contract) => total + contract.salary, 0);
}

export function validateOffseasonRoster(
  career: CareerSave,
): OffseasonRosterValidation {
  const errors: string[] = [];
  const rosterSettings = career.userTeam.rosterSettings;
  const minMainRosterPlayers = rosterSettings.minMainRosterPlayers ?? 5;
  const minAcademyRosterPlayers = rosterSettings.minAcademyRosterPlayers ?? 5;
  const contractedPlayerIds = career.userTeam.contracts
    .filter((contract) => {
      const player = getPlayer(career, contract.playerId);

      return contract.remainingYears > 0 && player?.availableForRoster;
    })
    .map((contract) => contract.playerId);
  const contractedIdSet = new Set(contractedPlayerIds);
  const yearlySalary = getContractSalaryTotal(career.userTeam);
  const starterPlayerIds = roleOrder
    .map((role) => career.userTeam.roster[role])
    .filter((playerId): playerId is string => {
      if (!playerId || !contractedIdSet.has(playerId)) {
        return false;
      }

      const player = getPlayer(career, playerId);

      return Boolean(player?.availableForRoster);
    });
  const mainRosterPlayerIds = [
    ...new Set([...career.userTeam.mainRosterPlayerIds, ...starterPlayerIds]),
  ].filter((playerId) => {
    if (!contractedIdSet.has(playerId)) {
      return false;
    }

    const player = getPlayer(career, playerId);

    return Boolean(player?.availableForRoster);
  });
  const academyPlayerIds = career.userTeam.academyRosterPlayerIds.filter(
    (playerId) => {
      if (!contractedIdSet.has(playerId)) {
        return false;
      }

      const player = getPlayer(career, playerId);

      return Boolean(player?.availableForRoster);
    },
  );

  if (contractedPlayerIds.length < rosterSettings.minPlayers) {
    errors.push(
      `계약 선수는 최소 ${rosterSettings.minPlayers}명이 필요합니다.`,
    );
  }

  if (contractedPlayerIds.length > rosterSettings.maxPlayers) {
    errors.push(
      `계약 선수는 최대 ${rosterSettings.maxPlayers}명을 넘을 수 없습니다.`,
    );
  }

  if (mainRosterPlayerIds.length < minMainRosterPlayers) {
    errors.push(`1군 등록 계약 선수는 최소 ${minMainRosterPlayers}명이 필요합니다.`);
  }

  if (academyPlayerIds.length < minAcademyRosterPlayers) {
    errors.push(
      `2군 등록 계약 선수는 최소 ${minAcademyRosterPlayers}명이 필요합니다.`,
    );
  }

  if (yearlySalary > career.userTeam.budget) {
    errors.push("계약 총액이 팀 예산을 초과했습니다.");
  }

  const confirmationPendingCount = (
    career.seasonState.offseason?.resolvedOffers ?? []
  ).filter((offer) => offer.status === "confirmation-pending").length;

  if (confirmationPendingCount > 0) {
    errors.push(
      `영입 확정 대기 중인 제안 ${confirmationPendingCount}건을 먼저 처리해야 합니다.`,
    );
  }

  roleOrder.forEach((role) => {
    const starterId = career.userTeam.roster[role];
    const starter = starterId ? getPlayer(career, starterId) : undefined;

    if (
      !starterId ||
      !starter ||
      !starter.availableForRoster ||
      !contractedIdSet.has(starterId)
    ) {
      errors.push(`${role.toUpperCase()} 선발 계약 선수가 필요합니다.`);
      return;
    }

    if (starter.role !== role) {
      errors.push(`${starter.name}은 ${role.toUpperCase()} 선발로 등록할 수 없습니다.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    academyPlayerIds,
    contractedPlayerIds,
    mainRosterPlayerIds,
    starterPlayerIds,
    yearlySalary,
  };
}

function setBlocked(career: CareerSave, errors: string[]) {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  return appendLog(
    {
      ...career,
      seasonState: {
        ...career.seasonState,
        offseason: {
          ...offseason,
          marketStatus: "blocked",
          validationErrors: errors,
        },
      },
    },
    "blocked",
    errors[0] ?? "스토브리그 진행 조건을 충족하지 못했습니다.",
  );
}

function advanceOffseasonDate(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (!offseason) {
    return career;
  }

  const nextDay = (offseason.currentDay ?? 1) + 1;
  const nextWeek = getCurrentOffseasonWeek(nextDay);
  const nextDateKey = addDaysToDateKey(career.seasonState.currentDateKey, 1);
  const nextMarketStatus = getMarketStatusForDay(nextDay);

  return {
    ...career,
    seasonState: {
      ...career.seasonState,
      currentDateKey: nextDateKey,
      currentDateLabel: formatSeasonDateLabel(nextDateKey),
      currentTurn: career.seasonState.currentTurn + 1,
      progressStatus: "idle" as const,
      nextMatchIds: [],
      lastMatchRecordIds: [],
      offseason: {
        ...offseason,
        currentDay: nextDay,
        currentWeek: nextWeek,
        marketStatus: nextMarketStatus,
        validationErrors: [],
      },
    },
  };
}

export function progressOffseasonDay(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;

  if (
    career.seasonState.phase !== "offseason" ||
    !offseason ||
    offseason.status !== "active"
  ) {
    return career;
  }

  const currentDay = offseason.currentDay ?? 1;
  const negotiatedPlayerIds = getPendingOfferPlayerIdsToResolve(career);
  const careerWithResolvedOffers = resolveAiDepthSignings(
    resolveFreeAgentOffers(resolveRenewalOffers(career)),
    negotiatedPlayerIds,
  );
  const unresolvedExpiredPlayerIds = getUnresolvedExpiredPlayerIds(
    careerWithResolvedOffers,
  );

  if (currentDay >= 7 && unresolvedExpiredPlayerIds.length > 0) {
    const unresolvedNames = unresolvedExpiredPlayerIds
      .map((playerId) => getPlayer(careerWithResolvedOffers, playerId)?.name ?? playerId)
      .join(", ");

    return setBlocked(careerWithResolvedOffers, [
      `1주차 종료 전 ${unresolvedNames}의 재계약 또는 방출을 결정해야 합니다.`,
    ]);
  }

  if (currentDay >= 28) {
    const validation = validateOffseasonRoster(careerWithResolvedOffers);

    if (!validation.isValid) {
      return setBlocked(careerWithResolvedOffers, validation.errors);
    }

    const readyCareer: CareerSave = {
      ...careerWithResolvedOffers,
      seasonState: {
        ...careerWithResolvedOffers.seasonState,
        offseason: {
          ...careerWithResolvedOffers.seasonState.offseason!,
          status: "ready-for-next-season",
          marketStatus: "completed",
          validationErrors: [],
        },
      },
    };
    const readyCareerWithLog = appendLog(
      readyCareer,
      "system",
      offseason.context === "preseason"
        ? "프리시즌 최종 등록을 마치고 2026 LCK Cup에 진입합니다."
        : "스토브리그 최종 등록을 마치고 다음 시즌으로 이동합니다.",
    );

    if (offseason.context === "preseason") {
      const nextSeasonState = completeStoveLeague(
        readyCareerWithLog.seasonState,
      );

      return {
        ...readyCareerWithLog,
        seasonState: {
          ...nextSeasonState,
          offseason: undefined,
        },
      };
    }

    return startNextSeasonFromOffseason(readyCareerWithLog);
  }

  return advanceOffseasonDate(careerWithResolvedOffers);
}
