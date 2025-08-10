export interface FlatOwnerDTO {
  flatOwnerId: number;
  flatId: number;
  ownerId: number;
  ownershipFrom: string;
  ownershipTo?: string;
  isPrimaryOwner: boolean;
  ownershipProof?: string;
  notes?: string;

  firstName?: string;
  lastName?: string;
  gender?: string;
  mobile?: string;
  emailId?: string;
  address?: string;
  pinCode?: string;
  occupation?: string;

  flatNumber?: string;
}
