import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import DateSelector from '@/domains/alerts/components/DateSelector';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useAppSelector } from '@/store/hooks';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PeakPeriodsLineChart from '../components/PeakPeriodsLineChart';
import RevenueMetricsOverview from '../components/RevenueMetricsOverview';
import StaffPerformanceTable from '../components/StaffPerformanceTable';
import { useDailyReport } from '../hooks/useDailyReport';

export default function DailyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const {
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,
    calendarDate,
    setCalendarDate,
    reportData,
    loading,
    error,
    calendarDays,
    monthYearLabel,
    weekDayLabels,
    canNavigateNext,
    formatDate,
    isSameDay,
    isToday,
    isPastDate,
    handleMonthChange,
    handleDateSelect,
  } = useDailyReport();

  // Sync DateSelector (alerts store) with daily report date
  const alertsSelectedDate = useAppSelector((state) => state.alerts.selectedDate);
  
  useEffect(() => {
    if (alertsSelectedDate) {
      const year = parseInt(alertsSelectedDate.split('-')[0]);
      const month = parseInt(alertsSelectedDate.split('-')[1]) - 1;
      const day = parseInt(alertsSelectedDate.split('-')[2]);
      const date = new Date(year, month, day);
      
      // Only update if the date is different to avoid infinite loops
      const currentDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      if (currentDateString !== alertsSelectedDate && isPastDate(date)) {
        setSelectedDate(date);
      }
    }
  }, [alertsSelectedDate, selectedDate, setSelectedDate, isPastDate]);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('home.features.caisse.title')}</Text>
          <Text style={styles.headerSubtitle}>{formatDate(selectedDate)}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Date Selector Blue Bar */}
      <View style={styles.headerSection}>
        <DateSelector />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BluePalette.merge} />
            <Text style={styles.loadingText}>Loading daily report...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={24} color={BluePalette.error || '#FF3B30'} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* No Data State */}
        {!reportData && !loading && !error && (
          <View style={styles.noDataContainer}>
            <Feather name="inbox" size={32} color={BluePalette.textTertiary} />
            <Text style={styles.noDataText}>No data available for this date</Text>
          </View>
        )}

        {/* Report Data */}
        {reportData && !loading && !error && (
          <>
            {/* Revenue Metrics Overview */}
            <RevenueMetricsOverview
              revenue={reportData.revenue}
              currency="MAD"
            />

            {/* Peak Periods Analysis */}
            <PeakPeriodsLineChart
              hourlyData={reportData.hourlyData}
              peakPeriods={reportData.peakPeriods}
              currency="MAD"
            />

            {/* Hourly Analysis Table */}
            {/* <HourlyAnalysisTable hourlyData={reportData.hourlyData} currency="MAD" /> */}

            {/* Top Products Ranking */}
            {/* <TopProductsRanking
              productsByQuantity={reportData.topProductsByQuantity}
              productsByRevenue={reportData.topProductsByRevenue}
              currency="MAD"
            /> */}

            {/* Category Analysis */}
            {/* <CategoryAnalysisChart
              categories={reportData.categoryAnalysis}
              currency="MAD"
            /> */}

            {/* Staff Performance */}
            <StaffPerformanceTable staff={reportData.staffPerformance} currency="MAD" />
          </>
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: BluePalette.textTertiary,
    marginTop: 2,
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
    gap: 24,
  },
  headerSection: {
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    marginTop: 0,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: BluePalette.textTertiary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: BluePalette.error || '#FF3B30',
    textAlign: 'center',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: BluePalette.textTertiary,
    textAlign: 'center',
  },
});
