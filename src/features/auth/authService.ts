import httpClient from '../../api/httpClient';

interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  userId: number;
  fullName: string;
  role: string;
}

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>('/Login/login', credentials);
  return response.data;
};