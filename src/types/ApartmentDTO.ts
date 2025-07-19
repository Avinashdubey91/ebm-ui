export interface ApartmentDTO {
  apartmentId?: number;              // Optional for creation
  societyId: number;

  apartmentName: string;
  blockName?: string;
  constructionYear?: number;
  buildingType?: string;

  totalFloors?: number;
  totalFlats?: number;
  hasLift: boolean;
  hasGenerator: boolean;
  gateFacing?: string;

  caretakerName?: string;
  caretakerPhone?: string;
  maintenanceLead?: string;
  emergencyContact?: string;

  createdDate?: string;
  modifiedDate?: string;
  createdBy?: number;
  modifiedBy?: number;
  isDeleted?: boolean;
}
