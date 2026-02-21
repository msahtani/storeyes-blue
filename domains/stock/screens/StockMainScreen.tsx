import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { useStock } from '@/domains/stock/context/StockContext';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildProductsToBuyFromEntries,
  getManualTotalFromEntries,
} from '../data/fakeStockData';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function StockMainScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const router = useRouter();
  const { manualEntries } = useStock();

  const totalValue = useMemo(
    () => getManualTotalFromEntries(manualEntries),
    [manualEntries]
  );
  const toBuyCount = useMemo(
    () => buildProductsToBuyFromEntries(manualEntries).length,
    [manualEntries]
  );
  const modifiedCount = useMemo(
    () => manualEntries.filter((e) => e.difference !== 0).length,
    [manualEntries]
  );

  const tabBarTotalHeight = 60 + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 24;

  return (
    <View style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerIconWrap}>
          <Feather name="package" size={28} color={BluePalette.merge} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('stock.screen.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('stock.screen.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main card: Real stock value */}
        <Pressable
          style={({ pressed }) => [
            styles.mainCard,
            pressed && styles.mainCardPressed,
          ]}
          onPress={() => router.push('/stock/value' as any)}
        >
          <View style={styles.mainCardIconWrap}>
            <Feather name="trending-up" size={40} color={BluePalette.merge} />
          </View>
          <View style={styles.mainCardContent}>
            <View style={styles.sourceBadge}>
              <Feather name="user" size={12} color={BluePalette.white} />
              <Text style={styles.sourceBadgeText}>
                {t('stock.totalValue.realStockFromCount')}
              </Text>
            </View>
            <Text style={styles.mainCardLabel}>{t('stock.totalValue.title')}</Text>
            <Text style={styles.mainCardValue}>{formatCurrency(totalValue)}</Text>
          </View>
          <Feather name="chevron-right" size={24} color={BluePalette.textTertiary} />
        </Pressable>

        {/* To Buy card */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryCard,
            pressed && styles.secondaryCardPressed,
          ]}
          onPress={() => router.push('/stock/tobuy' as any)}
        >
          <View style={[styles.secondaryCardIconWrap, styles.tobuyIconWrap]}>
            <Feather name="shopping-cart" size={28} color={BluePalette.warning} />
          </View>
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>{t('stock.tabs.tobuy')}</Text>
            <Text style={styles.secondaryCardSubtitle}>
              {toBuyCount === 0
                ? t('stock.tobuy.noRestock')
                : `${toBuyCount} ${t('stock.tobuy.toRestock')}`}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={BluePalette.textTertiary} />
        </Pressable>

        {/* Inventory card */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryCard,
            pressed && styles.secondaryCardPressed,
          ]}
          onPress={() => router.push('/stock/inventory' as any)}
        >
          <View style={[styles.secondaryCardIconWrap, styles.inventoryIconWrap]}>
            <Feather name="clipboard" size={28} color={BluePalette.merge} />
          </View>
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>{t('stock.tabs.inventory')}</Text>
            <Text style={styles.secondaryCardSubtitle}>
              {modifiedCount === 0
                ? t('stock.inventory.noModifications')
                : `${modifiedCount} ${t('stock.inventory.differences')}`}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={BluePalette.textTertiary} />
        </Pressable>

        {/* Smart stock value card (disabled / coming soon) */}
        <View style={[styles.secondaryCard, styles.secondaryCardDisabled]}>
          <View style={[styles.secondaryCardIconWrap, styles.smartIconWrap]}>
            <Ionicons name="bulb-outline" size={28} color={BluePalette.textTertiary} />
          </View>
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitleDisabled}>{t('stock.tabs.smartStockValue')}</Text>
            <Text style={styles.secondaryCardSubtitle}>
              {t('stock.smartStock.subtitle')}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color={BluePalette.textMuted} />
        </View>
      </ScrollView>
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
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${BluePalette.merge}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { marginLeft: 14 },
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
  scrollView: { flex: 1, backgroundColor: BluePalette.white },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    marginBottom: 16,
  },
  mainCardPressed: { opacity: 0.9 },
  mainCardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${BluePalette.merge}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardContent: { flex: 1, marginLeft: 16 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BluePalette.success,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BluePalette.white,
  },
  mainCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
    marginTop: 8,
  },
  mainCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: BluePalette.merge,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    marginBottom: 12,
  },
  secondaryCardPressed: { opacity: 0.9 },
  secondaryCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tobuyIconWrap: { backgroundColor: `${BluePalette.warning}20` },
  inventoryIconWrap: { backgroundColor: `${BluePalette.merge}20` },
  smartIconWrap: { backgroundColor: 'rgba(255,255,255,0.08)' },
  secondaryCardDisabled: { opacity: 0.7 },
  secondaryCardContent: { flex: 1, marginLeft: 14 },
  secondaryCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  secondaryCardSubtitle: {
    fontSize: 13,
    color: BluePalette.textSecondary,
    marginTop: 2,
  },
  secondaryCardTitleDisabled: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textTertiary,
  },
});
