import Colors from '@/constants/Colors';
import AlertList from '@/domains/alerts/components/AlertList';
import DateSelector from '@/domains/alerts/components/DateSelector';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';

interface HomeScreenProps {
  backgroundColor?: string;
}

export default function HomeScreen({ backgroundColor }: HomeScreenProps) {
  const bgColor = backgroundColor || Colors.dark.background || '#0A1929';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <DateSelector />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <AlertList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

