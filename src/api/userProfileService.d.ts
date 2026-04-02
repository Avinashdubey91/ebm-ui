import type { UserDTO } from "../types/UserDTO";
export declare const getUserProfile: (username: string) => Promise<UserDTO>;
export declare const checkUsernameAvailability: (username: string) => Promise<boolean>;
export declare const suggestUsernames: (firstName: string, lastName: string) => Promise<string[]>;
