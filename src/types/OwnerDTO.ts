/*  types/OwnerDTO.ts  */

/** Matches EBM.Application.DTOs.OwnerDTO on the backend */
export interface OwnerDTO {
  /* ------------- identity ------------- */
  ownerId: number;

  /* ------------- core info ------------- */
  firstName: string;
  lastName: string;
  gender?: string;

  /* ------------- contact ------------- */
  mobile?: string;
  alternateMobile?: string;
  emailId?: string;

  /* ------------- address ------------- */
  address?: string;
  city?: string;
  pinCode?: string;
  countryId?: number;
  countryName?: string;
  stateId?: number;
  stateName?: string;
  districtId?: number;
  districtName?: string;

  /* ------------- profile / docs ------------- */
  occupation?: string;
  aadharNumber?: string;
  ownershipType?: string;
  profilePhotoUrl?: string;
  idProofUrl?: string;

  /* ------------- emergency ------------- */
  emergencyContactName?: string;
  emergencyContactNumber?: string;

  /* ------------- flags ------------- */
  isDeceased: boolean;
  isActive: boolean;
  isFirstOwner: boolean;

  /* ------------- misc ------------- */
  notes?: string;

  /* ------------- audit fields (from BaseEntity) ------------- */
  createdBy?: number;
  createdDate?: string;   // ISO 8601
  modifiedBy?: number;
  modifiedDate?: string;  // ISO 8601
  deletedBy?: number;
  deletedDate?: string;   // ISO 8601
}
