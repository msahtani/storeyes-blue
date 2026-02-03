import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import DateSelector from '@/domains/alerts/components/DateSelector';
import { setSelectedDate } from '@/domains/alerts/store/alertsSlice';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    createVariableCharge,
    formatAmountForDisplay,
    formatAmountInput,
    getVariableChargeById,
    parseAmountInput,
    updateVariableCharge,
} from '../services/chargesService';

const categories = ['Supplies', 'Maintenance', 'Equipment', 'Other'];

export default function VariableChargeFormScreen() {
  const { id, date: dateParam } = useLocalSearchParams<{ id?: string; date?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.alerts.selectedDate);

  const isEditMode = !!id;
  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    supplier: '',
    notes: '',
    purchaseOrderUri: null as string | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Image Picker - DISABLED (Purchase Order section is hidden)
  // Removed ImagePicker code since purchase order functionality is commented out

  // Load existing data if editing
  useEffect(() => {
    const loadCharge = async () => {
      if (isEditMode && id) {
        try {
          const chargeId = parseInt(id, 10);
          if (isNaN(chargeId)) {
            Alert.alert('Error', 'Invalid charge ID');
            router.back();
            return;
          }

          const response = await getVariableChargeById(chargeId);

          // Populate form
          setFormData({
            name: response.name,
            amount: formatAmountForDisplay(response.amount),
            category: response.category,
            supplier: response.supplier || '',
            notes: response.notes || '',
            purchaseOrderUri: response.purchaseOrderUrl || null,
          });

          // Set the date in Redux
          if (response.date) {
            dispatch(setSelectedDate(response.date));
          }
        } catch (err: any) {
          const errorMessage =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load charge data';
          Alert.alert('Error', errorMessage);
          console.error('Error loading variable charge:', err);
          router.back();
        }
      } else {
        // New charge: use date from "New Variable Charge" button (current list day) or today
        const initialDate =
          dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
            ? dateParam
            : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        dispatch(setSelectedDate(initialDate));
      }
    };

    loadCharge();
  }, [id, isEditMode, dateParam, dispatch, router]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseAmountInput(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!selectedDate) {
      newErrors.date = 'Date is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTakePhoto = async () => {
    // DISABLED - Purchase Order section is hidden
    // ImagePicker code removed to prevent native module errors
    Alert.alert('Info', 'Purchase order functionality is currently disabled.');
  };

  const handlePickImage = async () => {
    // DISABLED - Purchase Order section is hidden
    // ImagePicker code removed to prevent native module errors
    Alert.alert('Info', 'Purchase order functionality is currently disabled.');
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this purchase order image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setFormData((prev) => ({ ...prev, purchaseOrderUri: null })),
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && id) {
        // Update existing charge
        const updateRequest = {
          name: formData.name.trim(),
          amount: parseAmountInput(formData.amount),
          date: selectedDate!,
          category: formData.category.trim(),
          supplier: formData.supplier.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          purchaseOrderUrl: formData.purchaseOrderUri || undefined,
        };

        await updateVariableCharge(parseInt(id, 10), updateRequest);
      } else {
        // Create new charge
        const createRequest = {
          name: formData.name.trim(),
          amount: parseAmountInput(formData.amount),
          date: selectedDate!,
          category: formData.category.trim(),
          supplier: formData.supplier.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          purchaseOrderUrl: formData.purchaseOrderUri || undefined,
        };

        await createVariableCharge(createRequest);
      }

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
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save charge';
      Alert.alert('Error', errorMessage);
      console.error('Error saving variable charge:', err);
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
          {isEditMode ? 'Edit Variable Charge' : 'New Variable Charge'}
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
          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date *</Text>
            <View style={[styles.dateSelectorContainer, errors.date && styles.inputError]}>
              <DateSelector variant="charges" />
            </View>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <Feather
                name="tag"
                size={18}
                color={errors.name ? BluePalette.error : BluePalette.textDark}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter charge name"
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <View style={[styles.inputWrapper, errors.amount && styles.inputError]}>
              <Text style={styles.amountCurrencyLabel}>MAD</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                value={formData.amount}
                onChangeText={(value) => updateField('amount', formatAmountInput(value))}
                keyboardType="decimal-pad"
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={({ pressed }) => [
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonActive,
                    pressed && styles.categoryButtonPressed,
                  ]}
                  onPress={() => updateField('category', category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === category && styles.categoryButtonTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Supplier Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="home"
                size={18}
                color={BluePalette.textDark}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter supplier name"
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                value={formData.supplier}
                onChangeText={(value) => updateField('supplier', value)}
                autoCapitalize="words"
              />
            </View>
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

          {/* Purchase Order Image - HIDDEN FOR NOW */}
          {/* <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Order</Text>
            {formData.purchaseOrderUri ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: formData.purchaseOrderUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                >
                  <Feather name="x" size={18} color={BluePalette.white} />
                </Pressable>
                <Pressable
                  style={styles.changeImageButton}
                  onPress={() => setShowImagePicker(true)}
                >
                  <Feather name="edit-2" size={16} color={BluePalette.merge} />
                  <Text style={styles.changeImageText}>Change</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.addImageButton}
                onPress={() => setShowImagePicker(true)}
              >
                <Feather name="camera" size={24} color={BluePalette.merge} />
                <Text style={styles.addImageText}>Add Purchase Order Image</Text>
                <Text style={styles.addImageSubtext}>Take photo or upload from gallery</Text>
              </Pressable>
            )}
          </View> */}

          {/* Image Picker Action Sheet - HIDDEN FOR NOW */}
          {false && showImagePicker && (
            <View style={styles.imagePickerOverlay}>
              <Pressable
                style={styles.imagePickerBackdrop}
                onPress={() => setShowImagePicker(false)}
              />
              <View style={styles.imagePickerActions}>
                <View style={styles.imagePickerHeader}>
                  <Text style={styles.imagePickerTitle}>Add Purchase Order</Text>
                  <Pressable
                    style={styles.imagePickerCloseButton}
                    onPress={() => setShowImagePicker(false)}
                  >
                    <Feather name="x" size={24} color={BluePalette.textPrimary} />
                  </Pressable>
                </View>
                <View style={styles.imagePickerOptions}>
                  <Pressable
                    style={styles.imagePickerAction}
                    onPress={handleTakePhoto}
                  >
                    <View style={styles.imagePickerActionIcon}>
                      <Feather name="camera" size={28} color={BluePalette.merge} />
                    </View>
                    <Text style={styles.imagePickerActionText}>Take Photo</Text>
                  </Pressable>
                  <Pressable
                    style={styles.imagePickerAction}
                    onPress={handlePickImage}
                  >
                    <View style={styles.imagePickerActionIcon}>
                      <Feather name="image" size={28} color={BluePalette.merge} />
                    </View>
                    <Text style={styles.imagePickerActionText}>Choose from Gallery</Text>
                  </Pressable>
                </View>
                <Pressable
                  style={styles.imagePickerCancel}
                  onPress={() => setShowImagePicker(false)}
                >
                  <Text style={styles.imagePickerCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  categoryButtonActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  categoryButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  categoryButtonTextActive: {
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
  receiptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BluePalette.white,
  },
  checkboxChecked: {
    backgroundColor: BluePalette.merge,
    borderColor: BluePalette.merge,
  },
  receiptLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BluePalette.textDark,
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
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(10, 31, 58, 0.2)',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: BluePalette.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BluePalette.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: BluePalette.white,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.merge,
  },
  addImageButton: {
    backgroundColor: BluePalette.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 31, 58, 0.2)',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.merge,
  },
  addImageSubtext: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  imagePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imagePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imagePickerActions: {
    backgroundColor: BluePalette.white,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 0,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imagePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  imagePickerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  imagePickerOptions: {
    paddingVertical: 12,
    gap: 8,
  },
  imagePickerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  imagePickerActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BluePalette.merge}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textDark,
    flex: 1,
  },
  imagePickerCancel: {
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.error,
  },
});
