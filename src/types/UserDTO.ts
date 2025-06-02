export interface UserDTO {
  userId?: number;
  userName: string;
  firstName: string;
  lastName: string;
  addressLine1?: string;
  street?: string;
  city?: string;
  country?: string;
  gender?: string;
  dob?: string; // 🟡 string (ISO format) — convert to Date if needed
  pinCode?: string;
  mobile?: string;
  email?: string;
  roleId?: number;
  roleName?: string;
  profilePicture?: string;
  remarks?: string;
}
