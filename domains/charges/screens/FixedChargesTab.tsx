import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FixedChargeCard from '../components/FixedChargeCard';
import PeriodSelector from '../components/PeriodSelector';
import { FixedCharge, PeriodType } from '../types/charge';

// Mock data - replace with actual data fetching
const mockFixedCharges: FixedCharge[] = [
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
];

export default function FixedChargesTab() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Filter charges based on selected period
  const filteredCharges = useMemo(() => {
    return mockFixedCharges.filter(
      (charge) => charge.period === selectedPeriod || selectedPeriod === 'week'
    );
  }, [selectedPeriod]);

  const handleCardPress = (chargeId: string) => {
    router.push(`/charges/fixed/${chargeId}` as any);
  };

  return (
    <View style={styles.container}>
      <PeriodSelector
        periods={['week', 'month']}
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
});

