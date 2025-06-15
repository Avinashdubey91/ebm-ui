export interface SocietyDTO {
  societyId: number;
  societyName: string;
  address?: string;
  city?: string;
  pinCode?: string;
  societyType?: string;

  contactPerson?: string;
  contactNumber?: string;
  email?: string;

  secretaryName?: string;
  secretaryPhone?: string;
  treasurerName?: string;
  treasurerPhone?: string;

  registrationNumber?: string;
  hasClubhouse: boolean;
  hasSwimmingPool: boolean;
  logoUrl?: string;

  createdDate?: string;
  modifiedDate?: string;
}
