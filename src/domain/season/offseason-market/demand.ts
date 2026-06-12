import type {
  ContractType,
  OffseasonNegotiationContext,
  Player,
} from "../../../types/game";
import { getPlayerContractDemand } from "../../players";

export function getOffseasonContractDemand(
  player: Player,
  contractType: ContractType,
) {
  return getPlayerContractDemand(player, contractType);
}
export function getRenewalDemandMultiplier(day: number) {
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

export function getFreeAgentDemandMultiplier(day: number) {
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

export function getDemandMultiplier({
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
