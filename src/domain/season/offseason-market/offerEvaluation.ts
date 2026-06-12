import { getLckTeamProfile } from "../../../data/lckTeams";
import type {
  CareerSave,
  ContractType,
  OffseasonNegotiationContext,
  OffseasonOffer,
  Player,
} from "../../../types/game";
import { getContractTypeScoreBonus } from "../../players";
import { getAiMainRoleCount } from "../offseasonRosterAutomation";
import { clampNumber } from "./shared";
import { getOffseasonContractDemand } from "./demand";
import { getOffseasonNegotiationSnapshot } from "./negotiation";
import {
  getContractedRoleCount,
  maxPlayersPerRolePerTeam,
} from "./validation";

export function getTeamNeedScore({
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
      : getAiMainRoleCount(career.lckPlayers, teamName, player.role);

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

export function getTeamAppeal(career: CareerSave, teamName: string) {
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

export function getTeamBudgetSnapshot(career: CareerSave, teamName: string) {
  if (teamName === career.userTeam.name) {
    const committedSalary = career.userTeam.contracts
      .filter((contract) => contract.remainingYears > 0)
      .reduce((total, contract) => total + contract.salary, 0);

    return {
      budget: career.userTeam.budget,
      committedSalary,
      remainingBudget: career.userTeam.budget - committedSalary,
    };
  }

  const profile = getLckTeamProfile(
    teamName,
    career.seasonState.teamBalanceAdjustments,
  );
  const budget = profile?.budget ?? 450;
  const committedSalary = career.lckPlayers
    .filter(
      (player) =>
        player.currentTeam === teamName &&
        player.availableForRoster &&
        player.rosterTier !== "academy",
    )
    .reduce((total, player) => total + player.salaryExpectation * 0.65, 0);

  return {
    budget,
    committedSalary,
    remainingBudget: budget - committedSalary,
  };
}

export function getBudgetFitScore({
  career,
  salaryOffer,
  teamName,
}: {
  career: CareerSave;
  salaryOffer: number;
  teamName: string;
}) {
  const { budget, remainingBudget } = getTeamBudgetSnapshot(career, teamName);
  const roomAfterOffer = remainingBudget - salaryOffer;
  const roomRatio = budget > 0 ? roomAfterOffer / budget : 0;

  return clampNumber(roomRatio * 55, -28, 16);
}

export function getOfferScore({
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
    getTeamNeedScore({ career, player, teamName }) +
    getBudgetFitScore({ career, salaryOffer, teamName }) +
    player.overall * 0.08 +
    player.potential * 0.04
  );
}

export function evaluateOffer({
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
    requestedRosterRole: offer.requestedRosterRole,
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
