export type FlatMaintenanceDTO = {
  flatMaintenanceId: number;
  flatId: number;
  maintenanceGroupId: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
};
