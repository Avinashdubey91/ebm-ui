import httpClient from './httpClient';
import type { UserProfile } from '../types/UserProfile';

export const getUserProfile = async (username: string): Promise<UserProfile> => {
  const response = await httpClient.get<UserProfile>(`/User/Get-UserProfile/${username}`);
  return response.data;
};

// Check if a username is available
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const response = await httpClient.get<{ available: boolean }>(`/User/Check-Username-Availability/${username}`);
  return response.data.available;
};

// Suggest usernames
export const suggestUsernames = async (firstName: string, lastName: string): Promise<string[]> => {
  const response = await httpClient.get<string[]>(`/User/Suggest-Usernames/${firstName}/${lastName}`);
  return response.data;
};

