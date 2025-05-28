import httpClient from './httpClient';

export const sendOtp = async (data: { username: string; email?: string }) => {
  return httpClient.post('/OTP/send-otp', data);
};

export const verifyOtp = async (data: { username: string; email: string; OTP: string }) => {
  return httpClient.post('/OTP/verify-otp', data);
};

export const unlockAccount = async (data: {
  username: string;
  email: string;
  mobile: string;
  OTP: string;
}) => {
  return httpClient.post('/Login/unlock-account', data);
};
