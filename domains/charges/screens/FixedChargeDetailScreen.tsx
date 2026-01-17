import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WeekSelector from '../components/WeekSelector';
import { FixedChargeCategory, FixedChargeDetail } from '../types/charge';

// Mock data - replace with actual data fetching
const mockFixedChargeDetails: Record<string, FixedChargeDetail> = {
  '1': {
    id: '1',
    category: 'personnel',
    amount: 4500,
    period: 'month',
    trend: 'up',
    trendPercentage: 5.2,
    previousAmount: 4278,
    personnelData: [
      {
        type: 'server',
        totalAmount: 1800,
        employees: [
          {
            id: 'p1',
            name: 'John Doe',
            salary: 900,
            hours: 160,
            position: 'Senior Server',
            startDate: '2023-01-15',
          },
          {
            id: 'p2',
            name: 'Jane Smith',
            salary: 900,
            hours: 160,
            position: 'Server',
            startDate: '2023-03-20',
          },
        ],
      },
      {
        type: 'barman',
        totalAmount: 1500,
        employees: [
          {
            id: 'p3',
            name: 'Mike Johnson',
            salary: 1500,
            hours: 160,
            position: 'Head Bartender',
            startDate: '2022-11-10',
          },
        ],
      },
      {
        type: 'cleaner',
        totalAmount: 1200,
        employees: [
          {
            id: 'p4',
            name: 'Sarah Williams',
            salary: 800,
            hours: 120,
            position: 'Cleaner',
            startDate: '2023-06-01',
          },
          {
            id: 'p5',
            name: 'Tom Brown',
            salary: 400,
            hours: 60,
            position: 'Part-time Cleaner',
            startDate: '2023-09-15',
          },
        ],
      },
    ],
    notes: 'Regular monthly payroll. No changes expected next month.',
    chartData: [
      { period: 'Oct 2023', amount: 4200 },
      { period: 'Nov 2023', amount: 4250 },
      { period: 'Dec 2023', amount: 4278 },
      { period: 'Jan 2024', amount: 4500 },
    ],
  },
  '2': {
    id: '2',
    category: 'water',
    amount: 320,
    period: 'month',
    trend: 'down',
    trendPercentage: -2.1,
    previousAmount: 327,
  },
  '3': {
    id: '3',
    category: 'electricity',
    amount: 850,
    period: 'month',
    trend: 'up',
    trendPercentage: 15.8,
    previousAmount: 735,
    abnormalIncrease: true,
    notes: 'Significant increase due to winter heating. Consider energy efficiency improvements.',
  },
  '4': {
    id: '4',
    category: 'wifi',
    amount: 120,
    period: 'month',
    trend: 'stable',
    trendPercentage: 0,
    previousAmount: 120,
  },
  // Current month personnel data
  '13': {
    id: '13',
    category: 'personnel',
    amount: 4600,
    period: 'month',
    trend: 'up',
    trendPercentage: 2.2,
    previousAmount: 4500,
    personnelData: [
      {
        type: 'server',
        totalAmount: 1900,
        employees: [
          {
            id: 'p1',
            name: 'John Doe',
            salary: 950,
            hours: 160,
            position: 'Senior Server',
            startDate: '2023-01-15',
          },
          {
            id: 'p2',
            name: 'Jane Smith',
            salary: 950,
            hours: 160,
            position: 'Server',
            startDate: '2023-03-20',
          },
        ],
      },
      {
        type: 'barman',
        totalAmount: 1500,
        employees: [
          {
            id: 'p3',
            name: 'Mike Johnson',
            salary: 1500,
            hours: 160,
            position: 'Head Bartender',
            startDate: '2022-11-10',
          },
        ],
      },
      {
        type: 'cleaner',
        totalAmount: 1200,
        employees: [
          {
            id: 'p4',
            name: 'Sarah Williams',
            salary: 800,
            hours: 120,
            position: 'Cleaner',
            startDate: '2023-06-01',
          },
          {
            id: 'p5',
            name: 'Tom Brown',
            salary: 400,
            hours: 60,
            position: 'Part-time Cleaner',
            startDate: '2023-09-15',
          },
        ],
      },
    ],
    notes: 'Current month payroll. Includes recent salary adjustments.',
    chartData: [
      { period: 'Nov 2023', amount: 4200 },
      { period: 'Dec 2023', amount: 4250 },
      { period: 'Jan 2024', amount: 4278 },
      { period: 'Feb 2024', amount: 4500 },
      { period: 'Mar 2024', amount: 4600 },
    ],
  },
};

const categoryLabels: Record<FixedChargeCategory, string> = {
  personnel: 'Personnel',
  water: 'Water',
  electricity: 'Electricity',
  wifi: 'Wi-Fi',
};

