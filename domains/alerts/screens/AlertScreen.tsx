import { Text } from '@/components/Themed';
import Colors, { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import AlertList from '@/domains/alerts/components/AlertList';
import DateSelector from '@/domains/alerts/components/DateSelector';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchAlerts } from '@/domains/alerts/store/alertsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMaxContentWidth, useDeviceType } from '@/utils/useDeviceType';

interface AlertScreenProps {
  backgroundColor?: string;
}

export default function AlertScreen({ backgroundColor }: AlertScreenProps) {
  const bgColor = backgroundColor || Colors.dark.background || BluePalette.background;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.alerts.selectedDate);
  const { t } = useI18n();
  const { isTablet } = useDeviceType();
  const maxContentWidth = getMaxContentWidth(isTablet);

  // Bottom bar height: 15px + bottom safe area inset
  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;
  const bottomPadding = bottomBarTotalHeight + 24;

  // Animation for hiding date selector on scroll
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(0);
  const accumulatedDelta = useRef(0); // Accumulate scroll deltas for more stable direction detection
  const lastStateChangeTime = useRef(0); // Track when we last changed state to prevent rapid toggling
  const [isDateSelectorHidden, setIsDateSelectorHidden] = useState(false);
  const [topHeaderHeight, setTopHeaderHeight] = useState(0);

  // Constants for stable scroll detection
  const MIN_SCROLL_FOR_HIDE = 40; // Minimum scroll position before allowing hide
  const ACCUMULATED_DELTA_THRESHOLD = 15; // Minimum accumulated delta to trigger hide/show
  const STATE_CHANGE_COOLDOWN = 200; // Minimum time (ms) between state changes
  const TOP_THRESHOLD = 15; // Distance from top to consider "at top"

  const hideDateSelector = useCallback(() => {
    if (isDateSelectorHidden) return; // Already hidden
    const now = Date.now();
    if (now - lastStateChangeTime.current < STATE_CHANGE_COOLDOWN) return; // Cooldown period
    
    lastStateChangeTime.current = now;
    setIsDateSelectorHidden(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, isDateSelectorHidden]);

  const showDateSelector = useCallback(() => {
    if (!isDateSelectorHidden) return; // Already shown
    const now = Date.now();
    if (now - lastStateChangeTime.current < STATE_CHANGE_COOLDOWN) return; // Cooldown period
    
    lastStateChangeTime.current = now;
    setIsDateSelectorHidden(false);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, isDateSelectorHidden]);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - scrollY.current;
    scrollY.current = currentScrollY;

    // Show when completely at the top
    if (currentScrollY <= TOP_THRESHOLD) {
      // Reset accumulated delta when at top
      accumulatedDelta.current = 0;
      if (isDateSelectorHidden) {
        showDateSelector();
      }
      return;
    }

    // Accumulate scroll delta (with decay to prevent infinite accumulation)
    if (Math.abs(scrollDelta) > 1) {
      // Add to accumulated delta, but cap it to prevent overflow
      accumulatedDelta.current += scrollDelta;
      // Apply decay factor (0.7) to gradually reduce accumulated delta
      accumulatedDelta.current *= 0.7;
    } else {
      // Small movements decay faster
      accumulatedDelta.current *= 0.5;
    }

    // Only process hide/show if we're past minimum scroll threshold
    if (currentScrollY <= MIN_SCROLL_FOR_HIDE) {
      return; // Don't process hide/show near the top
    }

    // Hide: Only if accumulated delta shows consistent downward scrolling
    if (
      !isDateSelectorHidden &&
      accumulatedDelta.current > ACCUMULATED_DELTA_THRESHOLD
    ) {
      hideDateSelector();
      accumulatedDelta.current = 0; // Reset after state change
    }
    // Note: We don't show when scrolling up - only when reaching the top
  }, [hideDateSelector, showDateSelector, isDateSelectorHidden]);

  const handleRefresh = useCallback(() => {
    // Use the selected date from DateSelector, or fallback to today
    const dateParam = selectedDate || (() => {
      const today = new Date();
      // Format date in local timezone to avoid UTC conversion issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    dispatch(
      fetchAlerts({
        date: `${dateParam}T00:00:00`,
        endDate: `${dateParam}T23:59:59`,
      })
    );
  }, [dispatch, selectedDate]);

  return (
    <SafeAreaView
      style={[styles.container]}
      edges={['left', 'right']}
    >
      {/* Header with back button */}
      <View
        style={[styles.topHeader, { paddingTop: insets.top + 5 }]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (topHeaderHeight === 0) {
            setTopHeaderHeight(height);
          }
        }}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('alerts.screen.title')}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.refreshButtonPressed,
          ]}
          onPress={handleRefresh}
        >
          <FontAwesome name="refresh" size={22} color={BluePalette.textPrimary} />
        </Pressable>
      </View>

      {/* Date Selector Blue Bar */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            transform: [{ translateY }],
            opacity,
            position: isDateSelectorHidden ? 'absolute' : 'relative',
            top: isDateSelectorHidden ? topHeaderHeight : 0,
            left: 0,
            right: 0,
            zIndex: isDateSelectorHidden ? -1 : 1,
          },
        ]}
      >
        <DateSelector />
      </Animated.View>

      <ScrollView
        style={[
          styles.scrollView,
          { zIndex: isDateSelectorHidden ? 1 : 0 }
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
          <AlertList />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={{ zIndex: 10 }}>
        <BottomBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: BluePalette.backgroundNew,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  refreshButtonPressed: {
    opacity: 0.7,
    backgroundColor: BluePalette.surfaceLight,
    transform: [{ scale: 0.95 }],
  },
  headerSection: {
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    marginTop: 0,
    paddingTop: 10,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
  },
});

