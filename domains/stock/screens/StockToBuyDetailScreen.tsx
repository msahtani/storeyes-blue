import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { useStock } from '@/domains/stock/context/StockContext';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomBar from '@/domains/shared/components/BottomBar';
import { buildProductsToBuyFromEntries } from '../data/fakeStockData';

export default function StockToBuyDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const router = useRouter();
  const { manualEntries } = useStock();

  const toBuyList = useMemo(
    () => buildProductsToBuyFromEntries(manualEntries),
    [manualEntries]
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof toBuyList>();
    for (const item of toBuyList) {
      const cat = item.entry.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries()).map(([name, entries]) => ({ name, entries }));
  }, [toBuyList]);

  if (toBuyList.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('stock.tabs.tobuy')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="check-circle" size={56} color={BluePalette.success} />
          <Text style={styles.emptyTitle}>{t('stock.tobuy.allGood')}</Text>
          <Text style={styles.emptySubtitle}>{t('stock.tobuy.noRestock')}</Text>
        </View>
        <BottomBar />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('stock.tabs.tobuy')}</Text>
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
        {byCategory.map(({ name, entries }) => (
          <View key={name} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{name}</Text>
              <Text style={styles.categoryCount}>{entries.length} {t('stock.totalValue.products')}</Text>
            </View>
            {entries.map(({ entry }) => (
              <View key={entry.productId} style={styles.productCard}>
                <Text style={styles.productName} numberOfLines={2}>{entry.productName}</Text>
                <View style={styles.quantityRow}>
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>{t('stock.tobuy.actual')}</Text>
                    <Text style={styles.quantityValue}>{entry.manualQuantity}</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={BluePalette.textMuted} />
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabel}>{t('stock.tobuy.threshold')}</Text>
                    <Text style={[styles.quantityValue, styles.thresholdValue]}>{entry.minimalThreshold}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1, backgroundColor: BluePalette.white },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BluePalette.success, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: BluePalette.textDark, marginTop: 8 },
  categoryBlock: { marginBottom: 20 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  categoryName: { fontSize: 16, fontWeight: '700', color: BluePalette.textDark },
  categoryCount: { fontSize: 13, color: BluePalette.textDark },
  productCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 8,
  },
  productName: { fontSize: 15, fontWeight: '600', color: BluePalette.textPrimary },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  quantityBox: { flex: 1, alignItems: 'center' },
  quantityLabel: { fontSize: 11, fontWeight: '600', color: BluePalette.textMuted },
  quantityValue: { fontSize: 16, fontWeight: '700', color: BluePalette.textPrimary, marginTop: 2 },
  thresholdValue: { color: BluePalette.warning },
});
