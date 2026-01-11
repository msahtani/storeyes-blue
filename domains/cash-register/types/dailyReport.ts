// Types for Daily KPI Report

export interface DailyRevenueMetrics {
  totalTTC: number; // Total with tax
  totalHT: number; // Total without tax
  transactions: number;
  avgTransactionValue: number;
  revenuePerTransaction: number;
}

export interface HourlyData {
  hour: string; // Format: "05:00"
  revenue: number;
  transactions: number;
  itemsSold: number;
  avgTransactionValue?: number;
}

export interface TopProduct {
  rank: number;
  name: string;
  quantity?: number;
  revenue?: number;
}

export interface CategoryData {
  category: string;
  revenue: number;
  quantity: number;
  transactions: number;
  percentageOfRevenue: number;
}

export interface StaffPerformance {
  name: string;
  revenue: number;
  transactions: number;
  avgValue: number;
  share: number; // Percentage of total daily revenue
}

export interface PeakPeriod {
  period: string; // e.g., "Early Morning", "Morning Rush"
  timeRange: string; // e.g., "05:00-07:00"
  revenue: number;
  transactions: number;
  itemsSold: number;
  share: number; // Percentage of total daily revenue
  status: 'peak' | 'moderate' | 'low';
}

export interface DailyReportInsights {
  peakHour: {
    time: string;
    revenue: number;
  };
  bestSellingProduct: {
    name: string;
    quantity: number;
  };
  highestValueTransaction: number;
  busiestPeriod: {
    period: string;
    transactions: number;
  };
  revenueComparison?: {
    vsPreviousDay: number; // Percentage change
    vsPreviousWeek: number; // Percentage change
  };
}

export interface DailyReportData {
  date: string; // Format: "YYYY-MM-DD"
  businessName: string;
  revenue: DailyRevenueMetrics;
  hourlyData: HourlyData[];
  topProductsByQuantity: TopProduct[];
  topProductsByRevenue: TopProduct[];
  categoryAnalysis: CategoryData[];
  staffPerformance: StaffPerformance[];
  peakPeriods: PeakPeriod[];
  insights: DailyReportInsights;
}
