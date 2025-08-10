export interface RenterDTO {
  renterId: number;
  firstName: string;
  lastName: string;
  gender?: string;
  mobile?: string;
  alternateMobile?: string;
  emailId?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  livingSince?: string | null;
  leaseEndDate?: string | null;
  agreementCopyUrl?: string;
  profilePhotoUrl?: string;
  aadharNumber?: string;
  isPoliceVerified: boolean;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  isActive: boolean;
  notes?: string;
  countryId?: number;
  countryName?: string;
  stateId?: number;
  stateName?: string;
  districtId?: number;
  districtName?: string;
}
