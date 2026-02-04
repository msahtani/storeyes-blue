import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { formatAmountMAD } from "@/utils/formatAmount";
import Feather from "@expo/vector-icons/Feather";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { DailyRevenueMetrics } from "../types/dailyReport";

interface RevenueMetricsOverviewProps {
  revenue: DailyRevenueMetrics;
  currency?: string;
  onUpdateTpe?: (tpe: number) => Promise<void>;
  updatingBreakdown?: boolean;
}

export default function RevenueMetricsOverview({
  revenue,
  currency = "MAD",
  onUpdateTpe,
  updatingBreakdown = false,
}: RevenueMetricsOverviewProps) {
  const formatCurrency = (amount: number) => formatAmountMAD(amount);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Computed Espèce = TTC - TPE. Use backend values if present, else local.
  const tpeValue = revenue.tpe ?? 0;
  const especeValue = revenue.espece ?? Math.max(0, revenue.totalTTC - tpeValue);

  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(
    revenue.tpe != null && revenue.tpe > 0
  );
  const [isEditingTpe, setIsEditingTpe] = useState(false);
  const [localTpe, setLocalTpe] = useState<string>(
    revenue.tpe != null ? String(Math.round(revenue.tpe * 100) / 100) : ""
  );
  const slideAnim = useRef(new Animated.Value(isBreakdownExpanded ? 1 : 0)).current;

  // Sync local state when revenue changes (e.g. after API update)
  useEffect(() => {
    if (revenue.tpe != null) {
      setLocalTpe(String(Math.round(revenue.tpe * 100) / 100));
    }
  }, [revenue.tpe]);

  const toggleBreakdown = useCallback(() => {
    const next = !isBreakdownExpanded;
    setIsBreakdownExpanded(next);
    Animated.spring(slideAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false, // required for maxHeight animation
      friction: 8,
      tension: 80,
    }).start();
  }, [isBreakdownExpanded, slideAnim]);

  const handleSaveTpe = useCallback(async () => {
    Keyboard.dismiss();
    const parsed = parseFloat(localTpe.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) return;
    if (parsed > revenue.totalTTC) {
      setLocalTpe(String(Math.round(revenue.totalTTC * 100) / 100));
      return;
    }
    if (onUpdateTpe) {
      try {
        await onUpdateTpe(parsed);
        setIsEditingTpe(false);
      } catch (_) {
        // Error handled in hook
      }
    }
  }, [localTpe, revenue.totalTTC, onUpdateTpe]);

  const computedEspece = Math.max(0, revenue.totalTTC - (parseFloat(localTpe.replace(",", ".")) || 0));
  const tpeDisplayValue =
    revenue.tpe != null ? revenue.tpe : (parseFloat(localTpe.replace(",", ".")) || 0);

  const metrics = [
    {
      label: "Total Revenue (TTC)",
      value: revenue.totalTTC,
      icon: "dollar-sign",
      format: "currency",
      color: BluePalette.merge,
      isFullWidth: true,
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
            {/* Collapsible Espèce / TPE section - only on TTC card */}
            {metric.isFullWidth && (
              <View style={styles.breakdownWrapper}>
                <Pressable
                  style={styles.breakdownToggle}
                  onPress={toggleBreakdown}
                  hitSlop={8}
                >
                  <Feather
                    name={isBreakdownExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={BluePalette.textDark}
                  />
                  <Text style={styles.breakdownToggleText}>
                    {isBreakdownExpanded
                      ? "Masquer Espèce / TPE"
                      : "Afficher Espèce / TPE"}
                  </Text>
                </Pressable>
                <Animated.View
                  style={[
                    styles.breakdownContent,
                    {
                      opacity: slideAnim,
                      maxHeight: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 160],
                      }),
                    },
                  ]}
                  pointerEvents={isBreakdownExpanded ? "auto" : "none"}
                >
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Espèce (cash)</Text>
                    <View style={styles.breakdownValueSlot}>
                      <Text style={styles.breakdownValue}>
                        {formatCurrency(isBreakdownExpanded ? computedEspece : especeValue)}
                      </Text>
                      <View style={styles.actionSlot} />
                    </View>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View>
                      <Text style={styles.breakdownLabel}>TPE (carte)</Text>
                      {onUpdateTpe && (
                        <Text style={styles.breakdownHint}>
                          Appuyez pour modifier
                        </Text>
                      )}
                    </View>
                    <View style={styles.breakdownValueSlot}>
                      {isEditingTpe ? (
                        <>
                          <TextInput
                            style={styles.tpeInput}
                            value={localTpe}
                            onChangeText={setLocalTpe}
                            onBlur={handleSaveTpe}
                            onSubmitEditing={handleSaveTpe}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={BluePalette.textTertiary}
                            editable={!!onUpdateTpe && !updatingBreakdown}
                            autoFocus
                          />
                          {onUpdateTpe && (
                            <Pressable
                              style={[
                                styles.saveButton,
                                updatingBreakdown && styles.saveButtonDisabled,
                              ]}
                              onPress={handleSaveTpe}
                              disabled={updatingBreakdown}
                            >
                              {updatingBreakdown ? (
                                <ActivityIndicator size="small" color={BluePalette.white} />
                              ) : (
                                <Feather name="check" size={16} color={BluePalette.white} />
                              )}
                            </Pressable>
                          )}
                        </>
                      ) : (
                        <Pressable
                          style={[
                            styles.tpeValuePressable,
                            onUpdateTpe && styles.tpeValuePressableEditable,
                          ]}
                          onPress={() => onUpdateTpe && setIsEditingTpe(true)}
                          disabled={!onUpdateTpe}
                        >
                          <Text style={styles.breakdownValue}>
                            {formatCurrency(tpeDisplayValue)}
                          </Text>
                          {onUpdateTpe ? (
                            <View style={styles.actionSlot}>
                              <Feather
                                name="edit-2"
                                size={16}
                                color={BluePalette.merge}
                              />
                            </View>
                          ) : (
                            <View style={styles.actionSlot} />
                          )}
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Animated.View>
              </View>
            )}
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
    minHeight: 180,
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
  breakdownWrapper: {
    width: "100%",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  breakdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  breakdownToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: BluePalette.textDark,
  },
  breakdownContent: {
    overflow: "hidden",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: BluePalette.textDark,
  },
  breakdownHint: {
    fontSize: 10,
    fontWeight: "500",
    color: BluePalette.textDark,
    marginTop: 2,
  },
  breakdownValueSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 120,
    justifyContent: "flex-end",
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: "700",
    color: BluePalette.primaryDark,
  },
  actionSlot: {
    width: 30,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  tpeValuePressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tpeValuePressableEditable: {
    borderColor: BluePalette.border,
  },
  tpeInput: {
    minWidth: 85,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: "600",
    color: BluePalette.textPrimary,
    backgroundColor: BluePalette.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BluePalette.merge,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
});
