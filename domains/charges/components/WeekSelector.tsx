import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  getMonthForWeek,
  getWeekNumberInMonth,
  getWeeksForMonth,
} from '../utils/weekUtils';

export interface WeekItem {
  weekNumber: number; // Week number within the month (1-5)
  startDate: Date;
  endDate: Date;
  monthKey: string; // Parent month key (YYYY-MM)
  weekKey: string; // Format: YYYY-MM-DD (Monday date)
  label: string; // Display label like "Jan 29 - Feb 4"
}

interface WeekSelectorProps {
  monthKey: string; // Format: YYYY-MM
  selectedWeek?: string; // Format: YYYY-MM-DD (Monday date)
  onWeekSelect: (weekKey: string) => void;
}

export default function WeekSelector({
  monthKey,
  selectedWeek,
  onWeekSelect,
}: WeekSelectorProps) {
  const { t } = useI18n();
  const weekScrollRef = useRef<ScrollView>(null);

  const weeks = useMemo((): WeekItem[] => {
    const weekInfos = getWeeksForMonth(monthKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Convert WeekInfo to WeekItem format
    // Filter to show only weeks that belong to this month (where Monday is in the month)
    // and have started (Monday <= today)
    return weekInfos
      .filter(week => {
        // Only show weeks that have started
        if (week.startDate > today) return false;

        // Only show weeks that belong to this month (Monday is in this month)
        const weekMonthKey = getMonthForWeek(week.weekKey);
        return weekMonthKey === monthKey;
      })
      .map((week, index) => ({
        weekNumber: getWeekNumberInMonth(week.weekKey, monthKey),
        startDate: week.startDate,
        endDate: week.endDate,
        monthKey: monthKey, // Primary month key
        weekKey: week.weekKey, // Format: YYYY-MM-DD (Monday date)
        label: week.label,
      }));
  }, [monthKey]);

  // Auto-select first week if none selected
  useEffect(() => {
    if (!selectedWeek && weeks.length > 0) {
      onWeekSelect(weeks[0].weekKey);
    }
  }, [selectedWeek, weeks, onWeekSelect]);

  // Scroll to selected week
  useEffect(() => {
    if (selectedWeek && weekScrollRef.current && weeks.length > 0) {
      const selectedIndex = weeks.findIndex((w) => w.weekKey === selectedWeek);
      if (selectedIndex !== -1) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            weekScrollRef.current?.scrollTo({
              x: selectedIndex * 120, // Approximate width + gap
              animated: true,
            });
          }, 150);
        });
      }
    }
  }, [selectedWeek, weeks]);

  if (weeks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('charges.weekSelector.selectWeek')}</Text>
      <ScrollView
        ref={weekScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {weeks.map((week) => {
          const isSelected = week.weekKey === selectedWeek;
          return (
            <Pressable
              key={week.weekKey}
              onPress={() => onWeekSelect(week.weekKey)}
              style={[
                styles.weekCard,
                isSelected && styles.weekCardSelected,
              ]}
            >
              <Text style={[styles.weekLabel, isSelected && styles.weekLabelSelected]}>
                {week.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  weekCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  weekCardSelected: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  weekLabelSelected: {
    color: BluePalette.merge,
    fontWeight: '700',

  },
});
