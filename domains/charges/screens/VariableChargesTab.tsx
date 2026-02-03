import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import DateSelector from '@/domains/alerts/components/DateSelector';
import { setSelectedDate } from '@/domains/alerts/store/alertsSlice';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VariableChargeItem from '../components/VariableChargeItem';
import { getVariableCharges } from '../services/chargesService';
import { VariableCharge } from '../types/charge';


export default function VariableChargesTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.alerts.selectedDate);
  const [charges, setCharges] = useState<VariableCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Fetch charges function
  const fetchCharges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch without date filters first to see if endpoint works
      // If that fails, we'll try with date range
      let response;

      if (selectedDate) {
        // Filter by single date (show only charges for that date)
        response = await getVariableCharges({
          startDate: selectedDate,
          endDate: selectedDate,
        });
      } else {
        // Try fetching all charges first (no date filter)
        // If backend doesn't support it, we'll handle the error gracefully
        try {
          response = await getVariableCharges();
        } catch (allError: any) {
          // If fetching all fails, try with current month range
          console.log('Fetching all charges failed, trying with date range:', allError);
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          response = await getVariableCharges({
            startDate: firstDay.toISOString().split('T')[0],
            endDate: lastDay.toISOString().split('T')[0],
          });
        }
      }

      // Convert to frontend format
      const frontendCharges: VariableCharge[] = response.map((charge) => ({
        id: charge.id.toString(),
        name: charge.name,
        amount: charge.amount,
        date: charge.date,
        category: charge.category,
        supplier: charge.supplier,
        notes: charge.notes,
        purchaseOrderUrl: charge.purchaseOrderUrl,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt,
      }));

      setCharges(frontendCharges);
    } catch (err: any) {
      // Log more details about the error
      console.error('Error fetching variable charges:', {
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
        params: selectedDate ? { startDate: selectedDate, endDate: selectedDate } : 'all',
      });

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        `Failed to load charges (${err?.response?.status || 'unknown error'})`;
      setError(errorMessage);
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch charges when selected date changes
  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  // Refetch when screen comes into focus (after create/edit/delete)
  useFocusEffect(
    useCallback(() => {
      fetchCharges();
    }, [fetchCharges])
  );

  // Filter charges based on selected date (double-check client-side)
  const filteredCharges = useMemo(() => {
    if (!selectedDate) {
      return charges;
    }
    // Filter client-side as well (already filtered by API, but double-check)
    return charges.filter((charge) => charge.date === selectedDate);
  }, [charges, selectedDate]);

  const handleItemPress = (chargeId: string) => {
    router.push(`/charges/variable/${chargeId}` as any);
  };

  // Initialize selected date if not set
  React.useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      dispatch(setSelectedDate(todayStr));
    }
  }, [selectedDate, dispatch]);

  const handleCreatePress = () => {
    const dateParam = selectedDate
      ? `?date=${encodeURIComponent(selectedDate)}`
      : '';
    router.push(`/charges/variable/create${dateParam}` as any);
  };

  return (
    <View style={styles.container}>
      <DateSelector variant="charges" />

      {/* Create Button */}
      <View style={styles.createButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreatePress}
        >
          <Feather name="plus" size={20} color={BluePalette.white} />
          <Text style={styles.createButtonText}>New Variable Charge</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BluePalette.merge} />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredCharges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('charges.variable.empty')}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredCharges.map((charge) => (
              <VariableChargeItem
                key={charge.id}
                charge={charge}
                onPress={() => handleItemPress(charge.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listContainer: {
    gap: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: BluePalette.error,
    fontWeight: '500',
    textAlign: 'center',
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: BluePalette.merge,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: -0.3,
  },
});

