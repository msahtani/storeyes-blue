// Types for Charges service

export type PeriodType = 'day' | 'week' | 'month';

export type FixedChargeCategory = 'personnel' | 'water' | 'electricity' | 'wifi';

export interface FixedCharge {
  id: string;
  category: FixedChargeCategory;
  amount: number;
  period: 'week' | 'month';
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  abnormalIncrease?: boolean;
}

export type PersonnelType = 'server' | 'barman' | 'cleaner';

export interface PersonnelEmployee {
  id: string;
  name: string;
  salary: number;
  hours?: number;
  position?: string;
  startDate?: string;
}

export interface PersonnelTypeData {
  type: PersonnelType;
  employees: PersonnelEmployee[];
  totalAmount: number;
}

export interface FixedChargeDetail extends FixedCharge {
  previousAmount?: number;
  breakdown?: Array<{
    label: string;
    amount: number;
  }>;
  notes?: string;
  chartData?: Array<{
    period: string;
    amount: number;
  }>;
  personnelData?: PersonnelTypeData[];
}

export interface VariableCharge {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  supplier?: string;
  notes?: string;
  receiptUrl?: string;
  purchaseOrderUrl?: string;
  hasReceipt: boolean;
}

export interface VariableChargeDetail extends VariableCharge {
  // Additional detail fields can be added here
}

