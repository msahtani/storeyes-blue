import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  convertEmployeeTypeToFrontend,
  getAvailableEmployees,
} from '../services/chargesService';
import { PersonnelEmployeeUI, PersonnelType } from '../types/charge';
import {
  getMonthForWeek,
  getMonthKey,
  getSundayOfWeek,
  getWeeksForMonth,
  parseWeekKey,
  validateWeekKey,
  validateWeekMonth,
} from '../utils/weekUtils';

interface EmployeeManagerProps {
  employees: PersonnelEmployeeUI[];
  onEmployeesChange: (employees: PersonnelEmployeeUI[]) => void;
  period?: 'week' | 'month'; // Current period selection
  selectedMonth?: string; // For calculating days left
  selectedWeek?: string; // For week calculations
  autoLoadEmployees?: boolean; // Auto-load all available employees on mount
}

export default function EmployeeManager({
  employees,
  onEmployeesChange,
  period = 'month',
  selectedMonth,
  selectedWeek,
  autoLoadEmployees = false,
}: EmployeeManagerProps) {
  const [editingEmployee, setEditingEmployee] = useState<PersonnelEmployeeUI | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showExistingEmployeesModal, setShowExistingEmployeesModal] = useState(false);
  const [positionFilter, setPositionFilter] = useState<PersonnelType | 'all'>('all');
  const [availableEmployees, setAvailableEmployees] = useState<PersonnelEmployeeUI[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch available employees from API
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const employees = await getAvailableEmployees();

        // Convert backend format to frontend format
        // These are Employee IDs from the employees table (valid for reuse)
        const frontendEmployees: PersonnelEmployeeUI[] = employees.map((emp) => ({
          id: emp.id.toString(),
          name: emp.name,
          type: convertEmployeeTypeToFrontend(emp.type),
          position: emp.position,
          startDate: emp.startDate,
          employeeId: emp.id, // Store Employee ID for use when creating/updating charges
        }));

        setAvailableEmployees(frontendEmployees);
      } catch (err: any) {
        console.error('Error fetching available employees:', err);
        // Set empty array on error - component will still work without existing employees
        setAvailableEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchAvailableEmployees();
  }, []);

  // Auto-load all employees when autoLoadEmployees is true and employees list is empty
  useEffect(() => {
    if (autoLoadEmployees && availableEmployees.length > 0 && employees.length === 0) {
      // Add all employees without salary (user can set salary later)
      const employeesToAdd: PersonnelEmployeeUI[] = availableEmployees.map((emp) => ({
        ...emp,
        salary: undefined,
        employeeId: emp.id ? parseInt(emp.id, 10) : undefined,
      }));
      onEmployeesChange(employeesToAdd);
    }
  }, [autoLoadEmployees, availableEmployees, employees.length, onEmployeesChange]);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    salary: '',
    position: '',
    startDate: '',
    type: 'server' as PersonnelType,
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter employees by position
  const filteredEmployees = useMemo(() => {
    if (positionFilter === 'all') return employees;
    return employees.filter(emp => emp.type === positionFilter);
  }, [employees, positionFilter]);

  // Get employees without salary
  const employeesWithoutSalary = useMemo(() => {
    return employees.filter(emp => !emp.salary && emp.salary !== 0);
  }, [employees]);

  // Get weeks that belong to the selected month using Monday-Sunday structure
  // IMPORTANT: Only weeks where Monday is in the month are returned
  const getWeeksForSelectedMonth = () => {
    if (!selectedMonth) return [];
    return getWeeksForMonth(selectedMonth);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({
      name: '',
      salary: '',
      position: '',
      startDate: '',
      type: 'server',
    });
    setShowEmployeeModal(true);
  };

  const handleAddExistingEmployee = () => {
    setShowExistingEmployeesModal(true);
  };

  const handleSelectExistingEmployee = (employee: PersonnelEmployeeUI) => {
    // Check if employee already exists by comparing both id and employeeId
    if (employees.some(emp =>
      emp.id === employee.id ||
      (emp.employeeId && employee.employeeId && emp.employeeId === employee.employeeId)
    )) {
      Alert.alert('Error', 'This employee is already added');
      return;
    }

    // Add employee without salary (can be set later)
    // Mark with employeeId to indicate this is a valid Employee ID from getAvailableEmployees
    const newEmployee: PersonnelEmployeeUI = {
      ...employee,
      salary: undefined,
      employeeId: employee.id ? parseInt(employee.id, 10) : undefined, // Store Employee ID separately
    };
    onEmployeesChange([...employees, newEmployee]);
    setShowExistingEmployeesModal(false);
  };

  const handleEditEmployee = (employee: PersonnelEmployeeUI) => {
    setEditingEmployee(employee);

    // Determine initial salary value based on current period and selection
    let initialSalary = '';

    if (period === 'week') {
      // In week period, only show salary for the selected week
      // If selectedWeek exists and has a value, show it; otherwise show empty (new week)
      if (selectedWeek && employee.weekSalaries && employee.weekSalaries[selectedWeek] !== undefined) {
        initialSalary = employee.weekSalaries[selectedWeek].toString();
      }
      // If no value for selected week, leave empty (user will fill it)
    } else if (period === 'month') {
      // In month period, edit the total monthly salary
      if (employee.monthSalary !== undefined) {
        initialSalary = employee.monthSalary.toString();
      } else if (employee.salary !== undefined) {
        initialSalary = employee.salary.toString();
      }
    }

    setEmployeeForm({
      name: employee.name,
      salary: initialSalary,
      position: employee.position || '',
      startDate: employee.startDate || '',
      type: employee.type || 'server',
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onEmployeesChange(employees.filter((emp) => emp.id !== employeeId));
          },
        },
      ]
    );
  };

  const handlePayEmployees = () => {
    // Open modal to set salary for employees without salary
    if (employeesWithoutSalary.length > 0) {
      setShowEmployeeModal(true);
      setEditingEmployee(null);
      setEmployeeForm({
        name: '',
        salary: '',
        position: '',
        startDate: '',
        type: 'server',
      });
    }
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    // Get existing employee data to preserve week-specific salaries (needed for both salary and non-salary updates)
    const existingEmployee = editingEmployee ? employees.find(emp => emp.id === editingEmployee.id) : null;
    const existingWeekSalaries = existingEmployee?.weekSalaries || {};

    // Salary is optional now
    let salary: number | undefined;
    let salaryByPeriod: 'week' | 'month' | undefined;
    let weekSalary: number | undefined;
    let monthSalary: number | undefined;
    let weekSalaries: Record<string, number> | undefined;

    if (employeeForm.salary.trim()) {
      const salaryValue = parseFloat(employeeForm.salary);
      if (isNaN(salaryValue) || salaryValue <= 0) {
        Alert.alert('Error', 'Salary must be a positive number');
        return;
      }

      // Calculate based on period
      if (period === 'month') {
        // Monthly salary - distribute across weeks using Monday-Sunday structure
        // IMPORTANT: Weeks belong to the month where their Monday falls
        // Even if a week extends into the next month, it's fully attributed to the month of its Monday
        if (!selectedMonth) {
          Alert.alert('Error', 'Please select a month first');
          return;
        }

        const weeks = getWeeksForSelectedMonth();

        // Filter weeks that belong to this month (where Monday is in this month)
        const weeksInMonth = weeks.filter(week => {
          const weekMonthKey = getMonthKey(week.startDate);
          return weekMonthKey === selectedMonth;
        });

        if (weeksInMonth.length === 0) {
          Alert.alert('Error', 'No weeks found for selected month');
          return;
        }

        // Distribute monthly salary equally across all weeks that belong to this month
        // Each week gets equal amount since all weeks are full weeks (7 days each)
        const salaryPerWeek = salaryValue / weeksInMonth.length;

        weekSalaries = {};
        for (const week of weeksInMonth) {
          // Each week gets equal portion since all weeks belong entirely to this month
          weekSalaries[week.weekKey] = salaryPerWeek;
        }

        // Calculate total from week salaries to handle rounding
        const calculatedTotal = Object.values(weekSalaries).reduce((sum, val) => sum + val, 0);
        const difference = salaryValue - calculatedTotal;

        // Adjust first week to account for rounding differences
        if (weeksInMonth.length > 0 && Math.abs(difference) > 0.01) {
          const firstWeekKey = weeksInMonth[0].weekKey;
          weekSalaries[firstWeekKey] = (weekSalaries[firstWeekKey] || 0) + difference;
        }

        monthSalary = salaryValue;
        // For display, show average weekly salary
        weekSalary = weeksInMonth.length > 0 ? salaryValue / weeksInMonth.length : 0;
        salary = salaryValue;
        salaryByPeriod = 'month';
      } else {
        // Weekly salary - only apply to selected week
        if (!selectedWeek) {
          Alert.alert('Error', 'Please select a week first');
          return;
        }

        // Validate that selectedWeek is a valid week key (Monday date)
        if (!validateWeekKey(selectedWeek)) {
          Alert.alert('Error', 'Invalid week selected. Week key must be a Monday date.');
          return;
        }

        // Validate that the week belongs to the selected month
        if (selectedMonth && !validateWeekMonth(selectedWeek, selectedMonth)) {
          Alert.alert('Error', 'Selected week does not belong to the selected month.');
          return;
        }

        // Set salary only for the selected week
        // IMPORTANT: When in weekly period, only keep weekSalaries for the selected month
        // Clear any weekSalaries from other months to avoid mixing data
        weekSalaries = {};
        if (selectedMonth) {
          // Only preserve weekSalaries that belong to the selected month
          for (const [weekKey, amount] of Object.entries(existingWeekSalaries)) {
            const weekMonthKey = getMonthForWeek(weekKey);
            if (weekMonthKey === selectedMonth) {
              weekSalaries[weekKey] = amount;
            }
          }
        }
        // Set salary for the selected week
        weekSalaries[selectedWeek] = salaryValue;

        // Calculate month total from all week salaries for the selected month
        // Only count weeks that belong to this month (where Monday is in this month)
        let totalWeekSalaries = 0;
        if (selectedMonth) {
          // Filter week salaries that belong to this month
          for (const [weekKey, amount] of Object.entries(weekSalaries)) {
            const weekMonthKey = getMonthForWeek(weekKey);
            if (weekMonthKey === selectedMonth) {
              totalWeekSalaries += amount;
            }
          }
        } else {
          // If no month selected, sum all week salaries
          totalWeekSalaries = Object.values(weekSalaries).reduce((sum, val) => sum + val, 0);
        }

        monthSalary = totalWeekSalaries;
        weekSalary = salaryValue; // For display, show current week salary
        salary = salaryValue;
        salaryByPeriod = 'week';
      }
    }

    const employeeData: PersonnelEmployeeUI = {
      id: editingEmployee?.id || Date.now().toString(),
      name: employeeForm.name.trim(),
      salary,
      position: employeeForm.position.trim() || undefined,
      startDate: employeeForm.startDate.trim() || undefined,
      type: employeeForm.type,
      salaryByPeriod,
      weekSalary,
      monthSalary,
      weekSalaries,
      employeeId: editingEmployee?.employeeId, // Preserve Employee ID for reuse when saving
      // daysLeftSalary is deprecated - now handled by weekSalaries
    };

    if (editingEmployee) {
      // Update existing employee - preserve week salaries if not setting new ones
      const updatedEmployee = {
        ...employeeData,
        weekSalaries: weekSalaries || existingWeekSalaries,
      };
      onEmployeesChange(
        employees.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp))
      );
    } else {
      // Add new employee
      onEmployeesChange([...employees, employeeData]);
    }

    setShowEmployeeModal(false);
    setEditingEmployee(null);
  };

  const totalAmount = employees.reduce((sum, emp) => {
    if (period === 'month') {
      // For month view, use monthSalary or calculate from weekSalaries for the selected month
      if (emp.monthSalary !== undefined) {
        return sum + emp.monthSalary;
      }
      // Calculate from week salaries if available (only for weeks that belong to selected month)
      if (emp.weekSalaries && selectedMonth) {
        // Filter week salaries that belong to this month (where Monday is in this month)
        const monthTotal = Object.entries(emp.weekSalaries).reduce((s, [weekKey, amount]) => {
          const weekMonthKey = getMonthForWeek(weekKey);
          if (weekMonthKey === selectedMonth) {
            return s + amount;
          }
          return s;
        }, 0);
        return sum + monthTotal;
      }
      // Fallback: sum all week salaries
      if (emp.weekSalaries) {
        const weekTotal = Object.values(emp.weekSalaries).reduce((s, v) => s + v, 0);
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

  const positionOptions: Array<{ value: PersonnelType | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'server', label: 'Server' },
    { value: 'barman', label: 'Barman' },
    { value: 'cleaner', label: 'Cleaner' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Employees</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.addExistingButton} onPress={handleAddExistingEmployee}>
            <Feather name="user-plus" size={16} color={BluePalette.merge} />
            <Text style={styles.addExistingButtonText}>Add Existing</Text>
          </Pressable>
          <Pressable style={styles.addButton} onPress={handleAddEmployee}>
            <Feather name="plus" size={18} color={BluePalette.white} />
            <Text style={styles.addButtonText}>New</Text>
          </Pressable>
        </View>
      </View>

      {/* Position Filter */}
      {employees.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {positionOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.filterChip,
                  positionFilter === option.value && styles.filterChipActive,
                ]}
                onPress={() => setPositionFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    positionFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Pay Button for employees without salary */}
      {employeesWithoutSalary.length > 0 && (
        <Pressable style={styles.payButton} onPress={handlePayEmployees}>
          <Feather name="dollar-sign" size={18} color={BluePalette.white} />
          <Text style={styles.payButtonText}>
            Set Salary for {employeesWithoutSalary.length} Employee{employeesWithoutSalary.length > 1 ? 's' : ''}
          </Text>
        </Pressable>
      )}

      {filteredEmployees.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="users" size={32} color={BluePalette.textDark} />
          <Text style={styles.emptyText}>
            {positionFilter !== 'all' ? `No ${positionFilter} employees` : 'No employees added yet'}
          </Text>
          <Text style={styles.emptySubtext}>Add employees to calculate total amount</Text>
        </View>
      ) : (
        <View style={styles.employeesList}>
          {filteredEmployees.map((employee) => (
            <View key={employee.id} style={styles.employeeCard}>
              <View style={styles.employeeInfo}>
                <View style={styles.employeeHeaderRow}>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  {employee.type && (
                    <View style={[
                      styles.typeBadge,
                      employee.type === 'server' && styles.typeBadgeServer,
                      employee.type === 'barman' && styles.typeBadgeBarman,
                      employee.type === 'cleaner' && styles.typeBadgeCleaner,
                    ]}>
                      <Text style={styles.typeBadgeText}>{employee.type}</Text>
                    </View>
                  )}
                </View>
                {employee.position && (
                  <Text style={styles.employeePosition}>{employee.position}</Text>
                )}
                <View style={styles.employeeDetails}>
                  {(() => {
                    // Determine what salary to display
                    let displaySalary: number | undefined;
                    let displayLabel = '';

                    if (period === 'month') {
                      // Month view: show monthly salary or calculate from weeks
                      if (employee.monthSalary !== undefined) {
                        displaySalary = employee.monthSalary;
                        displayLabel = '/month';
                      } else if (employee.weekSalaries) {
                        // Calculate total from week salaries for this month
                        const weekTotal = Object.entries(employee.weekSalaries).reduce((s, [weekKey, amount]) => {
                          if (selectedMonth) {
                            const weekMonthKey = getMonthForWeek(weekKey);
                            if (weekMonthKey === selectedMonth) {
                              return s + amount;
                            }
                          }
                          return s + amount;
                        }, 0);
                        displaySalary = weekTotal;
                        displayLabel = '/month';
                      } else if (employee.salary !== undefined) {
                        displaySalary = employee.salary;
                        displayLabel = '/month';
                      }
                    } else {
                      // Week view: show salary for selected week
                      if (selectedWeek && employee.weekSalaries && employee.weekSalaries[selectedWeek] !== undefined) {
                        displaySalary = employee.weekSalaries[selectedWeek];
                        // Format week key for display (e.g., "Jan 1 - Jan 7" instead of "2024-01-01")
                        try {
                          const monday = parseWeekKey(selectedWeek);
                          const sunday = getSundayOfWeek(monday);
                          const startStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const endStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          displayLabel = startStr === endStr.split(',')[0]
                            ? `/week (${startStr})`
                            : `/week (${startStr} - ${endStr})`;
                        } catch {
                          displayLabel = `/week (${selectedWeek})`;
                        }
                      } else if (employee.weekSalary !== undefined) {
                        displaySalary = employee.weekSalary;
                        displayLabel = '/week';
                      } else if (employee.salary !== undefined) {
                        displaySalary = employee.salary;
                        displayLabel = '/week';
                      }
                    }

                    if (displaySalary !== undefined) {
                      return (
                        <>
                          <Text style={styles.employeeSalary}>
                            {formatAmount(displaySalary)}
                          </Text>
                          <Text style={styles.employeePeriod}>
                            {displayLabel}
                          </Text>
                          {period === 'month' && employee.weekSalaries && Object.keys(employee.weekSalaries).length > 0 && (
                            <Text style={styles.employeePeriodInfo}>
                              ({Object.keys(employee.weekSalaries).length} weeks)
                            </Text>
                          )}
                          {period === 'week' && employee.monthSalary !== undefined && (
                            <Text style={styles.employeePeriodInfo}>
                              (Month: {formatAmount(employee.monthSalary)})
                            </Text>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <View style={styles.noSalaryBadge}>
                          <Feather name="alert-circle" size={14} color={BluePalette.warning} />
                          <Text style={styles.noSalaryText}>Salary not set</Text>
                        </View>
                      );
                    }
                  })()}
                </View>
              </View>
              <View style={styles.employeeActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleEditEmployee(employee)}
                >
                  <Feather name="edit-2" size={16} color={BluePalette.merge} />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteEmployee(employee.id)}
                >
                  <Feather name="trash-2" size={16} color={BluePalette.error} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {employees.length > 0 && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount ({period})</Text>
          <Text style={styles.totalAmount}>{formatAmount(totalAmount)}</Text>
        </View>
      )}

      {/* Employee Form Modal */}
      <Modal
        visible={showEmployeeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </Text>
              <Pressable onPress={() => setShowEmployeeModal(false)}>
                <Feather name="x" size={24} color={BluePalette.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalForm}>
                {/* Name */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Name *</Text>
                  <View style={styles.modalInputWrapper}>
                    <Feather
                      name="user"
                      size={18}
                      color={BluePalette.textDark}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Employee name"
                      placeholderTextColor="rgba(10, 31, 58, 0.5)"
                      value={employeeForm.name}
                      onChangeText={(value) =>
                        setEmployeeForm((prev) => ({ ...prev, name: value }))
                      }
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Type/Position */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Position/Type *</Text>
                  <View style={styles.typeSelector}>
                    {(['server', 'barman', 'cleaner'] as PersonnelType[]).map((type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.typeOption,
                          employeeForm.type === type && styles.typeOptionActive,
                        ]}
                        onPress={() => setEmployeeForm((prev) => ({ ...prev, type }))}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            employeeForm.type === type && styles.typeOptionTextActive,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Salary - Optional */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>
                    Salary ({period}) (Optional)
                  </Text>
                  <View style={styles.modalInputWrapper}>
                    <Feather
                      name="dollar-sign"
                      size={18}
                      color={BluePalette.textDark}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder={`0.00 per ${period}`}
                      placeholderTextColor="rgba(10, 31, 58, 0.5)"
                      value={employeeForm.salary}
                      onChangeText={(value) =>
                        setEmployeeForm((prev) => ({
                          ...prev,
                          salary: value.replace(/[^0-9.]/g, ''),
                        }))
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={styles.helperText}>
                    {period === 'month'
                      ? 'Monthly salary will be divided by weeks and remaining days'
                      : 'Weekly salary will be accumulated to calculate monthly total'
                    }
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowEmployeeModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleSaveEmployee}>
                <Text style={styles.modalSaveText}>
                  {editingEmployee ? 'Update' : 'Add'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Existing Employees Modal */}
      <Modal
        visible={showExistingEmployeesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExistingEmployeesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Existing Employee</Text>
              <Pressable onPress={() => setShowExistingEmployeesModal(false)}>
                <Feather name="x" size={24} color={BluePalette.textPrimary} />
              </Pressable>
            </View>

            {/* Position Filter in Modal */}
            {availableEmployees.length > 0 && (
              <View style={styles.modalFilterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalFilterScroll}>
                  {positionOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.filterChip,
                        positionFilter === option.value && styles.filterChipActive,
                      ]}
                      onPress={() => setPositionFilter(option.value)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          positionFilter === option.value && styles.filterChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.existingEmployeesList}>
                {loadingEmployees ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Loading employees...</Text>
                  </View>
                ) : (() => {
                  // Filter employees by position
                  const filteredAvailable = positionFilter === 'all'
                    ? availableEmployees
                    : availableEmployees.filter(emp => emp.type === positionFilter);

                  return filteredAvailable.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No employees found</Text>
                    </View>
                  ) : (
                    filteredAvailable.map((employee) => {
                      const isAlreadyAdded = employees.some(e => e.id === employee.id);
                      return (
                        <Pressable
                          key={employee.id}
                          style={[
                            styles.existingEmployeeCard,
                            isAlreadyAdded && styles.existingEmployeeCardDisabled
                          ]}
                          onPress={() => {
                            if (!isAlreadyAdded) {
                              handleSelectExistingEmployee(employee);
                            }
                          }}
                          disabled={isAlreadyAdded}
                        >
                          <View style={styles.existingEmployeeInfo}>
                            <View style={styles.existingEmployeeHeaderRow}>
                              <Text style={[
                                styles.existingEmployeeName,
                                isAlreadyAdded && styles.existingEmployeeNameDisabled
                              ]}>
                                {employee.name}
                              </Text>
                              {isAlreadyAdded && (
                                <View style={styles.addedBadge}>
                                  <Feather name="check" size={14} color={BluePalette.success} />
                                  <Text style={styles.addedBadgeText}>Added</Text>
                                </View>
                              )}
                            </View>
                            {employee.position && (
                              <Text style={[
                                styles.existingEmployeePosition,
                                isAlreadyAdded && styles.existingEmployeePositionDisabled
                              ]}>
                                {employee.position}
                              </Text>
                            )}
                            {employee.type && (
                              <View style={[
                                styles.typeBadge,
                                employee.type === 'server' && styles.typeBadgeServer,
                                employee.type === 'barman' && styles.typeBadgeBarman,
                                employee.type === 'cleaner' && styles.typeBadgeCleaner,
                              ]}>
                                <Text style={styles.typeBadgeText}>{employee.type}</Text>
                              </View>
                            )}
                          </View>
                          {!isAlreadyAdded && (
                            <Feather name="chevron-right" size={20} color={BluePalette.textTertiary} />
                          )}
                        </Pressable>
                      );
                    }));
                })()}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BluePalette.merge,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: BluePalette.merge,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.white,
  },
  addExistingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BluePalette.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  addExistingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.merge,
  },
  filterContainer: {
    marginTop: 4,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  filterChipTextActive: {
    color: BluePalette.merge,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BluePalette.warning,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textDark,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: BluePalette.textDark,
  },
  employeesList: {
    gap: 12,
  },
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  employeeInfo: {
    flex: 1,
    gap: 4,
  },
  employeeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  employeePosition: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  employeeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  employeeSalary: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.merge,
  },
  employeePeriod: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  employeePeriodInfo: {
    fontSize: 11,
    color: BluePalette.textTertiary,
    fontStyle: 'italic',
  },
  noSalaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${BluePalette.warning}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noSalaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.warning,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeBadgeServer: {
    backgroundColor: `${BluePalette.merge}15`,
  },
  typeBadgeBarman: {
    backgroundColor: `${BluePalette.success}15`,
  },
  typeBadgeCleaner: {
    backgroundColor: `${BluePalette.warning}15`,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    textTransform: 'capitalize',
  },
  employeeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  deleteButton: {
    borderColor: `${BluePalette.error}30`,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BluePalette.selectedBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BluePalette.merge,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.merge,
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BluePalette.backgroundNew,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.9,
    paddingBottom: 0,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalFilterContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  modalFilterScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  modalForm: {
    padding: 20,
    gap: 16,
  },
  modalInputGroup: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.merge,
    marginLeft: 4,
  },
  modalInputWrapper: {
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
  modalInputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: BluePalette.textDark,
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    color: BluePalette.textTertiary,
    marginLeft: 4,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
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
  typeOptionActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  typeOptionTextActive: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BluePalette.merge,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BluePalette.merge,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.white,
  },
  existingEmployeesList: {
    padding: 20,
    gap: 12,
  },
  existingEmployeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  existingEmployeeCardDisabled: {
    opacity: 0.6,
    backgroundColor: BluePalette.surface,
  },
  existingEmployeeInfo: {
    flex: 1,
    gap: 4,
  },
  existingEmployeeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  existingEmployeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  existingEmployeeNameDisabled: {
    color: BluePalette.textSecondary,
  },
  existingEmployeePosition: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  existingEmployeePositionDisabled: {
    color: BluePalette.textTertiary,
    opacity: 0.7,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${BluePalette.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.success,
  },
});
