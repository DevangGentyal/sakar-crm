import axios from "axios";

type ApiErrorResponse = {
  message?: string;
  error?: string;
  code?: string;
  data?: {
    message?: string;
  };
  errors?: unknown;
};

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    const serverMessage =
      responseData?.message ?? responseData?.error ?? responseData?.data?.message;

    const serverCode = responseData?.code;

    if (serverMessage && typeof serverMessage === "string") {
      return serverMessage;
    }

    if (serverCode) {
      switch (serverCode) {
        case "INVALID_CREDENTIALS":
          return "Invalid email or password.";
        case "DUPLICATE_EMAIL":
          return "An account with this email already exists.";
        case "COMPANY_INACTIVE":
          return "This company is currently inactive.";
        case "INVALID_COMPANY_CODE":
          return "The company code you entered is invalid.";
        case "INVALID_REGISTRATION_PASSWORD":
          return "The registration password is incorrect.";
        case "ACCOUNT_PENDING_APPROVAL":
          return "Your account is awaiting administrator approval.";
        case "ACCOUNT_REJECTED":
          return "Your registration request was rejected.";
        case "ACCOUNT_DISABLED":
          return "Your account has been disabled.";
        case "LEAD_NOT_FOUND":
          return "The lead was not found.";
        case "NO_LEAD_CHANGES":
          return "No changes were detected. Update at least one field.";
        case "TERMINAL_STATE":
          return "This lead can no longer be updated because it is in a final state.";
        case "EXECUTIVE_MOBILE_MISSING":
          return "Your account does not have a mobile number configured for calling.";
        case "FILE_TYPE_NOT_ALLOWED":
          return "Only JPG, JPEG, PNG, and WEBP files are allowed.";
        case "PAYLOAD_TOO_LARGE":
          return "The uploaded file is too large. Maximum size is 5 MB.";
        default:
          break;
      }
    }

    if (typeof error.response?.status === "number") {
      switch (error.response.status) {
        case 400:
          return "Please check the form fields and try again.";
        case 401:
          return "Invalid email or password.";
        case 403:
          return "You are not allowed to complete this action.";
        case 404:
          return "The requested account or company was not found.";
        case 409:
          return "An account with this email already exists.";
        case 422:
          return "Some details are invalid. Please review the form.";
        case 413:
          return "The uploaded file is too large.";
        default:
          return fallback;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
