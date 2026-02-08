import axios from "axios";

// Single place to change backend URL
// CRA env override: set REACT_APP_API_BASE_URL=http://localhost:2222
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:2222";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export function getApiErrorMessage(err, fallbackMessage) {
  const fallback = fallbackMessage || "Request failed";
  if (!err || !err.response) return fallback;

  const contentType = String(err.response.headers?.["content-type"] || "");
  const data = err.response.data;

  if (
    typeof data === "string" &&
    (contentType.includes("text/html") || data.trim().toLowerCase().startsWith("<!doctype html") || data.trim().toLowerCase().startsWith("<html"))
  ) {
    return "Backend returned an HTML page (likely wrong API URL or a proxy/404). Check REACT_APP_API_BASE_URL.";
  }

  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }

  return fallback;
}
