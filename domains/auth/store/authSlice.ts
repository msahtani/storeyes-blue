import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

import {
  getUserFromToken,
  isTokenExpired,
  keycloakApi,
  transformUserInfo,
  type AuthError
} from '../services/keycloakService';

// Storage keys
const TOKEN_STORAGE_KEY = 'accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  skipAuth: boolean; // Allow access without credentials for now
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  skipAuth: false,
};

/**
 * Store tokens and expiry time
 */
const storeTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  
  // Store expiry time (in milliseconds)
  const expiryTime = Date.now() + expiresIn * 1000;
  await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

// Async thunks for authentication
export const login = createAsyncThunk(
  'auth/login',
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await keycloakApi.login(username, password);
      
      // Store tokens securely with expiry time
      if (response.access_token && response.refresh_token) {
        await storeTokens(
          response.access_token,
          response.refresh_token,
          response.expires_in
        );
      }

      // Get user info from token (more efficient than API call)
      const userInfo = getUserFromToken(response.access_token) || 
        await keycloakApi.getUserInfo(response.access_token);
      const transformedUser = transformUserInfo(userInfo);
      
      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: transformedUser,
      };
    } catch (error: any) {
      const authError = error as AuthError;
      return rejectWithValue(
        authError.error_description || authError.error || 'Login failed'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    {
      email,
      username,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      username: string;
      password: string;
      firstName?: string;
      lastName?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await keycloakApi.register({
        email,
        username,
        password,
        firstName,
        lastName,
      });

      // After registration, automatically log in
      const response = await keycloakApi.login(username, password);
      
      // Store tokens securely with expiry time
      if (response.access_token && response.refresh_token) {
        await storeTokens(
          response.access_token,
          response.refresh_token,
          response.expires_in
        );
      }

      // Get user info from token (more efficient than API call)
      const userInfo = getUserFromToken(response.access_token) || 
        await keycloakApi.getUserInfo(response.access_token);
      const transformedUser = transformUserInfo(userInfo);
      
      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        user: transformedUser,
      };
    } catch (error: any) {
      const authError = error as AuthError;
      return rejectWithValue(
        authError.error_description || authError.error || 'Registration failed'
      );
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { getState }) => {
  try {
    // Try to revoke refresh token if available
    const state = getState() as { auth: AuthState };
    const refreshToken = state.auth.refreshToken;
    
    if (refreshToken) {
      try {
        await keycloakApi.logout(refreshToken);
      } catch (error) {
        // Ignore logout errors, just clear tokens
        console.warn('Logout API call failed, clearing tokens locally:', error);
      }
    }
  } catch (error) {
    // Ignore errors during logout
    console.warn('Error during logout:', error);
  } finally {
    // Always clear stored tokens
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  }
});

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Try to get refresh token from state first, then from storage
      const state = getState() as { auth: AuthState };
      let refreshToken = state.auth.refreshToken;
      
      if (!refreshToken) {
        refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      }

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await keycloakApi.refreshToken(refreshToken);
      
      // Store tokens securely with expiry time
      if (response.access_token && response.refresh_token) {
        await storeTokens(
          response.access_token,
          response.refresh_token,
          response.expires_in
        );
      }

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token || refreshToken,
      };
    } catch (error: any) {
      // If refresh fails, clear tokens
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      
      const authError = error as AuthError;
      return rejectWithValue(
        authError.error_description || authError.error || 'Token refresh failed'
      );
    }
  }
);

export const loadStoredTokens = createAsyncThunk('auth/loadStoredTokens', async () => {
  try {
    const accessToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);

    if (accessToken) {
      // Check if token is expired
      if (isTokenExpired(accessToken)) {
        // Token is expired, try to refresh
        if (refreshToken) {
          try {
            const refreshResponse = await keycloakApi.refreshToken(refreshToken);
            if (refreshResponse.access_token && refreshResponse.refresh_token) {
              await storeTokens(
                refreshResponse.access_token,
                refreshResponse.refresh_token,
                refreshResponse.expires_in
              );
              
              // Get user info from new token
              const userInfo = getUserFromToken(refreshResponse.access_token) || 
                await keycloakApi.getUserInfo(refreshResponse.access_token);
              const transformedUser = transformUserInfo(userInfo);
              
              return {
                accessToken: refreshResponse.access_token,
                refreshToken: refreshResponse.refresh_token,
                user: transformedUser,
              };
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens
            await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
            await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
            return null;
          }
        } else {
          // No refresh token, clear access token
          await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
          await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
          return null;
        }
      } else {
        // Token is still valid, get user info from token
        const userInfo = getUserFromToken(accessToken);
        if (userInfo) {
          const transformedUser = transformUserInfo(userInfo);
          return {
            accessToken,
            refreshToken,
            user: transformedUser,
          };
        } else {
          // Can't decode token, try API call as fallback
          try {
            const userInfo = await keycloakApi.getUserInfo(accessToken);
            const transformedUser = transformUserInfo(userInfo);
            return {
              accessToken,
              refreshToken,
              user: transformedUser,
            };
          } catch (error) {
            // API call failed, clear tokens
            await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
            await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
            return null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading stored tokens:', error);
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSkipAuth: (state, action: PayloadAction<boolean>) => {
      state.skipAuth = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.skipAuth = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.skipAuth = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.skipAuth = false;
        state.error = null;
      });

    // Refresh token
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // Load stored tokens
    builder
      .addCase(loadStoredTokens.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.user = action.payload.user;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(loadStoredTokens.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { setSkipAuth, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

