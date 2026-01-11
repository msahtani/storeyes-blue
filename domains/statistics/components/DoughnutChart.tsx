import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ChartDataPoint } from '../types/statistics';

interface DoughnutChartProps {
  data: ChartDataPoint[];
  size?: number;
}

const CHART_SIZE = 220;
const INNER_RADIUS_PERCENT = 0.6; // 60% of outer radius for doughnut hole

export default function DoughnutChart({ data, size = CHART_SIZE }: DoughnutChartProps) {
  const { segments, revenue, total } = useMemo(() => {
    if (data.length === 0) {
      return { segments: [], revenue: 0, total: 0 };
    }

    // Use the latest data point
    const latest = data[data.length - 1];
    const revenueValue = latest.revenue;
    const chargesValue = latest.charges;
    const profitValue = latest.profit;

    // Revenue = Charges + Profit (100% split)
    // The doughnut shows Charges and Profit as segments
    // Revenue is displayed in the center
    const totalAmount = chargesValue + profitValue; // Should equal revenue

    // Calculate percentages of charges and profit relative to revenue
    const chargesPercentage = revenueValue > 0 ? (chargesValue / revenueValue) * 100 : 0;
    const profitPercentage = revenueValue > 0 ? (profitValue / revenueValue) * 100 : 0;

    const segments = [
      {
        name: 'Charges',
        value: chargesValue,
        percentage: chargesPercentage,
        color: BluePalette.warning,
      },
      {
        name: 'Profit',
        value: profitValue,
        percentage: profitPercentage,
        color: BluePalette.success,
      },
    ];

    return {
      segments,
      revenue: revenueValue,
      total: totalAmount,
    };
  }, [data]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(amount)}`;
  };

  if (data.length === 0) {
    return null;
  }

  const radius = size / 2;
  const innerRadius = radius * INNER_RADIUS_PERCENT;
  const center = size / 2;

  // Calculate angles for segments (starting from top, going clockwise)
  let currentAngle = -90; // Start from top (-90 degrees)
  const segmentPaths = segments
    .filter((segment) => segment.percentage > 0) // Filter out zero-percentage segments
    .map((segment) => {
      const angle = (segment.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Convert angles to radians
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      // Calculate start and end points for outer arc
      const startXOuter = center + radius * Math.cos(startAngleRad);
      const startYOuter = center + radius * Math.sin(startAngleRad);
      const endXOuter = center + radius * Math.cos(endAngleRad);
      const endYOuter = center + radius * Math.sin(endAngleRad);

      // Calculate start and end points for inner arc
      const startXInner = center + innerRadius * Math.cos(startAngleRad);
      const startYInner = center + innerRadius * Math.sin(startAngleRad);
      const endXInner = center + innerRadius * Math.cos(endAngleRad);
      const endYInner = center + innerRadius * Math.sin(endAngleRad);

      // Determine if we need a large arc flag
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Create the path for the doughnut segment
      // M = move to, L = line to, A = arc, Z = close path
      // Outer arc goes clockwise (sweep flag = 1), inner arc goes counter-clockwise (sweep flag = 0)
      const path = `M ${startXOuter} ${startYOuter} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endXOuter} ${endYOuter} L ${endXInner} ${endYInner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner} Z`;

      return {
        ...segment,
        startAngle,
        endAngle,
        angle,
        path,
      };
    });

  return (
    <View style={styles.wrapper}>
      <View style={styles.chartContainer}>
        {/* Doughnut visualization using SVG */}
        <View style={[styles.doughnutOuter, { width: size, height: size }]}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Render segments - Charges and Profit */}
            {segmentPaths.map((segment, index) => (
              <Path
                key={index}
                d={segment.path}
                fill={segment.color}
                stroke={BluePalette.white}
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* Inner circle (doughnut hole) - shows Revenue in center */}
          <View
            style={[
              styles.doughnutInner,
              {
                width: innerRadius * 2,
                height: innerRadius * 2,
                borderRadius: innerRadius,
                backgroundColor: BluePalette.white,
              },
            ]}
          >
            <Text style={styles.centerTitle}>Revenue</Text>
            <Text style={styles.centerValue}>{formatAmount(revenue)}</Text>
          </View>
        </View>
      </View>

      {/* Legend with values */}
      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
            <View style={styles.legendTextContainer}>
              <Text style={styles.legendName}>{segment.name}</Text>
              <Text style={styles.legendValue}>{formatAmount(segment.value)}</Text>
            </View>
            <Text style={styles.legendPercentage}>{segment.percentage.toFixed(1)}%</Text>
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  doughnutOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doughnutInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BluePalette.border,
    zIndex: 10,
  },
  centerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BluePalette.textDark,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  legend: {
    width: '100%',
    gap: 14,
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
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  legendTextContainer: {
    flex: 1,
    gap: 2,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textDark,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '500',
    color: BluePalette.textDark,
    opacity: 0.7,
  },
  legendPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textDark,
    minWidth: 50,
    textAlign: 'right',
  },
});
