export interface UserDTO {
  userId?: number;
  userName: string;
  firstName: string;
  lastName: string;
  address?: string;
  pinCode?: string;
  mobile?: string;
  email?: string;
  roleId?: number;
  roleName?: string;
  profilePicture?: string;
}
