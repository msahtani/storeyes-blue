import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import Feather from '@expo/vector-icons/Feather';
import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildInitialManualInventory,
  buildProductsToBuyFromEntries,
  fakeStockProducts,
  getManualTotalFromEntries,
  getSystemTotalFromEntries,
  groupInventoryByCategory,
} from '../data/fakeStockData';
import type { ManualInventoryEntry } from '../types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabKey = 'value' | 'tobuy' | 'inventory';

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

function TabSelector({
  active,
  tabs,
  onSelect,
}: {
  active: TabKey;
  tabs: { key: TabKey; label: string; icon: string }[];
  onSelect: (k: TabKey) => void;
}) {
  return (
    <View style={styles.tabRow}>
      {tabs.map(({ key, label, icon }) => (
        <Pressable
          key={key}
          style={[styles.tab, active === key && styles.tabActive]}
          onPress={() => onSelect(key)}
        >
          <Feather
            name={icon as any}
            size={18}
            color={active === key ? BluePalette.white : BluePalette.textTertiary}
          />
          <Text
            style={[
              styles.tabLabel,
              active === key && styles.tabLabelActive,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Total stock value section - always shows real total (from owner's manual count) */
function TotalValueSection({
  manualEntries,
}: {
  manualEntries: ManualInventoryEntry[];
}) {
  const { t } = useI18n();
  const categoriesGrouped = useMemo(
    () => groupInventoryByCategory(manualEntries),
    [manualEntries]
  );
  const totalValue = useMemo(
    () => getManualTotalFromEntries(manualEntries),
    [manualEntries]
  );
  const categoriesWithValue = useMemo(
    () =>
      categoriesGrouped.map(({ name, entries: catEntries }) => ({
        name,
        totalValue: catEntries.reduce(
          (s, e) => s + e.manualQuantity * e.unitPrice,
          0
        ),
        productCount: catEntries.length,
        entries: catEntries,
      })),
    [categoriesGrouped]
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.sourceBadgeWrap}>
        <View style={[styles.sourceBadge, styles.sourceBadgeReal]}>
          <Feather name="user" size={14} color={BluePalette.white} />
          <Text style={styles.sourceBadgeText}>
            {t('stock.totalValue.realStockFromCount')}
          </Text>
        </View>
      </View>
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Feather name="trending-up" size={36} color={BluePalette.merge} />
        </View>
        <Text style={styles.heroLabel}>{t('stock.totalValue.title')}</Text>
        <Text style={styles.heroValue}>{formatCurrency(totalValue)}</Text>
      </View>

      <View style={styles.categoryList}>
        {categoriesWithValue.map((cat) => (
          <View key={cat.name} style={styles.categoryCard}>
            <Pressable
              style={({ pressed }) => [
                styles.categoryHeader,
                pressed && styles.categoryHeaderPressed,
              ]}
              onPress={() => toggle(cat.name)}
            >
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryMeta}>
                  {cat.productCount} {t('stock.totalValue.products')} • {formatCurrency(cat.totalValue)}
                </Text>
              </View>
              <Feather
                name={expanded.has(cat.name) ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={BluePalette.textTertiary}
              />
            </Pressable>
            {expanded.has(cat.name) && (
              <View style={styles.productsList}>
                {cat.entries.map((e) => {
                  const value = e.manualQuantity * e.unitPrice;
                  const unitDisplay =
                    e.unit === 'piece'
                      ? t('stock.units.piece')
                      : e.unit === 'g'
                        ? 'kg'
                        : e.unit === 'ml'
                          ? 'L'
                          : e.unit;
                  const pricePerUnit =
                    e.unit === 'g' || e.unit === 'ml'
                      ? e.unitPrice * 1000
                      : e.unitPrice;
                  return (
                    <View key={e.productId} style={styles.productRow}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {e.productName}
                        </Text>
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
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/** What to buy section - based on real (manual) quantities */
function WhatToBuySection({
  manualEntries,
}: {
  manualEntries: ManualInventoryEntry[];
}) {
  const { t } = useI18n();
  const toBuy = useMemo(
    () => buildProductsToBuyFromEntries(manualEntries),
    [manualEntries]
  );

  if (toBuy.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Feather name="check-circle" size={48} color={BluePalette.success} />
        </View>
        <Text style={styles.emptyTitle}>{t('stock.tobuy.allGood')}</Text>
        <Text style={styles.emptySubtitle}>{t('stock.tobuy.noRestock')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.tobuyBadge}>
        <Text style={styles.tobuyBadgeText}>
          {toBuy.length} {t('stock.tobuy.toRestock')}
        </Text>
      </View>
      <View style={styles.tobuyList}>
        {toBuy.map(({ entry, quantityToBuy }) => (
          <View key={entry.productId} style={styles.tobuyCard}>
            <View style={styles.tobuyCardHeader}>
              <Text style={styles.tobuyProductName} numberOfLines={2}>
                {entry.productName}
              </Text>
              <View style={styles.tobuyCategoryTag}>
                <Text style={styles.tobuyCategoryText}>{entry.category}</Text>
              </View>
            </View>
            <View style={styles.tobuyQuantities}>
              <View style={styles.tobuyQtyBox}>
                <Text style={styles.tobuyQtyLabel}>{t('stock.tobuy.actual')}</Text>
                <Text style={styles.tobuyQtyValue}>{entry.manualQuantity}</Text>
              </View>
              <Feather name="arrow-right" size={16} color={BluePalette.textMuted} />
              <View style={styles.tobuyQtyBox}>
                <Text style={styles.tobuyQtyLabel}>{t('stock.tobuy.threshold')}</Text>
                <Text style={[styles.tobuyQtyValue, styles.tobuyQtyThreshold]}>
                  {entry.minimalThreshold}
                </Text>
              </View>
              <View style={styles.tobuyBuyBox}>
                <Text style={styles.tobuyBuyLabel}>{t('stock.tobuy.buy')}</Text>
                <Text style={styles.tobuyBuyValue}>{quantityToBuy}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Manual inventory section - compare system vs real for statistics and écarts */
function ManualInventorySection({
  entries,
  setEntries,
}: {
  entries: ManualInventoryEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ManualInventoryEntry[]>>;
}) {
  const { t } = useI18n();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const updateManual = useCallback((productId: string, value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10) || 0;
    setEntries((prev) =>
      prev.map((e) =>
        e.productId === productId
          ? {
              ...e,
              manualQuantity: num,
              difference: num - e.systemQuantity,
            }
          : e
      )
    );
  }, [setEntries]);

  const categoriesGrouped = useMemo(
    () => groupInventoryByCategory(entries),
    [entries]
  );
  const systemTotal = useMemo(
    () => getSystemTotalFromEntries(entries),
    [entries]
  );
  const manualTotal = useMemo(
    () => getManualTotalFromEntries(entries),
    [entries]
  );
  const ecartValue = manualTotal - systemTotal;
  const withDiff = entries.filter((e) => e.difference !== 0);

  const toggleCategory = useCallback((name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.inventoryIntro}>{t('stock.inventory.compareHint')}</Text>

      {/* Totals comparison card - for statistics and écarts */}
      <View style={styles.totalsComparisonCard}>
        <View style={styles.totalsComparisonRow}>
          <View style={styles.totalsComparisonCol}>
            <Feather name="cpu" size={20} color={BluePalette.merge} />
            <Text style={styles.totalsComparisonLabel}>
              {t('stock.inventory.systemTotal')}
            </Text>
            <Text style={styles.totalsComparisonValue}>
              {formatCurrency(systemTotal)}
            </Text>
          </View>
          <View style={styles.totalsComparisonDivider} />
          <View style={styles.totalsComparisonCol}>
            <Feather name="user" size={20} color={BluePalette.success} />
            <Text style={styles.totalsComparisonLabel}>
              {t('stock.inventory.realTotal')}
            </Text>
            <Text style={styles.totalsComparisonValue}>
              {formatCurrency(manualTotal)}
            </Text>
          </View>
        </View>
        <View style={styles.ecartRow}>
          <Text style={styles.ecartLabel}>{t('stock.inventory.ecart')}</Text>
          <Text
            style={[
              styles.ecartValue,
              ecartValue > 0 && styles.inventoryDiffPlus,
              ecartValue < 0 && styles.inventoryDiffMinus,
            ]}
          >
            {ecartValue >= 0 ? '+' : ''}
            {formatCurrency(ecartValue)}
          </Text>
        </View>
        <Text style={styles.totalsComparisonHint}>
          {t('stock.inventory.statsHint')}
        </Text>
      </View>

      {withDiff.length > 0 && (
        <View style={styles.inventoryDiffBadge}>
          <Text style={styles.inventoryDiffBadgeText}>
            {withDiff.length} {t('stock.inventory.differences')}
          </Text>
        </View>
      )}

      {/* Products by category */}
      <View style={styles.inventoryCategoryList}>
        {categoriesGrouped.map(({ name, entries: catEntries }) => {
          const isExpanded = expandedCategories.has(name);
          return (
            <View key={name} style={styles.inventoryCategoryCard}>
              <Pressable
                style={({ pressed }) => [
                  styles.categoryHeader,
                  pressed && styles.categoryHeaderPressed,
                ]}
                onPress={() => toggleCategory(name)}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryName}>{name}</Text>
                  <Text style={styles.categoryMeta}>
                    {catEntries.length} {t('stock.totalValue.products')}
                  </Text>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={BluePalette.textTertiary}
                />
              </Pressable>
              {isExpanded && (
                <View style={styles.productsList}>
                  {catEntries.map((e) => (
                    <View
                      key={e.productId}
                      style={[
                        styles.inventoryCard,
                        e.difference !== 0 && styles.inventoryCardDiff,
                      ]}
                    >
                      <Text style={styles.inventoryProductName} numberOfLines={1}>
                        {e.productName}
                      </Text>
                      <View style={styles.inventoryRow}>
                        <View style={styles.inventoryCol}>
                          <Text style={styles.inventoryColLabel}>
                            {t('stock.inventory.system')}
                          </Text>
                          <Text style={styles.inventoryColValue}>
                            {e.systemQuantity}
                          </Text>
                        </View>
                        <View style={styles.inventoryCol}>
                          <Text style={styles.inventoryColLabel}>
                            {t('stock.inventory.manual')}
                          </Text>
                          <TextInput
                            style={styles.inventoryInput}
                            value={String(e.manualQuantity)}
                            onChangeText={(v) => updateManual(e.productId, v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={BluePalette.textMuted}
                          />
                        </View>
                        <View style={styles.inventoryCol}>
                          <Text style={styles.inventoryColLabel}>
                            {t('stock.inventory.diff')}
                          </Text>
                          <Text
                            style={[
                              styles.inventoryDiffValue,
                              e.difference > 0 && styles.inventoryDiffPlus,
                              e.difference < 0 && styles.inventoryDiffMinus,
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
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('value');
  const [manualEntries, setManualEntries] = useState<ManualInventoryEntry[]>(
    () => buildInitialManualInventory(fakeStockProducts)
  );

  const tabBarTotalHeight = 60 + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 24;

  const tabs = useMemo(
    () => [
      { key: 'value' as TabKey, label: t('stock.tabs.value'), icon: 'dollar-sign' },
      { key: 'tobuy' as TabKey, label: t('stock.tabs.tobuy'), icon: 'shopping-cart' },
      { key: 'inventory' as TabKey, label: t('stock.tabs.inventory'), icon: 'clipboard' },
    ],
    [t]
  );

  return (
    <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerIconWrap}>
          <Feather name="package" size={28} color={BluePalette.merge} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('stock.screen.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('stock.screen.subtitle')}</Text>
        </View>
      </View>

      <TabSelector active={activeTab} tabs={tabs} onSelect={setActiveTab} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'value' && (
          <TotalValueSection manualEntries={manualEntries} />
        )}
        {activeTab === 'tobuy' && (
          <WhatToBuySection manualEntries={manualEntries} />
        )}
        {activeTab === 'inventory' && (
          <ManualInventorySection
            entries={manualEntries}
            setEntries={setManualEntries}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${BluePalette.merge}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: BluePalette.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: BluePalette.backgroundNew,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
  },
  tabActive: {
    backgroundColor: BluePalette.merge,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textTertiary,
  },
  tabLabelActive: {
    color: BluePalette.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${BluePalette.merge}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
    marginTop: 12,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: BluePalette.merge,
    letterSpacing: -1,
    marginTop: 4,
  },
  sourceBadgeWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sourceBadgeReal: {
    backgroundColor: BluePalette.success,
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BluePalette.white,
  },
  categoryList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderPressed: {
    opacity: 0.9,
  },
  categoryHeaderLeft: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  categoryMeta: {
    fontSize: 13,
    color: BluePalette.textSecondary,
    marginTop: 4,
  },
  productsList: {
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
    padding: 12,
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  productDetail: {
    fontSize: 12,
    color: BluePalette.textSecondary,
    marginTop: 2,
  },
  productPerUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.merge,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconWrap: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.success,
  },
  emptySubtitle: {
    fontSize: 14,
    color: BluePalette.textSecondary,
    marginTop: 8,
  },
  tobuyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BluePalette.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tobuyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: BluePalette.white,
  },
  tobuyList: {
    gap: 12,
  },
  tobuyCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
  },
  tobuyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tobuyProductName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  tobuyCategoryTag: {
    backgroundColor: BluePalette.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tobuyCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  tobuyQuantities: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tobuyQtyBox: {
    flex: 1,
    alignItems: 'center',
  },
  tobuyQtyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textMuted,
  },
  tobuyQtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    marginTop: 2,
  },
  tobuyQtyThreshold: {
    color: BluePalette.warning,
  },
  tobuyBuyBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: BluePalette.merge,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tobuyBuyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.white,
  },
  tobuyBuyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.white,
    marginTop: 2,
  },
  inventoryIntro: {
    fontSize: 14,
    color: BluePalette.textSecondary,
    marginBottom: 4,
  },
  totalsComparisonCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    marginBottom: 12,
  },
  totalsComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  totalsComparisonCol: {
    alignItems: 'center',
    flex: 1,
  },
  totalsComparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textSecondary,
    marginTop: 8,
  },
  totalsComparisonValue: {
    fontSize: 20,
    fontWeight: '800',
    color: BluePalette.textPrimary,
    marginTop: 4,
  },
  totalsComparisonDivider: {
    width: 1,
    height: 48,
    backgroundColor: BluePalette.border,
  },
  ecartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  ecartLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  ecartValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textTertiary,
  },
  totalsComparisonHint: {
    fontSize: 12,
    color: BluePalette.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  inventoryCategoryList: {
    gap: 12,
  },
  inventoryCategoryCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    overflow: 'hidden',
  },
  inventoryDiffBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BluePalette.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  inventoryDiffBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BluePalette.white,
  },
  inventoryList: {
    gap: 12,
  },
  inventoryCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
  },
  inventoryCardDiff: {
    borderColor: BluePalette.warning,
  },
  inventoryProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    marginBottom: 8,
  },
  inventoryCategory: {
    fontSize: 12,
    color: BluePalette.textSecondary,
    marginTop: 2,
  },
  inventoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inventoryCol: {
    flex: 1,
  },
  inventoryColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textMuted,
  },
  inventoryColValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    marginTop: 4,
  },
  inventoryInput: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: BluePalette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  inventoryDiffValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textTertiary,
    marginTop: 4,
  },
  inventoryDiffPlus: {
    color: BluePalette.success,
  },
  inventoryDiffMinus: {
    color: BluePalette.error,
  },
});
