// Types for Statistics service

export type PeriodType = 'day' | 'week' | 'month';

export type StatusType = 'good' | 'medium' | 'critical';

export interface KPIData {
  revenue: number; // CA - Chiffre d'Affaires
  charges: number; // CH - Charges
  profit: number; // BE - Bénéfices (CA - CH)
  revenueEvolution: number; // % vs previous period
  chargesPercentage: number; // CH / CA
  profitPercentage: number; // BE / CA
  chargesStatus: StatusType;
  profitStatus: StatusType;
}

export interface ChartDataPoint {
  period: string;
  revenue: number;
  charges: number;
  profit: number;
}

export interface ChargeDetail {
  id: number; // Changed from string to number to match backend
  name: string;
  amount: number;
  percentageOfCharges: number; // % of total charges
  percentageOfRevenue: number; // % of CA
  category: 'fixed' | 'variable';
  status: StatusType;
  date?: string; // For variable charges (YYYY-MM-DD)
  supplier?: string | null; // For variable charges
}

export interface StatisticsData {
  period: PeriodType;
  kpi: KPIData;
  chartData: ChartDataPoint[];
  charges: {
    fixed: ChargeDetail[];
    variable: ChargeDetail[];
  };
}

// API Response Types
export interface StatisticsResponse {
  success: boolean;
  data: StatisticsData;
}

export interface ChargesDetailStatistics {
  totalCharges: number;
  totalFixedCharges: number;
  totalVariableCharges: number;
  itemCount: number;
  percentageOfAllCharges: number;
  caPercentage: number;
  revenue: number;
}

export interface ChargesDetailData {
  period: 'week' | 'month';
  statistics: ChargesDetailStatistics;
  fixedCharges: ChargeDetail[];
  variableCharges: ChargeDetail[];
}

export interface ChargesDetailResponse {
  success: boolean;
  data: ChargesDetailData;
}

