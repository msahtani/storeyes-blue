import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import {
  fetchAlerts,
  setSelectedDate,
} from "@/domains/alerts/store/alertsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getDisplayDateString } from "@/utils/getDisplayDate";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface DateItem {
  month: string;
  day: string;
  dayName: string;
  date: string;
}

const formatDate = (date: Date): string => {
  // Format date in local timezone to avoid UTC conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateString: string): Date => {
  return new Date(dateString + "T00:00:00");
};

const getDefaultDates = (): DateItem[] => {
  return getLast7Days();
};

// Get the last 7 available days (from display date, 21:00 GMT rule)
const getLast7Days = (): DateItem[] => {
  const items: DateItem[] = [];
  const displayDateStr = getDisplayDateString();
  const [y, m, d] = displayDateStr.split("-").map(Number);

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(Date.UTC(y, m - 1, d - offset));
    const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

    items.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      day: date.getUTCDate().toString(),
      dayName: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      date: dateStr,
    });
  }

  return items;
};

// Get last 7 days including selected date (using display date logic)
const getLast7DaysFromDate = (dateString: string): DateItem[] => {
  const [y, m, d] = dateString.split("-").map(Number);
  const items: DateItem[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(Date.UTC(y, m - 1, d - offset));
    const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

    if (isPastDateByString(dateStr)) {
      items.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        day: date.getUTCDate().toString(),
        dayName: date.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        }),
        date: dateStr,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
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

// Check if date string is on or before display date (21:00 GMT rule)
const isPastDateByString = (dateStr: string): boolean => {
  return dateStr <= getDisplayDateString();
};

// Check if date is available (on or before display date)
const isPastDate = (date: Date): boolean => {
  const dateStr = formatDate(date);
  return isPastDateByString(dateStr);
};

// Check if current UTC day is the display date (for canNavigateNext)
const isCurrentDayAvailable = (): boolean => {
  return new Date().getUTCHours() >= 21;
};

// Get default date (display date per 21:00 GMT rule)
const getDefaultDate = (): string => getDisplayDateString();

// --- Charges variant: use calendar today (local), show and allow selecting current day ---
const getLast7DaysIncludingToday = (): DateItem[] => {
  const items: DateItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const dateStr = formatDate(date);
    items.push({
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: date.getDate().toString(),
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: dateStr,
    });
  }
  return items.sort((a, b) => b.date.localeCompare(a.date));
};

const getLast7DaysFromDateCharges = (dateString: string): DateItem[] => {
  const date = parseDateString(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items: DateItem[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(date);
    d.setDate(date.getDate() - offset);
    const dateStr = formatDate(d);
    if (d <= today) {
      items.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        day: d.getDate().toString(),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateStr,
      });
    }
  }
  return items.sort((a, b) => b.date.localeCompare(a.date));
};

const isPastDateOrTodayCharges = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
};

const getDefaultDateCharges = (): string => formatDate(new Date());

export type DateSelectorVariant = "alerts" | "charges";

interface DateSelectorProps {
  /** When "charges", shows current day and allows selecting it. Default "alerts" uses 21:00 GMT display date. */
  variant?: DateSelectorVariant;
}