export default function FixedChargeDetailScreen() {
  const { id, month } = useLocalSearchParams<{ id?: string; month?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const charge = useMemo(() => {
    if (!id) return null;
    return mockFixedChargeDetails[id] || null;
  }, [id]);

  // Get month key for week selector - use passed month param or default to current month
  const monthKey = useMemo(() => {
    if (month) {
      return month;
    }
    // Fallback to current month if no month param
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${monthNum}`;
  }, [month]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!charge) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.container, { backgroundColor: BluePalette.white }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('charges.fixed.details.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{t('charges.fixed.details.notFound')}</Text>
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  const categoryLabel = categoryLabels[charge.category];
  const changeAmount = charge.previousAmount
    ? charge.amount - charge.previousAmount
    : 0;
  const changePercentage = charge.trendPercentage || 0;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryLabel}
        </Text>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push({
            pathname: `/charges/fixed/edit/${id}` as any,
            params: { category: charge.category, month: monthKey },
          })}
        >
          <Feather name="edit-2" size={20} color={BluePalette.merge} />
        </Pressable>
      </View>

      {/* Week Selector - Only for personnel category, at the top */}
      {charge.category === 'personnel' && (
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
          <Text style={styles.totalLabel}>{t('charges.fixed.details.total')}</Text>
          <Text style={styles.totalAmount}>{formatAmount(charge.amount)}</Text>
          {charge.previousAmount && (
            <View style={styles.comparisonContainer}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>
                  {t('charges.fixed.details.previous')}:
                </Text>
                <Text style={styles.comparisonValue}>
                  {formatAmount(charge.previousAmount)}
                </Text>
              </View>
              <View
                style={[
                  styles.changeBadge,
                  changeAmount >= 0
                    ? styles.changeBadgeUp
                    : styles.changeBadgeDown,
                ]}
              >
                <Feather
                  name={changeAmount >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={
                    changeAmount >= 0 ? BluePalette.error : BluePalette.success
                  }
                />
                <Text
                  style={[
                    styles.changeText,
                    changeAmount >= 0
                      ? styles.changeTextUp
                      : styles.changeTextDown,
                  ]}
                >
                  {changeAmount >= 0 ? '+' : ''}
                  {formatAmount(changeAmount)} ({changePercentage > 0 ? '+' : ''}
                  {changePercentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Abnormal Increase Warning */}
        {charge.abnormalIncrease && (
          <View style={styles.warningCard}>
            <Feather name="alert-circle" size={20} color={BluePalette.error} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                {t('charges.fixed.details.abnormalIncrease')}
              </Text>
              <Text style={styles.warningText}>
                {t('charges.fixed.details.abnormalIncreaseDesc')}
              </Text>
            </View>
          </View>
        )}

        {/* Personnel Types - Special layout for personnel category */}
        {charge.category === 'personnel' && charge.personnelData && charge.personnelData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('charges.fixed.details.personnel')}
            </Text>
            {charge.personnelData.map((personnelType, index) => {
              const typeIcons: Record<string, string> = {
                server: 'user',
                barman: 'coffee',
                cleaner: 'droplet',
              };
              const typeIcon = typeIcons[personnelType.type] || 'users';
              
              return (
                <View key={index} style={styles.personnelTypeContainer}>
                  <View style={styles.personnelTypeHeader}>
                    <View style={styles.personnelTypeTitleContainer}>
                      <View style={styles.personnelTypeIconContainer}>
                        <Feather name={typeIcon as any} size={18} color={BluePalette.merge} />
                      </View>
                      <Text style={styles.personnelTypeTitle}>
                        {personnelType.type.charAt(0).toUpperCase() + personnelType.type.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.personnelTypeTotalBadge}>
                      <Text style={styles.personnelTypeTotal}>
                        {formatAmount(personnelType.totalAmount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.employeesContainer}>
                    {personnelType.employees.map((employee) => (
                      <View key={employee.id} style={styles.employeeCard}>
                        <View style={styles.employeeHeader}>
                          <View style={styles.employeeInfo}>
                            <Text style={styles.employeeName}>{employee.name}</Text>
                            {employee.position && (
                              <Text style={styles.employeePosition}>{employee.position}</Text>
                            )}
                          </View>
                          <View style={styles.employeeSalaryBadge}>
                            <Text style={styles.employeeSalary}>
                              {formatAmount(employee.salary)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.employeeDetails}>
                          {employee.hours && (
                            <View style={styles.employeeDetailItem}>
                              <View style={styles.employeeDetailIcon}>
                                <Feather name="clock" size={14} color={BluePalette.merge} />
                              </View>
                              <Text style={styles.employeeDetailText}>
                                {employee.hours}h/month
                              </Text>
                            </View>
                          )}
                          {employee.startDate && (
                            <View style={styles.employeeDetailItem}>
                              <View style={styles.employeeDetailIcon}>
                                <Feather name="calendar" size={14} color={BluePalette.merge} />
                              </View>
                              <Text style={styles.employeeDetailText}>
                                Since {new Date(employee.startDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
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

        {/* Breakdown - For non-personnel categories */}
        {charge.category !== 'personnel' && charge.breakdown && charge.breakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('charges.fixed.details.breakdown')}
            </Text>
            <View style={styles.breakdownContainer}>
              {charge.breakdown.map((item, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownAmount}>
                    {formatAmount(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {charge.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('charges.fixed.details.notes')}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: -1,
  },
  comparisonContainer: {
    gap: 8,
    marginTop: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  comparisonValue: {
    fontSize: 16,
    color: BluePalette.white,
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
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
    fontWeight: '600',
  },
  changeTextUp: {
    color: BluePalette.error,
  },
  changeTextDown: {
    color: BluePalette.success,
  },
  warningCard: {
    flexDirection: 'row',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  breakdownLabel: {
    fontSize: 15,
    color: BluePalette.textDark,
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: 16,
    color: BluePalette.textDark,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
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
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: BluePalette.primaryDark,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  personnelTypeContainer: {
    marginBottom: 24,
  },
  personnelTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BluePalette.merge,
  },
  personnelTypeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personnelTypeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BluePalette.backgroundNew,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personnelTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textDark,
    textTransform: 'capitalize',
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
    fontWeight: '700',
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
    shadowColor: '#000',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  employeeInfo: {
    flex: 1,
    gap: 4,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '700',
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
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: -0.2,
  },
  employeePosition: {
    fontSize: 14,
    color: BluePalette.textDark,
    opacity: 0.65,
    fontWeight: '500',
    marginTop: 2,
  },
  employeeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  employeeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeDetailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BluePalette.backgroundNew,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeDetailText: {
    fontSize: 13,
    color: BluePalette.textDark,
    opacity: 0.75,
    fontWeight: '500',
  },
});

