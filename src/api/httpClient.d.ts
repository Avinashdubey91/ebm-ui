declare const httpClient: Axios.AxiosInstance;
export declare const setAccessToken: (token: string | null) => void;
export declare const getAccessToken: () => string | null;
export declare const clearAccessToken: () => void;
export default httpClient;
