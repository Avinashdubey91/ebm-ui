export interface SocietyDTO {
  societyId?: number;
  societyName: string;
  address?: string;
  city?: string;
  countryId?: number;
  stateId?: number;
  districtId?: number;
  pinCode?: string;
  contactNumber?: string;
  email?: string;
  contactPerson?: string;
  secretaryName?: string;
  secretaryPhone?: string;
  treasurerName?: string;
  treasurerPhone?: string;
  registrationNumber?: string;
  societyType?: string;
  hasClubhouse?: boolean;
  hasSwimmingPool?: boolean;
  logoUrl?: string;
}
