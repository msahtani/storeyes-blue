import axios, { AxiosError } from 'axios';

// Backend API configuration (using authentication proxy)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.storeyes.io';

// Legacy Keycloak configuration (kept for reference, not used for direct calls)
const KEYCLOAK_BASE_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://15.216.37.183';
const KEYCLOAK_REALM = process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'storeyes';
const KEYCLOAK_CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'storeyes-mobile';

// Backend API response format (camelCase)
interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

// Internal response format (snake_case for backward compatibility)
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  exp?: number;
  iat?: number;
  azp?: string;
  aud?: string | string[];
}

// Backend /auth/me response format
export interface CurrentUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredUsername: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface DecodedToken {
  sub: string;
  email: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  exp: number;
  iat: number;
  azp?: string;
  aud?: string | string[];
  [key: string]: any;
}

export interface AuthError {
  error: string;
  error_description?: string;
  statusCode?: number;
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This does not verify the signature. Backend should always verify tokens.
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as DecodedToken;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 * Uses 60-second buffer to align with backend's clock skew tolerance
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  // Add 60 second buffer to refresh before actual expiration
  // This aligns with backend's 60-second clock skew tolerance
  const expirationTime = decoded.exp * 1000;
  const bufferTime = 60 * 1000; // 60 seconds
  return Date.now() >= expirationTime - bufferTime;
};

/**
 * Get user info from decoded token (no API call needed)
 */
export const getUserFromToken = (token: string): UserInfo | null => {
  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }
  return {
    sub: decoded.sub,
    email: decoded.email,
    preferred_username: decoded.preferred_username,
    given_name: decoded.given_name,
    family_name: decoded.family_name,
    name: decoded.name,
    exp: decoded.exp,
    iat: decoded.iat,
    azp: decoded.azp,
    aud: decoded.aud,
  };
};

