import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { HourlyData, PeakPeriod } from '../types/dailyReport';

interface PeakPeriodsLineChartProps {
  hourlyData: HourlyData[];
  peakPeriods: PeakPeriod[];
  currency?: string;
}

const CHART_HEIGHT = 220;
const CHART_PADDING = 20;
const CHART_PADDING_TOP = 30;
const CHART_PADDING_BOTTOM = 40;
const CHART_PADDING_LEFT = 50;
const CHART_PADDING_RIGHT = 20;

export default function PeakPeriodsLineChart({
  hourlyData,
  peakPeriods,
  currency = 'MAD',
}: PeakPeriodsLineChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 32; // 16px on each side
  const chartContainerWidth = screenWidth - containerPadding;
  const chartWidth = chartContainerWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;

  const { pathData, areaPath, points, maxValue, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (hourlyData.length === 0) {
      return {
        pathData: '',
        areaPath: '',
        points: [],
        maxValue: 0,
        yAxisLabels: [],
        xAxisLabels: [],
      };
    }

    // Find max revenue value
    const max = Math.max(...hourlyData.map((d) => d.revenue));
    const adjustedMax = max * 1.15; // 15% padding

    // Calculate chart dimensions (chartWidth already excludes padding)
    const plotWidth = chartWidth;
    const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    // Generate points
    const points = hourlyData.map((data, index) => {
      const x = CHART_PADDING_LEFT + (index / (hourlyData.length - 1)) * plotWidth;
      const y =
        CHART_PADDING_TOP +
        plotHeight -
        (data.revenue / adjustedMax) * plotHeight;
      return { x, y, revenue: data.revenue, hour: data.hour };
    });

    // Create smooth path using quadratic curves
    let path = '';
    if (points.length > 0) {
      path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1] || curr;

        // Control point for smooth curve
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) / 2;
        const cp2y = curr.y;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
    }

    // Create area path (closed path under the line)
    const areaPath = `${path} L ${points[points.length - 1]?.x || 0} ${
      CHART_PADDING_TOP + plotHeight
    } L ${points[0]?.x || 0} ${CHART_PADDING_TOP + plotHeight} Z`;

    // Generate Y-axis labels (5 labels)
    const labelCount = 5;
    const yAxisLabels = Array.from({ length: labelCount }, (_, i) => {
      const value = adjustedMax - (adjustedMax / (labelCount - 1)) * i;
      return value;
    });

    // Generate X-axis labels (show every 2nd hour or key hours)
    const xAxisLabels = hourlyData.map((d, index) => ({
      hour: d.hour,
      x: CHART_PADDING_LEFT + (index / (hourlyData.length - 1)) * plotWidth,
      show: index % 2 === 0 || index === hourlyData.length - 1, // Show every 2nd hour
    }));

    return {
      pathData: path,
      areaPath,
      points,
      maxValue: adjustedMax,
      yAxisLabels,
      xAxisLabels,
    };
  }, [hourlyData, chartWidth, chartContainerWidth]);

  const formatCurrency = (amount: number) => {
    // For Y-axis, show actual numbers clearly
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPeakPeriodColor = (status: PeakPeriod['status']) => {
    switch (status) {
      case 'peak':
        return BluePalette.success;
      case 'moderate':
        return BluePalette.warning;
      case 'low':
        return BluePalette.error;
      default:
        return BluePalette.textTertiary;
    }
  };

  if (hourlyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Peak Periods Analysis</Text>
      <View style={styles.chartContainer}>
        {/* Chart */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={[styles.chartScrollContent, { minWidth: chartContainerWidth }]}>
          <View style={[styles.chartWrapper, { width: chartContainerWidth }]}>
            <Svg width={chartContainerWidth} height={CHART_HEIGHT} viewBox={`0 0 ${chartContainerWidth} ${CHART_HEIGHT}`}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={BluePalette.merge} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={BluePalette.merge} stopOpacity="0.05" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            {yAxisLabels.map((_, index) => {
              const y =
                CHART_PADDING_TOP +
                ((CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) /
                  (yAxisLabels.length - 1)) *
                  index;
              return (
                <Path
                  key={index}
                  d={`M ${CHART_PADDING_LEFT} ${y} L ${chartContainerWidth - CHART_PADDING_RIGHT} ${y}`}
                  stroke={BluePalette.border}
                  strokeWidth={1}
                  strokeOpacity={0.2}
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Area under line */}
            <Path
              d={areaPath}
              fill="url(#areaGradient)"
            />

            {/* Line */}
            <Path
              d={pathData}
              fill="none"
              stroke={BluePalette.merge}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, index) => (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={5}
                fill={BluePalette.merge}
                stroke={BluePalette.white}
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* Y-axis labels with numbers */}
          <View style={styles.yAxisContainer}>
            {yAxisLabels.map((label, index) => {
              const y =
                CHART_PADDING_TOP +
                ((CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) /
                  (yAxisLabels.length - 1)) *
                  index;
              return (
                <View
                  key={index}
                  style={[styles.yAxisLabelContainer, { top: y - 10 }]}
                >
                  <Text style={styles.yAxisLabel}>{formatCurrency(label)}</Text>
                </View>
              );
            })}
          </View>

          {/* X-axis labels with hours */}
          <View style={styles.xAxisContainer}>
            {xAxisLabels.map(
              (label, index) =>
                label.show && (
                  <View
                    key={index}
                    style={[styles.xAxisLabelContainer, { left: label.x - 25 }]}
                  >
                    <View style={styles.xAxisTickLine} />
                    <Text style={styles.xAxisLabel}>{label.hour}</Text>
                  </View>
                )
            )}
          </View>
          </View>
        </ScrollView>

        {/* Peak Periods Cards */}
        <View style={styles.periodsContainer}>
          <Text style={styles.periodsTitle}>Period Performance</Text>
          <View style={styles.periodsGrid}>
            {peakPeriods.map((period, index) => (
              <View key={index} style={styles.periodCard}>
                <View style={styles.periodCardHeader}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getPeakPeriodColor(period.status) },
                    ]}
                  />
                  <View style={styles.periodCardInfo}>
                    <Text style={styles.periodName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                      {period.period}
                    </Text>
                    <Text style={styles.timeRange} numberOfLines={1}>
                      {period.timeRange}
                    </Text>
                  </View>
                </View>
                <View style={styles.periodCardBody}>
                  <View style={styles.periodMetric}>
                    <Text style={styles.periodMetricLabel}>Revenue</Text>
                    <Text style={styles.periodMetricValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                      {formatCurrencyFull(period.revenue)}
                    </Text>
                  </View>
                  <View style={styles.periodMetric}>
                    <Text style={styles.periodMetricLabel}>Share</Text>
                    <Text style={styles.periodMetricValue} numberOfLines={1}>
                      {period.share.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  chartContainer: {
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
  },
  chartScrollContent: {
    paddingRight: 16,
  },
  chartWrapper: {
    position: 'relative',
    height: CHART_HEIGHT,
    marginBottom: 20,
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CHART_PADDING_LEFT,
    height: CHART_HEIGHT,
  },
  yAxisLabelContainer: {
    position: 'absolute',
    width: CHART_PADDING_LEFT - 10,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: BluePalette.textDark,
    fontWeight: '600',
  },
  xAxisContainer: {
    position: 'absolute',
    bottom: 0,
    left: CHART_PADDING_LEFT,
    right: CHART_PADDING_RIGHT,
    height: CHART_PADDING_BOTTOM,
    flexDirection: 'row',
  },
  xAxisLabelContainer: {
    position: 'absolute',
    width: 50,
    alignItems: 'center',
    bottom: 0,
  },
  xAxisTickLine: {
    width: 2,
    height: 10,
    backgroundColor: BluePalette.textDark,
    opacity: 0.5,
    marginBottom: 6,
  },
  xAxisLabel: {
    fontSize: 12,
    color: BluePalette.textDark,
    fontWeight: '600',
  },
  periodsContainer: {
    marginTop: 24,
    gap: 12,
  },
  periodsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textDark,
    marginBottom: 8,
  },
  periodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  periodCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: BluePalette.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BluePalette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  periodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    flexShrink: 0,
  },
  periodCardInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  periodName: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textDark,
  },
  timeRange: {
    fontSize: 12,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  periodCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodMetric: {
    flex: 1,
    gap: 4,
  },
  periodMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BluePalette.textDark,
  },
});
