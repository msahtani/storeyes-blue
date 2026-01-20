import { isTokenExpired, keycloakApi } from '@/domains/auth/services/keycloakService';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

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

// Refresh lock to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];
let failedRefresh = false;
let lastRefreshTime = 0; // Track when last refresh happened to prevent rapid retries

/**
 * Subscribe to token refresh - called when refresh completes
 */
const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Add subscriber to refresh queue
 */
const addRefreshSubscriber = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Reset refresh state (useful for logout)
 */
export const resetRefreshState = () => {
  isRefreshing = false;
  refreshSubscribers = [];
  failedRefresh = false;
  lastRefreshTime = 0;
};

/**
 * Clear all tokens and reset refresh state
 */
export const clearTokens = async () => {
  try {
    await deleteItemAsync(TOKEN_STORAGE_KEY);
    await deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    await deleteItemAsync(TOKEN_EXPIRY_KEY);
    resetRefreshState();
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Check if token is expired based on stored expiry time
 * Uses 60-second buffer to align with backend clock skew tolerance
 */
const isStoredTokenExpired = async (): Promise<boolean> => {
  try {
    const expiryTime = await getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;

    // Add 60 second buffer to refresh before actual expiration
    // This aligns with backend's 60-second clock skew tolerance
    const bufferTime = 60 * 1000; // 60 seconds
    return Date.now() >= parseInt(expiryTime, 10) - bufferTime;
  } catch (error) {
    return true;
  }
};

/**
 * Refresh token if expired - with lock to prevent concurrent refreshes
 * Implements request queuing pattern to handle multiple concurrent requests
 */
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  // If refresh already failed, don't try again
  if (failedRefresh) {
    console.log('[Token Refresh] Refresh already failed, skipping');
    return null;
  }

  // If already refreshing, wait for it to complete
  if (isRefreshing) {
    console.log('[Token Refresh] Refresh already in progress, subscribing to completion');
    return new Promise((resolve) => {
      addRefreshSubscriber((token: string | null) => {
        resolve(token);
      });
    });
  }

  // Prevent rapid retries (if refresh just happened, wait a bit)
  const timeSinceLastRefresh = Date.now() - lastRefreshTime;
  if (timeSinceLastRefresh < 1000 && lastRefreshTime > 0) {
    console.log('[Token Refresh] Refresh happened recently, using cached result');
    // Just get the current token from storage
    const currentToken = await getItemAsync(TOKEN_STORAGE_KEY);
    return currentToken;
  }

  isRefreshing = true;
  lastRefreshTime = Date.now();

  try {
    const refreshToken = await getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    if (!refreshToken) {
      console.warn('[Token Refresh] No refresh token available');
      failedRefresh = true;
      isRefreshing = false;
      onTokenRefreshed(null);
      return null;
    }

    console.log('[Token Refresh] Refreshing access token...');

    // Save the refresh token we're about to use (for debugging - first 20 chars only)
    const tokenPreview = refreshToken.length > 20
      ? refreshToken.substring(0, 20) + '...'
      : '***';
    console.log('[Token Refresh] Using refresh token (preview):', tokenPreview);

    // Make the refresh call
    const response = await keycloakApi.refreshToken(refreshToken);

    if (response.access_token) {
      // CRITICAL: Save new refresh token FIRST before saving access token
      // Some backends rotate refresh tokens (single-use), so we must save the new one immediately
      // This prevents race conditions where another request tries to use the old (now invalid) refresh token
      if (response.refresh_token) {
        await setItemAsync(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
        console.log('[Token Refresh] New refresh token saved (rotated)');
      } else {
        // If no new refresh token in response, backend doesn't rotate tokens
        // Keep using the same refresh token
        console.log('[Token Refresh] No new refresh token in response, keeping existing one');
      }

      // Save access token and expiry
      await setItemAsync(TOKEN_STORAGE_KEY, response.access_token);
      const expiryTime = Date.now() + (response.expires_in * 1000);
      await setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());

      console.log('[Token Refresh] Token refreshed successfully', {
        expiresIn: response.expires_in,
        hasNewRefreshToken: !!response.refresh_token,
        expiryTime: new Date(expiryTime).toISOString(),
      });

      // Reset failed flag on success
      failedRefresh = false;
      lastRefreshTime = Date.now();

      // Notify all waiting requests BEFORE releasing lock
      // This ensures they get the new token
      onTokenRefreshed(response.access_token);

      // Release lock AFTER notifying subscribers
      isRefreshing = false;

      return response.access_token;
    } else {
      console.error('[Token Refresh] Refresh response missing access_token');
      failedRefresh = true;
      isRefreshing = false;
      onTokenRefreshed(null);
      return null;
    }
  } catch (error: any) {
    console.error('[Token Refresh] Token refresh failed:', error);

    // Parse error details - handle nested error structures
    let errorMessage = error?.error_description || error?.message || '';
    let errorCode = error?.error || '';
    const statusCode = error?.statusCode;

    // Try to extract nested error information if error_description is a JSON string
    try {
      // Check if error_description contains a JSON string
      const jsonMatch = errorMessage.match(/\{.*"error".*\}/);
      if (jsonMatch) {
        const nestedError = JSON.parse(jsonMatch[0]);
        if (nestedError.error) {
          errorCode = nestedError.error || errorCode;
        }
        if (nestedError.error_description) {
          errorMessage = nestedError.error_description || errorMessage;
        }
      }
    } catch (parseError) {
      // If parsing fails, continue with original error message
    }

    // Also check the error message itself for nested error patterns
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token is not active')) {
      // Extract error code from message if present
      if (errorMessage.includes('invalid_grant') && !errorCode) {
        errorCode = 'invalid_grant';
      }
    }

    // Check for specific error types - comprehensive check
    const isInvalidGrant =
      errorCode === 'invalid_grant' ||
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('Token is not active') ||
      errorMessage.includes('not active') ||
      errorMessage.includes('invalid_grant');

    // 401 means unauthorized - refresh token is invalid/expired
    // 500 with invalid_grant might mean refresh token was already used (single-use) or expired
    const isRefreshTokenExpired =
      statusCode === 401 ||
      (statusCode === 500 && isInvalidGrant) ||
      errorMessage.includes('expired') ||
      errorMessage.includes('token expired') ||
      (errorMessage.includes('invalid') && !errorMessage.includes('credentials'));

    if (isInvalidGrant || isRefreshTokenExpired) {
      console.warn('[Token Refresh] Refresh token invalid, expired, or already used. User needs to login again.', {
        statusCode,
        errorCode,
        errorMessage,
        isInvalidGrant,
        isRefreshTokenExpired,
      });
      // Refresh token is invalid/expired/consumed - user must login again
      failedRefresh = true;

      // Clear tokens immediately - refresh token is no longer valid
      console.warn('[Token Refresh] Clearing tokens due to refresh token invalidation');
      await clearTokens();

      // TODO: Dispatch logout action here to redirect user to login screen
      // This would require importing your store/dispatch mechanism
      // Example: dispatch(logout());

    } else {
      // Network or other error (500 without invalid_grant, timeout, etc.)
      // Don't mark as permanently failed - might be temporary server issue
      console.warn('[Token Refresh] Refresh failed due to network or server error, will retry on next request', {
        statusCode,
        errorMessage,
      });
      // Don't set failedRefresh = true for network errors
      // Keep tokens - might still be valid, just couldn't refresh due to network
      console.log('[Token Refresh] Keeping tokens, resetting refresh state for retry');
      isRefreshing = false;
      resetRefreshState();
    }

    // Notify all waiting requests with null (refresh failed)
    onTokenRefreshed(null);
    isRefreshing = false;

    return null;
  }
};

