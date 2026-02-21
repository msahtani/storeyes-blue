import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { setLogoutCallback } from '@/api/client';
import { useColorScheme } from '@/components/useColorScheme';
import { I18nProvider } from '@/constants/i18n/I18nContext';
import { loadStoredTokens, logout } from '@/domains/auth/store/authSlice';
import { StockProvider } from '@/domains/stock/context/StockContext';
import { store } from '@/store';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, skipAuth, isLoading } = useSelector((state: any) => state.auth);

  // Set up logout callback for API client (when refresh token fails)
  useEffect(() => {
    setLogoutCallback(() => {
      console.log('[RootLayout] Logout callback triggered, dispatching logout');
      dispatch(logout());
    });
  }, [dispatch]);

  // Load stored tokens on mount
  useEffect(() => {
    dispatch(loadStoredTokens());
  }, [dispatch]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    const inAuthGroup = segments[0] === 'login';
    const inAppGroup = segments[0] === '(tabs)' || segments[0] === 'alerts' || segments[0] === 'alert' || segments[0] === 'charges' || segments[0] === 'statistics' || segments[0] === 'caisse' || segments[0] === 'stock';

    if (!isAuthenticated && !skipAuth && !inAuthGroup) {
      // Not authenticated and not skipped, redirect to login
      router.replace('/login');
    } else if ((isAuthenticated || skipAuth) && inAuthGroup) {
      // Authenticated or skipped, redirect to home
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, skipAuth, isLoading, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StockProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="alerts" options={{ headerShown: false }} />
          <Stack.Screen name="alert/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="charges" options={{ headerShown: false }} />
          <Stack.Screen name="charges/fixed/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="charges/variable/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="statistics" options={{ headerShown: false }} />
          <Stack.Screen name="statistics/charges" options={{ headerShown: false }} />
          <Stack.Screen name="caisse" options={{ headerShown: false }} />
          <Stack.Screen name="caisse/daily-report" options={{ headerShown: false }} />
          <Stack.Screen name="stock" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </StockProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <I18nProvider>
        <RootLayoutNav />
      </I18nProvider>
    </Provider>
  );
}
