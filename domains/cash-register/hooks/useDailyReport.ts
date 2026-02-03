import apiClient from "@/api/client";
import { getDisplayDate, getDisplayDateString } from "@/utils/getDisplayDate";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DailyReportData } from "../types/dailyReport";

// Date utility functions
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateString: string): Date => {
  return new Date(dateString + "T00:00:00");
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

// Check if date is on or before display date (21:00 GMT rule)
const isPastDate = (date: Date): boolean => {
  return formatDateString(date) <= getDisplayDateString();
};

// Check if current UTC day is the display date (for canNavigateNext)
const isCurrentDayAvailable = (): boolean => {
  return new Date().getUTCHours() >= 21;
};

// Get default date (display date per 21:00 GMT rule)
const getDefaultDate = (): Date => getDisplayDate();

export const useDailyReport = () => {
  const params = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.date) {
      const parsedDate = parseDateString(params.date);
      // If the parsed date is valid (past or today after 21:00 GMT), use it
      if (isPastDate(parsedDate)) {
        return parsedDate;
      }
      // Otherwise, use default date
      return getDefaultDate();
    }
    // Default to today (if after 21:00 GMT) or yesterday
    return getDefaultDate();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(selectedDate);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingBreakdown, setUpdatingBreakdown] = useState(false);

  // Use ref to track the current request's date to prevent race conditions
  const currentRequestDateRef = useRef<string>("");

  // Fetch daily report data when selectedDate changes
  useEffect(() => {
    // Clear old data immediately when date changes
    setReportData(null);
    setError(null);

    const dateString = formatDateString(selectedDate);
    currentRequestDateRef.current = dateString;

    const fetchDailyReport = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<DailyReportData>(
          "/kpi/daily-report",
          {
            params: {
              date: dateString,
            },
          },
        );

        // Verify this response is still for the current selected date
        // (prevents race conditions if user switches dates quickly)
        if (currentRequestDateRef.current !== dateString) {
          // Date changed while request was in flight, ignore this response
          return;
        }

        // Check if response is empty (no data)
        if (!data || Object.keys(data).length === 0) {
          setReportData(null);
        } else {
          setReportData(data);
        }
      } catch (err: any) {
        // Verify this error is still for the current selected date
        if (currentRequestDateRef.current !== dateString) {
          // Date changed while request was in flight, ignore this error
          return;
        }

        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch daily report";
        setError(errorMessage);
        setReportData(null);
        console.error("Error fetching daily report:", err);
      } finally {
        // Only update loading state if this is still the current date
        if (currentRequestDateRef.current === dateString) {
          setLoading(false);
        }
      }
    };

    fetchDailyReport();
  }, [selectedDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = getFirstDayOfMonth(calendarDate);
    const daysInMonth = getDaysInMonth(calendarDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day),
      );
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
    // Can navigate to next month if it's before today (or today if after 21:00 GMT)
    const maxDate = isCurrentDayAvailable()
      ? today
      : new Date(today.getTime() - 24 * 60 * 60 * 1000);
    return nextMonth <= maxDate;
  }, [calendarDate]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setCalendarDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (direction === "next" && canNavigateNext) {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) {
      setSelectedDate(date);
      setShowDatePicker(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (event.type === "set" && date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const updateRevenueBreakdown = async (tpe: number) => {
    const dateString = formatDateString(selectedDate);
    try {
      setUpdatingBreakdown(true);
      setError(null);
      const { data } = await apiClient.patch<DailyReportData>(
        "/kpi/daily-report/revenue-breakdown",
        { tpe },
        { params: { date: dateString } }
      );
      if (data) {
        setReportData(data);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to update revenue breakdown";
      setError(errorMessage);
      console.error("Error updating revenue breakdown:", err);
      throw err;
    } finally {
      setUpdatingBreakdown(false);
    }
  };

  return {
    // State
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,
    calendarDate,
    setCalendarDate,
    reportData,
    loading,
    error,
    updatingBreakdown,
    // Computed values
    calendarDays,
    monthYearLabel,
    weekDayLabels,
    canNavigateNext,
    // Functions
    formatDate,
    isSameDay,
    isToday,
    isPastDate,
    handleMonthChange,
    handleDateSelect,
    handleDateChange,
    updateRevenueBreakdown,
  };
};
