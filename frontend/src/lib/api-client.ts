import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Inject JWT token from localStorage & handle FormData
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g. 401 Unauthorized redirect)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Only redirect if not already on the login or register pages
        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")
        ) {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`;
        }
      }
    }
    return Promise.reject(error);
  }
);
