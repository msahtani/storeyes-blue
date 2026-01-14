import apiClient from '@/api/client';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { DailyReportData } from '../types/dailyReport';

// Date utility functions
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
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

const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  return dateToCheck < today;
};

export const useDailyReport = () => {
  const params = useLocalSearchParams<{ date?: string }>();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.date) {
      const parsedDate = parseDateString(params.date);
      // If the parsed date is today or future, default to yesterday
      if (!isPastDate(parsedDate)) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }
      return parsedDate;
    }
    // Default to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(selectedDate);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch daily report data when selectedDate changes
  useEffect(() => {
    const fetchDailyReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const dateString = formatDateString(selectedDate);
        const { data } = await apiClient.get<DailyReportData>('/kpi/daily-report', {
          params: {
            date: dateString,
          },
        });
        
        // Check if response is empty (no data)
        if (!data || Object.keys(data).length === 0) {
          setReportData(null);
        } else {
          setReportData(data);
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || 'Failed to fetch daily report';
        setError(errorMessage);
        setReportData(null);
        console.error('Error fetching daily report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyReport();
  }, [selectedDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    }

    return days;
  }, [calendarDate]);

  const monthYearLabel = useMemo(() => {
    return calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarDate]);

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const canNavigateNext = useMemo(() => {
    const nextMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nextMonth < today;
  }, [calendarDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCalendarDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else if (direction === 'next' && canNavigateNext) {
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
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
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
  };
};

