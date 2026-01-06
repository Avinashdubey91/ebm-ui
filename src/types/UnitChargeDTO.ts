export type UnitChargeDTO = {
  unitChargeId: number;

  effectiveFrom: string;
  effectiveTo: string;
  chargePerUnit: number | string;

  currencyId: number;
  rateTypeId: number;

  isActive: boolean;

  minUnit?: number | null;
  maxUnit?: number | null;

  threshold?: number | string | null;
  subsidizedFlag?: boolean | null;

  peakDemandMultiplier?: number | string | null;
  baseRate?: number | string | null;
  tieredRate?: number | string | null;

  applicableMonthFrom?: number | null;
  applicableMonthTo?: number | null;

  fromHour?: string | null;
  toHour?: string | null;
};