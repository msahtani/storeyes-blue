import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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

  const { bestPerformer, averageMetrics } = useMemo(() => {
    if (staff.length === 0) {
      return { bestPerformer: null, averageMetrics: null };
    }

    const best = staff.reduce((prev, current) =>
      prev.revenue > current.revenue ? prev : current
    );

    const totalRevenue = staff.reduce((sum, s) => sum + s.revenue, 0);
    const totalTransactions = staff.reduce((sum, s) => sum + s.transactions, 0);
    const avgRevenue = totalRevenue / staff.length;
    const avgTransactions = totalTransactions / staff.length;
    const avgValue = staff.reduce((sum, s) => sum + s.avgValue, 0) / staff.length;

    return {
      bestPerformer: best,
      averageMetrics: {
        revenue: avgRevenue,
        transactions: avgTransactions,
        avgValue,
      },
    };
  }, [staff]);


  if (staff.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Staff/Server Performance</Text>
      
      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${BluePalette.merge}15` }]}>
            <Feather name="users" size={20} color={BluePalette.merge} />
          </View>
          <Text style={styles.summaryLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            Total Active Servers
          </Text>
          <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {staff.length}
          </Text>
        </View>
        {bestPerformer && (
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${BluePalette.warning}15` }]}>
              <Feather name="award" size={20} color={BluePalette.warning} />
            </View>
            <Text style={styles.summaryLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              Best Performer
            </Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {bestPerformer.name}
            </Text>
            <Text style={styles.summarySubvalue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {formatCurrency(bestPerformer.revenue)}
            </Text>
          </View>
        )}
        {averageMetrics && (
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${BluePalette.success}15` }]}>
              <Feather name="trending-up" size={20} color={BluePalette.success} />
            </View>
            <Text style={styles.summaryLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              Average Performance
            </Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {formatCurrency(averageMetrics.revenue)}
            </Text>
            <Text style={styles.summarySubvalue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              {formatNumber(averageMetrics.transactions)} transactions
            </Text>
          </View>
        )}
      </View>

      {/* Staff Table with Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.nameColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Server
            </Text>
            <Text style={[styles.headerCell, styles.revenueColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Revenue (MAD)
            </Text>
            <Text style={[styles.headerCell, styles.transactionsColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Transactions
            </Text>
            <Text style={[styles.headerCell, styles.avgColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Avg Value
            </Text>
            <Text style={[styles.headerCell, styles.shareColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Share %
            </Text>
          </View>

          {staff.map((member, index) => {
            const isBestPerformer = bestPerformer?.name === member.name;

            return (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven,
                  isBestPerformer && styles.tableRowBest,
                ]}
              >
                <View style={styles.nameColumn}>
                  <Text
                    style={[styles.serverName, isBestPerformer && styles.serverNameBest]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {member.name}
                  </Text>
                  {isBestPerformer && (
                    <View style={styles.bestBadge}>
                      <Feather name="award" size={12} color={BluePalette.warning} />
                      <Text style={styles.bestBadgeText}>Best</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cell, styles.revenueColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {formatCurrency(member.revenue)}
                </Text>
                <Text style={[styles.cell, styles.transactionsColumn]} numberOfLines={1}>
                  {formatNumber(member.transactions)}
                </Text>
                <Text style={[styles.cell, styles.avgColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {formatCurrency(member.avgValue)}
                </Text>
                <Text style={[styles.cell, styles.shareColumn]} numberOfLines={1}>
                  {member.share.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    marginBottom: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BluePalette.border,
    minHeight: 140,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  summarySubvalue: {
    fontSize: 11,
    color: BluePalette.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  tableScrollContainer: {
    maxHeight: 400,
  },
  tableWrapper: {
    backgroundColor: BluePalette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BluePalette.merge,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: BluePalette.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    alignItems: 'center',
    minHeight: 60,
  },
  tableRowEven: {
    backgroundColor: BluePalette.whiteLight,
  },
  tableRowBest: {
    backgroundColor: `${BluePalette.warning}10`,
    borderLeftWidth: 3,
    borderLeftColor: BluePalette.warning,
    paddingLeft: 9,
  },
  cell: {
    fontSize: 13,
    fontWeight: '500',
    color: BluePalette.textDark,
  },
  nameColumn: {
    width: 140,
    flexShrink: 0,
    gap: 4,
  },
  revenueColumn: {
    width: 130,
    textAlign: 'right',
    paddingLeft: 8,
    flexShrink: 0,
  },
  transactionsColumn: {
    width: 110,
    textAlign: 'right',
    flexShrink: 0,
    paddingLeft: 8,
  },
  avgColumn: {
    width: 110,
    textAlign: 'right',
    flexShrink: 0,
    paddingLeft: 8,
  },
  shareColumn: {
    width: 90,
    textAlign: 'right',
    flexShrink: 0,
    paddingLeft: 8,
  },
  serverName: {
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textDark,
    marginBottom: 4,
    flex: 1,
    minWidth: 0,
  },
  serverNameBest: {
    color: BluePalette.warning,
    fontWeight: '700',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: `${BluePalette.warning}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BluePalette.warning,
    textTransform: 'uppercase',
  },
});
