import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomBar from '@/domains/shared/components/BottomBar';

export default function StockSmartDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('stock.tabs.smartStockValue')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 15 + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.placeholder}>
          <View style={styles.placeholderIconWrap}>
            <Feather name="zap" size={48} color={BluePalette.smartStock} />
          </View>
          <Text style={styles.placeholderTitle}>{t('stock.tabs.smartStockValue')}</Text>
          <Text style={styles.placeholderSubtitle}>{t('stock.smartStock.subtitle')}</Text>
        </View>
      </ScrollView>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: BluePalette.textPrimary, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 32 },
  scrollView: { flex: 1, backgroundColor: BluePalette.white },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  placeholder: { alignItems: 'center', paddingVertical: 48 },
  placeholderIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${BluePalette.smartStock}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: BluePalette.textDark },
  placeholderSubtitle: { fontSize: 14, color: BluePalette.textDark, opacity: 0.8, marginTop: 8 },
});
