import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { HourlyData } from '../types/dailyReport';

interface HourlyAnalysisTableProps {
  hourlyData: HourlyData[];
  currency?: string;
}

export default function HourlyAnalysisTable({
  hourlyData,
  currency = 'MAD',
}: HourlyAnalysisTableProps) {
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

  if (hourlyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Hourly Analysis</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableWrapper}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.hourColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Hour
            </Text>
            <Text style={[styles.headerCell, styles.revenueColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Revenue (MAD)
            </Text>
            <Text style={[styles.headerCell, styles.transactionsColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Transactions
            </Text>
            <Text style={[styles.headerCell, styles.itemsColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Items Sold
            </Text>
          </View>

          {/* Rows */}
          {hourlyData.map((data, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 && styles.tableRowEven,
              ]}
            >
              <Text style={[styles.cell, styles.hourColumn]} numberOfLines={1}>
                {data.hour}
              </Text>
              <Text style={[styles.cell, styles.revenueColumn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {formatCurrency(data.revenue)}
              </Text>
              <Text style={[styles.cell, styles.transactionsColumn]} numberOfLines={1}>
                {formatNumber(data.transactions)}
              </Text>
              <Text style={[styles.cell, styles.itemsColumn]} numberOfLines={1}>
                {formatNumber(data.itemsSold)}
              </Text>
            </View>
          ))}
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
    minHeight: 60,
  },
  tableRowEven: {
    backgroundColor: BluePalette.whiteLight,
  },
  cell: {
    fontSize: 13,
    fontWeight: '500',
    color: BluePalette.textDark,
  },
  hourColumn: {
    width: 70,
    flexShrink: 0,
    paddingRight: 8,
  },
  revenueColumn: {
    width: 130,
    textAlign: 'right',
    paddingLeft: 8,
    paddingRight: 8,
    flexShrink: 0,
  },
  transactionsColumn: {
    width: 110,
    textAlign: 'right',
    paddingLeft: 8,
    paddingRight: 8,
    flexShrink: 0,
  },
  itemsColumn: {
    width: 90,
    textAlign: 'right',
    paddingLeft: 8,
    paddingRight: 8,
    flexShrink: 0,
  },
});
