import Colors, { BluePalette } from '@/constants/Colors';
import AlertList from '@/domains/alerts/components/AlertList';
import DateSelector from '@/domains/alerts/components/DateSelector';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface HomeScreenProps {
  backgroundColor?: string;
}

export default function HomeScreen({ backgroundColor }: HomeScreenProps) {
  const bgColor = backgroundColor || Colors.dark.background || BluePalette.background;
  const insets = useSafeAreaInsets();
  
  // Tab bar total height: 65px base + bottom safe area inset
  // Add extra padding to ensure content doesn't overlap
  const tabBarBaseHeight = 65;
  const tabBarTotalHeight = tabBarBaseHeight + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 8; // Extra 8px for spacing

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: BluePalette.backgroundCard }]}
      edges={['left', 'right']}
    >
      <View style={styles.headerSection}>
        <DateSelector />
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AlertList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  headerSection: {
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    marginTop: 0,
    paddingTop: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

