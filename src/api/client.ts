import axios from "axios";
import { clearSession } from "../services/session";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  // No default Content-Type: axios sets application/json by itself for plain objects. A default JSON
  // header makes axios turn FormData uploads into JSON, which breaks every file upload.
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 400,
});

// The login cookie expires (15 minutes) but the session copy in localStorage does not, so the UI used to
// look logged in while every call failed. A 401 on a normal API call now ends the session and returns
// the user to the login page. Login/register themselves are excluded so a wrong password just shows its error.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.startsWith("/auth/") && window.location.pathname !== "/login") {
        clearSession();
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export function getApiError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const message = "message" in data ? data.message : undefined;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    if (!error.response) {
      return "Cannot reach the TrackNest API. Make sure the backend is running.";
    }
  }

  return fallback;
}