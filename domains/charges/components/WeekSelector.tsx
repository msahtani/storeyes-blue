import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export interface WeekItem {
  weekNumber: number; // Week number within the month (1-5)
  startDate: Date;
  endDate: Date;
  monthKey: string; // Parent month key (YYYY-MM)
  weekKey: string; // Format: YYYY-MM-WW
  label: string; // Display label like "Week 1" or "Jan 1-7"
}

const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatWeekKey = (monthKey: string, weekNumber: number): string => {
  return `${monthKey}-W${weekNumber}`;
};

const parseMonthKey = (monthKey: string): Date => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Subtract days to get to Sunday
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

const getWeeksInMonth = (monthKey: string): WeekItem[] => {
  const monthStart = parseMonthKey(monthKey);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  const weeks: WeekItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from the Sunday of the week that contains the first day of the month
  let weekStart = getStartOfWeek(new Date(monthStart));
  
  let weekNumber = 1;
  const maxWeeks = 6; // Safety limit
  
  // Generate weeks that overlap with this month
  while (weekStart <= monthEnd && weekNumber <= maxWeeks) {
    const weekEnd = getEndOfWeek(new Date(weekStart));
    weekEnd.setHours(23, 59, 59, 999);
    
    // Check if this week overlaps with the month
    if (weekEnd >= monthStart && weekStart <= monthEnd) {
      // Include all weeks that have started (including current week with remaining days)
      // Only exclude future weeks that haven't started yet
      if (weekStart <= today) {
        // Clamp dates to month boundaries for display
        const startDate = weekStart < monthStart ? new Date(monthStart) : new Date(weekStart);
        // For current/incomplete weeks, show up to today or month end, whichever comes first
        const effectiveEndDate = weekEnd > today ? (today > monthEnd ? new Date(monthEnd) : new Date(today)) : (weekEnd > monthEnd ? new Date(monthEnd) : new Date(weekEnd));
        const endDate = effectiveEndDate;
        
        // Format label
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
        
        let label: string;
        if (startMonth === endMonth) {
          label = `${startMonth} ${startDay}-${endDay}`;
        } else {
          label = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
        }
        
        weeks.push({
          weekNumber,
          startDate: startDate,
          endDate: endDate,
          monthKey,
          weekKey: formatWeekKey(monthKey, weekNumber),
          label,
        });
      }
    }
    
    // Move to next week
    weekStart.setDate(weekStart.getDate() + 7);
    weekNumber++;
  }
  
  return weeks;
};

interface WeekSelectorProps {
  monthKey: string; // Format: YYYY-MM
  selectedWeek?: string; // Format: YYYY-MM-WW
  onWeekSelect: (weekKey: string) => void;
}

export default function WeekSelector({
  monthKey,
  selectedWeek,
  onWeekSelect,
}: WeekSelectorProps) {
  const weekScrollRef = useRef<ScrollView>(null);

  const weeks = useMemo(() => {
    return getWeeksInMonth(monthKey);
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
      <Text style={styles.label}>Select Week</Text>
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
