import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import { getMonthForWeek, getWeeksForMonth, parseWeekKey as parseWeekKeyUtil } from '@/domains/charges/utils/weekUtils';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PeriodType } from '../types/statistics';

interface StatisticsDateSelectorProps {
  period: PeriodType;
  selectedDate?: string; // Format: 'YYYY-MM' for month, 'YYYY-MM-DD' for week (start date)
  onDateSelect: (dateKey: string) => void;
  onPeriodChange?: (period: PeriodType) => void;
}

// Helper to format month key
const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper to parse month key
const parseMonthKey = (monthKey: string): Date => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

// Helper to format week key (start date format)
const formatWeekKey = (weekStart: Date): string => {
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, '0');
  const day = String(weekStart.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse week key
const parseWeekKey = (weekKey: string): Date => {
  return new Date(weekKey + 'T00:00:00');
};

// Helper to get start of week (Sunday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day; // Subtract days to get to Sunday
  return new Date(d.setDate(diff));
};

// Helper to get end of week
const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

// Month interface
interface MonthItem {
  month: string;
  monthName: string;
  year: number;
  monthIndex: number;
  dateKey: string;
}

// Week interface (for weeks within a month)
interface WeekItem {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  monthKey: string;
  weekKey: string;
  label: string;
}

// Get months (last 6 months)
const getMonths = (count: number = 6): MonthItem[] => {
  const months: MonthItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

// Get weeks in a month using the same logic as charges service (Monday-Sunday)
const getWeeksInMonth = (monthKey: string): WeekItem[] => {
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
      weekNumber: index + 1,
      startDate: week.startDate,
      endDate: week.endDate,
      monthKey: monthKey,
      weekKey: week.weekKey, // Format: YYYY-MM-DD (Monday date)
      label: week.label,
    }));
};

