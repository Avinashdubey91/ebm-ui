export interface MaintenanceGroupDTO {
    maintenanceGroupId: number;
    apartmentId: number;
    effectiveFrom: string;
    effectiveTo?: string | null;
    totalCharge: number;
    isActive: boolean;
}
