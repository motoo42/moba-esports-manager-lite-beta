import type {
  ContractType,
  OffseasonRequestedRosterRole,
} from "../../../types/game";

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

export type OffseasonRosterValidationOptions = {
  academyPolicy?: "required" | "auto-fill";
};

export type OffseasonMarketViewStatus = "active-market" | "closed-info";
