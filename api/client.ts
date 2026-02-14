import { isTokenExpired, keycloakApi } from '@/domains/auth/services/keycloakService';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://api.storeyes.io';
const baseURL = apiBase.replace(/\/$/, '') + '/api';

/** Same base URL for fetch-based requests (e.g. document uploads). Use this instead of duplicating env logic. */
export const getApiBaseUrl = () => baseURL;

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
let refreshPromise: Promise<string | null> | null = null; // Store the active refresh promise (acts as lock)
let isCreatingRefreshPromise = false; // Flag to prevent multiple promises from being created
let refreshPromiseResolve: ((token: string | null) => void) | null = null; // Resolver for the promise (for cleanup tracking)

// Callback for when logout is needed (set from outside to avoid circular dependencies)
let onLogoutRequired: (() => void) | null = null;

/**
 * Set callback to be called when logout is required
 * This allows the API client to trigger logout without circular dependencies
 */
export const setLogoutCallback = (callback: () => void) => {
  onLogoutRequired = callback;
};

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
  isCreatingRefreshPromise = false;
  refreshSubscribers = [];
  failedRefresh = false;
  lastRefreshTime = 0;
  refreshPromise = null;
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
 * Uses 30-second proactive refresh buffer (refresh 30s before expiration)
 * Backend has 60-second clock skew tolerance, so 30s buffer is safe
 */
const isStoredTokenExpired = async (): Promise<boolean> => {
  try {
    const expiryTime = await getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;

    // Proactive refresh: refresh 30 seconds before actual expiration
    // This ensures token is refreshed before it expires, preventing 401 errors
    const bufferTime = 30 * 1000; // 30 seconds
    return Date.now() >= parseInt(expiryTime, 10) - bufferTime;
  } catch (error) {
    return true;
  }
};

