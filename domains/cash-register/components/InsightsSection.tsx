import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DailyReportInsights } from '../types/dailyReport';

interface InsightsSectionProps {
  insights: DailyReportInsights;
  currency?: string;
}

export default function InsightsSection({
  insights,
  currency = 'MAD',
}: InsightsSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const insightCards = [
    {
      icon: 'clock',
      title: 'Peak Hour',
      value: insights.peakHour.time,
      subtitle: formatCurrency(insights.peakHour.revenue),
      color: BluePalette.merge,
    },
    {
      icon: 'star',
      title: 'Best Selling Product',
      value: insights.bestSellingProduct.name,
      subtitle: `${formatNumber(insights.bestSellingProduct.quantity)} units`,
      color: BluePalette.warning,
    },
    {
      icon: 'dollar-sign',
      title: 'Highest Transaction',
      value: formatCurrency(insights.highestValueTransaction),
      subtitle: 'Single transaction value',
      color: BluePalette.success,
    },
    {
      icon: 'activity',
      title: 'Busiest Period',
      value: insights.busiestPeriod.period,
      subtitle: `${formatNumber(insights.busiestPeriod.transactions)} transactions`,
      color: BluePalette.primaryLight,
    },
  ];

  const getComparisonColor = (value: number) => {
    if (value > 0) return BluePalette.success;
    if (value < 0) return BluePalette.error;
    return BluePalette.textTertiary;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Key Insights</Text>
      <View style={styles.insightsGrid}>
        {insightCards.map((card, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${card.color}15` }]}>
              <Feather name={card.icon as any} size={20} color={card.color} />
            </View>
            <Text style={styles.insightTitle}>{card.title}</Text>
            <Text style={styles.insightValue} numberOfLines={1}>
              {card.value}
            </Text>
            <Text style={styles.insightSubtitle}>{card.subtitle}</Text>
          </View>
        ))}
      </View>

      {/* Revenue Comparison */}
      {insights.revenueComparison && (
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonTitle}>Revenue Comparison</Text>
          <View style={styles.comparisonGrid}>
            {insights.revenueComparison.vsPreviousDay !== undefined && (
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <Feather
                    name="calendar"
                    size={16}
                    color={BluePalette.textTertiary}
                  />
                  <Text style={styles.comparisonLabel}>vs Previous Day</Text>
                </View>
                <Text
                  style={[
                    styles.comparisonValue,
                    {
                      color: getComparisonColor(
                        insights.revenueComparison.vsPreviousDay
                      ),
                    },
                  ]}
                >
                  {insights.revenueComparison.vsPreviousDay >= 0 ? '+' : ''}
                  {insights.revenueComparison.vsPreviousDay.toFixed(1)}%
                </Text>
                <Feather
                  name={
                    insights.revenueComparison.vsPreviousDay >= 0
                      ? 'trending-up'
                      : 'trending-down'
                  }
                  size={16}
                  color={getComparisonColor(insights.revenueComparison.vsPreviousDay)}
                />
              </View>
            )}
            {insights.revenueComparison.vsPreviousWeek !== undefined && (
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <Feather
                    name="calendar"
                    size={16}
                    color={BluePalette.textTertiary}
                  />
                  <Text style={styles.comparisonLabel}>vs Previous Week</Text>
                </View>
                <Text
                  style={[
                    styles.comparisonValue,
                    {
                      color: getComparisonColor(
                        insights.revenueComparison.vsPreviousWeek
                      ),
                    },
                  ]}
                >
                  {insights.revenueComparison.vsPreviousWeek >= 0 ? '+' : ''}
                  {insights.revenueComparison.vsPreviousWeek.toFixed(1)}%
                </Text>
                <Feather
                  name={
                    insights.revenueComparison.vsPreviousWeek >= 0
                      ? 'trending-up'
                      : 'trending-down'
                  }
                  size={16}
                  color={getComparisonColor(insights.revenueComparison.vsPreviousWeek)}
                />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textDark,
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 12,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  comparisonContainer: {
    marginTop: 8,
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textDark,
    marginBottom: 12,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    gap: 8,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
