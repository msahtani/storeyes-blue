import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { VariableCharge } from '../types/charge';

interface VariableChargeItemProps {
  charge: VariableCharge;
  onPress: () => void;
}

export default function VariableChargeItem({ charge, onPress }: VariableChargeItemProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(6, 182, 212, 0.2)' }}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemMain}>
          <Text style={styles.itemName} numberOfLines={1}>
            {charge.name}
          </Text>
          <Text style={styles.itemCategory}>{charge.category}</Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemAmount}>{formatAmount(charge.amount)}</Text>
          <View style={styles.itemMeta}>
            <Feather name="calendar" size={12} color={BluePalette.textTertiary} />
            <Text style={styles.itemDate}>{formatDate(charge.date)}</Text>
          </View>
        </View>
      </View>

      {/* Purchase Order Badge - HIDDEN FOR NOW */}
      {/* {!charge.purchaseOrderUrl && (
        <View style={styles.missingReceiptBadge}>
          <Feather name="alert-circle" size={12} color={BluePalette.warning} />
          <Text style={styles.missingReceiptText}>No purchase order</Text>
        </View>
      )} */}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  itemPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: BluePalette.merge,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemMain: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: BluePalette.textPrimary,
  },
  itemCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: BluePalette.textTertiary,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.3,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDate: {
    fontSize: 12,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  missingReceiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  missingReceiptText: {
    fontSize: 11,
    color: BluePalette.warning,
    fontWeight: '600',
  },
});

