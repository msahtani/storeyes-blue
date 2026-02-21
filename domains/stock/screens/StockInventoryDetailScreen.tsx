import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { useStock } from '@/domains/stock/context/StockContext';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomBar from '@/domains/shared/components/BottomBar';
import {
  getManualTotalFromEntries,
  getSystemTotalFromEntries,
  groupInventoryByCategory,
} from '../data/fakeStockData';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Placeholder: in production this comes from config or API (e.g. backoffice base URL)
const BACKOFFICE_INVENTORY_URL = 'https://your-backoffice.example.com/inventory';

export default function StockInventoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const router = useRouter();
  const {
    manualEntries,
    inventoryDifferencesDate,
    acceptAndValidateInventory,
  } = useStock();

  const modifiedEntries = useMemo(
    () => manualEntries.filter((e) => e.difference !== 0),
    [manualEntries]
  );
  const modifiedByCategory = useMemo(
    () => groupInventoryByCategory(modifiedEntries),
    [modifiedEntries]
  );
  const systemTotal = useMemo(() => getSystemTotalFromEntries(manualEntries), [manualEntries]);
  const manualTotal = useMemo(() => getManualTotalFromEntries(manualEntries), [manualEntries]);
  const ecartValue = manualTotal - systemTotal;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(() =>
    modifiedByCategory.length > 0 ? modifiedByCategory[0].name : null
  );
  const selectedCatData = useMemo(
    () => modifiedByCategory.find((c) => c.name === selectedCategory),
    [modifiedByCategory, selectedCategory]
  );

  useEffect(() => {
    if (modifiedByCategory.length > 0 && (!selectedCategory || !selectedCatData)) {
      setSelectedCategory(modifiedByCategory[0].name);
    } else if (modifiedByCategory.length === 0) {
      setSelectedCategory(null);
    }
  }, [modifiedByCategory, selectedCategory, selectedCatData]);

  const handleShareLink = useCallback(async () => {
    try {
      await Share.share({
        message: BACKOFFICE_INVENTORY_URL,
        url: BACKOFFICE_INVENTORY_URL,
        title: t('stock.inventory.shareTitle'),
      });
    } catch (_) {}
  }, [t]);

  const formatDifferencesDate = (d: Date) =>
    d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('stock.tabs.inventory')}</Text>
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
        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <View style={styles.totalsCol}>
              <Feather name="cpu" size={18} color={BluePalette.merge} />
              <Text style={styles.totalsLabel}>{t('stock.inventory.systemTotal')}</Text>
              <Text style={styles.totalsValue}>{formatCurrency(systemTotal)}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsCol}>
              <Feather name="user" size={18} color={BluePalette.success} />
              <Text style={styles.totalsLabel}>{t('stock.inventory.realTotal')}</Text>
              <Text style={styles.totalsValue}>{formatCurrency(manualTotal)}</Text>
            </View>
          </View>
          <View style={styles.ecartRow}>
            <Text style={styles.ecartLabel}>{t('stock.inventory.ecart')}</Text>
            <Text
              style={[
                styles.ecartValue,
                ecartValue > 0 && styles.diffPlus,
                ecartValue < 0 && styles.diffMinus,
              ]}
            >
              {ecartValue >= 0 ? '+' : ''}
              {formatCurrency(ecartValue)}
            </Text>
          </View>
        </View>

        {/* Share link with other user */}
        <View style={styles.notifySection}>
          <Text style={styles.notifyTitle}>{t('stock.inventory.shareSectionTitle')}</Text>
          <Pressable
            style={({ pressed }) => [styles.shareButton, pressed && styles.btnPressed]}
            onPress={handleShareLink}
          >
            <Feather name="share-2" size={18} color={BluePalette.white} />
            <Text style={styles.notifyBtnText}>{t('stock.inventory.shareLink')}</Text>
          </Pressable>
        </View>

        {/* Differences count and date (when other user submitted) */}
        <Text style={styles.modifiedSectionTitle}>
          {modifiedEntries.length === 0
            ? t('stock.inventory.noModifications')
            : `${modifiedEntries.length} ${t('stock.inventory.differences')}${
                inventoryDifferencesDate
                  ? ` · ${t('stock.inventory.differencesDate')} ${formatDifferencesDate(inventoryDifferencesDate)}`
                  : ''
              }`}
        </Text>

        {/* Accept and validate: make real stock the new system baseline */}
        {modifiedEntries.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.acceptButton, pressed && styles.btnPressed]}
            onPress={acceptAndValidateInventory}
          >
            <Feather name="check-circle" size={20} color={BluePalette.white} />
            <Text style={styles.acceptButtonText}>{t('stock.inventory.acceptAndValidate')}</Text>
          </Pressable>
        )}

        {modifiedByCategory.length === 0 ? (
          <View style={styles.emptyModified}>
            <Text style={styles.emptyModifiedText}>{t('stock.inventory.noModifications')}</Text>
          </View>
        ) : (
          <>
            {/* Category tab selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabsScroll}
              contentContainerStyle={styles.categoryTabsContent}
            >
              {modifiedByCategory.map(({ name, entries: catEntries }) => {
                const isSelected = selectedCategory === name;
                return (
                  <Pressable
                    key={name}
                    style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                    onPress={() => setSelectedCategory(name)}
                  >
                    <Text
                      style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[styles.categoryTabMeta, isSelected && styles.categoryTabMetaActive]}
                      numberOfLines={1}
                    >
                      {catEntries.length} {t('stock.totalValue.products')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Modified products for selected category */}
            {selectedCatData && (
              <View style={styles.productsSection}>
                <View style={styles.productsList}>
                  {selectedCatData.entries.map((e) => (
                    <View
                      key={e.productId}
                      style={[styles.productCard, e.difference !== 0 && styles.productCardDiff]}
                    >
                      <Text style={styles.productName} numberOfLines={1}>{e.productName}</Text>
                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Text style={styles.colLabel}>{t('stock.inventory.system')}</Text>
                          <Text style={styles.colValue}>{e.systemQuantity}</Text>
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.colLabel}>{t('stock.inventory.manual')}</Text>
                          <Text style={styles.colValue}>{e.manualQuantity}</Text>
                        </View>
                        <View style={styles.col}>
                          <Text style={styles.colLabel}>{t('stock.inventory.diff')}</Text>
                          <Text
                            style={[
                              styles.diffValue,
                              e.difference > 0 && styles.diffPlus,
                              e.difference < 0 && styles.diffMinus,
                            ]}
                          >
                            {e.difference >= 0 ? '+' : ''}
                            {e.difference}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
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
  /* Text on white scroll background: use textDark to avoid white-on-white */
  totalsCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 16,
  },
  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalsCol: { flex: 1, alignItems: 'center' },
  totalsLabel: { fontSize: 11, fontWeight: '600', color: BluePalette.textSecondary, marginTop: 6 },
  totalsValue: { fontSize: 18, fontWeight: '700', color: BluePalette.textPrimary, marginTop: 2 },
  totalsDivider: { width: 1, height: 40, backgroundColor: BluePalette.border },
  ecartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  ecartLabel: { fontSize: 13, fontWeight: '600', color: BluePalette.textSecondary },
  ecartValue: { fontSize: 15, fontWeight: '700', color: BluePalette.textPrimary },
  diffPlus: { color: BluePalette.success },
  diffMinus: { color: BluePalette.error },
  notifySection: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 16,
  },
  notifyTitle: { fontSize: 15, fontWeight: '700', color: BluePalette.textPrimary },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BluePalette.merge,
    marginTop: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BluePalette.merge,
    marginBottom: 16,
  },
  btnPressed: { opacity: 0.85 },
  notifyBtnText: { fontSize: 14, fontWeight: '700', color: BluePalette.white },
  acceptButtonText: { fontSize: 14, fontWeight: '700', color: BluePalette.white },
  modifiedSectionTitle: { fontSize: 14, fontWeight: '700', color: BluePalette.textDark, marginBottom: 10 },
  emptyModified: { paddingVertical: 24, alignItems: 'center' },
  emptyModifiedText: { fontSize: 14, color: BluePalette.textDark },
  categoryTabsScroll: { marginHorizontal: -20, marginBottom: 12 },
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
    minWidth: 110,
    maxWidth: 150,
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
  productsList: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.border,
    padding: 12,
    gap: 8,
  },
  productCard: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: BluePalette.border },
  productCardDiff: { borderColor: BluePalette.warning },
  productName: { fontSize: 14, fontWeight: '600', color: BluePalette.textPrimary },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: 10, fontWeight: '600', color: BluePalette.textMuted },
  colValue: { fontSize: 14, fontWeight: '700', color: BluePalette.textPrimary, marginTop: 4 },
  diffValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
