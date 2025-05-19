import httpClient from './httpClient';
import type { UserProfile } from '../types/UserProfile';

export const getUserProfile = async (username: string): Promise<UserProfile> => {
  const response = await httpClient.get<UserProfile>(`/User/Get-UserProfile/${username}`);
  return response.data;
};
