import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { FeatureFlags } from '@/constants/FeatureFlags';
import { useI18n } from '@/constants/i18n/I18nContext';
import { getMaxContentWidth, useDeviceType } from '@/utils/useDeviceType';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  cardWidth: number;
}

function FeatureCard({ icon, title, subtitle, color, onPress, disabled = false, cardWidth }: FeatureCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.featureCard,
        { width: cardWidth },
        disabled && styles.featureCardDisabled,
        pressed && !disabled && styles.featureCardPressed,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      android_ripple={disabled ? undefined : { color: 'rgba(6, 182, 212, 0.2)' }}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={28} color={color} />
      </View>
      <Text style={[styles.featureTitle, disabled && styles.featureTitleDisabled]}>{title}</Text>
      <Text style={[styles.featureSubtitle, disabled && styles.featureSubtitleDisabled]}>{subtitle}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useI18n();
  const { isTablet, width } = useDeviceType();
  const maxContentWidth = getMaxContentWidth(isTablet);

  // Tab bar total height: 65px base + bottom safe area inset
  const tabBarBaseHeight = 65;
  const tabBarTotalHeight = tabBarBaseHeight + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 8;
  
  // Calculate card width responsively
  // On tablets, use max content width; on phones, use full screen width
  const contentWidth = isTablet ? Math.min(maxContentWidth, width - 40) : width - 40;
  const cardWidth = (contentWidth - 16) / 2; // 16px gap between cards

  const toggleLanguage = async () => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    await setLanguage(newLanguage);
  };

  const features = [
    {
      icon: 'bell',
      title: t('home.features.alertes.title'),
      subtitle: t('home.features.alertes.subtitle'),
      color: BluePalette.error,
      route: '/alerts' as const,
      enabled: FeatureFlags.ALERTES_ENABLED,
    },
    {
      icon: 'dollar-sign',
      title: t('home.features.charges.title'),
      subtitle: t('home.features.charges.subtitle'),
      color: BluePalette.warning,
      route: '/charges' as const,
      enabled: FeatureFlags.CHARGES_ENABLED,
    },
    {
      icon: 'credit-card',
      title: t('home.features.caisse.title'),
      subtitle: t('home.features.caisse.subtitle'),
      color: BluePalette.success,
      route: '/caisse' as const,
      enabled: FeatureFlags.CAISSE_ENABLED,
      // Future module – not available in v1
    },
    {
      icon: 'bar-chart-2',
      title: t('home.features.statistiques.title'),
      subtitle: t('home.features.statistiques.subtitle'),
      color: BluePalette.merge,
      route: '/statistiques' as const,
      enabled: FeatureFlags.STATISTIQUES_ENABLED,
      // Future module – not available in v1
    },
  ];

  return (
    <SafeAreaView 
      style={styles.container}
      edges={['left', 'right']}
    >
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 5 }]}>
        {/* Profile button removed in v1 - Profile tab is hidden */}
        <View style={styles.userCircle}>
          <FontAwesome name="user" size={20} color={BluePalette.textPrimary} />
        </View>
        
        <Pressable 
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          <Feather name="globe" size={16} color={BluePalette.merge} />
        </Pressable>
      </View>

      <View style={styles.scrollContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding, maxWidth: maxContentWidth }
          ]}
          showsVerticalScrollIndicator={false}
        >
        {/* Camera Card */}
        <View style={styles.cameraCard}>
          <View style={styles.cameraPlaceholder}>
            <Feather name="video" size={48} color={BluePalette.textTertiary} />
            <Text style={styles.cameraLabel}>{t('home.camera.title')}</Text>
            {/* LIVE badge only shown when stream is active */}
            {FeatureFlags.LIVE_CAMERA_ACTIVE && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('home.camera.live')}</Text>
              </View>
            )}
            {/* Placeholder message when stream is inactive */}
            {!FeatureFlags.LIVE_CAMERA_ACTIVE && (
              <Text style={styles.cameraPlaceholderText}>
                {t('home.camera.placeholder')}
              </Text>
            )}
          </View>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              subtitle={feature.subtitle}
              color={feature.color}
              disabled={!feature.enabled}
              cardWidth={cardWidth}
              onPress={() => {
                if (feature.enabled) {
                  if (feature.route === '/alerts') {
                    router.push('/alerts' as any);
                  } else if (feature.route === '/charges') {
                    router.push('/charges' as any);
                  } else if (feature.route === '/caisse') {
                    router.push('/caisse/daily-report' as any);
                  } else if (feature.route === '/statistiques') {
                    router.push('/statistics' as any);
                  }
                }
                // Disabled features do nothing when tapped
              }}
            />
          ))}
        </View>
        </ScrollView>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  userCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BluePalette.merge,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 26,
    alignSelf: 'center',
    width: '100%',
  },
  cameraCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: BluePalette.backgroundCard,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cameraPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: BluePalette.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: BluePalette.textTertiary,
  },
  cameraPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '400',
    color: BluePalette.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  featureCardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.merge,
    shadowColor: BluePalette.merge,
    shadowOpacity: 0.3,
  },
  featureCardDisabled: {
    opacity: 0.5,
  },
  featureTitleDisabled: {
    opacity: 0.7,
  },
  featureSubtitleDisabled: {
    opacity: 0.6,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  featureSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: BluePalette.textTertiary,
    textAlign: 'center',
  },
});

