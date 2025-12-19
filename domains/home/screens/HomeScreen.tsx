import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function FeatureCard({ icon, title, subtitle, color, onPress }: FeatureCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.featureCard,
        pressed && styles.featureCardPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(6, 182, 212, 0.2)' }}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  // Tab bar total height: 65px base + bottom safe area inset
  const tabBarBaseHeight = 65;
  const tabBarTotalHeight = tabBarBaseHeight + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 8;

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const features = [
    {
      icon: 'bell',
      title: 'Alertes',
      subtitle: 'Voir les alertes',
      color: BluePalette.error,
      route: '/alerts' as const,
    },
    {
      icon: 'coffee',
      title: 'Café',
      subtitle: 'Gestion café',
      color: BluePalette.warning,
      route: '/cafe' as const,
    },
    {
      icon: 'credit-card',
      title: 'Caisse',
      subtitle: 'Gestion caisse',
      color: BluePalette.success,
      route: '/caisse' as const,
    },
    {
      icon: 'bar-chart-2',
      title: 'Statistiques',
      subtitle: 'Voir les stats',
      color: BluePalette.merge,
      route: '/statistiques' as const,
    },
  ];

  return (
    <SafeAreaView 
      style={styles.container}
      edges={['left', 'right']}
    >
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 5 }]}>
        <Pressable 
          style={styles.userCircle}
          onPress={() => router.push('/(tabs)/profile' as any)}
        >
          <FontAwesome name="user" size={20} color={BluePalette.textPrimary} />
        </Pressable>
        
        <Pressable 
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          <Feather name="globe" size={16} color={BluePalette.merge} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Camera Card */}
        <View style={styles.cameraCard}>
          <View style={styles.cameraPlaceholder}>
            <Feather name="video" size={48} color={BluePalette.textTertiary} />
            <Text style={styles.cameraLabel}>Caméra en temps réel</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
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
              onPress={() => {
                if (feature.route === '/alerts') {
                  router.push('/alerts' as any);
                } else {
                  // Placeholder for other routes
                  console.log(`Navigate to ${feature.route}`);
                }
              }}
            />
          ))}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 26,
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
    width: (SCREEN_WIDTH - 56) / 2, // Screen width - padding - gap
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

