import type { CareerSave } from "../../types/game";
import type { OffseasonMarketViewStatus } from "./offseason-market/types";

export type {
  OffseasonContractOfferInput,
  OffseasonMarketViewStatus,
  OffseasonRosterValidation,
  OffseasonRosterValidationOptions,
} from "./offseason-market/types";

export {
  getOffseasonContractDemand,
  getOffseasonMinimumAcceptableSalary,
  getOffseasonVisibleDemandSalary,
} from "./offseason-market/demand";
export { getOffseasonMoodColor } from "./offseason-market/mood";
export { getOffseasonNegotiationSnapshot } from "./offseason-market/negotiation";
export {
  getUnresolvedExpiredPlayerIds,
  isFreeAgentMarketPlayer,
  isObservableFreeAgentPlayer,
} from "./offseason-market/playerPool";
export { validateOffseasonRoster } from "./offseason-market/validation";
export { initializeOffseasonMarket } from "./offseason-market/initialize";
export {
  releaseExpiredOffseasonPlayer,
  submitOffseasonRenewalOffer,
} from "./offseason-market/renewalFlow";
export {
  cancelFreeAgentSigning,
  confirmFreeAgentSigning,
  submitFreeAgentOffer,
} from "./offseason-market/freeAgentFlow";
export { progressOffseasonDay } from "./offseason-market/dayProgress";

/**
 * Public offseason market API.
 *
 * Keep this file as the stable import boundary for UI/tests. New behavior
 * should live in focused modules under offseason-market/ so workflow files stay
 * small and import direction remains offseasonMarket.ts -> submodules.
 */
export function getOffseasonMarketViewStatus(
  career: CareerSave,
): OffseasonMarketViewStatus {
  return career.seasonState.phase === "offseason" &&
    career.seasonState.offseason?.status === "active"
    ? "active-market"
    : "closed-info";
}
