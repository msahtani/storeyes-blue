// Types for Charges service - Matching Backend API

// Enums matching backend
export enum ChargeCategory {
  PERSONNEL = 'PERSONNEL',
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
  WIFI = 'WIFI',
}

export enum ChargePeriod {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

export enum EmployeeType {
  SERVER = 'SERVER',
  BARMAN = 'BARMAN',
  CLEANER = 'CLEANER',
}

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE',
}

// Legacy lowercase types for backward compatibility with existing UI code
export type PeriodType = 'day' | 'week' | 'month';
export type FixedChargeCategory = 'personnel' | 'water' | 'electricity' | 'wifi';
export type PersonnelType = 'server' | 'barman' | 'cleaner';

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

// Backend API Types (using uppercase enums and numeric IDs)
export interface FixedChargeResponse {
  id: number;
  category: ChargeCategory;
  amount: number;
  period: ChargePeriod;
  monthKey: string; // Format: "YYYY-MM"
  weekKey: string | null; // Format: "YYYY-MM-DD" (Monday date of the week) or null for monthly charges
  trend: TrendDirection | null;
  trendPercentage: number | null;
  abnormalIncrease: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface PersonnelEmployee {
  id: number;
  name: string;
  type: EmployeeType;
  position?: string;
  startDate?: string; // ISO date
  salary: number;
  hours?: number;
  salaryByPeriod: 'WEEK' | 'MONTH';
  monthSalary: number; // Total monthly salary
  weekSalary: number; // Salary for a single week (when period is WEEK)
  weekSalaries: Record<string, number>; // e.g., { "2024-01-29": 500.00 } where key is week start date (Monday) in YYYY-MM-DD format
  // Note: weeks start on Monday and end on Sunday. Week keys use the Monday date.
  // Some weeks span 2 months (e.g., Jan 29 - Feb 4). The week key is always the Monday date.
}

export interface PersonnelDataGroup {
  type: EmployeeType;
  totalAmount: number;
  employees: PersonnelEmployee[];
}

export interface ChartDataPoint {
  period: string; // e.g., "Mar 2024"
  amount: number;
}

export interface FixedChargeDetailResponse extends FixedChargeResponse {
  previousAmount?: number;
  notes?: string;
  personnelData?: PersonnelDataGroup[];
  chartData?: ChartDataPoint[];
}

// Request types for creating/updating charges
export interface PersonnelEmployeeRequest {
  id?: number; // Include to reuse existing employee
  name: string;
  type: EmployeeType;
  position?: string;
  startDate?: string; // ISO date format
  salary?: number; // Total salary (for monthly charges, this redistributes across all weeks)
  hours?: number;
  weekSalaries?: Record<string, number>; // Update specific week salaries (key is Monday date in YYYY-MM-DD format)
}

export interface CreateFixedChargeRequest {
  category: ChargeCategory;
  period: ChargePeriod;
  monthKey: string;
  weekKey: string | null;
  notes?: string;
  amount?: number; // Required for non-personnel
  employees?: PersonnelEmployeeRequest[]; // Required for personnel
}

export interface UpdateFixedChargeRequest {
  amount?: number;
  period?: ChargePeriod;
  monthKey?: string;
  weekKey?: string;
  notes?: string;
  employees?: PersonnelEmployeeRequest[];
}

// Variable Charges
export interface VariableChargeResponse {
  id: number;
  name: string;
  amount: number;
  date: string; // ISO date format
  category: string;
  supplier?: string;
  notes?: string;
  purchaseOrderUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVariableChargeRequest {
  name: string;
  amount: number;
  date: string; // ISO date format
  category: string;
  supplier?: string;
  notes?: string;
  purchaseOrderUrl?: string;
}

export interface UpdateVariableChargeRequest {
  name?: string;
  amount?: number;
  date?: string;
  category?: string;
  supplier?: string;
  notes?: string;
  purchaseOrderUrl?: string;
}

// Employee reuse endpoint response
export interface AvailableEmployee {
  id: number;
  name: string;
  type: EmployeeType;
  position?: string;
  startDate?: string;
}

// Frontend-compatible types (lowercase for UI compatibility)
// These can be converted from backend types using utility functions
export interface FixedCharge {
  id: string; // Converted from number for UI compatibility
  category: FixedChargeCategory; // Converted from uppercase enum
  amount: number;
  period: 'week' | 'month'; // Converted from uppercase enum
  monthKey?: string;
  weekKey?: string | null;
  trend?: 'up' | 'down' | 'stable'; // Converted from uppercase enum
  trendPercentage?: number;
  abnormalIncrease?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FixedChargeDetail extends FixedCharge {
  previousAmount?: number;
  notes?: string;
  chartData?: Array<{
    period: string;
    amount: number;
  }>;
  personnelData?: PersonnelTypeData[];
}

export interface PersonnelEmployeeUI {
  id: string; // Converted from number (may be PersonnelEmployee ID or Employee ID)
  name: string;
  salary?: number;
  hours?: number;
  position?: string;
  startDate?: string;
  type?: PersonnelType;
  salaryByPeriod?: 'week' | 'month';
  weekSalary?: number; // Salary for the currently selected week
  monthSalary?: number; // Total monthly salary (sum of all week salaries)
  weekSalaries?: Record<string, number>; // Format: { "YYYY-MM-DD": amount } where key is Monday date
  // Note: weeks are Monday-Sunday. Week key is the Monday date in YYYY-MM-DD format.
  // This allows weeks to span months (e.g., "2024-01-29" for Jan 29 - Feb 4 week)
  employeeId?: number; // Valid Employee ID (from employees table) - only set when employee is selected from getAvailableEmployees
}

export interface PersonnelTypeData {
  type: PersonnelType;
  employees: PersonnelEmployeeUI[];
  totalAmount: number;
}

export interface VariableCharge {
  id: string; // Converted from number
  name: string;
  amount: number;
  date: string;
  category: string;
  supplier?: string;
  notes?: string;
  purchaseOrderUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VariableChargeDetail extends VariableCharge {
  // Additional detail fields can be added here
}