export const keycloakApi = {
  /**
   * Login with username and password
   * @param username - User username
   * @param password - User password
   * @returns Token response (converted to snake_case format)
   * @throws AuthError if login fails
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post<BackendLoginResponse>(
        `${API_BASE_URL}/auth/login`,
        {
          username: username,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Convert backend response (camelCase) to internal format (snake_case)
      return {
        access_token: response.data.accessToken,
        refresh_token: response.data.refreshToken,
        expires_in: response.data.expiresIn,
        token_type: response.data.tokenType || 'Bearer',
      };
    } catch (error) {
      const axiosError = error as AxiosError<AuthError>;

      // Handle specific error cases
      if (axiosError.response?.status === 401) {
        throw {
          error: 'Invalid credentials',
          error_description: 'Invalid username or password',
          statusCode: 401,
        } as AuthError;
      }

      throw {
        error: axiosError.response?.data?.error || 'Authentication failed',
        error_description: axiosError.response?.data?.error_description || axiosError.message,
        statusCode: axiosError.response?.status,
      } as AuthError;
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<void> => {
    try {
      const registrationData = {
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
      };

      await axios.post(
        `${API_BASE_URL}/auth/register`,
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError<AuthError>;

      throw {
        error: axiosError.response?.data?.error || 'Registration failed',
        error_description: axiosError.response?.data?.error_description || axiosError.message,
        statusCode: axiosError.response?.status,
      } as AuthError;
    }
  },

  /**
   * Get current authenticated user information from /auth/me endpoint
   * @param accessToken - Access token
   * @returns Current user information
   * @throws AuthError if request fails
   */
  getCurrentUser: async (accessToken: string): Promise<CurrentUserResponse> => {
    try {
      const response = await axios.get<CurrentUserResponse>(
        `${API_BASE_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AuthError>;

      // Handle 401 specifically (unauthorized)
      if (axiosError.response?.status === 401) {
        throw {
          error: 'Unauthorized',
          error_description: 'Token is missing, invalid, or expired',
          statusCode: 401,
        } as AuthError;
      }

      throw {
        error: axiosError.response?.data?.error || 'Failed to get current user',
        error_description: axiosError.response?.data?.error_description || axiosError.message,
        statusCode: axiosError.response?.status,
      } as AuthError;
    }
  },

  /**
   * Get user information from access token
   * Note: This makes an API call. For better performance, use getUserFromToken() instead
   * This now tries the backend endpoint, but falls back to decoding the token if the endpoint is not available
   * @param accessToken - Access token
   * @returns User information
   * @throws AuthError if request fails and token cannot be decoded
   */
  getUserInfo: async (accessToken: string): Promise<UserInfo> => {
    try {
      // Try backend endpoint first (if available)
      try {
        const response = await axios.get<UserInfo>(`${API_BASE_URL}/auth/user`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return response.data;
      } catch (backendError) {
        // If backend endpoint doesn't exist, decode token instead
        const decoded = getUserFromToken(accessToken);
        if (decoded) {
          return decoded;
        }
        throw backendError;
      }
    } catch (error) {
      const axiosError = error as AxiosError<AuthError>;

      // Try to decode token as last resort
      const decoded = getUserFromToken(accessToken);
      if (decoded) {
        return decoded;
      }

      throw {
        error: axiosError.response?.data?.error || 'Failed to get user info',
        error_description: axiosError.response?.data?.error_description || axiosError.message,
        statusCode: axiosError.response?.status,
      } as AuthError;
    }
  },

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token
   * @returns New token response (converted to snake_case format)
   * @throws AuthError if refresh fails
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post<BackendLoginResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {
          refreshToken: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Convert backend response (camelCase) to internal format (snake_case)
      return {
        access_token: response.data.accessToken,
        refresh_token: response.data.refreshToken,
        expires_in: response.data.expiresIn,
        token_type: response.data.tokenType || 'Bearer',
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      // Extract error information - handle nested error structures
      let errorCode = axiosError.response?.data?.error || 'Token refresh failed';
      let errorDescription = axiosError.response?.data?.error_description || axiosError.message;
      const statusCode = axiosError.response?.status;

      // Try to parse nested error if error_description is a JSON string or nested object
      try {
        // Check if error_description contains nested error info
        if (typeof errorDescription === 'string' && errorDescription.includes('{')) {
          const jsonMatch = errorDescription.match(/\{.*\}/);
          if (jsonMatch) {
            const nestedError = JSON.parse(jsonMatch[0]);
            if (nestedError.error) {
              errorCode = nestedError.error;
            }
            if (nestedError.error_description) {
              errorDescription = nestedError.error_description;
            }
          }
        }

        // Also check response.data for nested error structure
        if (axiosError.response?.data?.error && typeof axiosError.response.data.error === 'string') {
          const dataErrorMatch = axiosError.response.data.error.match(/\{.*\}/);
          if (dataErrorMatch) {
            const nestedError = JSON.parse(dataErrorMatch[0]);
            if (nestedError.error) {
              errorCode = nestedError.error;
            }
            if (nestedError.error_description) {
              errorDescription = nestedError.error_description;
            }
          }
        }
      } catch (parseError) {
        // If parsing fails, use original values
      }

      throw {
        error: errorCode,
        error_description: errorDescription,
        statusCode: statusCode,
      } as AuthError;
    }
  },

  /**
   * Logout (revoke tokens)
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {
          refreshToken: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      // Logout endpoint failure is not critical - tokens will be cleared locally anyway
      const axiosError = error as AxiosError;
      console.warn('Logout API call failed (non-critical):', axiosError.response?.data || axiosError.message);
      // Don't throw - allow logout to succeed even if backend call fails
    }
  },
};

// Helper function to transform Keycloak user info to our User type
export const transformUserInfo = (userInfo: UserInfo) => {
  return {
    id: userInfo.sub,
    email: userInfo.email,
    username: userInfo.preferred_username || userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
  };
};

// Helper function to transform CurrentUserResponse to our User type
export const transformCurrentUser = (currentUser: CurrentUserResponse) => {
  return {
    id: currentUser.id,
    email: currentUser.email,
    username: currentUser.preferredUsername,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
  };
};

// Export constants for use in other modules (legacy, kept for backward compatibility)
export const KEYCLOAK_CONFIG = {
  BASE_URL: KEYCLOAK_BASE_URL,
  REALM: KEYCLOAK_REALM,
  CLIENT_ID: KEYCLOAK_CLIENT_ID,
  API_BASE_URL: API_BASE_URL,
} as const;


