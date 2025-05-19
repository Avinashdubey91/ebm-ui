export interface UserProfile {
  firstName: string;
  lastName: string;
  profilePicture?: string; // optional in case backend sends null
  role: string;
}
