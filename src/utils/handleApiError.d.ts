interface HandledApiError {
    userMessage: string;
    developerMessage: string;
    statusCode?: number;
}
export declare function handleApiError(error: unknown, fallbackMessage?: string): HandledApiError;
export {};
