import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChargesDateSelector from '../components/ChargesDateSelector';
import FixedChargeCard from '../components/FixedChargeCard';
import { FixedCharge } from '../types/charge';

// Helper to get month key
const getMonthKey = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Mock data with month keys for testing - replace with actual data fetching
// Data structure: monthKey -> charges array
const mockFixedChargesByMonth: Record<string, FixedCharge[]> = {
  // Current month - at least personnel data should be available
  [getMonthKey(0)]: [
    {
      id: '13',
      category: 'personnel',
      amount: 4600,
      period: 'month',
      trend: 'up',
      trendPercentage: 2.2,
      abnormalIncrease: false,
    },
  ],
  // Previous month (most recent available)
  [getMonthKey(1)]: [
    {
      id: '1',
      category: 'personnel',
      amount: 4500,
      period: 'month',
      trend: 'up',
      trendPercentage: 5.2,
      abnormalIncrease: false,
    },
    {
      id: '2',
      category: 'water',
      amount: 320,
      period: 'month',
      trend: 'down',
      trendPercentage: -2.1,
      abnormalIncrease: false,
    },
    {
      id: '3',
      category: 'electricity',
      amount: 850,
      period: 'month',
      trend: 'up',
      trendPercentage: 15.8,
      abnormalIncrease: true,
    },
    {
      id: '4',
      category: 'wifi',
      amount: 120,
      period: 'month',
      trend: 'stable',
      trendPercentage: 0,
      abnormalIncrease: false,
    },
  ],
  // 2 months ago
  [getMonthKey(2)]: [
    {
      id: '5',
      category: 'personnel',
      amount: 4278,
      period: 'month',
      trend: 'up',
      trendPercentage: 3.1,
      abnormalIncrease: false,
    },
    {
      id: '6',
      category: 'water',
      amount: 327,
      period: 'month',
      trend: 'stable',
      trendPercentage: 0,
      abnormalIncrease: false,
    },
    {
      id: '7',
      category: 'electricity',
      amount: 735,
      period: 'month',
      trend: 'down',
      trendPercentage: -5.2,
      abnormalIncrease: false,
    },
    {
      id: '8',
      category: 'wifi',
      amount: 120,
      period: 'month',
      trend: 'stable',
      trendPercentage: 0,
      abnormalIncrease: false,
    },
  ],
  // 3 months ago
  [getMonthKey(3)]: [
    {
      id: '9',
      category: 'personnel',
      amount: 4150,
      period: 'month',
      trend: 'stable',
      trendPercentage: 0,
      abnormalIncrease: false,
    },
    {
      id: '10',
      category: 'water',
      amount: 335,
      period: 'month',
      trend: 'up',
      trendPercentage: 2.4,
      abnormalIncrease: false,
    },
    {
      id: '11',
      category: 'electricity',
      amount: 775,
      period: 'month',
      trend: 'up',
      trendPercentage: 8.4,
      abnormalIncrease: false,
    },
    {
      id: '12',
      category: 'wifi',
      amount: 120,
      period: 'month',
      trend: 'stable',
      trendPercentage: 0,
      abnormalIncrease: false,
    },
  ],
};

// Flatten for easy access
const getAllMockFixedCharges = (): FixedCharge[] => {
  return Object.values(mockFixedChargesByMonth).flat();
};

export default function FixedChargesTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Filter charges based on selected month
  // Month selection: show ALL fixed charges (wifi, water, electricity, personnel) for that month
  const filteredCharges = useMemo(() => {
    if (selectedMonth) {
      // Show charges for the selected month
      return mockFixedChargesByMonth[selectedMonth] || [];
    }
    // If no month selected, default to current month
    const currentMonthKey = getMonthKey(0);
    return mockFixedChargesByMonth[currentMonthKey] || [];
  }, [selectedMonth]);

  const handleCardPress = (chargeId: string) => {
    // Get the current month key to pass to detail screen
    const monthKey = selectedMonth || getMonthKey(0);
    router.push({
      pathname: `/charges/fixed/${chargeId}` as any,
      params: { month: monthKey },
    });
  };

  const handleMonthSelect = (monthKey: string) => {
    setSelectedMonth(monthKey);
  };

  const handleCreatePress = () => {
    router.push('/charges/fixed/create' as any);
  };

  return (
    <View style={styles.container}>
      <ChargesDateSelector
        selectedMonth={selectedMonth}
        onMonthSelect={handleMonthSelect}
      />

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
          <Text style={styles.createButtonText}>New Fixed Charge</Text>
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
              {t('charges.fixed.empty')}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {filteredCharges.map((charge) => (
              <FixedChargeCard
                key={charge.id}
                charge={charge}
                onPress={() => handleCardPress(charge.id)}
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
  cardsContainer: {
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

