import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { useStock } from '@/domains/stock/context/StockContext';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomBar from '@/domains/shared/components/BottomBar';
import { getManualTotalFromEntries, groupInventoryByCategory } from '../data/fakeStockData';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatQuantity(qty: number, unit: string): string {
  if (unit === 'g' || unit === 'ml') {
    return qty >= 1000 ? `${(qty / 1000).toFixed(1)} ${unit === 'g' ? 'kg' : 'L'}` : `${qty} ${unit}`;
  }
  return `${qty} ${unit}`;
}

export default function StockValueDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const router = useRouter();
  const { manualEntries } = useStock();

  const categoriesWithValue = useMemo(() => {
    const grouped = groupInventoryByCategory(manualEntries);
    return grouped.map(({ name, entries: catEntries }) => ({
      name,
      totalValue: catEntries.reduce((s, e) => s + e.manualQuantity * e.unitPrice, 0),
      productCount: catEntries.length,
      entries: catEntries,
    }));
  }, [manualEntries]);

  const totalValue = useMemo(
    () => getManualTotalFromEntries(manualEntries),
    [manualEntries]
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(() =>
    categoriesWithValue.length > 0 ? categoriesWithValue[0].name : null
  );
  const selectedCatData = useMemo(
    () => categoriesWithValue.find((c) => c.name === selectedCategory),
    [categoriesWithValue, selectedCategory]
  );

  return (
    <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('stock.totalValue.title')}</Text>
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
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>{t('stock.totalValue.realStockFromCount')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
        </View>

        {/* Category tab selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabsScroll}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categoriesWithValue.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <Pressable
                key={cat.name}
                style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <Text
                  style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
                <Text
                  style={[styles.categoryTabMeta, isSelected && styles.categoryTabMetaActive]}
                  numberOfLines={1}
                >
                  {formatCurrency(cat.totalValue)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Products for selected category */}
        {selectedCatData && (
          <View style={styles.productsSection}>
            <Text style={styles.productsSectionTitle}>
              {selectedCatData.name} – {selectedCatData.entries.length} {t('stock.totalValue.products')}
            </Text>
            <View style={styles.productsList}>
              {selectedCatData.entries.map((e) => {
                const value = e.manualQuantity * e.unitPrice;
                const unitDisplay =
                  e.unit === 'piece' ? t('stock.units.piece') : e.unit === 'g' ? 'kg' : e.unit === 'ml' ? 'L' : e.unit;
                const pricePerUnit = e.unit === 'g' || e.unit === 'ml' ? e.unitPrice * 1000 : e.unitPrice;
                return (
                  <View key={e.productId} style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{e.productName}</Text>
                      <Text style={styles.productDetail}>
                        {formatQuantity(e.manualQuantity, e.unit)} • {formatCurrency(value)}
                      </Text>
                    </View>
                    <Text style={styles.productPerUnit}>
                      {formatCurrency(pricePerUnit)}/{unitDisplay}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
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
  totalBar: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  totalLabel: { fontSize: 12, fontWeight: '600', color: BluePalette.textSecondary },
  totalValue: { fontSize: 24, fontWeight: '800', color: BluePalette.merge, marginTop: 4 },
  categoryTabsScroll: { marginHorizontal: -20, marginBottom: 16 },
  categoryTabsContent: {
    paddingHorizontal: 20,
    gap: 10,
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: BluePalette.backgroundNew,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    minWidth: 120,
    maxWidth: 160,
  },
  categoryTabActive: {
    backgroundColor: BluePalette.merge,
    borderColor: BluePalette.mergeDark,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  categoryTabTextActive: { color: BluePalette.white },
  categoryTabMeta: {
    fontSize: 11,
    color: BluePalette.textSecondary,
    marginTop: 2,
  },
  categoryTabMetaActive: { color: 'rgba(255,255,255,0.9)' },
  productsSection: { marginTop: 4 },
  productsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textDark,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  productsList: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.border,
    padding: 12,
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: BluePalette.textPrimary },
  productDetail: { fontSize: 12, color: BluePalette.textSecondary, marginTop: 2 },
  productPerUnit: { fontSize: 12, fontWeight: '600', color: BluePalette.merge },
});
