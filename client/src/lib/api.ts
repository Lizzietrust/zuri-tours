import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/* ---------- Attach JWT to every request ---------- */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/* ---------- Normalize errors to a single shape ---------- */
export type ApiError = {
  status: "fail" | "error";
  message: string;
  statusCode?: number;
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data) {
      return Promise.reject({
        message: error.response.data.message || "Something went wrong",
        statusCode: error.response.status,
        status: error.response.data.status || "error",
      });
    }
    if (error.request) {
      return Promise.reject({
        message: "Network error. Is the server running?",
        status: "error",
      });
    }
    return Promise.reject({
      message: error.message || "Unknown error",
      status: "error",
    });
  },
);

/* ---------- Token helpers ---------- */
export const setToken = (token: string) => {
  if (typeof window !== "undefined") localStorage.setItem("token", token);
};

export const clearToken = () => {
  if (typeof window !== "undefined") localStorage.removeItem("token");
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};
