import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { StaffPerformance } from '../types/dailyReport';

interface StaffPerformanceTableProps {
  staff: StaffPerformance[];
  currency?: string;
}

export default function StaffPerformanceTable({
  staff,
  currency = 'MAD',
}: StaffPerformanceTableProps) {
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

  // Get top 2 servers (or all if less than 2)
  const displayStaff = useMemo(() => {
    const sorted = [...staff].sort((a, b) => b.revenue - a.revenue);
    return sorted.slice(0, 2);
  }, [staff]);

  const { totalRevenue } = useMemo(() => {
    if (staff.length === 0) {
      return { totalRevenue: 0 };
    }
    const total = staff.reduce((sum, s) => sum + s.revenue, 0);
    return { totalRevenue: total };
  }, [staff]);

  if (displayStaff.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Staff/Server Performance</Text>
      
      <View style={styles.cardsContainer}>
        {displayStaff.map((member, index) => {
          const revenuePercentage = totalRevenue > 0 ? (member.revenue / totalRevenue) * 100 : 0;

          return (
            <View key={index} style={styles.card}>
              {/* Card Header - Name Section */}
              <View style={styles.headerSection}>
                <View style={styles.avatar}>
                  <Feather name="user" size={18} color={BluePalette.merge} />
                </View>
                <Text style={styles.serverName} numberOfLines={1}>
                  {member.name}
                </Text>
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Revenue</Text>
                  <Text style={styles.metricValue} numberOfLines={1}>{formatCurrency(member.revenue)}</Text>
                </View>
                
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Transactions</Text>
                  <Text style={styles.metricValue} numberOfLines={1}>{formatNumber(member.transactions)}</Text>
                </View>
                
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Avg Value</Text>
                  <Text style={styles.metricValue} numberOfLines={1}>{formatCurrency(member.avgValue)}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${revenuePercentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {revenuePercentage.toFixed(1)}% of total revenue
              </Text>
            </View>
          );
        })}
      </View>
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
    marginBottom: 8,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    width: '100%',
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${BluePalette.backgroundCard}15`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textDark,
    flex: 1,
    minWidth: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textDark,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: BluePalette.mergeDark,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: `${BluePalette.backgroundCard}20`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: BluePalette.textDark,
    opacity: 0.6,
    fontWeight: '500',
    marginTop: 6,
  },
});
