import { Text } from '@/components/Themed';
import Colors, { BluePalette } from '@/constants/Colors';
import AlertList from '@/domains/alerts/components/AlertList';
import DateSelector from '@/domains/alerts/components/DateSelector';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface AlertScreenProps {
  backgroundColor?: string;
}

export default function AlertScreen({ backgroundColor }: AlertScreenProps) {
  const bgColor = backgroundColor || Colors.dark.background || BluePalette.background;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Bottom bar height: 15px + bottom safe area inset
  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;
  const bottomPadding = bottomBarTotalHeight + 24;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: BluePalette.backgroundCard }]}
      edges={['left', 'right']}
    >
      {/* Header with back button */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 5 }]}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Alertes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Date Selector Blue Bar */}
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
      
      {/* Bottom Bar */}
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
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

