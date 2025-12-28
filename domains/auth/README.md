# Authentication Setup Guide

This app uses Keycloak for authentication. Follow these steps to configure it.

## Keycloak Configuration

### 1. Environment Variables

Create a `.env` file in the root of your project (or configure in your build system) with the following variables:

```env
EXPO_PUBLIC_KEYCLOAK_URL=https://your-keycloak-server.com
EXPO_PUBLIC_KEYCLOAK_REALM=storeyes
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=storeyes-mobile
```

### 2. Keycloak Server Setup

1. **Create a Realm**: Create a new realm called `storeyes` (or your preferred name)
2. **Create a Client**: 
   - Client ID: `storeyes-mobile`
   - Client Protocol: `openid-connect`
   - Access Type: `public` (for mobile apps)
   - Standard Flow Enabled: `ON`
   - Direct Access Grants Enabled: `ON` (required for username/password login)
   - Valid Redirect URIs: Add your app's redirect URIs if needed
3. **Configure User Registration**: 
   - Go to Realm Settings → Login
   - Enable "User registration" if you want users to self-register
   - Or disable it and handle registration through admin API

### 3. Testing Without Keycloak

For now, you can use the "Continue without login" option to bypass authentication. This allows you to:
- Test the app functionality
- Develop features without setting up Keycloak immediately
- Access the app without credentials

**Note**: This is a temporary feature for development. Remove or disable it before production.

## Features

### Login Screen (`/login`)
- Username/Email and password login
- Form validation
- Error handling
- "Continue without login" option (temporary)
- Link to registration screen

### Registration Screen (`/register`)
- Full registration form with:
  - Email
  - Username
  - Password and confirmation
  - First name and last name (optional)
- Form validation
- Error handling
- "Continue without account" option (temporary)

### Authentication Flow

1. **App Launch**: 
   - Checks for stored tokens
   - If tokens exist and are valid, user is authenticated
   - If tokens are expired, attempts to refresh
   - If no tokens or refresh fails, redirects to login

2. **Login**:
   - User enters credentials
   - Tokens are stored securely using `expo-secure-store`
   - User info is fetched and stored in Redux
   - User is redirected to home

3. **Registration**:
   - User fills registration form
   - Account is created in Keycloak
   - User is automatically logged in
   - Tokens are stored securely

4. **Token Management**:
   - Access tokens are automatically added to API requests
   - Tokens are refreshed automatically when expired
   - Failed refresh triggers logout

## Security

- Tokens are stored using `expo-secure-store` (encrypted storage)
- Tokens are automatically refreshed before expiration
- Failed authentication attempts are handled gracefully
- API client automatically includes Bearer tokens in requests

## API Integration

The API client (`api/client.ts`) automatically:
- Adds the access token to all requests
- Refreshes tokens when they expire
- Handles 401 errors by refreshing tokens
- Logs out user if token refresh fails

## Redux State

The auth state includes:
- `user`: Current user information
- `accessToken`: Current access token
- `refreshToken`: Current refresh token
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state for auth operations
- `error`: Error messages
- `skipAuth`: Temporary flag to bypass authentication

## Usage in Components

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/domains/auth/store/authSlice';

function MyComponent() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    // Your component
  );
}
```

## Removing "Skip Auth" Feature

When ready for production, remove the skip auth functionality:

1. Remove `skipAuth` from auth state
2. Remove "Continue without login" buttons from login/register screens
3. Update navigation logic in `app/_layout.tsx` to only check `isAuthenticated`

## Troubleshooting

### "Cannot connect to Keycloak"
- Verify your Keycloak server URL is correct
- Check that the server is accessible from your device/emulator
- Verify the realm and client ID are correct

### "Invalid credentials"
- Check that the user exists in Keycloak
- Verify Direct Access Grants is enabled for the client
- Check password policies in Keycloak

### "Token refresh failed"
- Verify refresh token is still valid
- Check token expiration settings in Keycloak
- Ensure the client allows token refresh

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Restart your TypeScript server in your IDE
- Clear node_modules and reinstall if needed


