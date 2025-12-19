import AlertDetailsScreen from '@/domains/alerts/screens/AlertDetailsScreen';
import { Stack } from 'expo-router';

export default function AlertDetailsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AlertDetailsScreen />
    </>
  );
}

