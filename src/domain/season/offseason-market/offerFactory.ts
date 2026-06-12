import type {
  CareerSave,
  ContractType,
  OffseasonNegotiationContext,
  OffseasonOffer,
  OffseasonOfferStatus,
  OffseasonRequestedRosterRole,
  PlayerContract,
} from "../../../types/game";
import { createPlayerContract } from "../../players";
import { getCurrentOffseasonDay } from "./shared";
import type { OffseasonContractOfferInput } from "./types";

export function createContract({
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

export function createOffer({
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