export default function DateSelector({ variant = "alerts" }: DateSelectorProps) {
  const dispatch = useAppDispatch();
  const selectedDateFromStore = useAppSelector(
    (state) => state.alerts.selectedDate,
  );

  const isCharges = variant === "charges";
  const selectedDate =
    selectedDateFromStore ||
    (isCharges ? getDefaultDateCharges() : getDefaultDate());

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    return selectedDate ? parseDateString(selectedDate) : new Date();
  });
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate dates - show last 7 days, but include selected date if it's outside that range
  const dates = useMemo(() => {
    if (isCharges) {
      const last7Days = getLast7DaysIncludingToday();
      if (selectedDate && last7Days.some((d) => d.date === selectedDate)) {
        return last7Days;
      }
      if (selectedDate) {
        return getLast7DaysFromDateCharges(selectedDate);
      }
      return last7Days;
    }

    const last7Days = getLast7Days();
    if (selectedDate && last7Days.some((d) => d.date === selectedDate)) {
      return last7Days;
    }
    if (selectedDate) {
      return getLast7DaysFromDate(selectedDate);
    }
    return last7Days;
  }, [selectedDate, isCharges]);

  // Initialize with default date if no date is set
  useEffect(() => {
    if (!selectedDateFromStore) {
      const defaultDate = isCharges ? getDefaultDateCharges() : getDefaultDate();
      dispatch(setSelectedDate(defaultDate));
    }
  }, [dispatch, selectedDateFromStore, isCharges]);

  useEffect(() => {
    if (!selectedDate || isCharges) return;

    const start = `${selectedDate}T00:00:00`;
    const end = `${selectedDate}T23:59:59`;
    dispatch(fetchAlerts({ date: start, endDate: end }));
  }, [dispatch, selectedDate, isCharges]);

  // Scroll to selected date when it changes or dates array updates
  useEffect(() => {
    if (selectedDate && scrollViewRef.current && dates.length > 0) {
      const selectedIndex = dates.findIndex((d) => d.date === selectedDate);
      if (selectedIndex !== -1) {
        // Use requestAnimationFrame to ensure the view is laid out
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              x: selectedIndex * 82, // 70 width + 12 gap
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
      const defaultStr = isCharges ? getDefaultDateCharges() : getDefaultDate();
      const defaultDate = parseDateString(defaultStr);
      return defaultDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    const date = parseDateString(selectedDate);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate, isCharges]);

  const handleHeaderPress = () => {
    if (selectedDate) {
      setCalendarDate(parseDateString(selectedDate));
    } else {
      const defaultStr = isCharges ? getDefaultDateCharges() : getDefaultDate();
      setCalendarDate(parseDateString(defaultStr));
    }
    setShowCalendar(true);
  };

  const isDateSelectable = (date: Date) =>
    isCharges ? isPastDateOrTodayCharges(date) : isPastDate(date);

  const handleDateSelect = (date: Date) => {
    if (!isDateSelectable(date)) return;
    const formattedDate = formatDate(date);
    dispatch(setSelectedDate(formattedDate));
    setShowCalendar(false);

    setCalendarDate(date);
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const newDate = new Date(calendarDate);
    if (direction === "prev") {
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth(),
        day,
      );
      days.push(date);
    }

    return days;
  }, [calendarDate]);

  const monthYearLabel = useMemo(() => {
    return calendarDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [calendarDate]);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      1,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = isCharges
      ? today
      : isCurrentDayAvailable()
        ? today
        : new Date(today.getTime() - 24 * 60 * 60 * 1000);
    return nextMonth <= maxDate;
  }, [calendarDate, isCharges]);

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
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
            >
              <Text
                style={[
                  styles.monthText,
                  isSelected && styles.monthTextSelected,
                ]}
              >
                {item.month}
              </Text>
              <Text
                style={[styles.dayText, isSelected && styles.dayTextSelected]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dayNameText,
                  isSelected && styles.dayNameTextSelected,
                ]}
              >
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
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.calendarContainer}
          >
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Feather name="x" size={24} color={BluePalette.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.calendarNavigation}>
              <Pressable
                onPress={() => handleMonthChange("prev")}
                style={styles.navButton}
              >
                <Feather
                  name="chevron-left"
                  size={20}
                  color={BluePalette.textPrimary}
                />
              </Pressable>
              <Text style={styles.monthYearText}>{monthYearLabel}</Text>
              <Pressable
                onPress={() => handleMonthChange("next")}
                style={styles.navButton}
                disabled={!canNavigateNext}
              >
                <Feather
                  name="chevron-right"
                  size={20}
                  color={
                    canNavigateNext
                      ? BluePalette.textPrimary
                      : BluePalette.textTertiary
                  }
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

                const isSelected = selectedDate
                  ? isSameDay(date, parseDateString(selectedDate))
                  : false;
                const isCurrentDay = isToday(date);
                const isDisabled = !isDateSelectable(date);
                const uniqueKey = `${formatDate(date)}-${calendarDate.getFullYear()}-${calendarDate.getMonth()}-${index}`;

                return (
                  <Pressable
                    key={uniqueKey}
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
                        isCurrentDay &&
                          !isSelected &&
                          styles.calendarDayTextToday,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: BluePalette.textPrimary,
    letterSpacing: -0.3,
  },
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "center",
  },
  dateCard: {
    width: 70,
    height: 90,
    borderRadius: 16,
    backgroundColor: BluePalette.white,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: "#000",
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
    fontWeight: "600",
    color: BluePalette.textDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  monthTextSelected: {
    color: BluePalette.white,
  },
  dayText: {
    fontSize: 28,
    fontWeight: "700",
    color: BluePalette.textDark,
    marginBottom: 2,
  },
  dayTextSelected: {
    color: BluePalette.white,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: "500",
    color: BluePalette.textDark,
    textTransform: "uppercase",
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
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.divider,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BluePalette.textPrimary,
  },
  calendarNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BluePalette.surface,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  calendarWeekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: BluePalette.textTertiary,
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "500",
    color: BluePalette.textDark,
  },
  calendarDayTextSelected: {
    color: BluePalette.white,
    fontWeight: "700",
  },
  calendarDayTextToday: {
    color: BluePalette.merge,
    fontWeight: "700",
  },
  calendarDayTextDisabled: {
    color: BluePalette.textTertiary,
  },
});
