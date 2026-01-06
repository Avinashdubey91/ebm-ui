export type UtilityType = "Electricity" | "Water" | "Gas" | "Heat";

export type MeterScope =
  | "Apartment"
  | "Personal"
  | "Society"
  | "Block"
  | "Commercial"
  | "CommonArea"
  | "Temporary";

export type VerificationStatus =
  | "Pending"
  | "Verified"
  | "Failed"
  | "ReverificationRequired";

export type PhaseType = "SinglePhase" | "TwoPhase" | "ThreePhase";

export type MeterDTO = {
  meterId: number;

  apartmentId: number;
  flatId?: number | null;

  meterNumber: string;

  utilityType: UtilityType | number;
  meterScope: MeterScope | number;

  installationDate?: string | null;
  lastVerifiedDate?: string | null;

  isActive: boolean;
  isSmartMeter: boolean;

  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  readingUnit?: string | null;

  locationDescription?: string | null;

  installationBy?: string | null;
  verifiedBy?: string | null;

  verificationStatus?: VerificationStatus | number | null;
  verificationRemarks?: string | null;

  deactivationReason?: string | null;

  phaseType?: PhaseType | number | null;
};