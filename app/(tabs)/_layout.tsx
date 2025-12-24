import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { BluePalette } from '@/constants/Colors';
import { fetchAlerts } from '@/domains/alerts/store/alertsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.alerts.selectedDate);
  const insets = useSafeAreaInsets();

  const handleRefresh = useCallback(() => {
    // Use the selected date from DateSelector, or fallback to today
    const dateParam = selectedDate || (() => {
      const today = new Date();
      // Format date in local timezone to avoid UTC conversion issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    dispatch(
      fetchAlerts({
        date: `${dateParam}T00:00:00`,
        endDate: `${dateParam}T23:59:59`,
      })
    );
  }, [dispatch, selectedDate]);

  // Calculate tab bar height with safe area insets
  const tabBarBaseHeight = 60;
  const tabBarTotalHeight = tabBarBaseHeight + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BluePalette.merge,
        tabBarInactiveTintColor: BluePalette.textTertiary,
        tabBarStyle: {
          backgroundColor: BluePalette.backgroundCard,
          borderTopWidth: 1,
          borderTopColor: BluePalette.border,
          height: tabBarTotalHeight,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: BluePalette.backgroundCard,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: BluePalette.border,
        },
        headerTintColor: BluePalette.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 24,
          letterSpacing: -0.5,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarLabel: 'Support',
          tabBarIcon: ({ color }) => <TabBarIcon name="headphones" color={color} />,
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <FontAwesome name="refresh" size={22} color={BluePalette.textPrimary} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <FontAwesome name="refresh" size={22} color={BluePalette.textPrimary} />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: BluePalette.surface,
  },
  headerButtonPressed: {
    opacity: 0.7,
    backgroundColor: BluePalette.surfaceLight,
    transform: [{ scale: 0.95 }],
  },
});
