import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import { setSelectedDate as setAlertsSelectedDate } from "@/domains/alerts/store/alertsSlice";
import BottomBar from "@/domains/shared/components/BottomBar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getDisplayDateString } from "@/utils/getDisplayDate";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import DailyReportDateSelector from "../components/DailyReportDateSelector";
import PeakPeriodsLineChart from "../components/PeakPeriodsLineChart";
import RevenueMetricsOverview from "../components/RevenueMetricsOverview";
import StaffPerformanceTable from "../components/StaffPerformanceTable";
import { useDailyReport } from "../hooks/useDailyReport";

export default function DailyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ date?: string }>();
  const dispatch = useAppDispatch();

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
  const alertsSelectedDate = useAppSelector(
    (state) => state.alerts.selectedDate,
  );
  const hasProcessedInitialDate = useRef(false);

  // Set date from query parameter if provided (when navigating from HomeScreen card)
  // Only process once on initial mount to allow user to change dates afterward
  useEffect(() => {
    if (params.date && !hasProcessedInitialDate.current) {
      // Set in alerts store (used by DailyReportDateSelector)
      dispatch(setAlertsSelectedDate(params.date));
      // Also set in useDailyReport hook
      const year = parseInt(params.date.split("-")[0]);
      const month = parseInt(params.date.split("-")[1]) - 1;
      const day = parseInt(params.date.split("-")[2]);
      const date = new Date(year, month, day);
      const currentDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      if (params.date !== currentDateString && isPastDate(date)) {
        setSelectedDate(date);
      }
      hasProcessedInitialDate.current = true;
    }
  }, [
    params.date,
    dispatch,
    alertsSelectedDate,
    setSelectedDate,
    selectedDate,
    isPastDate,
  ]);

  useEffect(() => {
    if (alertsSelectedDate) {
      const year = parseInt(alertsSelectedDate.split("-")[0]);
      const month = parseInt(alertsSelectedDate.split("-")[1]) - 1;
      const day = parseInt(alertsSelectedDate.split("-")[2]);
      const date = new Date(year, month, day);

      // Only update if the date is different to avoid infinite loops
      // Trust the DateSelector's validation (it already handles 21:00 GMT rule)
      const currentDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      if (currentDateString !== alertsSelectedDate) {
        setSelectedDate(date);
      }
    }
  }, [alertsSelectedDate, selectedDate, setSelectedDate]);

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

  const handleScroll = useCallback(
    (event: any) => {
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
    },
    [hideDateSelector, showDateSelector, isDateSelectorHidden],
  );

  // Check if viewing the current display date (21:00 GMT rule) for no data message
  const isViewingDisplayDate = useMemo(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return dateStr === getDisplayDateString();
  }, [selectedDate]);

  return (
    <SafeAreaView edges={["left", "right"]} style={[styles.container]}>
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather
            name="arrow-left"
            size={24}
            color={BluePalette.textPrimary}
          />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {t("home.features.caisse.title")}
          </Text>
          <Text style={styles.headerSubtitle}>{formatDate(selectedDate)}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Date Selector Blue Bar */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            transform: [{ translateY }],
            opacity,
            position: isDateSelectorHidden ? "absolute" : "relative",
            top: isDateSelectorHidden ? topHeaderHeight : 0,
            left: 0,
            right: 0,
            zIndex: isDateSelectorHidden ? -1 : 1,
          },
        ]}
      >
        <DailyReportDateSelector />
      </Animated.View>

      <ScrollView
        style={[styles.scrollView, { zIndex: isDateSelectorHidden ? 1 : 0 }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
            <Feather
              name="alert-circle"
              size={24}
              color={BluePalette.error || "#FF3B30"}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* No Data State */}
        {!reportData && !loading && !error && (
          <View style={styles.noDataContainer}>
            <Feather name="inbox" size={32} color={BluePalette.textTertiary} />
            <Text style={styles.noDataText}>
              {isViewingDisplayDate
                ? "Data for today is not yet available. Please check back later."
                : "No data available for this date"}
            </Text>
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
            <StaffPerformanceTable
              staff={reportData.staffPerformance}
              currency="MAD"
            />
          </>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
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
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    marginTop: 0,
    paddingTop: 10,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: BluePalette.textTertiary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
    color: BluePalette.error || "#FF3B30",
    textAlign: "center",
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "500",
    color: BluePalette.textTertiary,
    textAlign: "center",
  },
});
