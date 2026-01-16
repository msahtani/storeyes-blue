import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FixedCharge, FixedChargeCategory } from '../types/charge';

interface FixedChargeCardProps {
  charge: FixedCharge;
  onPress: () => void;
}

const categoryIcons: Record<FixedChargeCategory, string> = {
  personnel: 'users',
  water: 'droplet',
  electricity: 'zap',
  wifi: 'wifi',
};

const categoryLabels: Record<FixedChargeCategory, string> = {
  personnel: 'Personnel',
  water: 'Water',
  electricity: 'Electricity',
  wifi: 'Wi-Fi',
};

export default function FixedChargeCard({ charge, onPress }: FixedChargeCardProps) {
  const icon = categoryIcons[charge.category];
  const label = categoryLabels[charge.category];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = () => {
    if (!charge.trend) return null;
    switch (charge.trend) {
      case 'up':
        return <Feather name="trending-up" size={14} color={BluePalette.error} />;
      case 'down':
        return <Feather name="trending-down" size={14} color={BluePalette.success} />;
      case 'stable':
        return <Feather name="minus" size={14} color={BluePalette.textTertiary} />;
      default:
        return null;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        charge.abnormalIncrease && styles.cardAbnormal,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(6, 182, 212, 0.2)' }}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${BluePalette.merge}15` }]}>
          <Feather name={icon as any} size={24} color={BluePalette.merge} />
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.categoryLabel}>{label}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatAmount(charge.amount)}</Text>
            {charge.trend && (
              <View style={styles.trendContainer}>
                {getTrendIcon()}
                {charge.trendPercentage !== undefined && (
                  <Text style={styles.trendText}>
                    {charge.trendPercentage > 0 ? '+' : ''}
                    {charge.trendPercentage.toFixed(1)}%
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {charge.abnormalIncrease && (
          <View style={styles.alertBadge}>
            <Feather name="alert-circle" size={16} color={BluePalette.error} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAbnormal: {
    borderColor: BluePalette.error,
    borderWidth: 2.5,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.merge,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textTertiary,
  },
  alertBadge: {
    padding: 4,
  },
});

