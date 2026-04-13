import axios from "axios";

type RefreshResponse = {
  accessToken?: string;
};

type RetryableRequestConfig = {
  url: string;
  headers?: Record<string, string>;
  _retry?: boolean;
  [key: string]: unknown;
};

type AxiosLikeError = {
  config?: RetryableRequestConfig;
  response?: {
    status?: number;
  };
};

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;

  return (
    url.includes("/Login/login") ||
    url.includes("/Login/refresh") ||
    url.includes("/Login/logout")
  );
};

const refreshAccessTokenRequest = async (): Promise<string | null> => {
  try {
    const response = await axios.post<RefreshResponse>(
      `${apiBaseUrl}/Login/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const nextAccessToken = response.data?.accessToken;

    if (!nextAccessToken) {
      clearAccessToken();
      return null;
    }

    setAccessToken(nextAccessToken);
    return nextAccessToken;
  } catch {
    clearAccessToken();
    return null;
  }
};

httpClient.interceptors.request.use((config) => {
  const requestConfig = config as unknown as RetryableRequestConfig;

  if (!requestConfig.headers) {
    requestConfig.headers = {};
  }

  if (accessToken) {
    requestConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosLikeError;
    const originalRequest = axiosError.config;

    if (!originalRequest || !originalRequest.url) {
      return Promise.reject(error);
    }

    const statusCode = axiosError.response?.status;

    if (
      statusCode !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessTokenRequest().finally(() => {
        refreshPromise = null;
      });
    }

    const nextAccessToken = await refreshPromise;

    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    if (!originalRequest.headers) {
      originalRequest.headers = {};
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

    return httpClient(originalRequest as never);
  }
);

export default httpClient;