export interface FlatRenterDTO {
  flatRenterId: number;
  flatId: number;
  renterId: number;

  rentFrom: string;     // ISO/string date
  rentTo?: string;      // ISO/string date

  agreementNumber?: string;
  notes?: string;

  // Related Renter fields
  firstName?: string;
  lastName?: string;
  gender?: string;
  mobile?: string;
  emailId?: string;
  address?: string;

  // Related Flat fields
  flatNumber?: string;
}
