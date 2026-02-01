import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { formatAmountMAD } from "@/utils/formatAmount";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DailyRevenueMetrics } from "../types/dailyReport";

interface RevenueMetricsOverviewProps {
  revenue: DailyRevenueMetrics;
  currency?: string;
}

export default function RevenueMetricsOverview({
  revenue,
  currency = "MAD",
}: RevenueMetricsOverviewProps) {
  const formatCurrency = (amount: number) => formatAmountMAD(amount);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Removed HT metric - only showing TTC, Transactions, and Avg Transaction Value
  const metrics = [
    {
      label: "Total Revenue (TTC)",
      value: revenue.totalTTC,
      icon: "dollar-sign",
      format: "currency",
      color: BluePalette.merge,
      isFullWidth: true, // TTC takes full width
    },
    {
      label: "Total Transactions",
      value: revenue.transactions,
      icon: "shopping-cart",
      format: "number",
      color: BluePalette.success,
    },
    {
      label: "Avg Transaction Value",
      value: revenue.avgTransactionValue,
      icon: "trending-up",
      format: "currency",
      color: BluePalette.warning,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Revenue Metrics Overview</Text>
      <View style={styles.grid}>
        {metrics.map((metric, index) => (
          <View
            key={index}
            style={[styles.card, metric.isFullWidth && styles.cardFullWidth]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${metric.color}15` },
              ]}
            >
              <Feather
                name={metric.icon as any}
                size={24}
                color={metric.color}
              />
            </View>
            <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
              {metric.label}
            </Text>
            <Text
              style={styles.value}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {metric.format === "currency"
                ? formatCurrency(metric.value)
                : formatNumber(metric.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: "47%",
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
    minHeight: 150,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  cardFullWidth: {
    minWidth: "100%",
    flexBasis: "100%",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: BluePalette.textDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: BluePalette.primaryDark,
    letterSpacing: -0.5,
    textAlign: "center",
    flexShrink: 1,
  },
});
