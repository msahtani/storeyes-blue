import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import { formatAmountMAD } from "@/utils/formatAmount";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FixedCharge, FixedChargeCategory } from "../types/charge";

interface FixedChargeCardProps {
  category: FixedChargeCategory;
  charge: FixedCharge | null;
  /** When category is 'other', show this name instead of translated "Other" */
  displayName?: string;
  isWarned?: boolean;
  onPress: () => void;
}

const categoryIcons: Record<FixedChargeCategory, string> = {
  personnel: "users",
  water: "droplet",
  electricity: "zap",
  wifi: "wifi",
  other: "tag",
};

const getCategoryLabelKey = (category: FixedChargeCategory): string =>
  `charges.fixed.categories.${category}`;

export default function FixedChargeCard({
  category,
  charge,
  displayName,
  isWarned = false,
  onPress,
}: FixedChargeCardProps) {
  const { t } = useI18n();
  const icon = categoryIcons[category];
  const label = displayName ?? t(getCategoryLabelKey(category));
  const isEmpty = !charge;

  const formatAmount = formatAmountMAD;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isEmpty && styles.cardEmpty,
        isWarned && styles.cardWarned,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: "rgba(6, 182, 212, 0.2)" }}
    >
      <View style={styles.cardContent}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isEmpty
                ? `${BluePalette.textTertiary}15`
                : `${BluePalette.merge}15`,
            },
          ]}
        >
          <Feather
            name={icon as any}
            size={24}
            color={isEmpty ? BluePalette.textTertiary : BluePalette.merge}
          />
        </View>

        <View style={styles.cardInfo}>
          <Text
            style={[styles.categoryLabel, isEmpty && styles.categoryLabelEmpty]}
          >
            {label}
          </Text>
          {isEmpty ? (
            <View style={styles.emptyState}>
              {isWarned ? (
                <>
                  <Feather
                    name="alert-circle"
                    size={14}
                    color={BluePalette.warning}
                  />
                  <Text style={styles.warnedText}>
                    {t("charges.fixed.notFilledMonthEnded")}
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  {t("charges.fixed.notFilled")}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.amountRow}>
              <Text style={styles.amount}>{formatAmount(charge.amount)}</Text>
            </View>
          )}
        </View>

        {isWarned && (
          <View style={styles.warnedBadge}>
            <Feather
              name="alert-triangle"
              size={18}
              color={BluePalette.warning}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardEmpty: {
    borderStyle: "dashed",
    opacity: 0.7,
  },
  cardWarned: {
    borderColor: BluePalette.warning,
    borderWidth: 2,
    backgroundColor: BluePalette.backgroundNew,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.merge,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  categoryLabelEmpty: {
    color: BluePalette.textTertiary,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    fontWeight: "500",
    fontStyle: "italic",
  },
  warnedText: {
    fontSize: 13,
    color: BluePalette.warning,
    fontWeight: "600",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
    color: BluePalette.textTertiary,
  },
  warnedBadge: {
    padding: 4,
  },
});
