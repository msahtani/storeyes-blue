import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChargesDateSelector from '../components/ChargesDateSelector';
import FixedChargeCard from '../components/FixedChargeCard';
import { FixedCharge, FixedChargeCategory } from '../types/charge';

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

// All fixed charge categories
const ALL_CATEGORIES: FixedChargeCategory[] = ['water', 'electricity', 'wifi', 'personnel'];

// Helper to check if a month has ended
const isMonthEnded = (monthKey: string): boolean => {
  const [year, month] = monthKey.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const now = new Date();
  return now > monthEnd;
};

export default function FixedChargesTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Get charges for selected month
  const monthCharges = useMemo(() => {
    const monthKey = selectedMonth || getMonthKey(0);
    return mockFixedChargesByMonth[monthKey] || [];
  }, [selectedMonth]);

  // Create a map of category -> charge for easy lookup
  const chargesByCategory = useMemo(() => {
    const map = new Map<FixedChargeCategory, FixedCharge>();
    monthCharges.forEach((charge) => {
      map.set(charge.category, charge);
    });
    return map;
  }, [monthCharges]);

  // Get current month key
  const currentMonthKey = useMemo(() => selectedMonth || getMonthKey(0), [selectedMonth]);
  
  // Check if current month has ended
  const monthEnded = useMemo(() => isMonthEnded(currentMonthKey), [currentMonthKey]);

  const handleCardPress = (category: FixedChargeCategory, charge: FixedCharge | null) => {
    const monthKey = currentMonthKey;
    
    if (charge) {
      // Navigate to detail screen (which has edit button)
      router.push({
        pathname: `/charges/fixed/${charge.id}` as any,
        params: { month: monthKey },
      });
    } else {
      // Navigate to create form
      router.push({
        pathname: `/charges/fixed/create` as any,
        params: { month: monthKey, category },
      });
    }
  };

  const handleMonthSelect = (monthKey: string) => {
    setSelectedMonth(monthKey);
  };

  return (
    <View style={styles.container}>
      <ChargesDateSelector
        selectedMonth={selectedMonth}
        onMonthSelect={handleMonthSelect}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {ALL_CATEGORIES.map((category) => {
            const charge = chargesByCategory.get(category) || null;
            const isWarned = !charge && monthEnded;
            
            return (
              <FixedChargeCard
                key={category}
                category={category}
                charge={charge}
                isWarned={isWarned}
                onPress={() => handleCardPress(category, charge)}
              />
            );
          })}
        </View>
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
});