/**
 * Refresh token if expired - MANDATORY: Single refresh lock implementation
 * 
 * This function implements the mandatory requirements from backend documentation:
 * 1. Single Refresh Lock: Only ONE refresh operation may be in progress at any time
 * 2. Atomic Token Storage: Access token and refresh token saved atomically
 * 3. Request Queueing: Requests arriving during refresh are queued and retried after refresh
 * 4. Proper Error Handling: Logout on invalid_grant errors
 * 
 * CRITICAL: This prevents race conditions with token rotation (single-use refresh tokens)
 */
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  // If refresh already failed, don't try again (user must login)
  if (failedRefresh) {
    console.log('[Token Refresh] Refresh already failed, skipping');
    return null;
  }

  // CRITICAL: Use promise itself as lock - check if refresh is already in progress
  // This is the ONLY truly atomic check - if promise exists, refresh is in progress
  // Check this FIRST before any async operations to prevent race conditions
  if (refreshPromise) {
    console.log('[Token Refresh] Refresh already in progress, subscribing to completion');
    // Request queueing: Wait for existing refresh to complete
    // CRITICAL: Return the promise directly - don't await here, let the caller await
    return refreshPromise;
  }

  // MANDATORY: Single Refresh Lock - Check if refresh is already in progress
  // Double-check with boolean flag (for edge cases)
  if (isRefreshing) {
    // If refreshing but no promise yet (shouldn't happen, but safety check)
    console.log('[Token Refresh] Refresh already in progress, subscribing to completion');
    return new Promise((resolve) => {
      addRefreshSubscriber((token: string | null) => {
        resolve(token);
      });
    });
  }

  // CRITICAL: Prevent rapid retries - if refresh just happened, use the new token
  // This prevents requests from starting a new refresh immediately after one completes
  // Increased to 2 seconds to give time for token to be saved and propagated
  const timeSinceLastRefresh = Date.now() - lastRefreshTime;
  if (timeSinceLastRefresh < 2000 && lastRefreshTime > 0) {
    console.log('[Token Refresh] Refresh happened recently, re-reading token from storage', {
      timeSinceLastRefresh: `${timeSinceLastRefresh}ms`,
    });
    // CRITICAL: Re-read token from storage (it was just updated by recent refresh)
    // Don't use cached token - read fresh from storage
    const currentToken = await getItemAsync(TOKEN_STORAGE_KEY);
    if (currentToken) {
      // Verify the token is actually valid before returning it
      const isExpired = isTokenExpired(currentToken);
      if (!isExpired) {
        console.log('[Token Refresh] Recent refresh token is valid, using it');
        return currentToken;
      } else {
        // Token is still expired - this shouldn't happen if refresh just completed
        // But don't start another refresh immediately - the previous one might still be saving
        console.warn('[Token Refresh] Token still expired after recent refresh, but waiting to avoid race condition');
        // Wait a bit more and check again
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryToken = await getItemAsync(TOKEN_STORAGE_KEY);
        if (retryToken && !isTokenExpired(retryToken)) {
          return retryToken;
        }
      }
    }
  }

  // CRITICAL: ATOMIC lock acquisition - check promise again after async operations
  // Multiple requests may have passed the first check, only one should proceed
  if (refreshPromise) {
    // Another request started refresh while we were checking, wait for it
    console.log('[Token Refresh] Refresh started by another request, subscribing to completion');
    return refreshPromise;
  }

  // CRITICAL: Check if another request is creating the promise right now
  if (isCreatingRefreshPromise) {
    // Wait a tiny bit and check again
    await new Promise(resolve => setTimeout(resolve, 10));
    if (refreshPromise) {
      console.log('[Token Refresh] Refresh promise created by another request, subscribing');
      return refreshPromise;
    }
  }

  // CRITICAL: ATOMIC lock acquisition - set flags SYNCHRONOUSLY
  // This must happen in a single synchronous operation to prevent race conditions
  // Multiple requests may have passed the checks above, but only ONE should create the promise
  isCreatingRefreshPromise = true;
  isRefreshing = true;
  lastRefreshTime = Date.now();

  // CRITICAL: Create promise and store it IMMEDIATELY (synchronously) before any async operations
  // The promise itself acts as the lock - if it exists, refresh is in progress
  // This ensures concurrent calls see the promise and wait for it
  // IMPORTANT: The promise from async IIFE is created synchronously when the function is called
  // We create it and store it immediately so concurrent requests see it
  const promiseToReturn = (async (): Promise<string | null> => {
    // Clear the creation flag once promise execution starts
    isCreatingRefreshPromise = false;
    try {
      // Read refresh token AFTER lock and promise are set (prevents race condition)
      const refreshToken = await getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      if (!refreshToken) {
        console.warn('[Token Refresh] No refresh token available');
        failedRefresh = true;
        isRefreshing = false;
        isCreatingRefreshPromise = false;
        refreshPromise = null;
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
        // MANDATORY: Atomic Token Storage - Save tokens atomically (single transaction)
        // CRITICAL: Save new refresh token FIRST before saving access token
        // Backend may rotate refresh tokens (single-use), so we must save the new one immediately
        // This prevents race conditions where another request tries to use the old (now invalid) refresh token
        // 
        // Backend contract: refreshToken in response may be:
        // - Same as request (if Reuse Refresh Tokens = ON)
        // - Different (if Keycloak returns new token)
        // - MUST always be saved by frontend
        const savePromises: Promise<void>[] = [];
        
        // ALWAYS save refresh token (even if same as old one)
        // Backend documentation: "MUST always be saved" regardless of whether it's new or same
        const refreshTokenToSave = response.refresh_token || refreshToken; // Fallback to old if not provided
        savePromises.push(setItemAsync(REFRESH_TOKEN_STORAGE_KEY, refreshTokenToSave));
        
        if (response.refresh_token) {
          console.log('[Token Refresh] New refresh token saved (rotated)');
        } else {
          // Backend didn't return new refresh token - keep using the same one
          console.log('[Token Refresh] No new refresh token in response, keeping existing one');
        }

        // Save access token and expiry atomically with refresh token
        savePromises.push(setItemAsync(TOKEN_STORAGE_KEY, response.access_token));
        const expiryTime = Date.now() + (response.expires_in * 1000);
        savePromises.push(setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString()));

        // MANDATORY: Wait for all saves to complete atomically before proceeding
        // This ensures tokens are never in a mismatched state
        await Promise.all(savePromises);

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

        // Release lock flags (but keep promise for a short time to prevent race conditions)
        isRefreshing = false;
        isCreatingRefreshPromise = false;

        // CRITICAL: Don't clear refreshPromise immediately
        // Keep it for 1000ms so requests coming in right after refresh completes can see it
        // This prevents new requests from starting another refresh immediately after one completes
        // The delay gives time for:
        // 1. New token to be fully saved and available
        // 2. Concurrent requests to see the promise and wait for it
        // 3. Any in-flight expiration checks to complete and see the promise
        setTimeout(() => {
          // Only clear if it's still the same promise (not replaced by new refresh)
          if (refreshPromise === promiseToReturn) {
            refreshPromise = null;
            refreshPromiseResolve = null;
          }
        }, 1000);

        return response.access_token;
      } else {
        console.error('[Token Refresh] Refresh response missing access_token');
        failedRefresh = true;
        isRefreshing = false;
        isCreatingRefreshPromise = false;
        refreshPromise = null;
        onTokenRefreshed(null);
        return null;
      }
    } catch (error: any) {
      console.error('[Token Refresh] Token refresh failed:', error);

      // Parse error details - handle nested error structures
      // Backend now returns: {"error": "invalid_grant", "error_description": "Token is not active"} with 401
      let errorMessage = error?.error_description || error?.message || '';
      let errorCode = error?.error || '';
      const statusCode = error?.statusCode || error?.response?.status;

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
      // Backend now correctly maps "Token is not active" to invalid_grant (401)
      const isInvalidGrant =
        errorCode === 'invalid_grant' ||
        errorCode === 'invalid_request' ||
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token is not active') ||
        errorMessage.toLowerCase().includes('token is not active') ||
        errorMessage.includes('not active') ||
        errorMessage.includes('Session doesn\'t have required client') ||
        errorMessage.includes('doesn\'t have required client');

      // 401 means unauthorized - refresh token is invalid/expired
      // Backend now returns 401 for invalid_grant errors (including "Token is not active")
      // 500 with invalid_grant might mean refresh token was already used (single-use) or expired
      const isRefreshTokenExpired =
        statusCode === 401 ||
        (statusCode === 400 && isInvalidGrant) || // Backend may return 400 but we map to invalid_grant
        (statusCode === 500 && isInvalidGrant) ||
        errorMessage.includes('expired') ||
        errorMessage.includes('token expired') ||
        (errorMessage.includes('invalid') && !errorMessage.includes('credentials'));

      // MANDATORY: Proper Error Handling - Force logout on invalid_grant
      // Backend documentation: invalid_grant means token invalid/expired/already used - FORCE LOGOUT
      if (isInvalidGrant || isRefreshTokenExpired) {
        console.warn('[Token Refresh] Refresh token invalid, expired, or already used. User needs to login again.', {
          statusCode,
          errorCode,
          errorMessage,
          isInvalidGrant,
          isRefreshTokenExpired,
        });
        
        // MANDATORY: Force logout on invalid_grant errors
        // Backend contract: invalid_grant (401) = token invalid/expired/already used - user must re-login
        // This can happen due to:
        // 1. Token rotation - old token was already used (race condition prevented by lock)
        // 2. Token expired (SSO Session Max reached - 10 hours)
        // 3. Token invalidated (user logged out elsewhere)
        failedRefresh = true;

        // MANDATORY: Clear tokens immediately - refresh token is no longer valid
        console.warn('[Token Refresh] Clearing tokens due to refresh token invalidation');
        await clearTokens();

        // MANDATORY: Trigger logout - redirect user to login screen
        if (onLogoutRequired) {
          console.log('[Token Refresh] Triggering logout callback');
          try {
            onLogoutRequired();
          } catch (callbackError) {
            console.error('[Token Refresh] Error in logout callback:', callbackError);
          }
        } else {
          console.warn('[Token Refresh] No logout callback set. User should be redirected to login manually.');
        }

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
      isCreatingRefreshPromise = false;
      // Clear promise immediately on error (no need to keep it)
      refreshPromise = null;
      refreshPromiseResolve = null;
      // Don't call resetRefreshState() here as it would clear failedRefresh flag
      // Just reset the lock state
      }

      // Notify all waiting requests with null (refresh failed)
      onTokenRefreshed(null);
      isRefreshing = false;
      isCreatingRefreshPromise = false;
      // Clear promise immediately on error
      refreshPromise = null;
      refreshPromiseResolve = null;
      
      return null;
    }
  })(); // End of async IIFE

  // CRITICAL: Store promise IMMEDIATELY (synchronously) after creating it
  // This must happen synchronously so concurrent calls see it
  // The promise is created when the async IIFE is called, so we store it immediately
  refreshPromise = promiseToReturn;

  return promiseToReturn;
};

