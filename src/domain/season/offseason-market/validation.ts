import type { CareerSave, Player, Role, Team } from "../../../types/game";
import type {
  OffseasonRosterValidation,
  OffseasonRosterValidationOptions,
} from "./types";
import { getPlayer } from "./playerPool";

export const roleOrder: Role[] = ["top", "jungle", "mid", "bot", "support"];
export const maxPlayersPerRolePerTeam = 3;

export function getContractedRoleCount(career: CareerSave, role: Role) {
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

export function getRoleLimitError(career: CareerSave, player: Player) {
  const roleCount = getContractedRoleCount(career, player.role);

  if (roleCount >= maxPlayersPerRolePerTeam) {
    return `${player.role.toUpperCase()} 포지션은 1군과 2군을 합쳐 최대 ${maxPlayersPerRolePerTeam}명까지만 보유할 수 있습니다.`;
  }

  return null;
}

export function getBudgetLimitError(career: CareerSave, salaryOffer: number) {
  const nextSalaryTotal = getContractSalaryTotal(career.userTeam) + salaryOffer;

  if (nextSalaryTotal > career.userTeam.budget) {
    return `예산 초과: 현재 연봉 여유 금액을 초과해 영입할 수 없습니다.`;
  }

  return null;
}

export function setOffseasonValidationErrors(career: CareerSave, errors: string[]) {
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

export function getContractSalaryTotal(team: Team) {
  return team.contracts
    .filter((contract) => contract.remainingYears > 0)
    .reduce((total, contract) => total + contract.salary, 0);
}

export function validateOffseasonRoster(
  career: CareerSave,
  options: OffseasonRosterValidationOptions = {},
): OffseasonRosterValidation {
  const errors: string[] = [];
  const rosterSettings = career.userTeam.rosterSettings;
  const minMainRosterPlayers = rosterSettings.minMainRosterPlayers ?? 5;
  const minAcademyRosterPlayers = rosterSettings.minAcademyRosterPlayers ?? 5;
  const requiresAcademyMinimum = options.academyPolicy !== "auto-fill";
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

  if (
    requiresAcademyMinimum &&
    contractedPlayerIds.length < rosterSettings.minPlayers
  ) {
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

  if (requiresAcademyMinimum && academyPlayerIds.length < minAcademyRosterPlayers) {
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
