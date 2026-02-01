import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { formatAmountMAD } from "@/utils/formatAmount";
import React, { useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { CategoryData } from "../types/dailyReport";

interface CategoryAnalysisChartProps {
  categories: CategoryData[];
  currency?: string;
}

const CHART_HEIGHT = 300;
const BAR_HEIGHT = 30;
const BAR_GAP = 12;
const COLORS = [
  BluePalette.merge,
  BluePalette.warning,
  BluePalette.success,
  BluePalette.error,
  BluePalette.primaryLight,
  BluePalette.accent,
];

export default function CategoryAnalysisChart({
  categories,
  currency = "MAD",
}: CategoryAnalysisChartProps) {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 40 - 32; // Container padding + chart padding

  const { maxRevenue, sortedCategories } = useMemo(() => {
    const sorted = [...categories].sort((a, b) => b.revenue - a.revenue);
    const max = Math.max(...categories.map((c) => c.revenue), 1);
    return { maxRevenue: max, sortedCategories: sorted };
  }, [categories]);

  const formatCurrency = (amount: number) => formatAmountMAD(amount);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Category Analysis</Text>
      <View style={styles.chartContainer}>
        {/* Horizontal Bar Chart */}
        <View style={styles.barChart}>
          {sortedCategories.map((category, index) => {
            const barWidth = (category.revenue / maxRevenue) * chartWidth;
            const color = COLORS[index % COLORS.length];

            return (
              <View key={index} style={styles.barRow}>
                <View style={styles.barLabelContainer}>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {category.category}
                  </Text>
                  <Text style={styles.barPercentage}>
                    {category.percentageOfRevenue.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: Math.max(barWidth, 40),
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={styles.barValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {formatCurrency(category.revenue)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary Table */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollContainer}
        >
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.categoryColumn]}>
                Category
              </Text>
              <Text style={[styles.tableHeaderCell, styles.revenueColumn]}>
                Revenue (MAD)
              </Text>
              <Text style={[styles.tableHeaderCell, styles.quantityColumn]}>
                Quantity
              </Text>
              <Text style={[styles.tableHeaderCell, styles.transactionsColumn]}>
                Transactions
              </Text>
            </View>
            {sortedCategories.map((category, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowEven,
                  ]}
                >
                  <View style={styles.categoryCell}>
                    <View
                      style={[
                        styles.categoryColorIndicator,
                        { backgroundColor: color },
                      ]}
                    />
                    <Text
                      style={styles.categoryName}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {category.category}
                    </Text>
                  </View>
                  <Text
                    style={[styles.tableCell, styles.revenueColumn]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {formatCurrency(category.revenue)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.quantityColumn]}
                    numberOfLines={1}
                  >
                    {formatNumber(category.quantity)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.transactionsColumn]}
                    numberOfLines={1}
                  >
                    {formatNumber(category.transactions)}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  chartContainer: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 16,
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
  barChart: {
    marginBottom: 24,
    gap: BAR_GAP,
  },
  barRow: {
    gap: 8,
  },
  barLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BluePalette.textDark,
    flex: 1,
  },
  barPercentage: {
    fontSize: 12,
    fontWeight: "700",
    color: BluePalette.textTertiary,
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: BAR_HEIGHT + 4,
  },
  barWrapper: {
    flex: 1,
    minWidth: 0,
    height: BAR_HEIGHT,
    justifyContent: "center",
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: 6,
    minWidth: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "700",
    color: BluePalette.textDark,
    minWidth: 85,
    maxWidth: 100,
    textAlign: "right",
    flexShrink: 0,
  },
  tableScrollContainer: {
    maxHeight: 400,
  },
  tableWrapper: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BluePalette.merge,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: BluePalette.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    minHeight: 60,
  },
  tableRowEven: {
    backgroundColor: BluePalette.whiteLight,
  },
  categoryCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 140,
    flexShrink: 0,
    paddingRight: 8,
    minWidth: 0,
  },
  categoryColumn: {
    width: 140,
    flexShrink: 0,
    paddingRight: 8,
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    color: BluePalette.textDark,
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  tableCell: {
    fontSize: 13,
    fontWeight: "500",
    color: BluePalette.textDark,
  },
  // categoryColumn: {
  //   width: 140,
  //   flexShrink: 0,
  //   paddingRight: 8,
  // },
  revenueColumn: {
    width: 130,
    textAlign: "right",
    paddingLeft: 8,
    paddingRight: 8,
    flexShrink: 0,
  },
  quantityColumn: {
    width: 90,
    textAlign: "right",
    paddingLeft: 8,
    paddingRight: 8,
    flexShrink: 0,
  },
  transactionsColumn: {
    width: 110,
    textAlign: "right",
    paddingLeft: 8,
    paddingRight: 8,
    flexShrink: 0,
  },
});
