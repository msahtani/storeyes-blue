import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { setSelectedDate } from '@/domains/alerts/store/alertsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface DateItem {
  month: string;
  day: string;
  dayName: string;
  date: string;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

// Get the last 7 available days (not week-based)
const getLast7Days = (): DateItem[] => {
  const items: DateItem[] = [];
  const today = new Date();
  let daysAdded = 0;
  let dayOffset = 0;

  // Start from today (if available) or yesterday
  while (daysAdded < 7 && dayOffset < 30) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOffset);

    if (isPastDate(d)) {
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate().toString();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      items.push({
        month,
        day,
        dayName,
        date: formatDate(d),
      });
      daysAdded++;
    }
    dayOffset++;
  }

  return items;
};

// Get last 7 days including selected date
const getLast7DaysFromDate = (dateString: string): DateItem[] => {
  const selectedDate = parseDateString(dateString);
  const items: DateItem[] = [];
  const dateSet = new Set<string>();

  // Start from the selected date and go backwards to get 7 days
  let dayOffset = 0;
  let daysAdded = 0;

  while (daysAdded < 7 && dayOffset < 30) {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() - dayOffset);
    const dateKey = formatDate(d);

    if (isPastDate(d) && !dateSet.has(dateKey)) {
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate().toString();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      items.push({
        month,
        day: dayNum,
        dayName,
        date: dateKey,
      });
      dateSet.add(dateKey);
      daysAdded++;
    }
    dayOffset++;
  }

  // Sort by date descending (newest first)
  items.sort((a, b) => {
    const dateA = parseDateString(a.date).getTime();
    const dateB = parseDateString(b.date).getTime();
    return dateB - dateA;
  });

  return items;
};

const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

// Check if current day should be available
// Logic: Day X is available after 21:00 GMT on day X, until 21:00 GMT on day X+1
// Example: Jan 25 is available from Jan 25 21:00 GMT until Jan 26 21:00 GMT
const isCurrentDayAvailable = (): boolean => {
  const now = new Date();
  const gmtHours = now.getUTCHours();
  // Available if GMT time is >= 21:00 (9:00 PM)
  return gmtHours >= 21;
};

const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  // If comparing today, check if it's after 21:00 GMT (9:00 PM)
  if (isSameDay(date, today)) {
    return isCurrentDayAvailable();
  }

  return compareDate < today; // Past dates are always available
};

// Get default date (today if >= 21:00 GMT, otherwise yesterday)
const getDefaultDate = (): string => {
  const today = new Date();
  if (isCurrentDayAvailable()) {
    return formatDate(today);
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return formatDate(yesterday);
};

export default function DailyReportDateSelector() {
  const dispatch = useAppDispatch();
  const selectedDateFromStore = useAppSelector((state) => state.alerts.selectedDate);

  const selectedDate = selectedDateFromStore || getDefaultDate();

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    return selectedDate ? parseDateString(selectedDate) : new Date();
  });
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate dates - show last 7 days, but include selected date if it's outside that range
  const dates = useMemo(() => {
    const last7Days = getLast7Days();

    // If selected date is in the last 7 days, return them as is
    if (selectedDate && last7Days.some(d => d.date === selectedDate)) {
      return last7Days;
    }

    // If selected date is outside the last 7 days, show 7 days including the selected date
    if (selectedDate) {
      return getLast7DaysFromDate(selectedDate);
    }

    return last7Days;
  }, [selectedDate]);

  // Initialize with default date if no date is set
  useEffect(() => {
    if (!selectedDateFromStore) {
      const defaultDate = getDefaultDate();
      dispatch(setSelectedDate(defaultDate));
    }
  }, [dispatch, selectedDateFromStore]);

  // Scroll to selected date when it changes or dates array updates
  useEffect(() => {
    if (selectedDate && scrollViewRef.current && dates.length > 0) {
      const selectedIndex = dates.findIndex((d) => d.date === selectedDate);
      if (selectedIndex !== -1) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              x: selectedIndex * 82,
              animated: true,
            });
          }, 150);
        });
      }
    }
  }, [selectedDate, dates]);

  // Update calendar date when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCalendarDate(parseDateString(selectedDate));
    }
  }, [selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) {
      const defaultDate = parseDateString(getDefaultDate());
      return defaultDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    const date = parseDateString(selectedDate);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const handleHeaderPress = () => {
    if (selectedDate) {
      setCalendarDate(parseDateString(selectedDate));
    } else {
      setCalendarDate(parseDateString(getDefaultDate()));
    }
    setShowCalendar(true);
  };

  const handleDateSelect = (date: Date) => {
    // Only allow past dates (including today if >= 21:00 GMT)
    if (!isPastDate(date)) return;
    const formattedDate = formatDate(date);
    dispatch(setSelectedDate(formattedDate));
    setShowCalendar(false);

    setCalendarDate(date);
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

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
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

  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Can navigate to next month if it's before today (or today if after 21:00 GMT)
    const maxDate = isCurrentDayAvailable() ? today : new Date(today.getTime() - 24 * 60 * 60 * 1000);
    return nextMonth <= maxDate;
  }, [calendarDate]);

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handleHeaderPress} style={styles.header}>
        <Text style={styles.headerText}>{selectedDateFormatted}</Text>
        <Feather name="chevron-down" size={18} color={BluePalette.merge} />
      </Pressable>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        {dates.map((item) => {
          const isSelected = item.date === selectedDate;
          return (
            <Pressable
              key={item.date}
              onPress={() => dispatch(setSelectedDate(item.date))}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
              ]}
            >
              <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                {item.month}
              </Text>
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {item.day}
              </Text>
              <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>
                {item.dayName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
              <Text style={styles.calendarTitle}>Select Date</Text>
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
                  return <View key={`empty-${calendarDate.getTime()}-${index}`} style={styles.calendarDay} />;
                }

                const isSelected = selectedDate ? isSameDay(date, parseDateString(selectedDate)) : false;
                const isCurrentDay = isToday(date);
                const isDisabled = !isPastDate(date);

                return (
                  <Pressable
                    key={`${formatDate(date)}-${calendarDate.getFullYear()}-${calendarDate.getMonth()}-${index}`}
                    onPress={() => handleDateSelect(date)}
                    disabled={isDisabled}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isCurrentDay && !isSelected && styles.calendarDayToday,
                      isDisabled && styles.calendarDayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isCurrentDay && !isSelected && styles.calendarDayTextToday,
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
    marginTop: 0,
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
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  dateCard: {
    width: 70,
    height: 90,
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
  dateCardSelected: {
    backgroundColor: BluePalette.selected,
    shadowColor: BluePalette.selected,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: BluePalette.mergeLight,
  },
  monthText: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  monthTextSelected: {
    color: BluePalette.white,
  },
  dayText: {
    fontSize: 28,
    fontWeight: '700',
    color: BluePalette.textDark,
    marginBottom: 2,
  },
  dayTextSelected: {
    color: BluePalette.white,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '500',
    color: BluePalette.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  dayNameTextSelected: {
    color: BluePalette.white,
    opacity: 1,
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
  calendarDayTextDisabled: {
    color: BluePalette.textTertiary,
  },
});
