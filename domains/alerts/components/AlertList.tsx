import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { useAppSelector } from '@/store/hooks';
import AlertItem from './AlertItem';

const VISIBLE_JUDGEMENTS = ['NEW', 'TRUE_POSITIVE'];

export default function AlertList() {
  const router = useRouter();
  const { t } = useI18n();
  const { items, status, error, activeTab } = useAppSelector(
    (state) => state.alerts
  );
  const visibleItems = items.filter(
    (a) => !a.humanJudgement || VISIBLE_JUDGEMENTS.includes(a.humanJudgement)
  );

  const handlePress = useCallback(
    (id: number) => {
      router.push(`/alert/${id}`);
    },
    [router]
  );

  if (status === 'loading') {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{t('alerts.list.loading')}</Text>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{t('alerts.list.failed')}</Text>
        {error ? <Text style={styles.message}>{error}</Text> : null}
      </View>
    );
  }

  if (!visibleItems.length) {
    const emptyKey =
      activeTab === "notTapped"
        ? "alerts.list.emptyNotTapped"
        : "alerts.list.emptyReturn";
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{t(emptyKey)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {visibleItems.map((alert) => (
        <AlertItem
          key={alert.id}
          id={String(alert.id)}
          title={alert.productName || t('alerts.list.defaultTitle')}
          timestamp={new Date(alert.alertDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
          isNew={alert.humanJudgement === 'NEW'}
          isConfirmed={alert.humanJudgement === 'TRUE_POSITIVE'}
          imageUri={alert.imageUrl && alert.imageUrl.length > 0 ? alert.imageUrl : undefined}
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
    textAlign: 'center',
  },
});

