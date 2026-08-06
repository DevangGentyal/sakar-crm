import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "../types";
import { mockUser, mockLeads, mockStats } from "./mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const USE_MOCK_DATA = false; // Disable mock data to connect to the backend

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store for auth token
let authToken: string | null = null;

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  if (stored) {
    authToken = stored;
  }
  return authToken;
};

// Set auth token
export const setAuthToken = (token: string | null): void => {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }
};

// Request interceptor - Add JWT token to headers and handle mock data
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Mock data handler
    if (USE_MOCK_DATA) {
      const url = config.url || "";

      // Mock authentication
      if (url.includes("/auth/me")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ...config,
              adapter: async () => ({
                data: { user: mockUser, token: "mock-token" },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }

      // Mock get leads
      if (
        url.includes("/leads") &&
        config.method === "get" &&
        !url.includes("/history") &&
        !url.includes("/notes") &&
        !url.includes("/follow-ups")
      ) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const params = config.params || {};
            let filteredLeads = [...mockLeads];

            // Apply search filter
            if (params.search) {
              const search = params.search.toLowerCase();
              filteredLeads = filteredLeads.filter(
                (l) =>
                  l.name.toLowerCase().includes(search) ||
                  l.email.toLowerCase().includes(search) ||
                  l.phone.includes(search),
              );
            }

            // Apply status filter
            if (params.status) {
              filteredLeads = filteredLeads.filter(
                (l) => l.status === params.status,
              );
            }

            // Apply source filter
            if (params.source) {
              filteredLeads = filteredLeads.filter(
                (l) => l.source === params.source,
              );
            }

            // Apply property type filter
            if (params.propertyType) {
              filteredLeads = filteredLeads.filter(
                (l) => l.propertyType === params.propertyType,
              );
            }

            const page = params.page || 1;
            const limit = params.limit || 10;
            const startIdx = (page - 1) * limit;
            const paginatedLeads = filteredLeads.slice(
              startIdx,
              startIdx + limit,
            );

            resolve({
              ...config,
              adapter: async () => ({
                data: {
                  data: paginatedLeads,
                  total: filteredLeads.length,
                  page,
                  limit,
                  totalPages: Math.ceil(filteredLeads.length / limit),
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }

      // Mock get dashboard stats
      if (url.includes("/dashboard/stats")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ...config,
              adapter: async () => ({
                data: mockStats,
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }

      // Mock get recent leads
      if (url.includes("/dashboard/recent-leads")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const limit = config.params?.limit || 5;
            resolve({
              ...config,
              adapter: async () => ({
                data: mockLeads.slice(0, limit),
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }

      // Mock create lead
      if (url.includes("/leads") && config.method === "post") {
        return new Promise((resolve) => {
          setTimeout(() => {
            const newLead = {
              id: `lead-${Date.now()}`,
              ...config.data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            mockLeads.unshift(newLead);
            resolve({
              ...config,
              adapter: async () => ({
                data: newLead,
                status: 201,
                statusText: "Created",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }

      // Mock update lead
      if (url.includes("/leads/") && config.method === "patch") {
        return new Promise((resolve) => {
          setTimeout(() => {
            const leadId = url.split("/").pop();
            const leadIndex = mockLeads.findIndex((l) => l.id === leadId);
            if (leadIndex !== -1) {
              mockLeads[leadIndex] = {
                ...mockLeads[leadIndex],
                ...config.data,
                updatedAt: new Date().toISOString(),
              };
            }
            resolve({
              ...config,
              adapter: async () => ({
                data: mockLeads[leadIndex],
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }

      // Mock delete lead
      if (url.includes("/leads/") && config.method === "delete") {
        return new Promise((resolve) => {
          setTimeout(() => {
            const leadId = url.split("/").pop();
            const leadIndex = mockLeads.findIndex((l) => l.id === leadId);
            if (leadIndex !== -1) {
              mockLeads.splice(leadIndex, 1);
            }
            resolve({
              ...config,
              adapter: async () => ({
                data: null,
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              }),
            } as any);
          }, 300);
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const apiError: ApiError = {
      code: error.code || "UNKNOWN_ERROR",
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    };

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      setAuthToken(null);
      // Trigger logout event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register"
        ) {
          window.location.href = "/login";
        }
      }
      apiError.message = "Session expired. Please log in again.";
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      apiError.message = "You do not have permission to access this resource.";
    }

    // Handle 404 - Not Found
    if (error.response?.status === 404) {
      apiError.message = "Resource not found.";
    }

    // Handle 422 - Validation Error
    if (error.response?.status === 422) {
      apiError.message = error.response.data?.message || "Validation error";
      apiError.details = error.response.data?.errors;
    }

    // Handle 5xx - Server Error
    if (error.response?.status && error.response.status >= 500) {
      apiError.message = "Server error. Please try again later.";
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
