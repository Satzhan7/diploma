import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005'; // Fallback to localhost:3005

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Single-flight refresh-token rotation ---
// On a 401 we attempt ONE token refresh via POST /auth/refresh and replay the
// failed request. Concurrent 401s share the same in-flight refresh: they are
// queued and replayed once the new access token arrives. If the refresh fails
// (or no refresh token is stored) we fall back to the previous behaviour:
// clear tokens and redirect to /login.
let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
};

const forceLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // If this is a login response and it has a token, save it
    if (response.config.url?.includes('/auth/login') && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    // Only handle expired-token 401s. Anything else keeps the prior behaviour.
    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthCall) {
      if (status === 401 && !isAuthCall) {
        forceLogout();
      }
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // A refresh is already in flight: queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      // Bare axios call so this request bypasses the request interceptor, which
      // would otherwise attach the stale access token and recurse on 401.
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      const newAccessToken: string | undefined = data?.accessToken;
      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }
      localStorage.setItem('accessToken', newAccessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      flushQueue(newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api; 