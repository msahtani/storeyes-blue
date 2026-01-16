import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TopProduct } from '../types/dailyReport';

interface TopProductsRankingProps {
  productsByQuantity: TopProduct[];
  productsByRevenue: TopProduct[];
  currency?: string;
}

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export default function TopProductsRanking({
  productsByQuantity,
  productsByRevenue,
  currency = 'MAD',
}: TopProductsRankingProps) {
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

  const getRankColor = (rank: number) => {
    if (rank === 1) return BluePalette.warning;
    if (rank === 2) return BluePalette.textTertiary;
    if (rank === 3) return BluePalette.error;
    return BluePalette.textTertiary;
  };

  const ProductRow = ({
    product,
    showQuantity,
  }: {
    product: TopProduct;
    showQuantity: boolean;
  }) => (
    <View
      style={[
        styles.productRow,
        product.rank === 1 && styles.productRowFirst,
      ]}
    >
      <View style={styles.rankContainer}>
        {product.rank <= 3 ? (
          <Text style={styles.medal}>{MEDAL_EMOJIS[product.rank - 1]}</Text>
        ) : (
          <View
            style={[
              styles.rankBadge,
              { backgroundColor: `${getRankColor(product.rank)}15` },
            ]}
          >
            <Text
              style={[styles.rankText, { color: getRankColor(product.rank) }]}
            >
              {product.rank}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.productName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
        {product.name}
      </Text>
      <Text style={styles.productValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
        {showQuantity
          ? `${formatNumber(product.quantity || 0)} units`
          : formatCurrency(product.revenue || 0)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Top Products Performance</Text>
      
      {/* By Quantity - Full Width */}
      <View style={styles.rankingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>By Quantity Sold</Text>
        </View>
        <View style={styles.rankingList}>
          {productsByQuantity.slice(0, 10).map((product) => (
            <ProductRow key={product.rank} product={product} showQuantity={true} />
          ))}
        </View>
      </View>

      {/* By Revenue - Full Width */}
      <View style={styles.rankingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>By Revenue Generated</Text>
        </View>
        <View style={styles.rankingList}>
          {productsByRevenue.slice(0, 10).map((product) => (
            <ProductRow key={product.rank} product={product} showQuantity={false} />
          ))}
        </View>
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
  },
  rankingCard: {
    width: '100%',
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
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textDark,
  },
  rankingList: {
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: BluePalette.backgroundNew,
    marginBottom: 6,
    minHeight: 50,
  },
  productRowFirst: {
    backgroundColor: `${BluePalette.warning}15`,
    borderWidth: 1,
    borderColor: BluePalette.warning,
  },
  rankContainer: {
    width: 35,
    alignItems: 'center',
    flexShrink: 0,
  },
  medal: {
    fontSize: 22,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textDark,
    marginRight: 8,
    minWidth: 0,
  },
  productValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BluePalette.textDark,
    flexShrink: 0,
    minWidth: 80,
    textAlign: 'right',
  },
});
