interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface HandledApiError {
  userMessage: string;       // Message suitable for end-user (toast, modal, etc.)
  developerMessage: string;  // Message helpful for debugging (log, alert)
  statusCode?: number;       // HTTP Status code if available
}

export function handleApiError(
  error: unknown,
  fallbackMessage = "Something went wrong."
): HandledApiError {
  const err = error as ApiError;

  const statusCode = err?.response?.status;
  const apiMessage = err?.response?.data?.message;
  const rawMessage = err?.message;

  let userMessage = fallbackMessage;
  let developerMessage = rawMessage || "Unknown error";

  if (statusCode) {
    switch (statusCode) {
      case 400:
        userMessage = "Invalid input. Please correct the form.";
        break;
      case 401:
        userMessage = "You are not authorized. Please login again.";
        break;
      case 403:
        userMessage = "Access denied. Contact your administrator.";
        break;
      case 404:
        userMessage = "Requested resource not found.";
        break;
      case 409:
        userMessage = "Conflict. The data might already exist.";
        break;
      case 422:
        userMessage = "Unprocessable input. Please review the data.";
        break;
      case 500:
        userMessage = "Server error. Please try again later.";
        break;
      case 503:
        userMessage = "Server is currently unavailable. Try again soon.";
        break;
      default:
        userMessage = apiMessage || `Unexpected error (Code: ${statusCode})`;
    }
  } else if (rawMessage?.toLowerCase().includes("network")) {
    userMessage = "Cannot reach server. Check your internet connection.";
    developerMessage = "Network Error - likely CORS, VPN, or server down";
  } else if (apiMessage) {
    userMessage = apiMessage;
  }

  return {
    userMessage,
    developerMessage,
    statusCode,
  };
}
