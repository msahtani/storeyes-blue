import axios, { AxiosError } from 'axios';

// Keycloak configuration
// Default values match the production Keycloak server configuration
const KEYCLOAK_BASE_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://15.216.37.183';
const KEYCLOAK_REALM = process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'storeyes';
const KEYCLOAK_CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'storeyes-mobile';

const KEYCLOAK_TOKEN_URL = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const KEYCLOAK_USERINFO_URL = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
const KEYCLOAK_REGISTRATION_URL = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/registrations`;

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
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  // Add 30 second buffer to refresh before actual expiration
  const expirationTime = decoded.exp * 1000;
  const bufferTime = 30 * 1000; // 30 seconds
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
   * @returns Token response from Keycloak
   * @throws AuthError if login fails
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('client_id', KEYCLOAK_CLIENT_ID);
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post<LoginResponse>(KEYCLOAK_TOKEN_URL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
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
    // Keycloak registration endpoint
    const registrationData = {
      email: data.email,
      username: data.username,
      password: data.password,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
    };

    // Note: Keycloak registration endpoint may vary based on your setup
    // This is a common pattern, but you may need to adjust based on your Keycloak configuration
    const response = await axios.post(
      `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/registrations`,
      registrationData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // If registration requires email verification, you might need to handle that separately
    return response.data;
  },

  /**
   * Get user information from access token
   * Note: This makes an API call. For better performance, use getUserFromToken() instead
   * @param accessToken - Access token
   * @returns User information
   * @throws AuthError if request fails
   */
  getUserInfo: async (accessToken: string): Promise<UserInfo> => {
    try {
      const response = await axios.get<UserInfo>(KEYCLOAK_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AuthError>;
      
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
   * @returns New token response
   * @throws AuthError if refresh fails
   */
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('client_id', KEYCLOAK_CLIENT_ID);
      formData.append('refresh_token', refreshToken);

      const response = await axios.post<LoginResponse>(KEYCLOAK_TOKEN_URL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AuthError>;
      
      throw {
        error: axiosError.response?.data?.error || 'Token refresh failed',
        error_description: axiosError.response?.data?.error_description || axiosError.message,
        statusCode: axiosError.response?.status,
      } as AuthError;
    }
  },

  /**
   * Logout (revoke tokens)
   */
  logout: async (refreshToken: string): Promise<void> => {
    const formData = new URLSearchParams();
    formData.append('client_id', KEYCLOAK_CLIENT_ID);
    formData.append('refresh_token', refreshToken);

    await axios.post(
      `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
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

// Export constants for use in other modules
export const KEYCLOAK_CONFIG = {
  BASE_URL: KEYCLOAK_BASE_URL,
  REALM: KEYCLOAK_REALM,
  CLIENT_ID: KEYCLOAK_CLIENT_ID,
  TOKEN_URL: KEYCLOAK_TOKEN_URL,
  USERINFO_URL: KEYCLOAK_USERINFO_URL,
} as const;


