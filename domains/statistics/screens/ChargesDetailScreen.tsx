import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import BottomBar from "@/domains/shared/components/BottomBar";
import { formatAmountMAD } from "@/utils/formatAmount";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SimplePieChart } from "../components/PieChart";
import { getChargesDetail } from "../services/statisticsService";
import { ChargesDetailData, PeriodType, StatusType } from "../types/statistics";

type TabType = "fixed" | "variable";

export default function ChargesDetailScreen() {
  const { period, month, week } = useLocalSearchParams<{
    period?: string;
    month?: string;
    week?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("fixed");
  const [chargesData, setChargesData] = useState<ChargesDetailData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const selectedPeriod = ((period as PeriodType) || "month") as
    | "week"
    | "month";

  // Fetch charges detail from API
  useEffect(() => {
    let cancelled = false;

    async function fetchChargesDetail() {
      // Need both period and month to fetch
      if (!month) {
        // If no month provided, use current month
        const today = new Date();
        const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        // We'll wait for the date selector to provide the month
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getChargesDetail(selectedPeriod, month, week);

        if (!cancelled) {
          setChargesData(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          const errorMessage =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load charges detail";
          setError(errorMessage);
          console.error("Error fetching charges detail:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchChargesDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedPeriod, month, week]);

  const activeCharges = useMemo(() => {
    if (!chargesData) return [];
    return activeTab === "fixed"
      ? chargesData.fixedCharges
      : chargesData.variableCharges;
  }, [chargesData, activeTab]);

  const formatAmount = (amount: number) => formatAmountMAD(amount);

  const getStatusColor = (status?: StatusType) => {
    switch (status) {
      case "good":
        return BluePalette.success;
      case "medium":
        return BluePalette.warning;
      case "critical":
        return BluePalette.error;
      default:
        return BluePalette.textTertiary;
    }
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather
            name="arrow-left"
            size={24}
            color={BluePalette.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t("statistics.chargesDetailScreen.title")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === "fixed" && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => setActiveTab("fixed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "fixed" && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            {t("statistics.chargesDetailScreen.fixed")}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === "variable" && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => setActiveTab("variable")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "variable" && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            {t("statistics.chargesDetailScreen.variable")}
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
        {/* Pie Chart - Only for fixed charges */}
        {activeTab === "fixed" && activeCharges.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>
              {t("statistics.chargesDetailScreen.distribution")}
            </Text>
            <View style={styles.chartContainer}>
              <SimplePieChart data={activeCharges} />
            </View>
          </View>
        )}

        {/* Statistics Section - Only for variable charges */}
        {activeTab === "variable" &&
          chargesData?.statistics &&
          !loading &&
          !error && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>
                {t("statistics.chargesDetailScreen.statistics") || "Statistics"}
              </Text>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${BluePalette.merge}15` },
                      ]}
                    >
                      <Feather
                        name="dollar-sign"
                        size={18}
                        color={BluePalette.merge}
                      />
                    </View>
                    <Text style={styles.statCardTitle}>
                      {t("statistics.chargesDetailScreen.totalCharges")}
                    </Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {formatAmount(chargesData.statistics.totalVariableCharges)}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${BluePalette.warning}15` },
                      ]}
                    >
                      <Feather
                        name="percent"
                        size={18}
                        color={BluePalette.warning}
                      />
                    </View>
                    <Text style={styles.statCardTitle}>
                      {t("statistics.chargesDetailScreen.caPercentage")}
                    </Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {chargesData.statistics.caPercentage.toFixed(2)}%
                  </Text>
                  <Text style={styles.statCardSubtitle}>
                    {t("statistics.chargesDetailScreen.ofTotalRevenue")}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${BluePalette.success}15` },
                      ]}
                    >
                      <Feather
                        name="list"
                        size={18}
                        color={BluePalette.success}
                      />
                    </View>
                    <Text style={styles.statCardTitle}>
                      {t("statistics.chargesDetailScreen.itemsCount")}
                    </Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {chargesData.variableCharges.length}
                  </Text>
                  <Text style={styles.statCardSubtitle}>
                    {chargesData.variableCharges.length === 1
                      ? t("statistics.chargesDetailScreen.item")
                      : t("statistics.chargesDetailScreen.items")}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${BluePalette.textTertiary}15` },
                      ]}
                    >
                      <Feather
                        name="pie-chart"
                        size={18}
                        color={BluePalette.textTertiary}
                      />
                    </View>
                    <Text style={styles.statCardTitle}>
                      {t("statistics.chargesDetailScreen.ofAllCharges")}
                    </Text>
                  </View>
                  <Text style={styles.statCardValue}>
                    {chargesData.statistics.percentageOfAllCharges.toFixed(2)}%
                  </Text>
                  <Text style={styles.statCardSubtitle}>
                    {t("statistics.chargesDetailScreen.ofTotalCharges")}
                  </Text>
                </View>
              </View>
            </View>
          )}

        {/* Charges List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            {t("statistics.chargesDetailScreen.details")}
          </Text>
          {activeTab === "fixed" ? (
            <View style={styles.listContainer}>
              {loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={BluePalette.merge} />
                </View>
              ) : error ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : activeCharges.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {activeTab === "fixed"
                      ? t("statistics.chargesDetailScreen.noFixedCharges")
                      : t("statistics.chargesDetailScreen.noVariableCharges")}
                  </Text>
                </View>
              ) : (
                activeCharges.map((charge) => (
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
                          {t("statistics.chargesDetailScreen.ofCharges")}:
                        </Text>
                        <Text style={styles.chargeDetailValue}>
                          {charge.percentageOfCharges.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.chargeDetailItem}>
                        <Text style={styles.chargeDetailLabel}>
                          {t("statistics.chargesDetailScreen.ofRevenue")}:
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
                          {
                            backgroundColor: `${getStatusColor(charge.status)}15`,
                          },
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
                          {charge.status === "good"
                            ? t("statistics.status.good")
                            : charge.status === "medium"
                              ? t("statistics.status.medium")
                              : t("statistics.status.critical")}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={BluePalette.merge} />
                </View>
              ) : error ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : activeCharges.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {t("statistics.chargesDetailScreen.noVariableCharges")}
                  </Text>
                </View>
              ) : (
                activeCharges.map((charge) => (
                  <Pressable
                    key={charge.id}
                    style={({ pressed }) => [
                      styles.variableChargeItem,
                      pressed && styles.variableChargeItemPressed,
                    ]}
                    onPress={() =>
                      router.push(`/charges/variable/${charge.id}` as any)
                    }
                    android_ripple={{ color: "rgba(6, 182, 212, 0.2)" }}
                  >
                    <View style={styles.variableChargeContent}>
                      <View style={styles.variableChargeMain}>
                        <Text
                          style={styles.variableChargeName}
                          numberOfLines={1}
                        >
                          {charge.name}
                        </Text>
                        <View style={styles.variableChargeStats}>
                          {charge.date && (
                            <View style={styles.variableStatRow}>
                              <Feather
                                name="calendar"
                                size={12}
                                color={BluePalette.textTertiary}
                              />
                              <Text style={styles.variableStatText}>
                                {new Date(charge.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </Text>
                            </View>
                          )}
                          {charge.supplier && (
                            <View style={styles.variableStatRow}>
                              <Feather
                                name="truck"
                                size={12}
                                color={BluePalette.textTertiary}
                              />
                              <Text
                                style={styles.variableStatText}
                                numberOfLines={1}
                              >
                                {charge.supplier}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.variableChargeRight}>
                        <Text style={styles.variableChargeAmount}>
                          {formatAmount(charge.amount)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  tabSelector: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: BluePalette.backgroundNew,
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
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
    color: BluePalette.textSecondary,
  },
  tabTextActive: {
    color: BluePalette.merge,
    fontWeight: "700",
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
    fontWeight: "700",
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  chartContainer: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: "#000",
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
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 12,
  },
  chargeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chargeName: {
    fontSize: 16,
    fontWeight: "600",
    color: BluePalette.textPrimary,
    flex: 1,
  },
  chargeAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    letterSpacing: -0.3,
  },
  chargeDetails: {
    flexDirection: "row",
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  chargeDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chargeDetailLabel: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: "500",
  },
  chargeDetailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: BluePalette.textPrimary,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
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
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: BluePalette.textTertiary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: BluePalette.error,
    fontWeight: "500",
    textAlign: "center",
  },
  variableChargeItem: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  variableChargeItemPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.merge,
  },
  variableChargeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  variableChargeMain: {
    flex: 1,
    gap: 8,
  },
  variableChargeName: {
    fontSize: 16,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  variableChargeStats: {
    gap: 6,
  },
  variableStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  variableStatText: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: "500",
    flex: 1,
  },
  variableChargeRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  variableChargeAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: BluePalette.merge,
    letterSpacing: -0.3,
  },
  statsSection: {
    gap: 12,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    flex: 1,
    minWidth: "47%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: BluePalette.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 11,
    color: BluePalette.textTertiary,
    fontWeight: "500",
  },
});
