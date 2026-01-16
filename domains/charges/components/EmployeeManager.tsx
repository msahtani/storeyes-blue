import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
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
import { PersonnelEmployee } from '../types/charge';

interface EmployeeManagerProps {
  employees: PersonnelEmployee[];
  onEmployeesChange: (employees: PersonnelEmployee[]) => void;
}

export default function EmployeeManager({
  employees,
  onEmployeesChange,
}: EmployeeManagerProps) {
  const [editingEmployee, setEditingEmployee] = useState<PersonnelEmployee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    salary: '',
    hours: '',
    position: '',
    startDate: '',
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({
      name: '',
      salary: '',
      hours: '',
      position: '',
      startDate: '',
    });
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: PersonnelEmployee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      salary: employee.salary.toString(),
      hours: employee.hours?.toString() || '',
      position: employee.position || '',
      startDate: employee.startDate || '',
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

  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim() || !employeeForm.salary.trim()) {
      Alert.alert('Error', 'Name and salary are required');
      return;
    }

    const salary = parseFloat(employeeForm.salary);
    if (isNaN(salary) || salary <= 0) {
      Alert.alert('Error', 'Salary must be a positive number');
      return;
    }

    const employeeData: PersonnelEmployee = {
      id: editingEmployee?.id || Date.now().toString(),
      name: employeeForm.name.trim(),
      salary,
      hours: employeeForm.hours ? parseInt(employeeForm.hours, 10) : undefined,
      position: employeeForm.position.trim() || undefined,
      startDate: employeeForm.startDate.trim() || undefined,
    };

    if (editingEmployee) {
      // Update existing employee
      onEmployeesChange(
        employees.map((emp) => (emp.id === editingEmployee.id ? employeeData : emp))
      );
    } else {
      // Add new employee
      onEmployeesChange([...employees, employeeData]);
    }

    setShowEmployeeModal(false);
    setEditingEmployee(null);
  };

  const totalAmount = employees.reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Employees</Text>
        <Pressable style={styles.addButton} onPress={handleAddEmployee}>
          <Feather name="plus" size={18} color={BluePalette.white} />
          <Text style={styles.addButtonText}>Add Employee</Text>
        </Pressable>
      </View>

      {employees.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="users" size={32} color={BluePalette.textDark} />
          <Text style={styles.emptyText}>No employees added yet</Text>
          <Text style={styles.emptySubtext}>Add employees to calculate total amount</Text>
        </View>
      ) : (
        <View style={styles.employeesList}>
          {employees.map((employee) => (
            <View key={employee.id} style={styles.employeeCard}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                {employee.position && (
                  <Text style={styles.employeePosition}>{employee.position}</Text>
                )}
                <View style={styles.employeeDetails}>
                  <Text style={styles.employeeSalary}>
                    {formatAmount(employee.salary)}
                  </Text>
                  {employee.hours && (
                    <Text style={styles.employeeHours}>• {employee.hours}h</Text>
                  )}
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
          <Text style={styles.totalLabel}>Total Amount</Text>
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

                {/* Salary */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Salary *</Text>
                  <View style={styles.modalInputWrapper}>
                    <Feather
                      name="dollar-sign"
                      size={18}
                      color={BluePalette.textDark}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0.00"
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
                </View>

                {/* Hours */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Hours (Optional)</Text>
                  <View style={styles.modalInputWrapper}>
                    <Feather
                      name="clock"
                      size={18}
                      color={BluePalette.textDark}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., 160"
                      placeholderTextColor="rgba(10, 31, 58, 0.5)"
                      value={employeeForm.hours}
                      onChangeText={(value) =>
                        setEmployeeForm((prev) => ({
                          ...prev,
                          hours: value.replace(/[^0-9]/g, ''),
                        }))
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {/* Position */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Position (Optional)</Text>
                  <View style={styles.modalInputWrapper}>
                    <Feather
                      name="briefcase"
                      size={18}
                      color={BluePalette.textDark}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g., Senior Server"
                      placeholderTextColor="rgba(10, 31, 58, 0.5)"
                      value={employeeForm.position}
                      onChangeText={(value) =>
                        setEmployeeForm((prev) => ({ ...prev, position: value }))
                      }
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Start Date */}
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Start Date (Optional)</Text>
                  <View style={styles.modalInputWrapper}>
                    <Feather
                      name="calendar"
                      size={18}
                      color={BluePalette.textDark}
                      style={styles.modalInputIcon}
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="rgba(10, 31, 58, 0.5)"
                      value={employeeForm.startDate}
                      onChangeText={(value) =>
                        setEmployeeForm((prev) => ({ ...prev, startDate: value }))
                      }
                    />
                  </View>
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
  },
  employeeSalary: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.merge,
  },
  employeeHours: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    fontWeight: '500',
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
});
