import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import BottomBar from "@/domains/shared/components/BottomBar";
import { formatAmountMAD } from "@/utils/formatAmount";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import WeekSelector from "../components/WeekSelector";
import {
    convertFixedChargeDetailToFrontend,
    deleteFixedCharge,
    getFixedChargeById,
} from "../services/chargesService";
import { FixedChargeCategory, FixedChargeDetail } from "../types/charge";

export default function FixedChargeDetailScreen() {
  const { id, month } = useLocalSearchParams<{ id?: string; month?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();
  const [charge, setCharge] = useState<FixedChargeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Get month key for week selector - use passed month param or default to current month
  const monthKey = useMemo(() => {
    if (month) {
      return month;
    }
    // Fallback to current month if no month param
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${monthNum}`;
  }, [month]);

  // Fetch charge detail function
  const fetchCharge = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const chargeId = parseInt(id, 10);
      if (isNaN(chargeId)) {
        throw new Error("Invalid charge ID");
      }

      const response = await getFixedChargeById(chargeId, monthKey);
      const frontendCharge = convertFixedChargeDetailToFrontend(response);
      setCharge(frontendCharge);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        t("charges.common.loadFailed");
      setError(errorMessage);
      console.error("Error fetching charge:", err);
      setCharge(null);
    } finally {
      setLoading(false);
    }
  }, [id, monthKey, t]);

  // Fetch charge detail when id or monthKey changes
  useEffect(() => {
    fetchCharge();
  }, [fetchCharge]);

  // Refetch when screen comes into focus (after edit)
  useFocusEffect(
    useCallback(() => {
      fetchCharge();
    }, [fetchCharge]),
  );

  const handleDelete = () => {
    if (!id) return;

    const chargeId = parseInt(id, 10);
    if (isNaN(chargeId)) return;

    Alert.alert(
      t("charges.fixed.details.deleteConfirmTitle"),
      t("charges.fixed.details.deleteConfirmMessage"),
      [
        { text: t("charges.fixed.form.cancel"), style: "cancel" },
        {
          text: t("charges.fixed.details.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteFixedCharge(chargeId);
              Alert.alert(t("charges.common.success"), t("charges.fixed.details.deleteSuccess"), [
                { text: t("charges.common.ok"), onPress: () => router.back() },
              ]);
            } catch (err: any) {
              const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                t("charges.common.loadFailed");
              Alert.alert(t("charges.common.error"), errorMessage);
              console.error("Error deleting charge:", err);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const formatAmount = formatAmountMAD;

  if (loading) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        style={[styles.container, { backgroundColor: BluePalette.white }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather
              name="arrow-left"
              size={24}
              color={BluePalette.textPrimary}
            />
          </Pressable>
          <Text style={styles.headerTitle}>
            {t("charges.fixed.details.title")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={BluePalette.merge} />
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  if (error || !charge) {
    return (
      <SafeAreaView
        edges={["left", "right"]}
        style={[styles.container, { backgroundColor: BluePalette.white }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather
              name="arrow-left"
              size={24}
              color={BluePalette.textPrimary}
            />
          </Pressable>
          <Text style={styles.headerTitle}>
            {t("charges.fixed.details.title")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {error || t("charges.fixed.details.notFound")}
          </Text>
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  const categoryLabel =
    charge.category === "other" && charge.name?.trim()
      ? charge.name.trim()
      : t(`charges.fixed.categories.${charge.category}`);

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather
            name="arrow-left"
            size={24}
            color={BluePalette.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryLabel}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.editButton}
            onPress={() =>
              router.push({
                pathname: `/charges/fixed/edit/${id}` as any,
                params: { category: charge.category, month: monthKey },
              })
            }
            disabled={deleting}
          >
            <Feather name="edit-2" size={20} color={BluePalette.merge} />
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={BluePalette.error} />
            ) : (
              <Feather name="trash-2" size={20} color={BluePalette.error} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Week Selector - Only for personnel category, at the top */}
      {charge.category === "personnel" && (
        <View style={styles.weekSelectorContainer}>
          <WeekSelector
            monthKey={monthKey}
            selectedWeek={selectedWeek}
            onWeekSelect={setSelectedWeek}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Amount Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            {t("charges.fixed.details.total")}
          </Text>
          <Text style={styles.totalAmount}>
            {(() => {
              // In week view for personnel, show total for selected week across all employees
              if (
                charge.category === "personnel" &&
                selectedWeek &&
                charge.personnelData &&
                charge.personnelData.length > 0
              ) {
                let weekTotal = 0;
                charge.personnelData.forEach((group) => {
                  group.employees.forEach((employee) => {
                    if (
                      employee.weekSalaries &&
                      employee.weekSalaries[selectedWeek] !== undefined
                    ) {
                      weekTotal += employee.weekSalaries[selectedWeek];
                    }
                  });
                });
                return formatAmount(weekTotal);
              }

              // Default: show monthly total amount
              return formatAmount(charge.amount);
            })()}
          </Text>
        </View>

        {/* Personnel Types - Special layout for personnel category */}
        {charge.category === "personnel" &&
          charge.personnelData &&
          charge.personnelData.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t("charges.fixed.details.personnel")}
                </Text>
                {selectedWeek && (
                  <View style={styles.weekBadge}>
                    <Feather
                      name="calendar"
                      size={14}
                      color={BluePalette.merge}
                    />
                    <Text style={styles.weekBadgeText}>{t("charges.fixed.details.weekView")}</Text>
                  </View>
                )}
              </View>
              {charge.personnelData.map((personnelType, index) => {
                const typeIcons: Record<string, string> = {
                  server: "user",
                  barman: "coffee",
                  cleaner: "droplet",
                };
                const typeIcon = typeIcons[personnelType.type] || "users";

                return (
                  <View key={index} style={styles.personnelTypeContainer}>
                    <View style={styles.personnelTypeHeader}>
                      <View style={styles.personnelTypeTitleContainer}>
                        <View style={styles.personnelTypeIconContainer}>
                          <Feather
                            name={typeIcon as any}
                            size={18}
                            color={BluePalette.merge}
                          />
                        </View>
                        <Text style={styles.personnelTypeTitle}>
                          {personnelType.type.charAt(0).toUpperCase() +
                            personnelType.type.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.personnelTypeTotalBadge}>
                        <Text style={styles.personnelTypeTotal}>
                          {(() => {
                            // In week view, show total for selected week for this personnel type
                            if (
                              charge.category === "personnel" &&
                              selectedWeek &&
                              personnelType.employees &&
                              personnelType.employees.length > 0
                            ) {
                              const typeWeekTotal =
                                personnelType.employees.reduce(
                                  (sum, employee) => {
                                    if (
                                      employee.weekSalaries &&
                                      employee.weekSalaries[selectedWeek] !==
                                        undefined
                                    ) {
                                      return (
                                        sum +
                                        employee.weekSalaries[selectedWeek]
                                      );
                                    }
                                    return sum;
                                  },
                                  0,
                                );
                              return formatAmount(typeWeekTotal);
                            }

                            // Default: show monthly total amount for this type
                            return formatAmount(personnelType.totalAmount);
                          })()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.employeesContainer}>
                      {personnelType.employees.map((employee) => (
                        <View key={employee.id} style={styles.employeeCard}>
                          <View style={styles.employeeHeader}>
                            <View style={styles.employeeInfo}>
                              <Text style={styles.employeeName}>
                                {employee.name}
                              </Text>
                              {employee.position && (
                                <Text style={styles.employeePosition}>
                                  {employee.position}
                                </Text>
                              )}
                            </View>
                            <View style={styles.employeeSalaryBadge}>
                              <Text style={styles.employeeSalary}>
                                {(() => {
                                  // Determine what salary to display based on selected week
                                  let displaySalary: number | undefined;

                                  if (
                                    selectedWeek &&
                                    employee.weekSalaries &&
                                    employee.weekSalaries[selectedWeek] !==
                                      undefined
                                  ) {
                                    // Show salary for selected week (week key is Monday date in YYYY-MM-DD format)
                                    displaySalary =
                                      employee.weekSalaries[selectedWeek];
                                  } else if (
                                    employee.monthSalary !== undefined
                                  ) {
                                    // Show monthly salary
                                    displaySalary = employee.monthSalary;
                                  } else if (
                                    employee.weekSalary !== undefined
                                  ) {
                                    // Fallback to weekSalary
                                    displaySalary = employee.weekSalary;
                                  } else if (employee.salary !== undefined) {
                                    // Fallback to salary
                                    displaySalary = employee.salary;
                                  }

                                  return displaySalary !== undefined
                                    ? formatAmount(displaySalary)
                                    : "N/A";
                                })()}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.employeeDetails}>
                            {employee.hours && (
                              <View style={styles.employeeDetailItem}>
                                <View style={styles.employeeDetailIcon}>
                                  <Feather
                                    name="clock"
                                    size={14}
                                    color={BluePalette.merge}
                                  />
                                </View>
                                <Text style={styles.employeeDetailText}>
                                  {employee.hours}h/month
                                </Text>
                              </View>
                            )}
                            {employee.startDate && (
                              <View style={styles.employeeDetailItem}>
                                <View style={styles.employeeDetailIcon}>
                                  <Feather
                                    name="calendar"
                                    size={14}
                                    color={BluePalette.merge}
                                  />
                                </View>
                                <Text style={styles.employeeDetailText}>
                                  Since{" "}
                                  {new Date(
                                    employee.startDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        {/* Notes */}
        {charge.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("charges.fixed.details.notes")}
            </Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{charge.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  weekSelectorContainer: {
    backgroundColor: BluePalette.backgroundNew,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  weekBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BluePalette.selectedBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: BluePalette.merge,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  totalCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BluePalette.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: BluePalette.white,
    letterSpacing: -1,
  },
  comparisonContainer: {
    gap: 8,
    marginTop: 4,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    fontWeight: "500",
  },
  comparisonValue: {
    fontSize: 16,
    color: BluePalette.white,
    fontWeight: "600",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeBadgeUp: {
    backgroundColor: `${BluePalette.error}15`,
  },
  changeBadgeDown: {
    backgroundColor: `${BluePalette.success}15`,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  changeTextUp: {
    color: BluePalette.error,
  },
  changeTextDown: {
    color: BluePalette.success,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: `${BluePalette.error}10`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.error,
    gap: 12,
  },
  warningContent: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BluePalette.error,
  },
  warningText: {
    fontSize: 13,
    color: BluePalette.textDark,
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  breakdownContainer: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 12,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  breakdownLabel: {
    fontSize: 15,
    color: BluePalette.textDark,
    fontWeight: "500",
  },
  breakdownAmount: {
    fontSize: 16,
    color: BluePalette.textDark,
    fontWeight: "700",
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
  notesCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  notesText: {
    fontSize: 15,
    color: BluePalette.textTertiary,
    lineHeight: 22,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  messageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: BluePalette.primaryDark,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  personnelTypeContainer: {
    marginBottom: 24,
  },
  personnelTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BluePalette.merge,
  },
  personnelTypeTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  personnelTypeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BluePalette.backgroundNew,
    alignItems: "center",
    justifyContent: "center",
  },
  personnelTypeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BluePalette.textDark,
    textTransform: "capitalize",
    letterSpacing: -0.3,
  },
  personnelTypeTotalBadge: {
    backgroundColor: BluePalette.backgroundNew,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  personnelTypeTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: BluePalette.white,
    letterSpacing: -0.3,
  },
  employeesContainer: {
    gap: 14,
  },
  employeeCard: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  employeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  employeeInfo: {
    flex: 1,
    gap: 4,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: "700",
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  employeeSalaryBadge: {
    backgroundColor: BluePalette.backgroundNew,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${BluePalette.merge}30`,
  },
  employeeSalary: {
    fontSize: 16,
    fontWeight: "700",
    color: BluePalette.white,
    letterSpacing: -0.2,
  },
  employeePosition: {
    fontSize: 14,
    color: BluePalette.textDark,
    opacity: 0.65,
    fontWeight: "500",
    marginTop: 2,
  },
  employeeDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  employeeDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  employeeDetailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BluePalette.backgroundNew,
    alignItems: "center",
    justifyContent: "center",
  },
  employeeDetailText: {
    fontSize: 13,
    color: BluePalette.textDark,
    opacity: 0.75,
    fontWeight: "500",
  },
});
