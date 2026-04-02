export interface FlatRenterDTO {
    flatRenterId: number;
    flatId: number;
    renterId: number;
    rentFrom: string;
    rentTo?: string;
    agreementNumber?: string;
    notes?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    mobile?: string;
    emailId?: string;
    address?: string;
    flatNumber?: string;
}
