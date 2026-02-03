import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { getMonthForWeek } from '@/domains/charges/utils/weekUtils';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

  // Animation for hiding date selector on scroll
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(0);
  const accumulatedDelta = useRef(0); // Accumulate scroll deltas for more stable direction detection
  const lastStateChangeTime = useRef(0); // Track when we last changed state to prevent rapid toggling
  const [isDateSelectorHidden, setIsDateSelectorHidden] = useState(false);
  const [topHeaderHeight, setTopHeaderHeight] = useState(0);

  // Constants for stable scroll detection
  const MIN_SCROLL_FOR_HIDE = 40; // Minimum scroll position before allowing hide
  const ACCUMULATED_DELTA_THRESHOLD = 15; // Minimum accumulated delta to trigger hide/show
  const STATE_CHANGE_COOLDOWN = 200; // Minimum time (ms) between state changes
  const TOP_THRESHOLD = 15; // Distance from top to consider "at top"

  const hideDateSelector = useCallback(() => {
    if (isDateSelectorHidden) return; // Already hidden
    const now = Date.now();
    if (now - lastStateChangeTime.current < STATE_CHANGE_COOLDOWN) return; // Cooldown period
    
    lastStateChangeTime.current = now;
    setIsDateSelectorHidden(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, isDateSelectorHidden]);

  const showDateSelector = useCallback(() => {
    if (!isDateSelectorHidden) return; // Already shown
    const now = Date.now();
    if (now - lastStateChangeTime.current < STATE_CHANGE_COOLDOWN) return; // Cooldown period
    
    lastStateChangeTime.current = now;
    setIsDateSelectorHidden(false);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, isDateSelectorHidden]);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - scrollY.current;
    scrollY.current = currentScrollY;

    // Show when completely at the top
    if (currentScrollY <= TOP_THRESHOLD) {
      // Reset accumulated delta when at top
      accumulatedDelta.current = 0;
      if (isDateSelectorHidden) {
        showDateSelector();
      }
      return;
    }

    // Accumulate scroll delta (with decay to prevent infinite accumulation)
    if (Math.abs(scrollDelta) > 1) {
      // Add to accumulated delta, but cap it to prevent overflow
      accumulatedDelta.current += scrollDelta;
      // Apply decay factor (0.7) to gradually reduce accumulated delta
      accumulatedDelta.current *= 0.7;
    } else {
      // Small movements decay faster
      accumulatedDelta.current *= 0.5;
    }

    // Only process hide/show if we're past minimum scroll threshold
    if (currentScrollY <= MIN_SCROLL_FOR_HIDE) {
      return; // Don't process hide/show near the top
    }

    // Hide: Only if accumulated delta shows consistent downward scrolling
    if (
      !isDateSelectorHidden &&
      accumulatedDelta.current > ACCUMULATED_DELTA_THRESHOLD
    ) {
      hideDateSelector();
      accumulatedDelta.current = 0; // Reset after state change
    }
    // Note: We don't show when scrolling up - only when reaching the top
  }, [hideDateSelector, showDateSelector, isDateSelectorHidden]);

  // Build a single chart point from KPI so DoughnutChart always shows the same values as the KPI cards.
  // (chartData from API can be sub-period points e.g. last day of week, so using it caused mismatch.)
  const doughnutDataFromKpi = React.useMemo(() => {
    if (!statistics) return [];
    const { kpi } = statistics;
    return [
      {
        period: 'current',
        revenue: kpi.revenue,
        charges: kpi.charges,
        profit: kpi.profit,
      },
    ];
  }, [statistics]);

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
      style={[styles.container]}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 5 }]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (topHeaderHeight === 0) {
            setTopHeaderHeight(height);
          }
        }}
      >
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
      <Animated.View
        style={[
          styles.headerSection,
          {
            transform: [{ translateY }],
            opacity,
            position: isDateSelectorHidden ? 'absolute' : 'relative',
            top: isDateSelectorHidden ? topHeaderHeight : 0,
            left: 0,
            right: 0,
            zIndex: isDateSelectorHidden ? -1 : 1,
          },
        ]}
      >
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
      </Animated.View>

      <ScrollView
        style={[
          styles.scrollView,
          { zIndex: isDateSelectorHidden ? 1 : 0 }
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

            {/* Doughnut Chart - uses KPI-derived data so revenue/charges/profit match the KPI cards */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>
                {t('statistics.chart.title')}
              </Text>
              <View style={styles.chartContainer}>
                <DoughnutChart data={doughnutDataFromKpi} />
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

      {/* Bottom Bar */}
      <View style={{ zIndex: 10 }}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.white,
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
  headerSection: {
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    marginTop: 0,
    paddingTop: 10,
    overflow: 'hidden',
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

