export interface UserDTO {
  userId?: number;
  userName: string;
  firstName: string;
  lastName: string;
  addressLine1?: string;
  street?: string;
  city?: string;
  gender?: string;
  dob?: string; // 🟡 string (ISO format) — convert to Date if needed
  pinCode?: string;
  mobile?: string;
  email?: string;
  roleId?: number;
  roleName?: string;
  profilePicture?: string;
  remarks?: string;
  countryId?: number;
  countryName?: string;
  stateId?: number;
  stateName?: string;
  districtId?: number;
  districtName?: string;
}
