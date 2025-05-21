import httpClient from '../../api/httpClient';

interface LoginRequest {
  userName: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  userId: number;
}

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>('/Login/login', credentials);
  return response.data;
};
