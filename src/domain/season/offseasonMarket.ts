import { lck2026Teams } from "../../data/lckTeams";
import { offseasonFreeAgentSeeds } from "../../data/offseasonFreeAgents";
import type {
  CareerSave,
  ContractType,
  OffseasonLogEntry,
  OffseasonMarketStatus,
  OffseasonOffer,
  OffseasonOfferStatus,
  Player,
  PlayerContract,
  Role,
  Team,
} from "../../types/game";
import {
  addDaysToDateKey,
  formatSeasonDateLabel,
} from "./seasonScheduleDates";
import { startNextSeasonFromOffseason } from "./seasonEnd";

export type OffseasonContractOfferInput = {
  playerId: string;
  contractType: ContractType;
  salaryOffer: number;
};

export type OffseasonRosterValidation = {
  isValid: boolean;
  errors: string[];
  contractedPlayerIds: string[];
  yearlySalary: number;
};

const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];
const contractTypeSalaryMultiplier: Record<ContractType, number> = {
  "one-year": 1,
  "two-year": 1.08,
  "one-plus-one": 1.04,
};
const contractTypeScoreBonus: Record<ContractType, number> = {
  "one-year": 0,
  "two-year": 6,
  "one-plus-one": 3,
};

function getContractYears(type: ContractType): Pick<
  PlayerContract,
  "guaranteedYears" | "optionYear" | "remainingYears"
> {
  if (type === "two-year") {
    return {
      guaranteedYears: 2,
      remainingYears: 2,
    };
  }

  if (type === "one-plus-one") {
    return {
      guaranteedYears: 1,
      optionYear: true,
      remainingYears: 2,
    };
  }

  return {
    guaranteedYears: 1,
    remainingYears: 1,
  };
}

function createContract({
  contractType,
  playerId,
  salaryOffer,
}: OffseasonContractOfferInput): PlayerContract {
  return {
    playerId,
    salary: Math.max(0, Math.round(salaryOffer)),
    type: contractType,
    ...getContractYears(contractType),
  };
}

export function getOffseasonContractDemand(
  player: Player,
  contractType: ContractType,
) {
  return Math.round(
    player.salaryExpectation * contractTypeSalaryMultiplier[contractType],
  );
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
  message,
  type,
}: {
  career: CareerSave;
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
  };
}

