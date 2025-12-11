import { Text } from '@/components/Themed';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAlerts, setSelectedDate } from '@/domains/alerts/store/alertsSlice';

interface DateItem {
  label: string;
  date: string;
}

const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

const formatLabel = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const getLast7DaysFromYesterday = (): DateItem[] => {
  const items: DateItem[] = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    items.push({
      label: formatLabel(d),
      date: formatDate(d),
    });
  }

  return items;
};

const dates: DateItem[] = getLast7DaysFromYesterday();

export default function DateSelector() {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.alerts.selectedDate);

  useEffect(() => {
    if (!selectedDate) return;

    const start = `${selectedDate}T00:00:00`;
    const end = `${selectedDate}T23:59:59`;
    dispatch(fetchAlerts({ date: start, endDate: end }));
  }, [dispatch, selectedDate]);

  return (
    <ScrollView 
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
              styles.dateButton,
              isSelected && styles.dateButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.dateText,
                isSelected && styles.dateTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    alignItems: 'center',
  },
  dateButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dateButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  dateTextSelected: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

