import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export interface MonthItem {
  month: string;
  monthName: string;
  year: number;
  monthIndex: number; // 0-11
  dateKey: string; // Format: YYYY-MM
}

const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const parseMonthKey = (monthKey: string): Date => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

const getMonths = (count: number = 6): MonthItem[] => {
  const months: MonthItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from current month (i=0) because personnel data can be available in current month
  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = formatMonthKey(date);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    months.push({
      month,
      monthName,
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      dateKey: monthKey,
    });
  }
  
  return months;
};

interface ChargesDateSelectorProps {
  selectedMonth?: string; // Format: YYYY-MM
  onMonthSelect?: (monthKey: string) => void;
}

export default function ChargesDateSelector({
  selectedMonth,
  onMonthSelect,
}: ChargesDateSelectorProps) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(selectedMonth || null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    if (selectedMonth) {
      return parseMonthKey(selectedMonth);
    }
    return new Date();
  });
  
  const monthScrollRef = useRef<ScrollView>(null);

  const months = useMemo(() => getMonths(6), []);

  // Initialize with current month if no selection
  useEffect(() => {
    if (!selectedMonth && !expandedMonth) {
      const currentMonth = formatMonthKey(new Date());
      setExpandedMonth(currentMonth);
      onMonthSelect?.(currentMonth);
    }
  }, [selectedMonth, expandedMonth, onMonthSelect]);

  // Update expanded month when selectedMonth changes externally
  useEffect(() => {
    if (selectedMonth && selectedMonth !== expandedMonth) {
      setExpandedMonth(selectedMonth);
    }
  }, [selectedMonth, expandedMonth]);

  // Scroll to selected month
  useEffect(() => {
    if (expandedMonth && monthScrollRef.current) {
      const selectedIndex = months.findIndex((m) => m.dateKey === expandedMonth);
      if (selectedIndex !== -1) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            monthScrollRef.current?.scrollTo({
              x: selectedIndex * 100, // Approximate width + gap
              animated: true,
            });
          }, 150);
        });
      }
    }
  }, [expandedMonth, months]);

  const handleMonthPress = (monthKey: string) => {
    setExpandedMonth(monthKey);
    onMonthSelect?.(monthKey);
  };

  const handleHeaderPress = () => {
    if (expandedMonth) {
      setCalendarDate(parseMonthKey(expandedMonth));
    }
    setShowCalendar(true);
  };

  const handleMonthSelectFromCalendar = (date: Date) => {
    const monthKey = formatMonthKey(date);
    handleMonthPress(monthKey);
    setShowCalendar(false);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    if (direction === 'prev') {
      newDate.setMonth(calendarDate.getMonth() - 1);
    } else {
      newDate.setMonth(calendarDate.getMonth() + 1);
    }
    setCalendarDate(newDate);
  };

  const selectedMonthDisplay = useMemo(() => {
    if (!expandedMonth) return 'Select Month';
    const date = parseMonthKey(expandedMonth);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [expandedMonth]);


  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nextMonth <= today;
  }, [calendarDate]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [calendarDate]);

  const monthYearLabel = useMemo(() => {
    return calendarDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [calendarDate]);

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handleHeaderPress} style={styles.header}>
        <Text style={styles.headerText}>{selectedMonthDisplay}</Text>
        <Feather name="chevron-down" size={18} color={BluePalette.merge} />
      </Pressable>

      {/* Month Cards */}
      <ScrollView
        ref={monthScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthScrollView}
        contentContainerStyle={styles.monthContainer}
      >
        {months.map((month) => {
          const isSelected = month.dateKey === expandedMonth;
          return (
            <Pressable
              key={month.dateKey}
              onPress={() => handleMonthPress(month.dateKey)}
              style={[
                styles.monthCard,
                isSelected && styles.monthCardSelected,
              ]}
            >
              <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                {month.month}
              </Text>
              <Text style={[styles.yearText, isSelected && styles.yearTextSelected]}>
                {month.year}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>


      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Month</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Feather name="x" size={24} color={BluePalette.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.calendarNavigation}>
              <Pressable
                onPress={() => handleMonthChange('prev')}
                style={styles.navButton}
              >
                <Feather name="chevron-left" size={20} color={BluePalette.textPrimary} />
              </Pressable>
              <Text style={styles.monthYearText}>{monthYearLabel}</Text>
              <Pressable
                onPress={() => handleMonthChange('next')}
                style={styles.navButton}
                disabled={!canNavigateNext}
              >
                <Feather
                  name="chevron-right"
                  size={20}
                  color={canNavigateNext ? BluePalette.textPrimary : BluePalette.textTertiary}
                />
              </Pressable>
            </View>

            <View style={styles.calendarWeekDays}>
              {weekDayLabels.map((day) => (
                <View key={day} style={styles.weekDayHeader}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <View
                      key={`empty-${calendarDate.getTime()}-${index}`}
                      style={styles.calendarDay}
                    />
                  );
                }

                const isSelected =
                  expandedMonth && formatMonthKey(date) === expandedMonth;
                const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
                const today = new Date();
                const isToday =
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
                
                // Allow current month (personnel data can be available)
                const isDisabled = false;

                return (
                  <Pressable
                    key={`${date.getTime()}-${index}`}
                    onPress={() => !isDisabled && handleMonthSelectFromCalendar(date)}
                    disabled={isDisabled}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isToday && !isSelected && styles.calendarDayToday,
                      !isCurrentMonth && styles.calendarDayOtherMonth,
                      isDisabled && styles.calendarDayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday,
                        !isCurrentMonth && styles.calendarDayTextOtherMonth,
                        isDisabled && styles.calendarDayTextDisabled,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: BluePalette.backgroundNew,
    paddingTop: 0,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    letterSpacing: -0.3,
  },
  monthScrollView: {
    flexGrow: 0,
  },
  monthContainer: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  monthCard: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: BluePalette.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthCardSelected: {
    backgroundColor: BluePalette.selected,
    shadowColor: BluePalette.selected,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: BluePalette.mergeLight,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  monthTextSelected: {
    color: BluePalette.white,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textDark,
  },
  yearTextSelected: {
    color: BluePalette.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: BluePalette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.divider,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BluePalette.surface,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  calendarDaySelected: {
    backgroundColor: BluePalette.selected,
    borderWidth: 2,
    borderColor: BluePalette.mergeLight,
  },
  calendarDayToday: {
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: BluePalette.textDark,
  },
  calendarDayTextSelected: {
    color: BluePalette.white,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: BluePalette.merge,
    fontWeight: '700',
  },
  calendarDayTextOtherMonth: {
    color: BluePalette.textTertiary,
  },
  calendarDayTextDisabled: {
    color: BluePalette.textTertiary,
    opacity: 0.5,
  },
});
