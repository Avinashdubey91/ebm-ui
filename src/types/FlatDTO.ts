export interface FlatDTO {
  flatId?: number;
  apartmentId: number;
  flatNumber: string;
  isRented?: boolean;
  floorNumber?: number;
  facingDirection?: string;
  flatType?: string;
  superBuiltUpArea?: number;
  carParkingSlots?: number;
  isActive?: boolean;
  hasGasPipeline?: boolean;
  hasWaterConnection?: boolean;
  hasBalcony?: boolean;
  isFurnished?: boolean;
  hasSolarPanel?: boolean;
  hasInternetConnection?: boolean;
  registeredEmail?: string;
  registeredMobile?: string;
  utilityNotes?: string;
}
