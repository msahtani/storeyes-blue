import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusType } from '../types/statistics';

interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  evolution?: number;
  status?: StatusType;
  icon: string;
  formatCurrency?: boolean;
}

export default function KPICard({
  title,
  value,
  subtitle,
  evolution,
  status,
  icon,
  formatCurrency = true,
}: KPICardProps) {
  const { t } = useI18n();
  const formatAmount = (amount: number) => {
    if (formatCurrency) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return `${amount.toFixed(1)}%`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return BluePalette.success;
      case 'medium':
        return BluePalette.warning;
      case 'critical':
        return BluePalette.error;
      default:
        return BluePalette.textTertiary;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return 'trending-up';
      case 'medium':
        return 'minus';
      case 'critical':
        return 'trending-down';
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${BluePalette.merge}15` }]}>
          <Feather name={icon as any} size={20} color={BluePalette.merge} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardValue}>{formatAmount(value)}</Text>

        {subtitle && (
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        )}

        {evolution !== undefined && (
          <View style={styles.evolutionContainer}>
            <Feather
              name={evolution >= 0 ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={evolution >= 0 ? BluePalette.success : BluePalette.error}
            />
            <Text
              style={[
                styles.evolutionText,
                {
                  color: evolution >= 0 ? BluePalette.success : BluePalette.error,
                },
              ]}
            >
              {evolution >= 0 ? '+' : ''}
              {evolution.toFixed(1)}%
            </Text>
          </View>
        )}

        {status && (
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
            <Feather name={getStatusIcon() as any} size={12} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {t(`statistics.status.${status}`)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BluePalette.border,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardContent: {
    gap: 6,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  evolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  evolutionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

