import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { useColorScheme } from '@/components/useColorScheme';
import { I18nProvider } from '@/constants/i18n/I18nContext';
import { loadStoredTokens } from '@/domains/auth/store/authSlice';
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

  // Load stored tokens on mount
  useEffect(() => {
    dispatch(loadStoredTokens());
  }, [dispatch]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    const inAuthGroup = segments[0] === 'login';
    const inAppGroup = segments[0] === '(tabs)' || segments[0] === 'alerts' || segments[0] === 'alert';

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="alerts" options={{ headerShown: false }} />
        <Stack.Screen name="alert/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
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
