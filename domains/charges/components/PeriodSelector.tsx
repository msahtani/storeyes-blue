import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PeriodType } from '../types/charge';

interface PeriodSelectorProps {
  periods: PeriodType[];
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export default function PeriodSelector({
  periods,
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <View style={styles.container}>
      {periods.map((period) => (
        <Pressable
          key={period}
          style={({ pressed }) => [
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
            pressed && styles.periodButtonPressed,
          ]}
          onPress={() => onPeriodChange(period)}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period && styles.periodTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  periodButton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  periodButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  periodTextActive: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
});

