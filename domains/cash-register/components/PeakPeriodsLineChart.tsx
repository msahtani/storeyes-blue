import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
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
  // ScrollView paddingHorizontal: 20px each side = 40px total
  // ChartContainer padding: 16px each side = 32px total
  // Available width for chart wrapper: screenWidth - 40 - 32 = screenWidth - 72
  const chartWrapperWidth = screenWidth - 72;

  // Filter hourlyData to show only 8:00 AM to 10:00 PM (08:00 to 22:00)
  const filteredHourlyData = useMemo(() => {
    return hourlyData.filter((data) => {
      const hour = parseInt(data.hour.split(':')[0], 10);
      return hour >= 8 && hour <= 22;
    });
  }, [hourlyData]);

  const { pathData, areaPath, points, maxValue, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (filteredHourlyData.length === 0) {
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
    const max = Math.max(...filteredHourlyData.map((d) => d.revenue));
    const adjustedMax = max * 1.15; // 15% padding

    // Calculate chart dimensions
    const plotWidth = chartWrapperWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    // Generate points - 8 AM starts at CHART_PADDING_LEFT (leftmost position)
    const points = filteredHourlyData.map((data, index) => {
      const x = CHART_PADDING_LEFT + (index / Math.max(filteredHourlyData.length - 1, 1)) * plotWidth;
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
    const yAxisLabelCount = 5;
    const yAxisLabels = Array.from({ length: yAxisLabelCount }, (_, i) => {
      const value = adjustedMax - (adjustedMax / (yAxisLabelCount - 1)) * i;
      return value;
    });

    // Generate X-axis labels - show exactly 5 labels with equal spacing: 8 AM, 12 PM, 4 PM, 8 PM, 10 PM
    const targetHours = [8, 12, 16, 20, 22]; // 8 AM, 12 PM, 4 PM, 8 PM, 10 PM
    const xAxisLabelCount = targetHours.length;
    
    // Calculate evenly spaced positions across the plot width
    const xAxisLabels = targetHours.map((targetHour, labelIndex) => {
      // Format hour for display
      const hourStr = targetHour.toString().padStart(2, '0');
      const displayHour = `${hourStr}:00`;
      
      // Calculate evenly spaced X position (0 to plotWidth)
      const xPosition = (labelIndex / (xAxisLabelCount - 1)) * plotWidth;
      
      return {
        hour: displayHour,
        x: CHART_PADDING_LEFT + xPosition,
        show: true,
      };
    });

    return {
      pathData: path,
      areaPath,
      points,
      maxValue: adjustedMax,
      yAxisLabels,
      xAxisLabels,
    };
  }, [filteredHourlyData, chartWrapperWidth]);

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

  if (filteredHourlyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Peak Periods Analysis</Text>
      <View style={styles.chartContainer}>
        {/* Chart */}
        <View style={[styles.chartWrapper, { width: chartWrapperWidth }]}>
          <Svg width={chartWrapperWidth} height={CHART_HEIGHT} viewBox={`0 0 ${chartWrapperWidth} ${CHART_HEIGHT}`}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={BluePalette.backgroundCard} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={BluePalette.backgroundCard} stopOpacity="0.1" />
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
                  d={`M ${CHART_PADDING_LEFT} ${y} L ${chartWrapperWidth - CHART_PADDING_RIGHT} ${y}`}
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
              stroke={BluePalette.backgroundCard}
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
                fill={BluePalette.backgroundCard}
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
              (label, index) => {
                if (!label.show) return null;
                // Calculate position relative to xAxisContainer (which starts at CHART_PADDING_LEFT)
                const relativeX = label.x - CHART_PADDING_LEFT;
                const availableWidth = chartWrapperWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
                // Clamp label position to stay within bounds (label container width is 50, so center it)
                const labelLeft = Math.max(0, Math.min(relativeX - 25, availableWidth - 50));
                return (
                  <View
                    key={index}
                    style={[styles.xAxisLabelContainer, { left: labelLeft }]}
                  >
                    <View style={styles.xAxisTickLine} />
                    <Text style={styles.xAxisLabel}>{label.hour}</Text>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* Peak Periods Cards */}
        {/* <View style={styles.periodsContainer}>
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
        </View> */}
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