// Request interceptor to add auth token and check expiry
// MANDATORY: Proactive token refresh (30 seconds before expiration)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // For FormData (multipart), remove Content-Type so the client sets it with the correct boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }

      // Skip token check for auth endpoints to avoid interceptor loops
      const isAuthEndpoint = config.url?.includes('/auth/refresh') ||
        config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register');

      if (isAuthEndpoint) {
        return config;
      }

      let token = await getItemAsync(TOKEN_STORAGE_KEY);

      // CRITICAL: Check lock FIRST (before async expiration check) to prevent race condition
      // If refresh is already in progress, wait for it instead of checking expiration
      // This prevents multiple requests from all detecting expiration and starting concurrent refreshes
      if (refreshPromise) {
        console.log('[Token Refresh] Refresh in progress, waiting for completion...', {
          url: config.url,
        });
        // Wait for existing refresh to complete
        const newToken = await refreshPromise;
        if (newToken) {
          token = newToken;
          console.log('[Token Refresh] Using refreshed token from in-progress refresh');
        } else {
          // Refresh failed, token cleared
          token = null;
        }
      } else {
        // CRITICAL: Re-read token from storage (it might have been updated by a recent refresh)
        // Don't use the token we read earlier - read fresh from storage
        token = await getItemAsync(TOKEN_STORAGE_KEY);
        
        // CRITICAL: Check lock AGAIN after async token read
        // Another request may have started refresh while we were reading the token
        if (refreshPromise) {
          console.log('[Token Refresh] Refresh started during token read, waiting...', {
            url: config.url,
          });
          const newToken = await refreshPromise;
          if (newToken) {
            token = newToken;
            console.log('[Token Refresh] Using refreshed token from concurrent refresh');
          } else {
            token = null;
          }
        } else if (token) {
          // MANDATORY: Proactive refresh - check if token is expired (30s before expiration)
          // Backend contract: Access token expires in 5 minutes (300 seconds)
          // We refresh 30 seconds before expiration to prevent 401 errors
          const expiredByDecode = isTokenExpired(token);
          
          // CRITICAL: Check lock BEFORE async expiration check
          // This prevents multiple requests from all passing the check simultaneously
          if (refreshPromise) {
            console.log('[Token Refresh] Refresh started before expiration check, waiting...', {
              url: config.url,
            });
            const newToken = await refreshPromise;
            if (newToken) {
              token = newToken;
              console.log('[Token Refresh] Using refreshed token from concurrent refresh');
            } else {
              token = null;
            }
          } else {
            // Now do async expiration check
            const expiredByTime = await isStoredTokenExpired();
            
            // CRITICAL: Check lock AGAIN after async expiration check
            // Another request may have started refresh while we were checking expiration
            if (refreshPromise) {
              console.log('[Token Refresh] Refresh started during expiration check, waiting...', {
                url: config.url,
              });
              const newToken = await refreshPromise;
              if (newToken) {
                token = newToken;
                console.log('[Token Refresh] Using refreshed token from concurrent refresh');
              } else {
                token = null;
              }
            } else if (expiredByTime || expiredByDecode) {
              // CRITICAL: Check lock ONE MORE TIME before starting refresh
              // Another request may have started refresh while we were checking
              if (refreshPromise) {
                console.log('[Token Refresh] Refresh started by another request, waiting...', {
                  url: config.url,
                });
                const newToken = await refreshPromise;
                if (newToken) {
                  token = newToken;
                  console.log('[Token Refresh] Using refreshed token from concurrent refresh');
                } else {
                  token = null;
                }
              } else {
                // CRITICAL: Check lock ONE FINAL TIME right before calling refreshTokenIfNeeded
                // This is the last chance to catch a concurrent refresh that started
                if (refreshPromise) {
                  console.log('[Token Refresh] Refresh started just before refreshTokenIfNeeded call, waiting...', {
                    url: config.url,
                  });
                  const newToken = await refreshPromise;
                  if (newToken) {
                    token = newToken;
                    console.log('[Token Refresh] Using refreshed token from concurrent refresh');
                  } else {
                    token = null;
                  }
                } else {
                  console.log('[Token Refresh] Token expired, attempting proactive refresh...', {
                    expiredByTime,
                    expiredByDecode,
                    url: config.url,
                  });

                  // MANDATORY: Request Queueing - If refresh in progress, wait for it
                  // The refreshTokenIfNeeded function handles queueing via promise sharing
                  const newToken = await refreshTokenIfNeeded();
                  if (newToken) {
                    token = newToken;
                    console.log('[Token Refresh] Using refreshed token for request');
                  } else {
                    // Refresh failed (invalid_grant) - token cleared, user will be logged out
                    console.warn('[Token Refresh] Proactive refresh failed, request will proceed without token');
                    token = null;
                  }
                }
              }
            }
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

    // MANDATORY: Retry Logic - Retry ONCE on 401 (not from refresh endpoint)
    // Backend contract: 401 from API endpoint = token expired, refresh and retry
    // Backend contract: 401 from refresh endpoint = invalid_grant, force logout (handled in refreshTokenIfNeeded)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Skip retry for auth endpoints (refresh endpoint failures are handled in refreshTokenIfNeeded)
      const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') ||
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/register');
      
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      console.log('[Token Refresh] Received 401, attempting token refresh...', {
        url: originalRequest.url,
        isRefreshing,
      });

      // MANDATORY: Request Queueing - If refresh is already in progress, wait for it
      // This prevents multiple concurrent refresh attempts
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
              // Refresh failed (invalid_grant) - user needs to login, don't retry
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
        // MANDATORY: Single Refresh Lock - refreshTokenIfNeeded handles the lock
        const newToken = await refreshTokenIfNeeded();

        if (newToken) {
          console.log('[Token Refresh] Token refreshed, retrying original request');
          // MANDATORY: Retry ONCE - retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } else {
          console.error('[Token Refresh] Token refresh failed');
          // Refresh failed (invalid_grant) - tokens cleared, user logged out
          // Don't retry - user needs to login
          return Promise.reject(error);
        }
      } catch (refreshError: any) {
        console.error('[Token Refresh] Token refresh error:', refreshError);
        // Refresh failed - tokens already cleared by refreshTokenIfNeeded
        // Don't retry - user needs to login
        return Promise.reject(refreshError);
      }
    }

    // Network error (no connectivity, timeout, server unreachable) - redirect to login
    const isNetworkError =
      !error.response &&
      (error.message === 'Network Error' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED');
    if (isNetworkError && onLogoutRequired) {
      console.warn('[API] Network error detected, redirecting to login', {
        message: error.message,
        code: error.code,
      });
      await clearTokens();
      resetRefreshState();
      try {
        onLogoutRequired();
      } catch (callbackError) {
        console.error('[API] Error in logout callback:', callbackError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

