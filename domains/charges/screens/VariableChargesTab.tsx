import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import DateSelector from '@/domains/alerts/components/DateSelector';
import { setSelectedDate } from '@/domains/alerts/store/alertsSlice';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VariableChargeItem from '../components/VariableChargeItem';
import { VariableCharge } from '../types/charge';

// Mock data with dates for testing - replace with actual data fetching
const mockVariableCharges: VariableCharge[] = [
  // Recent charges (last 7 days)
  {
    id: '1',
    name: 'Coffee Beans - Premium Blend',
    amount: 245.50,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    category: 'Supplies',
    supplier: 'Coffee Distributors Inc.',
    purchaseOrderUrl: 'https://example.com/po1.jpg',
  },
  {
    id: '2',
    name: 'Cleaning Supplies',
    amount: 89.99,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    category: 'Maintenance',
    supplier: 'Supply Co.',
  },
  {
    id: '3',
    name: 'Milk Delivery',
    amount: 156.00,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    category: 'Supplies',
    supplier: 'Dairy Farm',
    purchaseOrderUrl: 'https://example.com/po3.jpg',
  },
  {
    id: '4',
    name: 'Equipment Repair',
    amount: 320.00,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
    category: 'Maintenance',
    supplier: 'Tech Services',
    notes: 'Espresso machine maintenance',
    purchaseOrderUrl: 'https://example.com/po4.jpg',
  },
  {
    id: '5',
    name: 'Sugar & Sweeteners',
    amount: 45.75,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    category: 'Supplies',
    supplier: 'Bulk Foods Co.',
    purchaseOrderUrl: 'https://example.com/po5.jpg',
  },
  {
    id: '6',
    name: 'Paper Products',
    amount: 78.20,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days ago
    category: 'Supplies',
    supplier: 'Office Depot',
  },
  {
    id: '7',
    name: 'Light Bulbs Replacement',
    amount: 32.50,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    category: 'Maintenance',
    supplier: 'Hardware Store',
    purchaseOrderUrl: 'https://example.com/po7.jpg',
  },
  // Previous week charges
  {
    id: '8',
    name: 'Syrups & Flavors',
    amount: 125.00,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
    category: 'Supplies',
    supplier: 'Flavor Distributors',
    purchaseOrderUrl: 'https://example.com/po8.jpg',
  },
  {
    id: '9',
    name: 'Window Cleaning Service',
    amount: 150.00,
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days ago
    category: 'Maintenance',
    supplier: 'Clean Pro Services',
    purchaseOrderUrl: 'https://example.com/po9.jpg',
  },
  {
    id: '10',
    name: 'Napkins & Towels',
    amount: 67.30,
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days ago
    category: 'Supplies',
    supplier: 'Restaurant Supply',
  },
];

export default function VariableChargesTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.alerts.selectedDate);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Filter charges based on selected date
  const filteredCharges = useMemo(() => {
    if (!selectedDate) {
      return mockVariableCharges;
    }
    
    // Filter charges that match the selected date
    return mockVariableCharges.filter((charge) => {
      return charge.date === selectedDate;
    });
  }, [selectedDate]);

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
    router.push('/charges/variable/create' as any);
  };

  return (
    <View style={styles.container}>
      <DateSelector />

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
        {filteredCharges.length === 0 ? (
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

