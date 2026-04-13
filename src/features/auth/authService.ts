import httpClient from '../../api/httpClient';

interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  expiresIn: number;
  userId: number;
  fullName: string;
  role: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  userId: number;
  role: string;
}

export const loginUser = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>('/Login/login', credentials);
  return response.data;
};

export const refreshAccessToken = async (): Promise<RefreshTokenResponse> => {
  const response = await httpClient.post<RefreshTokenResponse>('/Login/refresh');
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await httpClient.post('/Login/logout');
};