// Request interceptor to add auth token and check expiry
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Skip token check for auth endpoints to avoid interceptor loops
      const isAuthEndpoint = config.url?.includes('/auth/refresh') ||
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register');

      if (isAuthEndpoint) {
        return config;
      }

      let token = await getItemAsync(TOKEN_STORAGE_KEY);

      // Check if token is expired (by expiry time or by decoding)
      if (token) {
        const expiredByTime = await isStoredTokenExpired();
        const expiredByDecode = isTokenExpired(token);

        if (expiredByTime || expiredByDecode) {
          console.log('[Token Refresh] Token expired, attempting proactive refresh...', {
            expiredByTime,
            expiredByDecode,
            url: config.url,
          });

          // Try to refresh token proactively
          const newToken = await refreshTokenIfNeeded();
          if (newToken) {
            token = newToken;
            console.log('[Token Refresh] Using refreshed token for request');
          } else {
            // Refresh failed, clear token
            console.warn('[Token Refresh] Proactive refresh failed, request will proceed without token');
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
      console.warn('[Token Refresh] Failed to retrieve access token:', error);
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

    // Skip refresh for auth endpoints to avoid loops
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried, try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('[Token Refresh] Received 401, attempting token refresh...', {
        url: originalRequest.url,
        isRefreshing,
      });

      // If refresh is already in progress, wait for it
      if (isRefreshing) {
        console.log('[Token Refresh] Refresh in progress, queuing request...');
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string | null) => {
            if (token) {
              console.log('[Token Refresh] Retrying request with refreshed token');
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            } else {
              console.error('[Token Refresh] Refresh failed while queued, rejecting request');
              // If refresh failed, don't retry - user needs to login
              reject(error);
            }
          });
        });
      }

      // Check if we already failed refresh (don't retry if refresh token is invalid)
      if (failedRefresh) {
        console.warn('[Token Refresh] Refresh already failed, not retrying. User needs to login.');
        return Promise.reject(error);
      }

      try {
        const newToken = await refreshTokenIfNeeded();

        if (newToken) {
          console.log('[Token Refresh] Token refreshed, retrying original request');
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } else {
          console.error('[Token Refresh] Token refresh failed');
          // Refresh failed - tokens may have been cleared by refreshTokenIfNeeded
          // Don't clear again here to avoid double-clearing

          // You might want to dispatch logout action here
          // For now, we'll reject the error
          return Promise.reject(error);
        }
      } catch (refreshError: any) {
        console.error('[Token Refresh] Token refresh error:', refreshError);
        // Refresh failed - check if tokens were already cleared
        // Don't clear again to avoid issues

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

