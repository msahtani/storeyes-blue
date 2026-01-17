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
import { FixedCharge, FixedChargeCategory, PersonnelEmployee, PersonnelTypeData } from '../types/charge';

// Mock data - replace with actual data fetching
const mockFixedCharges: Record<string, FixedCharge> = {
  '1': {
    id: '1',
    category: 'personnel',
    amount: 4500,
    period: 'month',
    trend: 'up',
    trendPercentage: 5.2,
    abnormalIncrease: false,
  },
};

// Mock detail data for loading employees when editing
const mockFixedChargeDetailsForForm: Record<string, { personnelData?: PersonnelTypeData[] }> = {
  '1': {
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
  },
  '13': {
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
  },
};

const fixedCategories: Array<{ value: FixedChargeCategory; label: string; icon: string }> = [
  { value: 'personnel', label: 'Personnel', icon: 'users' },
  { value: 'water', label: 'Water', icon: 'droplet' },
  { value: 'electricity', label: 'Electricity', icon: 'zap' },
  { value: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
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

  // Determine initial category - use param if provided, or load from charge if editing, otherwise default to personnel
  const initialCategory = useMemo(() => {
    if (categoryParam) {
      return categoryParam as FixedChargeCategory;
    }
    if (isEditMode && id) {
      // Load category from existing charge
      const existingCharge = mockFixedCharges[id];
      if (existingCharge) {
        return existingCharge.category;
      }
    }
    return 'personnel';
  }, [categoryParam, isEditMode, id]);
  
  const [formData, setFormData] = useState({
    category: initialCategory,
    amount: '',
    period: 'month' as 'week' | 'month',
    notes: '',
  });
  
  // Set selected month from params if provided, otherwise use current month
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam || getMonthKey(0)
  );
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();
  const [employees, setEmployees] = useState<PersonnelEmployee[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPersonnel = formData.category === 'personnel';
  const isMonthlyUtility = ['water', 'electricity', 'wifi'].includes(formData.category);

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
      const total = employees.reduce((sum, emp) => sum + emp.salary, 0);
      setFormData((prev) => ({ ...prev, amount: total.toFixed(2) }));
    }
  }, [employees, isPersonnel]);

  // Load existing data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const existingCharge = mockFixedCharges[id];
      if (existingCharge) {
        const chargeCategory = existingCharge.category;
        const chargeIsPersonnel = chargeCategory === 'personnel';
        
        setFormData({
          category: chargeCategory,
          amount: existingCharge.amount.toString(),
          period: existingCharge.period,
          notes: '',
        });
        // Set month/week based on period
        if (existingCharge.period === 'week' && chargeIsPersonnel) {
          // In real app, extract week from charge data
          setSelectedWeek(undefined);
        }
        // Load employees if personnel (in real app, fetch from API)
        if (chargeIsPersonnel) {
          const detailData = mockFixedChargeDetailsForForm[id];
          if (detailData?.personnelData) {
            // Flatten all employees from all personnel types
            const allEmployees = detailData.personnelData.flatMap((typeData) => typeData.employees);
            setEmployees(allEmployees);
          } else {
            setEmployees([]);
          }
        } else {
          // Clear employees if not personnel
          setEmployees([]);
        }
      }
    }
  }, [id, isEditMode]);

  const updateField = (field: string, value: string | 'week' | 'month') => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isPersonnel && employees.length === 0) {
      newErrors.employees = 'At least one employee is required for personnel charges';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!selectedMonth) {
      newErrors.month = 'Month is required';
    }

    if (isPersonnel && formData.period === 'week' && !selectedWeek) {
      newErrors.week = 'Week is required for weekly personnel charges';
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production, call API here
      const chargeData = {
        id: isEditMode ? id : Date.now().toString(),
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: isPersonnel ? formData.period : 'month', // Utilities are always monthly
        monthKey: selectedMonth,
        weekKey: isPersonnel && formData.period === 'week' ? selectedWeek : undefined,
        notes: formData.notes.trim() || undefined,
        employees: isPersonnel ? employees : undefined,
      };

      console.log(isEditMode ? 'Updating charge:' : 'Creating charge:', chargeData);

      // Show success message
      Alert.alert(
        'Success',
        isEditMode ? 'Charge updated successfully' : 'Charge created successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save charge. Please try again.');
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
          {isEditMode ? 'Edit Fixed Charge' : 'New Fixed Charge'}
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
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryGrid}>
              {fixedCategories.map((cat) => (
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

          {/* Period Selector (Only for Personnel) */}
          {isPersonnel && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Period *</Text>
              <View style={styles.periodContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.periodButton,
                    formData.period === 'month' && styles.periodButtonActive,
                    pressed && styles.periodButtonPressed,
                  ]}
                  onPress={() => updateField('period', 'month')}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      formData.period === 'month' && styles.periodButtonTextActive,
                    ]}
                  >
                    Month
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.periodButton,
                    formData.period === 'week' && styles.periodButtonActive,
                    pressed && styles.periodButtonPressed,
                  ]}
                  onPress={() => updateField('period', 'week')}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      formData.period === 'week' && styles.periodButtonTextActive,
                    ]}
                  >
                    Week
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Month Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Month *</Text>
            <View style={[styles.dateSelectorContainer, errors.month && styles.inputError]}>
              <ChargesDateSelector
                selectedMonth={selectedMonth}
                onMonthSelect={setSelectedMonth}
              />
            </View>
            {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}
          </View>

          {/* Week Selector (Only for Personnel with Week Period) */}
          {isPersonnel && formData.period === 'week' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Week *</Text>
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
              />
              {/* Auto-calculate amount from employees */}
              {employees.length > 0 && (
                <View style={styles.autoAmountContainer}>
                  <Text style={styles.autoAmountText}>
                    Total calculated from employees: {employees.reduce((sum, emp) => sum + emp.salary, 0).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <View style={[styles.inputWrapper, errors.amount && styles.inputError]}>
              <Feather
                name="dollar-sign"
                size={18}
                color={errors.amount ? BluePalette.error : BluePalette.textDark}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={isPersonnel && employees.length > 0 
                  ? employees.reduce((sum, emp) => sum + emp.salary, 0).toFixed(2)
                  : "0.00"}
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                value={formData.amount}
                onChangeText={(value) => updateField('amount', value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                editable={!isPersonnel || employees.length === 0}
              />
            </View>
            {isPersonnel && employees.length > 0 && (
              <Text style={styles.helperText}>
                Amount is calculated from employees. Edit employees to change the total.
              </Text>
            )}
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Add any additional notes..."
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
                {isEditMode ? 'Update Charge' : 'Create Charge'}
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
    color: BluePalette.textTertiary,
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
