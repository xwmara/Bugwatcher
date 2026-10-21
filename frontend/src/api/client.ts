import axios, { isAxiosError } from "axios";

// One configured HTTP client for the whole app.
// Requests go to "/api/..." on the same origin as the frontend:
// - in development, Vite forwards /api to the backend (see vite.config.js)
// - in production, the hosting platform does the same (rewrite rule)
// Same origin means the login cookie works without cross-site settings.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Every API error response has this shape: { message: "..." }
interface ApiErrorBody {
  message?: string;
}

// Returns the error message sent by the API (e.g. "Invalid email or password."),
// or the fallback text when there is none (network error, server down).
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

// Returns the HTTP status of an API error (e.g. 401, 409), or undefined when the
// request never got an answer (network error) or the error is not from the API.
export const getErrorStatus = (err: unknown): number | undefined =>
  isAxiosError(err) ? err.response?.status : undefined;
