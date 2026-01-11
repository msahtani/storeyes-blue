import { StatusType } from '../types/statistics';

/**
 * Calculate profit status based on percentage of revenue
 * Good (≥33%), Medium (15-33%), Critical (<15%)
 */
export function calculateProfitStatus(profitPercentage: number): StatusType {
  if (profitPercentage >= 33) {
    return 'good';
  } else if (profitPercentage >= 15) {
    return 'medium';
  } else {
    return 'critical';
  }
}

/**
 * Calculate charges status based on percentage of revenue
 * Healthy (≤66%), High (66-75%), Critical (>75%)
 * Maps to: good (≤66%), medium (66-75%), critical (>75%)
 */
export function calculateChargesStatus(chargesPercentage: number): StatusType {
  if (chargesPercentage <= 66) {
    return 'good';
  } else if (chargesPercentage <= 75) {
    return 'medium';
  } else {
    return 'critical';
  }
}

/**
 * Calculate percentages and statuses from raw KPI data
 */
export function calculateKPIMetrics(revenue: number, charges: number, profit: number) {
  const chargesPercentage = revenue > 0 ? (charges / revenue) * 100 : 0;
  const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    chargesPercentage,
    profitPercentage,
    chargesStatus: calculateChargesStatus(chargesPercentage),
    profitStatus: calculateProfitStatus(profitPercentage),
  };
}
