import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import DateSelector from '@/domains/alerts/components/DateSelector';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useAppSelector } from '@/store/hooks';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PeakPeriodsLineChart from '../components/PeakPeriodsLineChart';
import RevenueMetricsOverview from '../components/RevenueMetricsOverview';
import StaffPerformanceTable from '../components/StaffPerformanceTable';
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
    
    { hour: '08:00', revenue: 234.0, transactions: 8, itemsSold: 12 },
    { hour: '09:00', revenue: 312.0, transactions: 10, itemsSold: 15 },
    { hour: '10:00', revenue: 278.0, transactions: 9, itemsSold: 13 },
    { hour: '11:00', revenue: 345.0, transactions: 11, itemsSold: 16 },
    { hour: '12:00', revenue: 456.0, transactions: 15, itemsSold: 22 },
    { hour: '13:00', revenue: 523.0, transactions: 17, itemsSold: 25 },
    { hour: '14:00', revenue: 567.0, transactions: 19, itemsSold: 28 },
    { hour: '15:00', revenue: 563.0, transactions: 18, itemsSold: 27 },
    { hour: '16:00', revenue: 412.0, transactions: 13, itemsSold: 19 },
    { hour: '17:00', revenue: 350.0, transactions: 11, itemsSold: 15 },
    { hour: '18:00', revenue: 280.0, transactions: 9, itemsSold: 12 },
    { hour: '19:00', revenue: 220.0, transactions: 7, itemsSold: 10 },
    { hour: '20:00', revenue: 180.0, transactions: 6, itemsSold: 8 },
    { hour: '21:00', revenue: 150.0, transactions: 5, itemsSold: 7 },
    { hour: '22:00', revenue: 120.0, transactions: 4, itemsSold: 6 },
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
      revenue: 2238.0,
      transactions: 73,
      avgValue: 30.66,
      share: 55.4,
    },
    {
      name: 'AHMED',
      revenue: 1800.0,
      transactions: 59,
      avgValue: 30.51,
      share: 44.6,
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

const parseDateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

export default function DailyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  
  // Get selected date from Redux (shared with alerts DateSelector)
  const selectedDateString = useAppSelector((state) => state.alerts.selectedDate);
  const selectedDate = selectedDateString ? parseDateString(selectedDateString) : new Date();

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
});
