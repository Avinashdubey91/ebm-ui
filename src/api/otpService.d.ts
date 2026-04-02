export declare const sendOtp: (data: {
    username: string;
    email?: string;
}) => Promise<Axios.AxiosXHR<unknown>>;
export declare const verifyOtp: (data: {
    username: string;
    email: string;
    OTP: string;
}) => Promise<Axios.AxiosXHR<unknown>>;
export declare const unlockAccount: (data: {
    username: string;
    email: string;
    mobile: string;
    OTP: string;
}) => Promise<Axios.AxiosXHR<unknown>>;
