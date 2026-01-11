import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ChartDataPoint } from '../types/statistics';

interface CombinedChartProps {
  data: ChartDataPoint[];
  height?: number;
}

const CHART_HEIGHT = 220;
const CHART_PADDING = 16;
const CHART_PADDING_TOP = 30;
const CHART_PADDING_BOTTOM = 35;

export default function CombinedChart({ data, height = CHART_HEIGHT }: CombinedChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40 - (CHART_PADDING * 2) - 58; // Container padding + chart padding + yAxis width

  const { bars, maxValue, yAxisLabels } = useMemo(() => {
    if (data.length === 0) {
      return { bars: [], maxValue: 0, yAxisLabels: [] };
    }

    // Find max value across all metrics
    const allValues = data.flatMap((d) => [d.revenue, d.charges, d.profit]);
    const max = Math.max(...allValues);
    const adjustedMax = max * 1.1; // 10% padding

    const barWidth = (chartWidth - (data.length - 1) * 8) / data.length;

    const bars = data.map((point, index) => {
      const x = index * (barWidth + 8);
      const revenueHeight = (point.revenue / adjustedMax) * (height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM);
      const chargesHeight = (point.charges / adjustedMax) * (height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM);
      const profitHeight = (point.profit / adjustedMax) * (height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM);
      
      return {
        ...point,
        x,
        barWidth,
        revenueHeight,
        chargesHeight,
        profitHeight,
      };
    });

    // Generate Y-axis labels (4 labels)
    const labelCount = 4;
    const yAxisLabels = Array.from({ length: labelCount }, (_, i) => {
      const value = adjustedMax - (adjustedMax / (labelCount - 1)) * i;
      return value;
    });

    return { bars, maxValue: adjustedMax, yAxisLabels };
  }, [data, chartWidth, height]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${Math.round(amount)}`;
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {/* Y-axis labels and chart area */}
      <View style={styles.chartRow}>
        <View style={styles.yAxisContainer}>
          {yAxisLabels.map((label, index) => (
            <View key={index} style={styles.yAxisLabelContainer}>
              <Text style={styles.yAxisLabel}>{formatAmount(label)}</Text>
            </View>
          ))}
        </View>

        {/* Chart area */}
        <View style={[styles.chartArea, { width: chartWidth, height }]}>
          {/* Grid lines */}
          {yAxisLabels.map((_, index) => {
            const y = (index / (yAxisLabels.length - 1)) * (height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) + CHART_PADDING_TOP;
            return (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: y, width: chartWidth },
                ]}
              />
            );
          })}

          {/* Bars and lines */}
          <View style={styles.barsContainer}>
            {bars.map((bar, index) => (
              <View
                key={index}
                style={[
                  styles.barGroup,
                  {
                    left: bar.x,
                    bottom: CHART_PADDING_BOTTOM,
                    width: bar.barWidth,
                  },
                ]}
              >
                {/* Revenue bar (full height) */}
                <View
                  style={[
                    styles.revenueBar,
                    {
                      height: bar.revenueHeight,
                      width: bar.barWidth * 0.3,
                    },
                  ]}
                />
                
                {/* Charges bar (overlapped) */}
                <View
                  style={[
                    styles.chargesBar,
                    {
                      height: bar.chargesHeight,
                      width: bar.barWidth * 0.3,
                      left: bar.barWidth * 0.35,
                    },
                  ]}
                />
                
                {/* Profit indicator (small bar on right) */}
                <View
                  style={[
                    styles.profitBar,
                    {
                      height: Math.max(bar.profitHeight, 2),
                      width: bar.barWidth * 0.2,
                      left: bar.barWidth * 0.75,
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxisContainer}>
            {data.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.xAxisLabelContainer,
                  { width: bars[index]?.barWidth || chartWidth / data.length },
                ]}
              >
                <Text style={styles.xAxisLabel} numberOfLines={1}>
                  {point.period}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BluePalette.merge }]} />
          <Text style={styles.legendText}>Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BluePalette.warning }]} />
          <Text style={styles.legendText}>Charges</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: BluePalette.success }]} />
          <Text style={styles.legendText}>Profit</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: CHART_PADDING,
  },
  chartRow: {
    flexDirection: 'row',
  },
  yAxisContainer: {
    width: 50,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingTop: CHART_PADDING_TOP,
    paddingBottom: CHART_PADDING_BOTTOM,
    height: CHART_HEIGHT,
  },
  yAxisLabelContainer: {
    height: 20,
    justifyContent: 'center',
  },
  yAxisLabel: {
    fontSize: 11,
    color: BluePalette.textPrimary,
    opacity: 0.6,
    fontWeight: '500',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: BluePalette.border,
    opacity: 0.2,
  },
  barsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  barGroup: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  revenueBar: {
    backgroundColor: BluePalette.merge,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  chargesBar: {
    backgroundColor: BluePalette.warning,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  profitBar: {
    backgroundColor: BluePalette.success,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  xAxisContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: CHART_PADDING_BOTTOM,
  },
  xAxisLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  xAxisLabel: {
    fontSize: 11,
    color: BluePalette.textPrimary,
    opacity: 0.6,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
});

