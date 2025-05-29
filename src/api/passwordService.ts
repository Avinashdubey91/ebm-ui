import httpClient from './httpClient';

interface ChangePasswordWithOtpRequest {
  username: string;
  newPassword: string;
  OTP: string;
  email?: string;
  mobile?: string;
  currentPassword?: string;
}

export const changePasswordWithOtp = async (data: ChangePasswordWithOtpRequest) => {
  return httpClient.post('/Login/change-password-with-otp', data);
};
