// Types for Statistics service

export type PeriodType = 'day' | 'week' | 'month';

export type StatusType = 'good' | 'medium' | 'critical';

export interface KPIData {
  revenue: number; // CA - Chiffre d'Affaires
  charges: number; // CH - Charges
  profit: number; // BE - Bénéfices (CA - CH)
  revenueEvolution?: number; // % vs previous period
  chargesPercentage?: number; // CH / CA
  profitPercentage?: number; // BE / CA
  chargesStatus?: StatusType;
  profitStatus?: StatusType;
}

export interface ChartDataPoint {
  period: string;
  revenue: number;
  charges: number;
  profit: number;
}

export interface ChargeDetail {
  id: string;
  name: string;
  amount: number;
  percentageOfCharges: number; // % of total charges
  percentageOfRevenue: number; // % of CA
  category: 'fixed' | 'variable';
  status?: StatusType;
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

