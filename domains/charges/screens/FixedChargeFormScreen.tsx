import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ChargesDateSelector from '../components/ChargesDateSelector';
import EmployeeManager from '../components/EmployeeManager';
import WeekSelector from '../components/WeekSelector';
import {
  convertCategoryFromFrontend,
  convertEmployeeTypeFromFrontend,
  convertFixedChargeDetailToFrontend,
  convertPeriodFromFrontend,
  createFixedCharge,
  formatAmountForDisplay,
  formatAmountInput,
  getFixedChargeById,
  getPersonnelChargeLastPeriod,
  parseAmountInput,
  setPersonnelChargeLastPeriod,
  updateFixedCharge,
} from '../services/chargesService';
import {
  ChargeCategory,
  ChargePeriod,
  FixedChargeCategory,
  PersonnelEmployeeUI
} from '../types/charge';
import { getMonthForWeek, validateWeekKey, validateWeekMonth } from '../utils/weekUtils';


const getFixedCategories = (t: (key: string) => string): Array<{ value: FixedChargeCategory; label: string; icon: string }> => [
  { value: 'personnel', label: t('charges.fixed.categories.personnel'), icon: 'users' },
  { value: 'water', label: t('charges.fixed.categories.water'), icon: 'droplet' },
  { value: 'electricity', label: t('charges.fixed.categories.electricity'), icon: 'zap' },
  { value: 'wifi', label: t('charges.fixed.categories.wifi'), icon: 'wifi' },
  { value: 'other', label: t('charges.fixed.categories.other'), icon: 'file-text' },
];

