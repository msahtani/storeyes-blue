import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import PeriodSelector from '@/domains/charges/components/PeriodSelector';
import { PeriodType as ChargesPeriodType } from '@/domains/charges/types/charge';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnalysisPhrases from '../components/AnalysisPhrases';
import DoughnutChart from '../components/DoughnutChart';
import KPICard from '../components/KPICard';
import { PeriodType, StatisticsData } from '../types/statistics';
import { calculateKPIMetrics } from '../utils/statusCalculator';

// Helper function to create statistics data with calculated metrics
function createStatisticsData(
  period: PeriodType,
  revenue: number,
  charges: number,
  profit: number,
  revenueEvolution: number,
  chartData: Array<{ period: string; revenue: number; charges: number; profit: number }>
): StatisticsData {
  const metrics = calculateKPIMetrics(revenue, charges, profit);
  
  return {
    period,
    kpi: {
      revenue,
      charges,
      profit,
      revenueEvolution,
      ...metrics,
    },
    chartData,
    charges: {
      fixed: [],
      variable: [],
    },
  };
}

// Mock data - replace with actual data fetching
// Note: revenue = charges + profit (100% split)
const mockStatisticsData: Record<PeriodType, StatisticsData> = {
  day: createStatisticsData(
    'day',
    1250, // revenue
    850,  // charges
    400,  // profit (1250 - 850 = 400)
    5.2,
    [
      { period: 'Mon', revenue: 1200, charges: 800, profit: 400 },
      { period: 'Tue', revenue: 1350, charges: 850, profit: 500 },
      { period: 'Wed', revenue: 1100, charges: 750, profit: 350 },
      { period: 'Thu', revenue: 1400, charges: 900, profit: 500 },
      { period: 'Fri', revenue: 1600, charges: 1000, profit: 600 },
      { period: 'Sat', revenue: 1800, charges: 1100, profit: 700 },
      { period: 'Sun', revenue: 1250, charges: 850, profit: 400 },
    ]
  ),
  week: createStatisticsData(
    'week',
    8750, // revenue
    5950, // charges
    2800, // profit (8750 - 5950 = 2800)
    3.8,
    [
      { period: 'W1', revenue: 8400, charges: 5800, profit: 2600 },
      { period: 'W2', revenue: 8600, charges: 5900, profit: 2700 },
      { period: 'W3', revenue: 8750, charges: 5950, profit: 2800 },
      { period: 'W4', revenue: 8900, charges: 6000, profit: 2900 },
    ]
  ),
  month: createStatisticsData(
    'month',
    35000, // revenue
    24500, // charges
    10500, // profit (35000 - 24500 = 10500)
    2.5,
    [
      { period: 'Oct', revenue: 32000, charges: 22000, profit: 10000 },
      { period: 'Nov', revenue: 34000, charges: 23500, profit: 10500 },
      { period: 'Dec', revenue: 34500, charges: 24000, profit: 10500 },
      { period: 'Jan', revenue: 35000, charges: 24500, profit: 10500 },
    ]
  ),
};

export default function StatisticsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const statistics = useMemo(() => {
    return mockStatisticsData[selectedPeriod];
  }, [selectedPeriod]);

  const handleChargesDetailPress = () => {
    router.push(`/statistics/charges?period=${selectedPeriod}` as any);
  };

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('statistics.screen.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <PeriodSelector
          periods={['day', 'week', 'month'] as ChargesPeriodType[]}
          selectedPeriod={selectedPeriod as ChargesPeriodType}
          onPeriodChange={(period) => setSelectedPeriod(period as PeriodType)}
        />

        {/* KPI Cards - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiScrollContent}
          style={styles.kpiScrollView}
        >
          <KPICard
            title={t('statistics.kpi.revenue')}
            value={statistics.kpi.revenue}
            evolution={statistics.kpi.revenueEvolution}
            icon="dollar-sign"
          />
          <KPICard
            title={t('statistics.kpi.charges')}
            value={statistics.kpi.charges}
            subtitle={`${statistics.kpi.chargesPercentage?.toFixed(1)}% ${t('statistics.kpi.ofRevenue')}`}
            status={statistics.kpi.chargesStatus}
            icon="credit-card"
          />
          <KPICard
            title={t('statistics.kpi.profit')}
            value={statistics.kpi.profit}
            subtitle={`${statistics.kpi.profitPercentage?.toFixed(1)}% ${t('statistics.kpi.ofRevenue')}`}
            status={statistics.kpi.profitStatus}
            icon="trending-up"
          />
        </ScrollView>

        {/* Doughnut Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            {t('statistics.chart.title')}
          </Text>
          <View style={styles.chartContainer}>
            <DoughnutChart data={statistics.chartData} />
          </View>
        </View>

        {/* Analysis Phrases */}
        <AnalysisPhrases kpi={statistics.kpi} charges={[...statistics.charges.fixed, ...statistics.charges.variable]} />

        {/* Charges Detail Button */}
        <Pressable
          style={({ pressed }) => [
            styles.detailButton,
            pressed && styles.detailButtonPressed,
          ]}
          onPress={handleChargesDetailPress}
        >
          <Text style={styles.detailButtonText}>
            {t('statistics.chargesDetail')}
          </Text>
          <Feather name="chevron-right" size={20} color={BluePalette.merge} />
        </Pressable>
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
    backgroundColor: BluePalette.backgroundNew,
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
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  kpiScrollView: {
    marginTop: 8,
    marginHorizontal: -20,
  },
  kpiScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
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
    padding: 16,
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
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  detailButtonPressed: {
    opacity: 0.7,
    borderColor: BluePalette.merge,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
});

