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
export declare const loginUser: (credentials: LoginRequest) => Promise<LoginResponse>;
export declare const refreshAccessToken: () => Promise<RefreshTokenResponse>;
export declare const logoutUser: () => Promise<void>;
export {};