// Helper to get month key
const getMonthKey = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function FixedChargeFormScreen() {
  const { id, category: categoryParam, month: monthParam } = useLocalSearchParams<{
    id?: string;
    category?: string;
    month?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const isEditMode = !!id;
  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Determine initial category - use param if provided, otherwise default to personnel
  const initialCategory = useMemo(() => {
    if (categoryParam) {
      return categoryParam as FixedChargeCategory;
    }
    return 'personnel';
  }, [categoryParam]);

  const [formData, setFormData] = useState({
    category: initialCategory,
    name: '', // Custom name when category is 'other'
    amount: '',
    period: 'month' as 'week' | 'month',
    notes: '',
  });

  // Set selected month from params if provided, otherwise use current month
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam || getMonthKey(0)
  );
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();
  const [employees, setEmployees] = useState<PersonnelEmployeeUI[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPersonnel = formData.category === 'personnel';
  const isOther = formData.category === 'other';
  const isMonthlyUtility = ['water', 'electricity', 'wifi', 'other'].includes(formData.category);

  // Load user's last used period when creating a new personnel charge (synced per user on backend)
  useEffect(() => {
    if (!isEditMode && initialCategory === 'personnel') {
      getPersonnelChargeLastPeriod()
        .then((period) => {
          setFormData((prev) => ({ ...prev, period }));
        })
        .catch(() => {});
    }
  }, [isEditMode, initialCategory]);

  // Reset period to month when switching to utility category
  useEffect(() => {
    if (isMonthlyUtility && formData.period === 'week') {
      setFormData((prev) => ({ ...prev, period: 'month' }));
      setSelectedWeek(undefined);
    }
  }, [formData.category, isMonthlyUtility, formData.period]);

  // Auto-update amount when employees change (for personnel)
  useEffect(() => {
    if (isPersonnel && employees.length > 0) {
      const total = employees.reduce((sum, emp) => {
        if (formData.period === 'month') {
          // For month view, use monthSalary or calculate from weekSalaries
          if (emp.monthSalary !== undefined) {
            return sum + emp.monthSalary;
          }
          // Calculate from week salaries if available (only weeks belonging to this month)
          if (emp.weekSalaries) {
            const weekTotal = Object.entries(emp.weekSalaries).reduce((s, [weekKey, amount]) => {
              // Only count weeks that belong to the selected month
              if (selectedMonth) {
                const weekMonthKey = getMonthForWeek(weekKey);
                if (weekMonthKey === selectedMonth) {
                  return s + amount;
                }
              } else {
                // If no month selected, sum all weeks
                return s + amount;
              }
              return s;
            }, 0);
            return sum + weekTotal;
          }
          return sum + (emp.salary || 0);
        } else {
          // For week view, use salary for selected week or weekSalary
          if (selectedWeek && emp.weekSalaries && emp.weekSalaries[selectedWeek] !== undefined) {
            return sum + emp.weekSalaries[selectedWeek];
          }
          return sum + (emp.weekSalary || emp.salary || 0);
        }
      }, 0);
      setFormData((prev) => ({ ...prev, amount: formatAmountForDisplay(total) }));
    }
  }, [employees, isPersonnel, formData.period, selectedWeek]);

  // Load existing data if editing
  useEffect(() => {
    const loadCharge = async () => {
      if (!isEditMode || !id) return;

      try {
        const chargeId = parseInt(id, 10);
        if (isNaN(chargeId)) {
          Alert.alert(t('charges.common.error'), t('charges.common.invalidChargeId'));
          router.back();
          return;
        }

        const response = await getFixedChargeById(chargeId, selectedMonth);
        const frontendCharge = convertFixedChargeDetailToFrontend(response);

        const chargeCategory = frontendCharge.category;
        const chargeIsPersonnel = chargeCategory === 'personnel';

        setFormData({
          category: chargeCategory,
          name: frontendCharge.name ?? '',
          amount: formatAmountForDisplay(frontendCharge.amount),
          period: frontendCharge.period,
          notes: frontendCharge.notes || '',
        });

        setSelectedMonth(frontendCharge.monthKey || selectedMonth);
        if (frontendCharge.weekKey) {
          setSelectedWeek(frontendCharge.weekKey);
        }

        // Load employees if personnel
        if (chargeIsPersonnel && frontendCharge.personnelData) {
          // Flatten all employees from all personnel types
          const allEmployees: PersonnelEmployeeUI[] = frontendCharge.personnelData.flatMap(
            (typeData) => typeData.employees
          );

          // When loading employees, filter weekSalaries to only include weeks for the selected month
          // This ensures switching periods doesn't show data from other months
          const filteredEmployees = allEmployees.map((emp) => {
            if (emp.weekSalaries && selectedMonth) {
              const filteredWeekSalaries: Record<string, number> = {};
              for (const [weekKey, amount] of Object.entries(emp.weekSalaries)) {
                const weekMonthKey = getMonthForWeek(weekKey);
                if (weekMonthKey === selectedMonth) {
                  filteredWeekSalaries[weekKey] = amount;
                }
              }
              return {
                ...emp,
                weekSalaries: Object.keys(filteredWeekSalaries).length > 0 ? filteredWeekSalaries : undefined,
              };
            }
            return emp;
          });

          setEmployees(filteredEmployees);
        } else {
          setEmployees([]);
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load charge data';
        Alert.alert(t('charges.common.error'), errorMessage || t('charges.common.loadFailed'));
        console.error('Error loading charge:', err);
        router.back();
      }
    };

    loadCharge();
    // In edit mode, only load once (when id is set). Do not refetch when selectedMonth
    // changes so the month selector stays on the charge's month and we edit exactly that one.
  }, [id, isEditMode, router, t]);

  const updateField = (field: string, value: string | 'week' | 'month') => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handle changing period between month and week for personnel charges.
   * Keeps the same employee list but clears period-specific salary data so the user
   * can re-enter salaries for the new period. Shows confirmation for better UX.
   */
  const handlePeriodChange = (nextPeriod: 'week' | 'month') => {
    if (!isPersonnel) {
      updateField('period', nextPeriod);
      return;
    }

    if (formData.period === nextPeriod) {
      return;
    }

    const applyPeriodChange = () => {
      updateField('period', nextPeriod);

      // Keep employees; clear only salary data so user can re-enter for the new period
      const employeesWithClearedSalaries: PersonnelEmployeeUI[] = employees.map((emp) => ({
        ...emp,
        monthSalary: undefined,
        weekSalary: undefined,
        salary: undefined,
        weekSalaries: undefined,
      }));
      setEmployees(employeesWithClearedSalaries);
      setFormData((prev) => ({ ...prev, amount: '' }));

      if (nextPeriod === 'month') {
        setSelectedWeek(undefined);
      }
    };

    Alert.alert(
      t('charges.fixed.form.changePeriodTitle'),
      t('charges.fixed.form.changePeriodMessage'),
      [
        { text: t('charges.fixed.form.cancel'), style: 'cancel' },
        {
          text: t('charges.fixed.form.continue'),
          onPress: applyPeriodChange,
        },
      ]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isPersonnel && employees.length === 0) {
      newErrors.employees = t('charges.common.employeesRequired');
    }

    // Check if all employees have salary set
    if (isPersonnel && employees.length > 0) {
      const employeesWithoutSalary = employees.filter(emp => {
        // Check if employee has any salary set (monthSalary, weekSalary, salary, or weekSalaries)
        if (formData.period === 'month') {
          return emp.monthSalary === undefined &&
            (!emp.weekSalaries || Object.keys(emp.weekSalaries).length === 0) &&
            emp.salary === undefined;
        } else {
          return (selectedWeek && emp.weekSalaries && emp.weekSalaries[selectedWeek] === undefined) &&
            emp.weekSalary === undefined &&
            emp.salary === undefined;
        }
      });
      if (employeesWithoutSalary.length > 0) {
        newErrors.employees = t('charges.common.salaryRequired');
      }
    }

    // Name required when category is 'other'
    if (isOther && !formData.name.trim()) {
      newErrors.name = t('charges.fixed.form.nameRequired');
    }

    // Amount is only required for non-personnel charges
    // For personnel charges, amount is calculated automatically from employees
    if (!isPersonnel) {
      if (!formData.amount.trim()) {
        newErrors.amount = t('charges.common.amountRequired');
      } else {
        const amountNum = parseAmountInput(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          newErrors.amount = t('charges.common.amountInvalid');
        }
      }
    }

    if (!selectedMonth) {
      newErrors.month = t('charges.common.monthRequired');
    }

    if (isPersonnel && formData.period === 'week' && !selectedWeek) {
      newErrors.week = t('charges.common.weekRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isPersonnel) {
        // Validate week key if creating/updating weekly charge
        if (formData.period === 'week' && selectedWeek) {
          if (!validateWeekKey(selectedWeek)) {
            Alert.alert(t('charges.common.error'), t('charges.common.weekInvalid'));
            setIsSubmitting(false);
            return;
          }
          if (!validateWeekMonth(selectedWeek, selectedMonth)) {
            Alert.alert(t('charges.common.error'), t('charges.common.weekMonthMismatch'));
            setIsSubmitting(false);
            return;
          }
        }

        // Convert employees to backend format
        // Include weekSalaries for updates so backend can update specific weeks
        const employeeRequests = employees.map((emp) => {
          const baseRequest: any = {
            // Only send id if it's a valid Employee ID (from getAvailableEmployees)
            // Don't send id if it's a PersonnelEmployee ID (from charge detail) - backend will match by name/type/position/startDate
            id: emp.employeeId !== undefined ? emp.employeeId : undefined,
            name: emp.name,
            type: convertEmployeeTypeFromFrontend(emp.type!),
            position: emp.position,
            startDate: emp.startDate,
            hours: emp.hours,
          };

          // For monthly charges, send salary to redistribute or weekSalaries to update specific weeks
          if (formData.period === 'month') {
            if (emp.salary !== undefined) {
              baseRequest.salary = parseAmountInput(emp.salary.toString());
            }
            // Include weekSalaries if they exist (allows updating specific weeks)
            // Only include weekSalaries for the selected month
            if (emp.weekSalaries && Object.keys(emp.weekSalaries).length > 0 && selectedMonth) {
              const monthWeekSalaries: Record<string, number> = {};
              for (const [weekKey, amount] of Object.entries(emp.weekSalaries)) {
                const weekMonthKey = getMonthForWeek(weekKey);
                if (weekMonthKey === selectedMonth) {
                  monthWeekSalaries[weekKey] = amount;
                }
              }
              if (Object.keys(monthWeekSalaries).length > 0) {
                baseRequest.weekSalaries = monthWeekSalaries;
              }
            }
          } else {
            // For weekly charges, send only the selected week's salary
            // Don't send weekSalaries map - backend will handle it based on weekKey
            if (selectedWeek && emp.weekSalaries && emp.weekSalaries[selectedWeek] !== undefined) {
              baseRequest.salary = parseAmountInput(emp.weekSalaries[selectedWeek].toString());
            } else {
              baseRequest.salary = parseAmountInput(String(emp.weekSalary || emp.salary || 0));
            }
          }

          return baseRequest;
        });

        if (isEditMode && id) {
          // Update existing charge
          const updateRequest = {
            period: convertPeriodFromFrontend(formData.period) as ChargePeriod,
            monthKey: selectedMonth,
            weekKey: formData.period === 'week' ? selectedWeek || undefined : undefined,
            notes: formData.notes.trim() || undefined,
            employees: employeeRequests,
          };

          await updateFixedCharge(parseInt(id, 10), updateRequest);
        } else {
          // Create new charge
          const createRequest = {
            category: convertCategoryFromFrontend(formData.category) as ChargeCategory,
            period: convertPeriodFromFrontend(formData.period) as ChargePeriod,
            monthKey: selectedMonth,
            weekKey: formData.period === 'week' ? (selectedWeek || null) : null,
            notes: formData.notes.trim() || undefined,
            employees: employeeRequests,
          };

          await createFixedCharge(createRequest);
        }
      } else {
        // Utility or other charge (water, electricity, wifi, other)
        if (isEditMode && id) {
          const updateRequest: any = {
            amount: parseAmountInput(formData.amount),
            notes: formData.notes.trim() || undefined,
          };
          if (isOther && formData.name.trim()) {
            updateRequest.name = formData.name.trim();
          }
          await updateFixedCharge(parseInt(id, 10), updateRequest);
        } else {
          const createRequest: any = {
            category: convertCategoryFromFrontend(formData.category) as ChargeCategory,
            period: ChargePeriod.MONTH,
            monthKey: selectedMonth,
            weekKey: null as string | null,
            amount: parseAmountInput(formData.amount),
            notes: formData.notes.trim() || undefined,
          };
          if (isOther && formData.name.trim()) {
            createRequest.name = formData.name.trim();
          }
          await createFixedCharge(createRequest);
        }
      }

      // Save period for next time (personnel only, per user on backend)
      if (isPersonnel) {
        setPersonnelChargeLastPeriod(formData.period).catch(() => {});
      }

      // Show success message
      Alert.alert(
        t('charges.common.success'),
        isEditMode ? t('charges.common.successUpdated') : t('charges.common.successSaved'),
        [
          {
            text: t('charges.common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      // Extract detailed error message from backend
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('charges.common.saveFailed');

      // Log full error for debugging
      console.error('Error saving charge:', err);
      console.error('Error response data:', err?.response?.data);

      Alert.alert(t('charges.common.error'), errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.white }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditMode ? t('charges.fixed.form.titleEdit') : t('charges.fixed.form.titleNew')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomBarTotalHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selector (Hide if category provided in params or in edit mode) */}
          {!isEditMode && !categoryParam && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('charges.fixed.form.category')} *</Text>
              <View style={styles.categoryGrid}>
                {getFixedCategories(t).map((cat) => (
                  <Pressable
                    key={cat.value}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      formData.category === cat.value && styles.categoryCardActive,
                      pressed && styles.categoryCardPressed,
                    ]}
                    onPress={() => updateField('category', cat.value)}
                  >
                    <View
                      style={[
                        styles.categoryIconContainer,
                        formData.category === cat.value && styles.categoryIconContainerActive,
                      ]}
                    >
                      <Feather
                        name={cat.icon as any}
                        size={24}
                        color={
                          formData.category === cat.value
                            ? BluePalette.white
                            : BluePalette.merge
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        formData.category === cat.value && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Charge name (required when category is Other) */}
          {isOther && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('charges.fixed.form.chargeName')} *</Text>
              <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder={t('charges.fixed.form.placeholderChargeName')}
                  placeholderTextColor="rgba(10, 31, 58, 0.5)"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  maxLength={255}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          )}

          {/* Period Selector (Only for Personnel) */}
          {isPersonnel && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('charges.fixed.form.period')} *</Text>
              <View style={styles.periodContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.periodButton,
                    formData.period === 'month' && styles.periodButtonActive,
                    pressed && styles.periodButtonPressed,
                  ]}
                  onPress={() => handlePeriodChange('month')}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      formData.period === 'month' && styles.periodButtonTextActive,
                    ]}
                  >
                    {t('charges.fixed.form.periodMonth')}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.periodButton,
                    formData.period === 'week' && styles.periodButtonActive,
                    pressed && styles.periodButtonPressed,
                  ]}
                  onPress={() => handlePeriodChange('week')}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      formData.period === 'week' && styles.periodButtonTextActive,
                    ]}
                  >
                    {t('charges.fixed.form.periodWeek')}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Month Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('charges.fixed.form.month')} *</Text>
            <View style={[styles.dateSelectorContainer, errors.month && styles.inputError]}>
              <ChargesDateSelector
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
                disabled={isEditMode}
              />
            </View>
            {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}
          </View>

          {/* Week Selector (Only for Personnel with Week Period) */}
          {isPersonnel && formData.period === 'week' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('charges.fixed.form.week')} *</Text>
              <View style={[styles.weekSelectorContainer, errors.week && styles.inputError]}>
                <WeekSelector
                  monthKey={selectedMonth}
                  selectedWeek={selectedWeek}
                  onWeekSelect={setSelectedWeek}
                />
              </View>
              {errors.week && <Text style={styles.errorText}>{errors.week}</Text>}
            </View>
          )}

          {/* Employee Manager (Only for Personnel) */}
          {isPersonnel && (
            <View style={styles.inputGroup}>
              <EmployeeManager
                employees={employees}
                onEmployeesChange={setEmployees}
                period={formData.period}
                selectedMonth={selectedMonth}
                selectedWeek={selectedWeek}
                autoLoadEmployees={!isEditMode && employees.length === 0}
              />
              {/* Auto-calculate amount from employees */}
              {employees.length > 0 && (
                <View style={styles.autoAmountContainer}>
                  <Text style={styles.autoAmountText}>
                    {t('charges.fixed.form.totalFromEmployees')} ({formData.period}): {formatAmountForDisplay(employees.reduce((sum, emp) => {
                      if (formData.period === 'month') {
                        if (emp.monthSalary !== undefined) {
                          return sum + emp.monthSalary;
                        }
                        if (emp.weekSalaries) {
                          // Calculate from week salaries (only weeks belonging to this month)
                          const weekTotal = Object.entries(emp.weekSalaries).reduce((s, [weekKey, amount]) => {
                            if (selectedMonth) {
                              const weekMonthKey = getMonthForWeek(weekKey);
                              if (weekMonthKey === selectedMonth) {
                                return s + amount;
                              }
                            } else {
                              return s + amount;
                            }
                            return s;
                          }, 0);
                          return sum + weekTotal;
                        }
                        return sum + (emp.salary || 0);
                      } else {
                        if (selectedWeek && emp.weekSalaries && emp.weekSalaries[selectedWeek] !== undefined) {
                          return sum + emp.weekSalaries[selectedWeek];
                        }
                        return sum + (emp.weekSalary || emp.salary || 0);
                      }
                    }, 0))}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Amount Input - Only show for non-personnel charges */}
          {!isPersonnel && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('charges.fixed.form.amount')} *</Text>
              <View style={[styles.inputWrapper, errors.amount && styles.inputError]}>
                <Text style={styles.amountCurrencyLabel}>MAD</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('charges.fixed.form.placeholderAmount')}
                  placeholderTextColor="rgba(10, 31, 58, 0.5)"
                  value={formData.amount}
                  onChangeText={(value) => updateField('amount', formatAmountInput(value))}
                  keyboardType="decimal-pad"
                />
              </View>
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            </View>
          )}

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('charges.fixed.form.notesOptional')}</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder={t('charges.fixed.form.placeholderNotes')}
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              (isSubmitting || Object.keys(errors).length > 0) && styles.submitButtonDisabled,
              pressed && styles.submitButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={BluePalette.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? t('charges.fixed.form.buttonUpdate') : t('charges.fixed.form.buttonCreate')}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textDark,
    marginLeft: 4,
  },
  dateSelectorContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  weekSelectorContainer: {
    backgroundColor: BluePalette.backgroundNew,
    paddingTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textDark,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BluePalette.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 31, 58, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 52,
  },
  inputError: {
    borderColor: BluePalette.error,
    backgroundColor: `${BluePalette.error}15`,
  },
  inputIcon: {
    marginRight: 12,
  },
  amountCurrencyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textDark,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: BluePalette.textDark,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: BluePalette.error,
    marginLeft: 4,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: BluePalette.textDark,
    marginLeft: 4,
    marginTop: 4,
  },
  autoAmountContainer: {
    backgroundColor: `${BluePalette.merge}15`,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  autoAmountText: {
    fontSize: 13,
    color: BluePalette.merge,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    gap: 8,
  },
  categoryCardActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
  },
  categoryCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BluePalette.merge}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconContainerActive: {
    backgroundColor: BluePalette.merge,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  categoryLabelActive: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  periodButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  periodButtonTextActive: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
  textAreaWrapper: {
    backgroundColor: BluePalette.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 31, 58, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    color: BluePalette.textDark,
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: BluePalette.merge,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: -0.3,
  },
});
