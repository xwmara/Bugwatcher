import axios from "axios";

// One configured HTTP client for the whole app.
// Requests go to "/api/..." on the same origin as the frontend:
// - in development, Vite forwards /api to the backend (see vite.config.js)
// - in production, the hosting platform does the same (rewrite rule)
// Same origin means the login cookie works without cross-site settings.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});
