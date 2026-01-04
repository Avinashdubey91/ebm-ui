export interface MaintenanceGroupDTO {
  maintenanceGroupId: number;
  apartmentId: number;
  effectiveFrom: string;   // API returns DateTime => ISO string
  effectiveTo?: string | null;
  totalCharge: number;     // API returns decimal
  isActive: boolean;
}