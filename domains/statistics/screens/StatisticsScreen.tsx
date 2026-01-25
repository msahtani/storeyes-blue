import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { getMonthForWeek } from '@/domains/charges/utils/weekUtils';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnalysisPhrases from '../components/AnalysisPhrases';
import DoughnutChart from '../components/DoughnutChart';
import KPICard from '../components/KPICard';
import StatisticsDateSelector from '../components/StatisticsDateSelector';
import { getStatistics } from '../services/statisticsService';
import { PeriodType, StatisticsData } from '../types/statistics';

// Helper function to format date for API based on period type
function formatDateForAPI(period: PeriodType, date: string): string {
  // Date is already in the correct format from StatisticsDateSelector
  // - month: YYYY-MM
  // - week: YYYY-MM-DD (Monday date)
  // - day: YYYY-MM-DD
  return date;
}

// Helper function to get default date for period
function getDefaultDateForPeriod(period: PeriodType): string {
  const today = new Date();
  if (period === 'month') {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } else {
    // For day and week, return today's date in YYYY-MM-DD format
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default function StatisticsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month'); // Default to month
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Fetch statistics when period or date changes
  useEffect(() => {
    let cancelled = false;

    async function fetchStatistics() {
      if (!selectedDate) {
        // Wait for date selector to initialize
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const dateForAPI = formatDateForAPI(selectedPeriod, selectedDate);
        const data = await getStatistics(selectedPeriod, dateForAPI);

        if (!cancelled) {
          setStatistics(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          const errorMessage =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load statistics';
          setError(errorMessage);
          console.error('Error fetching statistics:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStatistics();

    return () => {
      cancelled = true;
    };
  }, [selectedPeriod, selectedDate]);

  const handleChargesDetailPress = () => {
    const params: Record<string, string> = { period: selectedPeriod };
    if (selectedDate) {
      if (selectedPeriod === 'month') {
        params.month = selectedDate;
      } else if (selectedPeriod === 'week') {
        params.week = selectedDate;
        // Also include month for context
        try {
          params.month = getMonthForWeek(selectedDate);
        } catch {
          // Fallback if parsing fails
          const parts = selectedDate.split('-');
          if (parts.length >= 2) {
            params.month = `${parts[0]}-${parts[1]}`;
          }
        }
      }
    }
    router.push({
      pathname: '/statistics/charges' as any,
      params,
    });
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

      {/* Date Selector - Includes Period Selector and Date Selection */}
      <StatisticsDateSelector
        period={selectedPeriod}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onPeriodChange={(period) => {
          setSelectedPeriod(period);
          // Reset selected date when period changes
          setSelectedDate(undefined);
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BluePalette.merge} />
            <Text style={styles.loadingText}>{t('common.loadingStatistics')}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={BluePalette.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                // Trigger refetch by updating state
                setSelectedDate(selectedDate);
              }}
            >
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : statistics ? (
          <>
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
                subtitle={`${statistics.kpi.chargesPercentage.toFixed(1)}% ${t('statistics.kpi.ofRevenue')}`}
                status={statistics.kpi.chargesStatus}
                icon="credit-card"
              />
              <KPICard
                title={t('statistics.kpi.profit')}
                value={statistics.kpi.profit}
                subtitle={`${statistics.kpi.profitPercentage.toFixed(1)}% ${t('statistics.kpi.ofRevenue')}`}
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
            <AnalysisPhrases
              kpi={statistics.kpi}
              charges={[...statistics.charges.fixed, ...statistics.charges.variable]}
            />

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
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('common.noDataAvailable')}</Text>
          </View>
        )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: BluePalette.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: BluePalette.error,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
});

