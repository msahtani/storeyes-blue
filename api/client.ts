import { isTokenExpired, keycloakApi } from '@/domains/auth/services/keycloakService';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const baseURL = 'https://api.storeyes.io/api';

// Storage keys
const TOKEN_STORAGE_KEY = 'accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Check if token is expired based on stored expiry time
 */
const isStoredTokenExpired = async (): Promise<boolean> => {
  try {
    const expiryTime = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    // Add 30 second buffer to refresh before actual expiration
    const bufferTime = 30 * 1000; // 30 seconds
    return Date.now() >= parseInt(expiryTime, 10) - bufferTime;
  } catch (error) {
    return true;
  }
};

/**
 * Refresh token if expired
 */
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    if (!refreshToken) {
      return null;
    }

    const response = await keycloakApi.refreshToken(refreshToken);
    
    if (response.access_token) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, response.access_token);
      
      // Store expiry time
      const expiryTime = Date.now() + response.expires_in * 1000;
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      if (response.refresh_token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
      }
      
      return response.access_token;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens on refresh failure
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  }
  
  return null;
};

// Request interceptor to add auth token and check expiry
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      let token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      
      // Check if token is expired (by expiry time or by decoding)
      if (token) {
        const expiredByTime = await isStoredTokenExpired();
        const expiredByDecode = isTokenExpired(token);
        
        if (expiredByTime || expiredByDecode) {
          // Try to refresh token
          const newToken = await refreshTokenIfNeeded();
          if (newToken) {
            token = newToken;
          } else {
            // Refresh failed, clear token
            token = null;
          }
        }
      }
      
      // Add Authorization header if token exists
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If token retrieval fails, continue without token
      console.warn('Failed to retrieve access token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshTokenIfNeeded();
        
        if (newToken) {
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } else {
          // Refresh failed, clear tokens
          await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
          await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
          
          // You might want to dispatch logout action here
          // For now, we'll reject the error
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

