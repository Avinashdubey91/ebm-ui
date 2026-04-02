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
export declare const loginUser: (credentials: LoginRequest) => Promise<LoginResponse>;
export {};
