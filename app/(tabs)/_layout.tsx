import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { fetchAlerts } from '@/domains/alerts/store/alertsSlice';
import { useAppDispatch } from '@/store/hooks';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();

  const handleRefresh = useCallback(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 1);
    const dateParam = start.toISOString().split('T')[0];

    dispatch(
      fetchAlerts({
        date: `${dateParam}T00:00:00`,
        endDate: `${dateParam}T23:59:59`,
      })
    );
  }, [dispatch]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].secondary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: Colors[colorScheme ?? 'light'].secondary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 24,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'alerts',
          tabBarLabel: 'alerts',
          tabBarIcon: ({ color }) => <TabBarIcon name="bell" color={color} />,
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <FontAwesome name="refresh" size={24} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'counting',
          tabBarLabel: 'counting',
          tabBarIcon: ({ color }) => <TabBarIcon name="bars" color={color} />,
          headerShown: true,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
    padding: 4,
  },
  headerButtonPressed: {
    opacity: 0.5,
  },
});
