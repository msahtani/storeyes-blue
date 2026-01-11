import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PeriodSelector from '../components/PeriodSelector';
import VariableChargeItem from '../components/VariableChargeItem';
import { PeriodType, VariableCharge } from '../types/charge';

// Mock data - replace with actual data fetching
const mockVariableCharges: VariableCharge[] = [
  {
    id: '1',
    name: 'Coffee Beans - Premium Blend',
    amount: 245.50,
    date: '2024-01-15',
    category: 'Supplies',
    supplier: 'Coffee Distributors Inc.',
    hasReceipt: true,
    receiptUrl: 'https://example.com/receipt1.jpg',
  },
  {
    id: '2',
    name: 'Cleaning Supplies',
    amount: 89.99,
    date: '2024-01-14',
    category: 'Maintenance',
    supplier: 'Supply Co.',
    hasReceipt: false,
  },
  {
    id: '3',
    name: 'Milk Delivery',
    amount: 156.00,
    date: '2024-01-13',
    category: 'Supplies',
    supplier: 'Dairy Farm',
    hasReceipt: true,
    receiptUrl: 'https://example.com/receipt3.jpg',
  },
  {
    id: '4',
    name: 'Equipment Repair',
    amount: 320.00,
    date: '2024-01-12',
    category: 'Maintenance',
    supplier: 'Tech Services',
    notes: 'Espresso machine maintenance',
    hasReceipt: true,
    receiptUrl: 'https://example.com/receipt4.jpg',
  },
];

export default function VariableChargesTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Filter charges based on selected period (mock implementation)
  const filteredCharges = useMemo(() => {
    // In a real app, this would filter by date range based on selectedPeriod
    return mockVariableCharges;
  }, [selectedPeriod]);

  const handleItemPress = (chargeId: string) => {
    router.push(`/charges/variable/${chargeId}` as any);
  };

  return (
    <View style={styles.container}>
      <PeriodSelector
        periods={['day', 'week', 'month']}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

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
});

