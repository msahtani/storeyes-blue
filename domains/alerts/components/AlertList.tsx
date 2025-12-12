import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useAppSelector } from '@/store/hooks';
import AlertItem from './AlertItem';

export default function AlertList() {
  const router = useRouter();
  const { items, status, error } = useAppSelector((state) => state.alerts);

  const handlePress = useCallback(
    (id: number) => {
      router.push(`/alert/${id}`);
    },
    [router]
  );

  if (status === 'loading') {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>Loading alerts…</Text>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>Failed to load alerts</Text>
        {error ? <Text style={styles.message}>{error}</Text> : null}
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>No alerts for this date</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((alert) => (
        <AlertItem
          key={alert.id}
          id={String(alert.id)}
          title={alert.productName || 'Alert'}
          timestamp={new Date(alert.alertDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          isNew={alert.humanJudgement === 'NEW'}
          imageUri={alert.imageUrl || undefined}
          onPress={() => handlePress(alert.id)}
          style={styles.card}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    backgroundColor: BluePalette.white,
    borderRadius: 20,
  },
  card: {
    width: '48%',
  },
  messageContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: BluePalette.white,
    borderRadius: 20,
    padding: 24,
  },
  message: {
    color: BluePalette.textDark,
    fontSize: 16,
    fontWeight: '500',
  },
});

