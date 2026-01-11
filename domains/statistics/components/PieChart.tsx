import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChargeDetail } from '../types/statistics';

interface PieChartProps {
  data: ChargeDetail[];
  size?: number;
}

const CHART_SIZE = 200;
const COLORS = [
  BluePalette.merge,
  BluePalette.warning,
  BluePalette.success,
  BluePalette.error,
  BluePalette.accent,
  BluePalette.primaryLight,
];

export default function PieChart({ data, size = CHART_SIZE }: PieChartProps) {
  const radius = size / 2;
  const center = size / 2;

  const { segments, total } = useMemo(() => {
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    
    let currentAngle = -90; // Start from top
    const segments = data.map((item, index) => {
      const percentage = (item.amount / totalAmount) * 100;
      const angle = (item.amount / totalAmount) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Calculate path for pie segment
      const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArc = angle > 180 ? 1 : 0;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        angle,
        color: COLORS[index % COLORS.length],
        path: `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`,
      };
    });

    return { segments, total: totalAmount };
  }, [data, radius, center]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Pie segments using View-based approach */}
        <View style={styles.chart}>
          {segments.map((segment, index) => {
            // For React Native, we'll use a simpler approach with overlapping circles
            // This is a simplified visualization
            return (
              <View
                key={segment.id}
                style={[
                  styles.segment,
                  {
                    width: size,
                    height: size,
                    borderRadius: radius,
                    backgroundColor: segment.color,
                    opacity: segment.percentage / 100,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <View key={segment.id} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: segment.color },
              ]}
            />
            <View style={styles.legendTextContainer}>
              <Text style={styles.legendName} numberOfLines={1}>
                {segment.name}
              </Text>
              <Text style={styles.legendPercentage}>
                {segment.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Simplified pie chart using bars for better React Native compatibility
export function SimplePieChart({ data, size = CHART_SIZE }: PieChartProps) {
  const { segments, total } = useMemo(() => {
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const segments = data.map((item, index) => ({
      ...item,
      percentage: (item.amount / totalAmount) * 100,
      color: COLORS[index % COLORS.length],
    }));
    return { segments, total: totalAmount };
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={styles.simpleContainer}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  return (
    <View style={styles.simpleWrapper}>
      <View style={styles.simpleChart}>
        {segments.map((segment) => (
          <View
            key={segment.id}
            style={[
              styles.simpleBar,
              {
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.id} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: segment.color },
              ]}
            />
            <View style={styles.legendTextContainer}>
              <Text style={styles.legendName} numberOfLines={1}>
                {segment.name}
              </Text>
              <Text style={styles.legendPercentage}>
                {segment.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 24,
  },
  container: {
    position: 'relative',
  },
  chart: {
    ...StyleSheet.absoluteFillObject,
  },
  segment: {
    position: 'absolute',
  },
  legend: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BluePalette.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 14,
    fontWeight: '500',
    color: BluePalette.textDark,
    flex: 1,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textDark,
  },
  emptyText: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    textAlign: 'center',
  },
  simpleWrapper: {
    gap: 20,
  },
  simpleContainer: {
    padding: 40,
    alignItems: 'center',
  },
  simpleChart: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: BluePalette.surfaceDark,
  },
  simpleBar: {
    height: '100%',
  },
});

