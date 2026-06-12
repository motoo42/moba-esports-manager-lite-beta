import { offseasonFreeAgentSeeds } from "../../../data/offseasonFreeAgents";
import type { CareerSave, Player } from "../../../types/game";
import { appendLog } from "./shared";
import { removePlayersFromUserTeam } from "./rosterPlacement";

export function getPlayer(career: CareerSave, playerId: string) {
  return career.lckPlayers.find((player) => player.id === playerId);
}

export function updatePlayer(
  players: Player[],
  playerId: string,
  update: (player: Player) => Player,
) {
  return players.map((player) =>
    player.id === playerId ? update(player) : player,
  );
}

export function setPlayerCurrentTeam(
  players: Player[],
  playerId: string,
  currentTeam: string | undefined,
) {
  return updatePlayer(players, playerId, (player) => ({
    ...player,
    currentTeam,
  }));
}

export function mergeOffseasonFreeAgents(players: Player[]) {
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

export function normalizeUserContractedPlayers(career: CareerSave, players: Player[]) {
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

export function getInitialFreeAgentIds(players: Player[], extraIds: string[] = []) {
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

export function getResolvedExpiredPlayerIds(career: CareerSave) {
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

export function shouldRetireThisOffseason(player: Player) {
  return (
    player.availableForRoster &&
    (Boolean(player.retirementCandidate) ||
      (player.retirementAge !== undefined && player.age >= player.retirementAge))
  );
}

export function shouldEnterMilitaryService(player: Player) {
  return (
    player.availableForRoster &&
    player.militaryServiceStatus === "pending"
  );
}

export function applyOffseasonDepartures(career: CareerSave, players: Player[]) {
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

export function getPlayerNamesById(players: Player[], playerIds: string[]) {
  return playerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.name)
    .filter((name): name is string => Boolean(name));
}

export function appendDepartureLogs(
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

export function getAvailableFreeAgentPlayers(
  career: CareerSave,
  excludedPlayerIds: Set<string>,
) {
  return career.lckPlayers.filter(
    (player) =>
      isFreeAgentMarketPlayer(career, player) &&
      !excludedPlayerIds.has(player.id),
  );
}

export function getConfirmationPendingOffer(career: CareerSave, offerId: string) {
  return (career.seasonState.offseason?.resolvedOffers ?? []).find(
    (offer) =>
      offer.id === offerId &&
      offer.status === "confirmation-pending" &&
      offer.fromTeamName === career.userTeam.name &&
      (offer.negotiationContext ?? "free-agent") === "free-agent",
  );
}

export function getConfirmationPendingPlayerIds(career: CareerSave) {
  return new Set(
    (career.seasonState.offseason?.resolvedOffers ?? [])
      .filter((offer) => offer.status === "confirmation-pending")
      .flatMap((offer) => offer.playerIds),
  );
}

export function isObservableFreeAgentPlayer(
  career: CareerSave,
  player: Player,
) {
  return (
    player.availableForRoster &&
    !player.currentTeam &&
    !getConfirmationPendingPlayerIds(career).has(player.id)
  );
}

export function isFreeAgentMarketPlayer(career: CareerSave, player: Player) {
  const freeAgentIds = new Set(
    career.seasonState.offseason?.freeAgentPlayerIds ?? [],
  );

  return freeAgentIds.has(player.id) && isObservableFreeAgentPlayer(career, player);
}
