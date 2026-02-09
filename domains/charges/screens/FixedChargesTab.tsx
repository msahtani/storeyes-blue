import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChargesDateSelector from '../components/ChargesDateSelector';
import FixedChargeCard from '../components/FixedChargeCard';
import {
  convertFixedChargeToFrontend,
  getFixedChargesByMonth,
} from '../services/chargesService';
import { FixedCharge, FixedChargeCategory } from '../types/charge';

// Helper to get month key
const getMonthKey = (monthsAgo: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  const [charges, setCharges] = useState<FixedCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Fetch charges function
  const fetchCharges = useCallback(async () => {
    const monthKey = selectedMonth || getMonthKey(0);
    setLoading(true);
    setError(null);

    try {
      const response = await getFixedChargesByMonth(monthKey);
      // Convert backend response to frontend format
      const frontendCharges = response.map(convertFixedChargeToFrontend);
      setCharges(frontendCharges);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load charges';
      setError(errorMessage);
      console.error('Error fetching charges:', err);
      // Set empty array on error
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  // Fetch charges when month changes
  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  // Refetch when screen comes into focus (after create/edit/delete)
  useFocusEffect(
    useCallback(() => {
      fetchCharges();
    }, [fetchCharges])
  );

  // Get charges for selected month
  const monthCharges = useMemo(() => {
    return charges;
  }, [charges]);

  // Predefined categories: at most one charge per category
  const chargesByCategory = useMemo(() => {
    const map = new Map<FixedChargeCategory, FixedCharge>();
    monthCharges.forEach((charge) => {
      if (charge.category !== 'other') {
        map.set(charge.category, charge);
      }
    });
    return map;
  }, [monthCharges]);

  // Custom "other" charges (each has its own name, multiple per month)
  const otherCharges = useMemo(
    () => monthCharges.filter((c) => c.category === 'other'),
    [monthCharges]
  );

  // Get current month key
  const currentMonthKey = useMemo(() => selectedMonth || getMonthKey(0), [selectedMonth]);

  // Check if current month has ended
  const monthEnded = useMemo(() => isMonthEnded(currentMonthKey), [currentMonthKey]);

  const handleCardPress = (category: FixedChargeCategory, charge: FixedCharge | null) => {
    const monthKey = currentMonthKey;

    if (charge) {
      router.push({
        pathname: `/charges/fixed/${charge.id}` as any,
        params: { month: monthKey },
      });
    } else {
      router.push({
        pathname: `/charges/fixed/create` as any,
        params: { month: monthKey, category },
      });
    }
  };

  const handleNewFixedChargePress = () => {
    router.push({
      pathname: `/charges/fixed/create` as any,
      params: { month: currentMonthKey, category: 'other' },
    });
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
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BluePalette.merge} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {/* New fixed charge button (like variable tab) */}
            <Pressable
              style={({ pressed }) => [
                styles.newChargeButton,
                pressed && styles.newChargeButtonPressed,
              ]}
              onPress={handleNewFixedChargePress}
            >
              <Feather name="plus" size={20} color={BluePalette.white} />
              <Text style={styles.newChargeButtonText}>
                {t('charges.fixedTab.newFixedCharge')}
              </Text>
            </Pressable>

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

            {/* Other (custom) fixed charges - each with its own name */}
            {otherCharges.map((charge) => (
              <FixedChargeCard
                key={charge.id}
                category="other"
                charge={charge}
                displayName={charge.name ?? undefined}
                isWarned={false}
                onPress={() => handleCardPress('other', charge)}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: BluePalette.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  newChargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: BluePalette.merge,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newChargeButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  newChargeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: -0.3,
  },
});

