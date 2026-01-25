import { apiClient } from '@/api/client';
import { ApiResponse } from '@/domains/charges/types/charge';
import {
  ChargesDetailResponse,
  PeriodType,
  StatisticsResponse,
} from '../types/statistics';

/**
 * Statistics Service - Frontend API Integration
 * All endpoints are scoped to the authenticated user's store.
 * Base URL: /api/statistics
 */

/**
 * Get comprehensive statistics for a specific period
 * @param period - Period type: 'day', 'week', or 'month'
 * @param date - Date for the period:
 *   - day: YYYY-MM-DD (e.g., "2024-01-15")
 *   - week: YYYY-MM-DD (Monday date of the week, e.g., "2024-01-15")
 *   - month: YYYY-MM (e.g., "2024-01")
 * @returns Statistics data including KPIs, chart data, and charges breakdown
 */
export const getStatistics = async (
  period: PeriodType,
  date: string
): Promise<StatisticsResponse['data']> => {
  const { data } = await apiClient.get<ApiResponse<StatisticsResponse['data']>>(
    '/statistics',
    {
      params: { period, date },
    }
  );
  return data.data;
};

/**
 * Get detailed breakdown of charges for a specific period
 * @param period - Period type: 'week' or 'month'
 * @param month - Month key in format YYYY-MM (e.g., "2024-01")
 * @param week - Week key in format YYYY-MM-DD (Monday date, required for week period)
 * @returns Detailed charges data with statistics
 */
export const getChargesDetail = async (
  period: 'week' | 'month',
  month: string,
  week?: string
): Promise<ChargesDetailResponse['data']> => {
  const params: Record<string, string> = { period, month };
  if (week) {
    params.week = week;
  }

  const { data } = await apiClient.get<ApiResponse<ChargesDetailResponse['data']>>(
    '/statistics/charges',
    {
      params,
    }
  );
  return data.data;
};