export default function StatisticsDateSelector({
  period,
  selectedDate,
  onDateSelect,
  onPeriodChange,
}: StatisticsDateSelectorProps) {
  const { t } = useI18n();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    if (selectedDate) {
      return period === 'month' ? parseMonthKey(selectedDate) : parseWeekKeyUtil(selectedDate);
    }
    return new Date();
  });

  const monthScrollRef = useRef<ScrollView>(null);
  const weekScrollRef = useRef<ScrollView>(null);

  const months = useMemo(() => getMonths(6), []);

  // For week period: extract month from selectedDate or use selectedMonth
  const currentMonthForWeeks = useMemo(() => {
    if (period === 'week') {
      if (selectedDate) {
        // Extract month from week key (format: YYYY-MM-DD, Monday date)
        try {
          const weekMonday = parseWeekKeyUtil(selectedDate);
          return getMonthForWeek(selectedDate);
        } catch {
          // Fallback to parsing manually
          const parts = selectedDate.split('-');
          if (parts.length >= 2) {
            return `${parts[0]}-${parts[1]}`;
          }
        }
      }
      return selectedMonth || formatMonthKey(new Date());
    }
    return null;
  }, [period, selectedDate, selectedMonth]);

  const weeks = useMemo(() => {
    if (period === 'week' && currentMonthForWeeks) {
      return getWeeksInMonth(currentMonthForWeeks);
    }
    return [];
  }, [period, currentMonthForWeeks]);

  // Initialize with current month/week if no selection
  useEffect(() => {
    if (!selectedDate) {
      if (period === 'month' && months.length > 0) {
        onDateSelect(months[0].dateKey);
      } else if (period === 'week' && months.length > 0) {
        const firstMonth = months[0].dateKey;
        setSelectedMonth(firstMonth);
        const weeksInMonth = getWeeksInMonth(firstMonth);
        if (weeksInMonth.length > 0) {
          onDateSelect(weeksInMonth[0].weekKey); // Use weekKey (YYYY-MM-DD format)
        }
      }
    }
  }, [selectedDate, period, months, onDateSelect]);

  // Update selectedMonth when period is week and selectedDate changes
  useEffect(() => {
    if (period === 'week' && selectedDate) {
      try {
        const monthKey = getMonthForWeek(selectedDate);
        if (monthKey !== selectedMonth) {
          setSelectedMonth(monthKey);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [period, selectedDate, selectedMonth]);

  // Update calendar date when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const date = period === 'month' ? parseMonthKey(selectedDate) : parseWeekKeyUtil(selectedDate);
      setCalendarDate(date);
    }
  }, [selectedDate, period]);

  // Scroll to selected month
  useEffect(() => {
    if (selectedDate && monthScrollRef.current) {
      const monthKey = period === 'month' ? selectedDate : currentMonthForWeeks;
      if (monthKey) {
        const selectedIndex = months.findIndex((m) => m.dateKey === monthKey);
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
    }
  }, [selectedDate, months, period, currentMonthForWeeks]);

  // Scroll to selected week
  useEffect(() => {
    if (period === 'week' && selectedDate && weekScrollRef.current && weeks.length > 0) {
      // Find week by weekKey match
      const selectedIndex = weeks.findIndex((w) => w.weekKey === selectedDate);
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
  }, [selectedDate, weeks, period]);

  const handleHeaderPress = () => {
    if (selectedDate) {
      const date = period === 'month' ? parseMonthKey(selectedDate) : parseWeekKeyUtil(selectedDate);
      setCalendarDate(date);
    }
    setShowCalendar(true);
  };

  const handleMonthSelectFromCalendar = (date: Date) => {
    const monthKey = formatMonthKey(date);
    if (period === 'month') {
      onDateSelect(monthKey);
    } else {
      // For week period, select month first
      setSelectedMonth(monthKey);
      const weeksInMonth = getWeeksInMonth(monthKey);
      if (weeksInMonth.length > 0) {
        onDateSelect(weeksInMonth[0].weekKey); // Use weekKey (YYYY-MM-DD format)
      }
    }
    setShowCalendar(false);
  };

  const handleMonthPress = (monthKey: string) => {
    if (period === 'month') {
      onDateSelect(monthKey);
    } else {
      // For week period, select month first
      setSelectedMonth(monthKey);
      const weeksInMonth = getWeeksInMonth(monthKey);
      if (weeksInMonth.length > 0) {
        onDateSelect(weeksInMonth[0].weekKey); // Use weekKey (YYYY-MM-DD format)
      }
    }
  };

  const handleWeekPress = (week: WeekItem) => {
    onDateSelect(week.weekKey); // Use weekKey (YYYY-MM-DD format)
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

  const selectedDisplay = useMemo(() => {
    if (!selectedDate) return period === 'month' ? t('common.selectMonth') : t('common.selectWeek');

    if (period === 'month') {
      const date = parseMonthKey(selectedDate);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } else {
      // For week, show the week range using new week key format
      try {
        const weekStart = parseWeekKeyUtil(selectedDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday
        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
        const startDay = weekStart.getDate();
        const endDay = weekEnd.getDate();

        if (startMonth === endMonth) {
          return `${startMonth} ${startDay}-${endDay}, ${weekStart.getFullYear()}`;
        } else {
          return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${weekStart.getFullYear()}`;
        }
      } catch {
        return t('common.selectWeek');
      }
    }
  }, [selectedDate, period]);

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
      {/* Period Selector - Match ChargesScreen style */}
      <View style={styles.tabSelector}>
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            period === 'month' && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => {
            onPeriodChange?.('month');
            setSelectedMonth(null);
            setSelectedWeek(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              period === 'month' && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            {t('common.month')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tabButton,
            period === 'week' && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          onPress={() => {
            onPeriodChange?.('week');
            setSelectedMonth(null);
            setSelectedWeek(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              period === 'week' && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            {t('common.week')}
          </Text>
        </Pressable>
      </View>

      {/* Month Period: Show month selector */}
      {period === 'month' && (
        <>
          <Pressable onPress={handleHeaderPress} style={styles.header}>
            <Text style={styles.headerText}>{selectedDisplay}</Text>
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
              const isSelected = month.dateKey === selectedDate;
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
        </>
      )}

      {/* Week Period: Show month cards first, then weeks */}
      {period === 'week' && (
        <>
          <Pressable onPress={handleHeaderPress} style={styles.header}>
            <Text style={styles.headerText}>
              {selectedMonth ? parseMonthKey(selectedMonth).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              }) : t('common.selectMonth')}
            </Text>
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
              const isSelected = month.dateKey === currentMonthForWeeks;
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

          {/* Week Selector */}
          {currentMonthForWeeks && weeks.length > 0 && (
            <View style={styles.weekSelectorContainer}>
              <Text style={styles.weekLabel}>{t('common.selectWeek')}</Text>
              <ScrollView
                ref={weekScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.weekScrollView}
                contentContainerStyle={styles.weekScrollContent}
              >
                {weeks.map((week) => {
                  const isSelected = selectedDate === week.weekKey;
                  return (
                    <Pressable
                      key={week.weekKey}
                      onPress={() => handleWeekPress(week)}
                      style={[
                        styles.weekCard,
                        isSelected && styles.weekCardSelected,
                      ]}
                    >
                      <Text style={[styles.weekCardLabel, isSelected && styles.weekCardLabelSelected]}>
                        {week.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </>
      )}

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
              <Text style={styles.calendarTitle}>
                {t('common.selectMonth')}
              </Text>
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
                  period === 'month'
                    ? selectedDate && formatMonthKey(date) === selectedDate
                    : currentMonthForWeeks && formatMonthKey(date) === currentMonthForWeeks;
                const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
                const today = new Date();
                const isToday =
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();

                return (
                  <Pressable
                    key={`${date.getTime()}-${index}`}
                    onPress={() => handleMonthSelectFromCalendar(date)}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isToday && !isSelected && styles.calendarDayToday,
                      !isCurrentMonth && styles.calendarDayOtherMonth,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday,
                        !isCurrentMonth && styles.calendarDayTextOtherMonth,
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
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: BluePalette.selectedBackground,
    borderColor: BluePalette.merge,
    borderWidth: 1.5,
  },
  tabButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  tabTextActive: {
    color: BluePalette.merge,
    fontWeight: '700',
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
  weekSelectorContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  weekScrollView: {
    flexGrow: 0,
  },
  weekScrollContent: {
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
  weekCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textSecondary,
  },
  weekCardLabelSelected: {
    color: BluePalette.merge,
    fontWeight: '700',
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
});
