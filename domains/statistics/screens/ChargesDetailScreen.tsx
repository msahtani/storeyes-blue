import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimplePieChart } from '../components/PieChart';
import { ChargeDetail, PeriodType, StatusType } from '../types/statistics';

// Mock data - replace with actual data fetching
const mockChargesData: Record<PeriodType, { fixed: ChargeDetail[]; variable: ChargeDetail[] }> = {
  day: {
    fixed: [
      {
        id: 'f1',
        name: 'Personnel',
        amount: 150,
        percentageOfCharges: 50,
        percentageOfRevenue: 12,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f2',
        name: 'Electricity',
        amount: 30,
        percentageOfCharges: 10,
        percentageOfRevenue: 2.4,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f3',
        name: 'Water',
        amount: 20,
        percentageOfCharges: 6.7,
        percentageOfRevenue: 1.6,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f4',
        name: 'Wi-Fi',
        amount: 4,
        percentageOfCharges: 1.3,
        percentageOfRevenue: 0.3,
        category: 'fixed',
        status: 'good',
      },
    ],
    variable: [
      {
        id: 'v1',
        name: 'Coffee Supplies',
        amount: 60,
        percentageOfCharges: 20,
        percentageOfRevenue: 4.8,
        category: 'variable',
        status: 'good',
      },
      {
        id: 'v2',
        name: 'Milk & Dairy',
        amount: 30,
        percentageOfCharges: 10,
        percentageOfRevenue: 2.4,
        category: 'variable',
        status: 'good',
      },
      {
        id: 'v3',
        name: 'Other Supplies',
        amount: 16,
        percentageOfCharges: 5.3,
        percentageOfRevenue: 1.3,
        category: 'variable',
        status: 'good',
      },
    ],
  },
  week: {
    fixed: [
      {
        id: 'f1',
        name: 'Personnel',
        amount: 1050,
        percentageOfCharges: 50,
        percentageOfRevenue: 12,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f2',
        name: 'Electricity',
        amount: 210,
        percentageOfCharges: 10,
        percentageOfRevenue: 2.4,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f3',
        name: 'Water',
        amount: 140,
        percentageOfCharges: 6.7,
        percentageOfRevenue: 1.6,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f4',
        name: 'Wi-Fi',
        amount: 28,
        percentageOfCharges: 1.3,
        percentageOfRevenue: 0.3,
        category: 'fixed',
        status: 'good',
      },
    ],
    variable: [
      {
        id: 'v1',
        name: 'Coffee Supplies',
        amount: 420,
        percentageOfCharges: 20,
        percentageOfRevenue: 4.8,
        category: 'variable',
        status: 'good',
      },
      {
        id: 'v2',
        name: 'Milk & Dairy',
        amount: 210,
        percentageOfCharges: 10,
        percentageOfRevenue: 2.4,
        category: 'variable',
        status: 'good',
      },
      {
        id: 'v3',
        name: 'Other Supplies',
        amount: 112,
        percentageOfCharges: 5.3,
        percentageOfRevenue: 1.3,
        category: 'variable',
        status: 'good',
      },
    ],
  },
  month: {
    fixed: [
      {
        id: 'f1',
        name: 'Personnel',
        amount: 4500,
        percentageOfCharges: 50,
        percentageOfRevenue: 12.9,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f2',
        name: 'Electricity',
        amount: 900,
        percentageOfCharges: 10,
        percentageOfRevenue: 2.6,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f3',
        name: 'Water',
        amount: 600,
        percentageOfCharges: 6.7,
        percentageOfRevenue: 1.7,
        category: 'fixed',
        status: 'good',
      },
      {
        id: 'f4',
        name: 'Wi-Fi',
        amount: 120,
        percentageOfCharges: 1.3,
        percentageOfRevenue: 0.3,
        category: 'fixed',
        status: 'good',
      },
    ],
    variable: [
      {
        id: 'v1',
        name: 'Coffee Supplies',
        amount: 1800,
        percentageOfCharges: 20,
        percentageOfRevenue: 5.1,
        category: 'variable',
        status: 'good',
      },
      {
        id: 'v2',
        name: 'Milk & Dairy',
        amount: 900,
        percentageOfCharges: 10,
        percentageOfRevenue: 2.6,
        category: 'variable',
        status: 'good',
      },
      {
        id: 'v3',
        name: 'Other Supplies',
        amount: 480,
        percentageOfCharges: 5.3,
        percentageOfRevenue: 1.4,
        category: 'variable',
        status: 'good',
      },
    ],
  },
};

type TabType = 'fixed' | 'variable';

export default function ChargesDetailScreen() {
  const { period } = useLocalSearchParams<{ period?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('fixed');

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const selectedPeriod = (period as PeriodType) || 'month';
  const charges = useMemo(() => {
    return mockChargesData[selectedPeriod] || mockChargesData.month;
  }, [selectedPeriod]);

  const activeCharges = activeTab === 'fixed' ? charges.fixed : charges.variable;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status?: StatusType) => {
    switch (status) {
      case 'good':
        return BluePalette.success;
      case 'medium':
        return BluePalette.warning;
      case 'critical':
        return BluePalette.error;
      default:
        return BluePalette.textTertiary;
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.backgroundCard }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t('statistics.chargesDetailScreen.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === 'fixed' && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => setActiveTab('fixed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'fixed' && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            {t('statistics.chargesDetailScreen.fixed')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === 'variable' && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => setActiveTab('variable')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'variable' && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            {t('statistics.chargesDetailScreen.variable')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pie Chart */}
        {activeCharges.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>
              {t('statistics.chargesDetailScreen.distribution')}
            </Text>
            <View style={styles.chartContainer}>
              <SimplePieChart data={activeCharges} />
            </View>
          </View>
        )}

        {/* Charges List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
              {t('statistics.chargesDetailScreen.details')}
          </Text>
          <View style={styles.listContainer}>
            {activeCharges.map((charge) => (
              <View key={charge.id} style={styles.chargeItem}>
                <View style={styles.chargeHeader}>
                  <Text style={styles.chargeName}>{charge.name}</Text>
                  <Text style={styles.chargeAmount}>
                    {formatAmount(charge.amount)}
                  </Text>
                </View>
                <View style={styles.chargeDetails}>
                  <View style={styles.chargeDetailItem}>
                    <Text style={styles.chargeDetailLabel}>
                      {t('statistics.chargesDetailScreen.ofCharges')}:
                    </Text>
                    <Text style={styles.chargeDetailValue}>
                      {charge.percentageOfCharges.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.chargeDetailItem}>
                    <Text style={styles.chargeDetailLabel}>
                      {t('statistics.chargesDetailScreen.ofRevenue')}:
                    </Text>
                    <Text style={styles.chargeDetailValue}>
                      {charge.percentageOfRevenue.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                {charge.status && (
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: `${getStatusColor(charge.status)}15` },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(charge.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(charge.status) },
                      ]}
                    >
                      {charge.status === 'good'
                        ? t('statistics.status.good')
                        : charge.status === 'medium'
                        ? t('statistics.status.medium')
                        : t('statistics.status.critical')}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  tabButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  tabTextActive: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  chartSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  chartContainer: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  listSection: {
    gap: 12,
  },
  listContainer: {
    gap: 12,
  },
  chargeItem: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 12,
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chargeName: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    flex: 1,
  },
  chargeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.3,
  },
  chargeDetails: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  chargeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chargeDetailLabel: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  chargeDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

