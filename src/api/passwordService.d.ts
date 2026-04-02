interface ChangePasswordWithOtpRequest {
    username: string;
    newPassword: string;
    OTP: string;
    email?: string;
    mobile?: string;
    currentPassword?: string;
}
export declare const changePasswordWithOtp: (data: ChangePasswordWithOtpRequest) => Promise<Axios.AxiosXHR<unknown>>;
export {};