function appendLog(
  career: CareerSave,
  type: OffseasonLogEntry["type"],
  message: string,
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
          createLogEntry({ career, type, message }),
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

function addPlayerToAcademy(team: Team, playerId: string): Team {
  const existingIds = new Set([
    ...Object.values(team.roster).filter((id): id is string => Boolean(id)),
    ...team.mainRosterPlayerIds,
    ...team.academyRosterPlayerIds,
  ]);

  if (existingIds.has(playerId)) {
    return team;
  }

  return {
    ...team,
    academyRosterPlayerIds: [...team.academyRosterPlayerIds, playerId],
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

function createOffer({
  career,
  contractType,
  fromTeamName,
  playerId,
  salaryOffer,
  status,
  toTeamName = "Free Agent",
}: {
  career: CareerSave;
  contractType: ContractType;
  fromTeamName: string;
  playerId: string;
  salaryOffer: number;
  status: OffseasonOfferStatus;
  toTeamName?: string;
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
  const freeAgentPlayerIds = getInitialFreeAgentIds(
    lckPlayers,
    offseason.freeAgentPlayerIds ?? [],
  );
  const resolvedExpiredPlayerIds =
    offseason.expiredContractPlayerIds.length === 0
      ? []
      : offseason.resolvedExpiredPlayerIds ?? [];
  const nextCareer: CareerSave = {
    ...career,
    lckPlayers,
    seasonState: {
      ...career.seasonState,
      currentDateKey: startedDateKey,
      currentDateLabel: formatSeasonDateLabel(startedDateKey),
      progressStatus: "idle" as const,
      nextMatchIds: [],
      lastMatchRecordIds: [],
      offseason: {
        ...offseason,
        status: "active",
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
        resolvedExpiredPlayerIds,
        logEntries: [],
        validationErrors: [],
        bridgeNote:
          "Advanced stove league market initialized for daily offseason progress.",
      },
    },
  };

  return appendLog(
    nextCareer,
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
    !offseason.expiredContractPlayerIds.includes(offerInput.playerId)
  ) {
    return career;
  }

  const demand = getOffseasonContractDemand(player, offerInput.contractType);
  const accepted = offerInput.salaryOffer >= Math.ceil(demand * 0.9);
  const resolvedOffer = {
    ...createOffer({
      career,
      contractType: offerInput.contractType,
      fromTeamName: career.userTeam.name,
      playerId: offerInput.playerId,
      salaryOffer: offerInput.salaryOffer,
      status: accepted ? "accepted" : "rejected",
    }),
    resolvedDay: getCurrentOffseasonDay(career),
  };
  const updatedOffseason = {
    ...offseason,
    marketStatus: "renewal-week" as OffseasonMarketStatus,
    resolvedOffers: [...(offseason.resolvedOffers ?? []), resolvedOffer],
    validationErrors: [],
  };

  if (!accepted) {
    return appendLog(
      setOffseasonState(career, updatedOffseason),
      "renewal",
      `${player.name}이 ${Math.round(offerInput.salaryOffer)} 제안을 거절했습니다. 요구액은 ${demand}입니다.`,
    );
  }

  const nextContract = createContract(offerInput);
  const nextCareer: CareerSave = {
    ...career,
    lckPlayers: setPlayerCurrentTeam(
      career.lckPlayers,
      player.id,
      career.userTeam.name,
    ),
    userTeam: replaceContract(career.userTeam, nextContract),
    seasonState: {
      ...career.seasonState,
      offseason: {
        ...updatedOffseason,
        renewedPlayerIds: addUnique(offseason.renewedPlayerIds, player.id),
        resolvedExpiredPlayerIds: addUnique(
          offseason.resolvedExpiredPlayerIds ?? [],
          player.id,
        ),
      },
    },
  };

  return appendLog(
    nextCareer,
    "renewal",
    `${player.name}과 ${Math.round(offerInput.salaryOffer)} 규모의 ${offerInput.contractType} 재계약에 합의했습니다.`,
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
  );
}

function getContractedRoleCount(career: CareerSave, role: Role) {
  const contractedIds = new Set(
    career.userTeam.contracts.map((contract) => contract.playerId),
  );

  return career.lckPlayers.filter(
    (player) => player.role === role && contractedIds.has(player.id),
  ).length;
}

function getAiRoleCount(players: Player[], teamName: string, role: Role) {
  return players.filter(
    (player) => player.currentTeam === teamName && player.role === role,
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

  return (
    lck2026Teams.find((team) => team.name === teamName || team.shortName === teamName)
      ?.strength ?? 72
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
    contractTypeScoreBonus[contractType] +
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
  player,
  teamName,
}: {
  career: CareerSave;
  player: Player;
  teamName: string;
}) {
  const currentDay = getCurrentOffseasonDay(career);
  const hash = hashString(`${player.id}:${teamName}:${currentDay}`);
  const contractType: ContractType = hash % 3 === 0 ? "two-year" : "one-year";
  const demand = getOffseasonContractDemand(player, contractType);
  const salaryOffer = Math.round(demand * (0.92 + (hash % 24) / 100));
  const offer = createOffer({
    career,
    contractType,
    fromTeamName: teamName,
    playerId: player.id,
    salaryOffer,
    status: "pending",
  });

  return {
    ...offer,
    score: getOfferScore({
      career,
      contractType,
      player,
      salaryOffer,
      teamName,
    }),
  };
}

function getPendingUserOffersToResolve(career: CareerSave) {
  const currentDay = getCurrentOffseasonDay(career);

  return (career.seasonState.offseason?.pendingOffers ?? []).filter(
    (offer) =>
      offer.kind === "contract" &&
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      offer.createdDay < currentDay,
  );
}

function resolveFreeAgentOffers(career: CareerSave): CareerSave {
  const offseason = career.seasonState.offseason;
  const offersToResolve = getPendingUserOffersToResolve(career);

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

    const userContractType = userOffer.contractType ?? "one-year";
    const userScore = getOfferScore({
      career: currentCareer,
      contractType: userContractType,
      player,
      salaryOffer: userOffer.salaryOffer,
      teamName: currentCareer.userTeam.name,
    });
    const aiOffers = getAiCandidateTeams(currentCareer, player).map(({ team }) =>
      createAiOffer({
        career: currentCareer,
        player,
        teamName: team.name,
      }),
    );
    const bestAiOffer = aiOffers.sort(
      (left, right) => (right.score ?? 0) - (left.score ?? 0),
    )[0];
    const userWins = !bestAiOffer || userScore >= (bestAiOffer.score ?? 0);
    const resolvedUserOffer: OffseasonOffer = {
      ...userOffer,
      status: userWins ? "accepted" : "lost",
      resolvedDay: getCurrentOffseasonDay(currentCareer),
      score: userScore,
    };
    const remainingPendingOffers = (currentOffseason.pendingOffers ?? []).filter(
      (offer) => offer.id !== userOffer.id,
    );

    if (userWins) {
      const nextContract = createContract({
        playerId,
        contractType: userContractType,
        salaryOffer: userOffer.salaryOffer,
      });
      const nextCareer: CareerSave = {
        ...currentCareer,
        lckPlayers: setPlayerCurrentTeam(
          currentCareer.lckPlayers,
          playerId,
          currentCareer.userTeam.name,
        ),
        userTeam: addPlayerToAcademy(
          replaceContract(currentCareer.userTeam, nextContract),
          playerId,
        ),
        seasonState: {
          ...currentCareer.seasonState,
          offseason: {
            ...currentOffseason,
            pendingOffers: remainingPendingOffers,
            resolvedOffers: [
              ...(currentOffseason.resolvedOffers ?? []),
              resolvedUserOffer,
            ],
            freeAgentPlayerIds: removeValue(
              currentOffseason.freeAgentPlayerIds ?? [],
              playerId,
            ),
            signedPlayerIds: addUnique(
              currentOffseason.signedPlayerIds ?? [],
              playerId,
            ),
            validationErrors: [],
          },
        },
      };

      return appendLog(
        nextCareer,
        "signing",
        `${player.name} 영입 경쟁에서 승리했습니다. 제안 연봉 ${Math.round(userOffer.salaryOffer)}.`,
      );
    }

    const acceptedAiOffer: OffseasonOffer = {
      ...(bestAiOffer ?? userOffer),
      id: `${bestAiOffer?.id ?? userOffer.id}-ai-win`,
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
    );
  }, career);
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
    !(offseason.freeAgentPlayerIds ?? []).includes(player.id)
  ) {
    return career;
  }

  const hasPendingOffer = (offseason.pendingOffers ?? []).some(
    (offer) =>
      offer.status === "pending" &&
      offer.fromTeamName === career.userTeam.name &&
      offer.playerIds.includes(player.id),
  );

  if (hasPendingOffer) {
    return career;
  }

  const pendingOffer = createOffer({
    career,
    contractType: offerInput.contractType,
    fromTeamName: career.userTeam.name,
    playerId: player.id,
    salaryOffer: offerInput.salaryOffer,
    status: "pending",
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
    `${player.name}에게 ${Math.round(offerInput.salaryOffer)} 규모의 FA 계약을 제안했습니다. 다음날 AI 경쟁 제안과 함께 결과가 확정됩니다.`,
  );
}

function getContractSalaryTotal(team: Team) {
  return team.contracts.reduce((total, contract) => total + contract.salary, 0);
}

export function validateOffseasonRoster(
  career: CareerSave,
): OffseasonRosterValidation {
  const errors: string[] = [];
  const contractedPlayerIds = career.userTeam.contracts
    .filter((contract) => contract.remainingYears > 0)
    .map((contract) => contract.playerId);
  const contractedIdSet = new Set(contractedPlayerIds);
  const yearlySalary = getContractSalaryTotal(career.userTeam);

  if (contractedPlayerIds.length < career.userTeam.rosterSettings.minPlayers) {
    errors.push(
      `계약 선수는 최소 ${career.userTeam.rosterSettings.minPlayers}명이 필요합니다.`,
    );
  }

  if (contractedPlayerIds.length > career.userTeam.rosterSettings.maxPlayers) {
    errors.push(
      `계약 선수는 최대 ${career.userTeam.rosterSettings.maxPlayers}명을 넘을 수 없습니다.`,
    );
  }

  if (yearlySalary > career.userTeam.budget) {
    errors.push("계약 총액이 팀 예산을 초과했습니다.");
  }

  roleOrder.forEach((role) => {
    const starterId = career.userTeam.roster[role];
    const starter = starterId ? getPlayer(career, starterId) : undefined;

    if (!starterId || !starter || !contractedIdSet.has(starterId)) {
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
    contractedPlayerIds,
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
  const careerWithResolvedOffers = resolveFreeAgentOffers(career);
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

    return startNextSeasonFromOffseason(
      appendLog(
        readyCareer,
        "system",
        "스토브리그 최종 등록을 마치고 다음 시즌으로 이동합니다.",
      ),
    );
  }

  return advanceOffseasonDate(careerWithResolvedOffers);
}
