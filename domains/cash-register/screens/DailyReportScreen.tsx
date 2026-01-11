import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryAnalysisChart from '../components/CategoryAnalysisChart';
import HourlyAnalysisTable from '../components/HourlyAnalysisTable';
import PeakPeriodsLineChart from '../components/PeakPeriodsLineChart';
import RevenueMetricsOverview from '../components/RevenueMetricsOverview';
import StaffPerformanceTable from '../components/StaffPerformanceTable';
import TopProductsRanking from '../components/TopProductsRanking';
import { DailyReportData } from '../types/dailyReport';

// Mock data - replace with actual data fetching
const mockDailyReportData: DailyReportData = {
  date: '2024-01-15',
  businessName: 'Café Storeyes',
  revenue: {
    totalTTC: 4038.0,
    totalHT: 3670.91,
    transactions: 132,
    avgTransactionValue: 30.59,
    revenuePerTransaction: 30.59,
  },
  hourlyData: [
    { hour: '05:00', revenue: 57.0, transactions: 2, itemsSold: 3 },
    { hour: '06:00', revenue: 89.0, transactions: 3, itemsSold: 4 },
    { hour: '07:00', revenue: 145.0, transactions: 5, itemsSold: 7 },
    { hour: '08:00', revenue: 234.0, transactions: 8, itemsSold: 12 },
    { hour: '09:00', revenue: 312.0, transactions: 10, itemsSold: 15 },
    { hour: '10:00', revenue: 278.0, transactions: 9, itemsSold: 13 },
    { hour: '11:00', revenue: 345.0, transactions: 11, itemsSold: 16 },
    { hour: '12:00', revenue: 456.0, transactions: 15, itemsSold: 22 },
    { hour: '13:00', revenue: 523.0, transactions: 17, itemsSold: 25 },
    { hour: '14:00', revenue: 567.0, transactions: 19, itemsSold: 28 },
    { hour: '15:00', revenue: 563.0, transactions: 18, itemsSold: 27 },
    { hour: '16:00', revenue: 412.0, transactions: 13, itemsSold: 19 },
    { hour: '17:00', revenue: 198.0, transactions: 6, itemsSold: 9 },
  ],
  topProductsByQuantity: [
    { rank: 1, name: 'ESPRESSO STANDARD', quantity: 78 },
    { rank: 2, name: 'CAPPUCCINO', quantity: 45 },
    { rank: 3, name: 'CROISSANT', quantity: 32 },
    { rank: 4, name: 'LATTE', quantity: 28 },
    { rank: 5, name: 'AMERICANO', quantity: 24 },
    { rank: 6, name: 'MOCHA', quantity: 18 },
    { rank: 7, name: 'PAIN AU CHOCOLAT', quantity: 15 },
    { rank: 8, name: 'TEA', quantity: 12 },
    { rank: 9, name: 'ORANGE JUICE', quantity: 10 },
    { rank: 10, name: 'SANDWICH', quantity: 8 },
  ],
  topProductsByRevenue: [
    { rank: 1, name: 'ESPRESSO STANDARD', revenue: 1092.0 },
    { rank: 2, name: 'CAPPUCCINO', revenue: 675.0 },
    { rank: 3, name: 'LATTE', revenue: 420.0 },
    { rank: 4, name: 'MOCHA', revenue: 360.0 },
    { rank: 5, name: 'CROISSANT', revenue: 320.0 },
    { rank: 6, name: 'AMERICANO', revenue: 288.0 },
    { rank: 7, name: 'PAIN AU CHOCOLAT', revenue: 180.0 },
    { rank: 8, name: 'SANDWICH', revenue: 160.0 },
    { rank: 9, name: 'TEA', revenue: 144.0 },
    { rank: 10, name: 'ORANGE JUICE', revenue: 120.0 },
  ],
  categoryAnalysis: [
    {
      category: 'Coffee',
      revenue: 1285.0,
      quantity: 88,
      transactions: 73,
      percentageOfRevenue: 31.8,
    },
    {
      category: 'Beverages',
      revenue: 264.0,
      quantity: 22,
      transactions: 18,
      percentageOfRevenue: 6.5,
    },
    {
      category: 'Food',
      revenue: 480.0,
      quantity: 40,
      transactions: 32,
      percentageOfRevenue: 11.9,
    },
    {
      category: 'Desserts',
      revenue: 500.0,
      quantity: 35,
      transactions: 28,
      percentageOfRevenue: 12.4,
    },
    {
      category: 'Tea',
      revenue: 144.0,
      quantity: 12,
      transactions: 10,
      percentageOfRevenue: 3.6,
    },
  ],
  staffPerformance: [
    {
      name: 'MASTFA',
      revenue: 4038.0,
      transactions: 132,
      avgValue: 30.59,
      share: 100.0,
    },
  ],
  peakPeriods: [
    {
      period: 'Afternoon (2-4 PM)',
      timeRange: '14:00-16:00',
      revenue: 1130.0,
      transactions: 37,
      itemsSold: 56,
      share: 28.0,
      status: 'peak',
    },
    {
      period: 'Lunch Period',
      timeRange: '12:00-14:00',
      revenue: 979.0,
      transactions: 32,
      itemsSold: 47,
      share: 24.2,
      status: 'peak',
    },
    {
      period: 'Morning Rush',
      timeRange: '07:00-10:00',
      revenue: 735.0,
      transactions: 24,
      itemsSold: 34,
      share: 18.2,
      status: 'moderate',
    },
    {
      period: 'Mid-Morning',
      timeRange: '10:00-12:00',
      revenue: 623.0,
      transactions: 20,
      itemsSold: 29,
      share: 15.4,
      status: 'moderate',
    },
    {
      period: 'Early Morning',
      timeRange: '05:00-07:00',
      revenue: 146.0,
      transactions: 5,
      itemsSold: 7,
      share: 3.6,
      status: 'low',
    },
    {
      period: 'Evening',
      timeRange: '16:00-17:00',
      revenue: 198.0,
      transactions: 6,
      itemsSold: 9,
      share: 4.9,
      status: 'low',
    },
  ],
  insights: {
    peakHour: {
      time: '14:00',
      revenue: 567.0,
    },
    bestSellingProduct: {
      name: 'ESPRESSO STANDARD',
      quantity: 78,
    },
    highestValueTransaction: 125.0,
    busiestPeriod: {
      period: 'Afternoon (2-4 PM)',
      transactions: 37,
    },
    revenueComparison: {
      vsPreviousDay: 5.2,
      vsPreviousWeek: 3.8,
    },
  },
};

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};

export default function DailyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.date) {
      return parseDateString(params.date);
    }
    return new Date('2024-01-15');
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(selectedDate);

  // In production, fetch data based on date parameter
  const reportData: DailyReportData = mockDailyReportData;

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = getFirstDayOfMonth(calendarDate);
    const daysInMonth = getDaysInMonth(calendarDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    }

    return days;
  }, [calendarDate]);

  const monthYearLabel = useMemo(() => {
    return calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarDate]);

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    return nextMonth <= new Date();
  }, [calendarDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCalendarDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (direction === 'next' && canNavigateNext) {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) {
      setSelectedDate(date);
      setShowDatePicker(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
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
        <HourlyAnalysisTable hourlyData={reportData.hourlyData} currency="MAD" />

        {/* Top Products Ranking */}
        <TopProductsRanking
          productsByQuantity={reportData.topProductsByQuantity}
          productsByRevenue={reportData.topProductsByRevenue}
          currency="MAD"
        />

        {/* Category Analysis */}
        <CategoryAnalysisChart
          categories={reportData.categoryAnalysis}
          currency="MAD"
        />

        {/* Staff Performance */}
        <StaffPerformanceTable staff={reportData.staffPerformance} currency="MAD" />
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
});
