/** Matches EBM.Application.DTOs.OwnerDTO on the backend */
export interface OwnerDTO {
    ownerId: number;
    firstName: string;
    lastName: string;
    gender?: string;
    mobile?: string;
    alternateMobile?: string;
    emailId?: string;
    address?: string;
    city?: string;
    pinCode?: string;
    countryId?: number;
    countryName?: string;
    stateId?: number;
    stateName?: string;
    districtId?: number;
    districtName?: string;
    occupation?: string;
    aadharNumber?: string;
    ownershipType?: string;
    profilePhotoUrl?: string;
    idProofUrl?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    isDeceased: boolean;
    isActive: boolean;
    isFirstOwner: boolean;
    notes?: string;
    createdBy?: number;
    createdDate?: string;
    modifiedBy?: number;
    modifiedDate?: string;
    deletedBy?: number;
    deletedDate?: string;
}
