import { apiClient } from '@/api/client';
import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { FeatureFlags } from '@/constants/FeatureFlags';
import { useI18n } from '@/constants/i18n/I18nContext';
import { fetchAlerts } from '@/domains/alerts/store/alertsSlice';
import { DailyReportData } from '@/domains/cash-register/types/dailyReport';
import { getStatistics } from '@/domains/statistics/services/statisticsService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMaxContentWidth, useDeviceType } from '@/utils/useDeviceType';
import { getUserInitials } from '@/utils/userUtils';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  cardWidth: number;
  value?: string | number;
  dateLabel?: string;
  showArrow?: boolean;
}

function FeatureCard({
  icon,
  title,
  subtitle,
  color,
  onPress,
  disabled = false,
  cardWidth,
  value,
  dateLabel,
  showArrow = true,
}: FeatureCardProps) {
  const { t } = useI18n();

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
      <View style={styles.featureCardContent}>
        <View style={[styles.featureIconContainer, { backgroundColor: `${color}15` }]}>
          <Feather name={icon as any} size={28} color={color} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={[styles.featureTitle, disabled && styles.featureTitleDisabled]}>
            {title}
          </Text>
          {value !== undefined && (
            <Text style={[styles.featureValue, disabled && styles.featureValueDisabled]}>
              {value}
            </Text>
          )}
        </View>
        <View style={styles.featureFooterRow}>
          {dateLabel && (
            <Text style={[styles.featureDate, disabled && styles.featureDateDisabled]}>
              {t('home.features.datePrefix')} {dateLabel}
            </Text>
          )}
          {showArrow && !disabled && (
            <View style={styles.featureArrowContainer}>
              <Feather name="chevron-right" size={20} color={color} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

interface StatisticsCardProps {
  revenue: number | null;
  loading: boolean;
  onPress: () => void;
}

function StatisticsCard({ revenue, loading, onPress }: StatisticsCardProps) {
  const { t } = useI18n();
  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.statisticsCard,
        pressed && styles.statisticsCardPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(6, 182, 212, 0.2)' }}
    >
      <View style={styles.statisticsCardContent}>
        <View style={[styles.statisticsIconContainer, { backgroundColor: `${BluePalette.merge}15` }]}>
          <Feather name="bar-chart-2" size={32} color={BluePalette.merge} />
        </View>
        <View style={styles.statisticsTextContainer}>
          <Text style={styles.statisticsTitle}>{t('home.features.statistiques.title')}</Text>
          {loading ? (
            <ActivityIndicator size="small" color={BluePalette.merge} style={styles.loadingIndicator} />
          ) : (
            <>
              <Text style={styles.statisticsValue}>
                {revenue !== null ? formatCurrency(revenue) : '--'}
              </Text>
              <View style={styles.statisticsDateRow}>
                <Text style={styles.statisticsDate}>
                  {monthName} {year}
                </Text>
                <View style={styles.arrowContainer}>
                  <Feather name="chevron-right" size={24} color={BluePalette.merge} />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useI18n();
  const { isTablet, width } = useDeviceType();
  const maxContentWidth = getMaxContentWidth(isTablet);
  const { user } = useAppSelector((state) => state.auth);
  const alerts = useAppSelector((state) => state.alerts.items);

  // State for data fetching
  const [statisticsRevenue, setStatisticsRevenue] = useState<number | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [cashRegisterData, setCashRegisterData] = useState<DailyReportData | null>(null);
  const [cashRegisterLoading, setCashRegisterLoading] = useState(true);

  // Tab bar total height: 65px base + bottom safe area inset
  const tabBarBaseHeight = 65;
  const tabBarTotalHeight = tabBarBaseHeight + insets.bottom;
  const bottomPadding = tabBarTotalHeight + 8;

  // Calculate card width responsively for 2-column grid
  const contentWidthForGrid = isTablet
    ? Math.min(maxContentWidth, width - 40)
    : width - 40;
  const gapBetweenCards = 16;
  const cardWidth = (contentWidthForGrid - gapBetweenCards) / 2;

  // Format date utilities
  const formatDate = (date: Date, format: 'day-month' | 'day-month-year' = 'day-month') => {
    if (format === 'day-month') {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      });
    }
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch statistics for current month
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatisticsLoading(true);
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const data = await getStatistics('month', monthKey);
        setStatisticsRevenue(data.kpi.revenue);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setStatisticsRevenue(null);
      } finally {
        setStatisticsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Fetch alerts for previous day
  useEffect(() => {
    const fetchPreviousDayAlerts = async () => {
      try {
        setAlertsLoading(true);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        await dispatch(fetchAlerts({
          date: `${dateString}T00:00:00`,
          endDate: `${dateString}T23:59:59`,
        })).unwrap();
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchPreviousDayAlerts();
  }, [dispatch]);

  // Fetch cash register data for previous day
  useEffect(() => {
    const fetchPreviousDayReport = async () => {
      try {
        setCashRegisterLoading(true);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const { data } = await apiClient.get<DailyReportData>('/kpi/daily-report', {
          params: { date: dateString },
        });

        if (data && Object.keys(data).length > 0) {
          setCashRegisterData(data);
        } else {
          setCashRegisterData(null);
        }
      } catch (error) {
        console.error('Error fetching daily report:', error);
        setCashRegisterData(null);
      } finally {
        setCashRegisterLoading(false);
      }
    };

    fetchPreviousDayReport();
  }, []);

  // Get previous day and month for alerts
  const previousDateForAlerts = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday, 'day-month');
  }, []);

  // Get previous day and month for cash register
  const previousDate = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday, 'day-month');
  }, []);

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
      value: alertsLoading ? undefined : alerts.length,
      dateLabel: previousDateForAlerts,
    },
    {
      icon: 'credit-card',
      title: t('home.features.caisse.title'),
      subtitle: t('home.features.caisse.subtitle'),
      color: BluePalette.success,
      route: '/caisse' as const,
      enabled: FeatureFlags.CAISSE_ENABLED,
      value: cashRegisterLoading
        ? undefined
        : cashRegisterData?.revenue.totalTTC
          ? formatCurrency(cashRegisterData.revenue.totalTTC)
          : '--',
      dateLabel: previousDate,
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
      icon: 'log-in',
      title: 'Check In/Out',
      subtitle: 'Employee attendance',
      color: BluePalette.textTertiary,
      route: '/check-in-out' as const,
      enabled: false, // Disabled as requested
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
          style={({ pressed }) => [
            styles.userCircle,
            pressed && styles.userCirclePressed,
          ]}
          onPress={() => router.push('/(tabs)/profile' as any)}
          android_ripple={{ color: BluePalette.merge }}
        >
          <Text style={styles.userCircleText}>{getUserInitials(user)}</Text>
        </Pressable>

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
          {/* Statistics Card - Replaces Camera Card */}
          <StatisticsCard
            revenue={statisticsRevenue}
            loading={statisticsLoading}
            onPress={() => router.push('/statistics' as any)}
          />

          {/* Feature Cards Grid - 2 rows, 2 columns */}
          <View style={styles.featuresGrid}>
            {/* First Row: Alerts, Register Cash */}
            <FeatureCard
              icon={features[0].icon}
              title={features[0].title}
              subtitle={features[0].subtitle}
              color={features[0].color}
              disabled={!features[0].enabled}
              cardWidth={cardWidth}
              value={features[0].value}
              dateLabel={features[0].dateLabel}
              onPress={() => router.push('/alerts' as any)}
            />
            <FeatureCard
              icon={features[1].icon}
              title={features[1].title}
              subtitle={features[1].subtitle}
              color={features[1].color}
              disabled={!features[1].enabled}
              cardWidth={cardWidth}
              value={features[1].value}
              dateLabel={features[1].dateLabel}
              onPress={() => router.push('/caisse/daily-report' as any)}
            />

            {/* Second Row: Charges, Check In/Out */}
            <FeatureCard
              icon={features[2].icon}
              title={features[2].title}
              subtitle={features[2].subtitle}
              color={features[2].color}
              disabled={!features[2].enabled}
              cardWidth={cardWidth}
              onPress={() => router.push('/charges' as any)}
            />
            <FeatureCard
              icon={features[3].icon}
              title={features[3].title}
              subtitle={features[3].subtitle}
              color={features[3].color}
              disabled={!features[3].enabled}
              cardWidth={cardWidth}
              onPress={() => { }}
            />
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
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  userCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.merge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BluePalette.mergeDark,
    overflow: 'hidden',
  },
  userCirclePressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: BluePalette.mergeDark,
  },
  userCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.white,
    letterSpacing: 0.5,
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
    gap: 24,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'stretch',
  },
  statisticsCard: {
    width: '100%',
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 20,
    padding: 24,
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
  statisticsCardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.merge,
    shadowColor: BluePalette.merge,
    shadowOpacity: 0.3,
  },
  statisticsCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  statisticsIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statisticsTextContainer: {
    flex: 1,
    gap: 4,
  },
  statisticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textSecondary,
    letterSpacing: -0.3,
  },
  statisticsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  statisticsDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  statisticsDate: {
    fontSize: 14,
    fontWeight: '500',
    color: BluePalette.textTertiary,
  },
  loadingIndicator: {
    marginVertical: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  featureCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 18,
    padding: 20,
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
    height: 200,
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
  featureCardContent: {
    flex: 1,
    gap: 12,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.3,
  },
  featureTitleDisabled: {
    opacity: 0.7,
  },
  featureValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  featureValueDisabled: {
    opacity: 0.7,
  },
  featureDate: {
    fontSize: 12,
    fontWeight: '500',
    color: BluePalette.textTertiary,
  },
  featureDateDisabled: {
    opacity: 0.6,
  },
  featureFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  featureSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: BluePalette.textTertiary,
    flex: 1,
  },
  featureSubtitleDisabled: {
    opacity: 0.6,
  },
  featureArrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
