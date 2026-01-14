import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector */}
        <Pressable
          style={styles.dateSelector}
          onPress={() => {
            setCalendarDate(selectedDate);
            setShowDatePicker(true);
          }}
        >
          <View style={styles.dateSelectorContent}>
            <View style={styles.calendarIconWrapper}>
              <Feather name="calendar" size={20} color={BluePalette.merge} />
            </View>
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateLabel}>{t('statistics.dailyReport.date')}</Text>
              <Text style={styles.dateValue}>{formatDate(selectedDate)}</Text>
            </View>
            <View style={styles.chevronIconWrapper}>
              <Feather name="chevron-down" size={20} color={BluePalette.textTertiary} />
            </View>
          </View>
        </Pressable>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.datePickerOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>{t('statistics.dailyReport.date')}</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Feather name="x" size={24} color={BluePalette.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.calendarNavigation}>
                <Pressable
                  onPress={() => handleMonthChange('prev')}
                  style={styles.navButton}
                >
                  <Feather name="chevron-left" size={20} color={BluePalette.textPrimary} />
                </Pressable>
                <Text style={styles.monthYearText}>{monthYearLabel}</Text>
                <Pressable
                  onPress={() => handleMonthChange('next')}
                  style={styles.navButton}
                  disabled={!canNavigateNext}
                >
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={canNavigateNext ? BluePalette.textPrimary : BluePalette.textTertiary}
                  />
                </Pressable>
              </View>

              <View style={styles.calendarWeekDays}>
                {weekDayLabels.map((day) => (
                  <View key={day} style={styles.weekDayHeader}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <View key={`empty-${index}`} style={styles.calendarDay} />;
                  }

                  const isSelected = isSameDay(date, selectedDate);
                  const isCurrentDay = isToday(date);
                  const isDisabled = !isPastDate(date);

                  return (
                    <Pressable
                      key={`${date.getTime()}-${index}`}
                      onPress={() => handleDateSelect(date)}
                      disabled={isDisabled}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isCurrentDay && !isSelected && styles.calendarDayToday,
                        isDisabled && styles.calendarDayDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                          isCurrentDay && !isSelected && styles.calendarDayTextToday,
                          isDisabled && styles.calendarDayTextDisabled,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </TouchableOpacity>
        </Modal>

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
  dateSelector: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  dateTextContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  chevronIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: BluePalette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.divider,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BluePalette.surface,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  calendarDaySelected: {
    backgroundColor: BluePalette.selected || BluePalette.merge,
    borderWidth: 2,
    borderColor: BluePalette.mergeLight || BluePalette.merge,
  },
  calendarDayToday: {
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: BluePalette.textDark,
  },
  calendarDayTextSelected: {
    color: BluePalette.white,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: BluePalette.textTertiary,
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
