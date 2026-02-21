import { Stack } from 'expo-router';

export default function StockLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="value" />
      <Stack.Screen name="tobuy" />
      <Stack.Screen name="smart" />
      <Stack.Screen name="inventory" />
    </Stack>
  );
}
