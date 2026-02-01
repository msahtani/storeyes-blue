import { apiClient } from "@/api/client";
import {
  ApiResponse,
  AvailableEmployee,
  ChargeCategory,
  ChargePeriod,
  CreateFixedChargeRequest,
  CreateVariableChargeRequest,
  EmployeeType,
  FixedChargeDetailResponse,
  FixedChargeResponse,
  UpdateFixedChargeRequest,
  UpdateVariableChargeRequest,
  VariableChargeResponse,
} from "../types/charge";

/**
 * Charges Service - Frontend API Integration
 * All endpoints are scoped to the authenticated user's store.
 * Base URL: /api/charges
 */

// ==================== Fixed Charges API ====================

/**
 * Get all fixed charges with optional filtering
 * @param params - Query parameters
 * @returns Array of fixed charges
 */
export const getFixedCharges = async (params?: {
  month?: string; // Format: "YYYY-MM"
  category?: ChargeCategory;
  period?: ChargePeriod;
}): Promise<FixedChargeResponse[]> => {
  const { data } = await apiClient.get<ApiResponse<FixedChargeResponse[]>>(
    "/charges/fixed",
    {
      params,
    },
  );
  return data.data;
};

/**
 * Get fixed charge by ID (detail view)
 * @param id - Charge ID
 * @param month - Month key for context (format: "YYYY-MM")
 * @returns Detailed charge information with employee data
 */
export const getFixedChargeById = async (
  id: number,
  month?: string,
): Promise<FixedChargeDetailResponse> => {
  const { data } = await apiClient.get<ApiResponse<FixedChargeDetailResponse>>(
    `/charges/fixed/${id}`,
    {
      params: month ? { month } : undefined,
    },
  );
  return data.data;
};

/**
 * Get all fixed charges for a specific month
 * @param monthKey - Month in format "YYYY-MM" (e.g., "2024-03")
 * @returns Array of fixed charges for the month
 */
export const getFixedChargesByMonth = async (
  monthKey: string,
): Promise<FixedChargeResponse[]> => {
  const { data } = await apiClient.get<ApiResponse<FixedChargeResponse[]>>(
    `/charges/fixed/month/${monthKey}`,
  );
  return data.data;
};

/**
 * Get fixed charges for a specific week within a month
 * @param monthKey - Month in format "YYYY-MM" (e.g., "2024-03")
 * @param weekKey - Week key in format "YYYY-MM-DD" (Monday date, e.g., "2024-03-04")
 * @param category - Optional category filter
 * @returns Array of fixed charges for the week
 */
export const getFixedChargesByWeek = async (
  monthKey: string,
  weekKey: string,
  category?: ChargeCategory,
): Promise<FixedChargeResponse[]> => {
  const { data } = await apiClient.get<ApiResponse<FixedChargeResponse[]>>(
    `/charges/fixed/month/${monthKey}/week/${weekKey}`,
    {
      params: category ? { category } : undefined,
    },
  );
  return data.data;
};

/**
 * Create a new fixed charge
 * @param request - Charge creation request
 * @returns Created charge
 */
export const createFixedCharge = async (
  request: CreateFixedChargeRequest,
): Promise<FixedChargeResponse> => {
  const { data } = await apiClient.post<ApiResponse<FixedChargeResponse>>(
    "/charges/fixed",
    request,
  );
  return data.data;
};

/**
 * Update an existing fixed charge
 * @param id - Charge ID
 * @param request - Update request (all fields optional)
 * @returns Updated charge
 */
export const updateFixedCharge = async (
  id: number,
  request: UpdateFixedChargeRequest,
): Promise<FixedChargeResponse> => {
  const { data } = await apiClient.put<ApiResponse<FixedChargeResponse>>(
    `/charges/fixed/${id}`,
    request,
  );
  return data.data;
};

/**
 * Delete a fixed charge
 * @param id - Charge ID
 */
export const deleteFixedCharge = async (id: number): Promise<void> => {
  await apiClient.delete(`/charges/fixed/${id}`);
};

/**
 * Get available employees for reuse when creating new charges
 * @param type - Optional employee type filter
 * @returns Array of available employees
 */
export const getAvailableEmployees = async (
  type?: EmployeeType,
): Promise<AvailableEmployee[]> => {
  const { data } = await apiClient.get<ApiResponse<AvailableEmployee[]>>(
    "/charges/fixed/personnel/employees",
    {
      params: type ? { type } : undefined,
    },
  );
  return data.data;
};

// ==================== Variable Charges API ====================

/**
 * Get all variable charges with optional filtering
 * @param params - Query parameters
 * @returns Array of variable charges
 */
export const getVariableCharges = async (params?: {
  startDate?: string; // Format: "YYYY-MM-DD"
  endDate?: string; // Format: "YYYY-MM-DD"
  category?: string;
}): Promise<VariableChargeResponse[]> => {
  // Only include params that have values
  const queryParams: Record<string, string> = {};
  if (params?.startDate) {
    queryParams.startDate = params.startDate;
  }
  if (params?.endDate) {
    queryParams.endDate = params.endDate;
  }
  if (params?.category) {
    queryParams.category = params.category;
  }

  const { data } = await apiClient.get<ApiResponse<VariableChargeResponse[]>>(
    "/charges/variable",
    {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  );
  return data.data;
};

/**
 * Get variable charge by ID
 * @param id - Charge ID
 * @returns Variable charge details
 */
export const getVariableChargeById = async (
  id: number,
): Promise<VariableChargeResponse> => {
  const { data } = await apiClient.get<ApiResponse<VariableChargeResponse>>(
    `/charges/variable/${id}`,
  );
  return data.data;
};

/**
 * Create a new variable charge
 * @param request - Variable charge creation request
 * @returns Created charge
 */
export const createVariableCharge = async (
  request: CreateVariableChargeRequest,
): Promise<VariableChargeResponse> => {
  const { data } = await apiClient.post<ApiResponse<VariableChargeResponse>>(
    "/charges/variable",
    request,
  );
  return data.data;
};

/**
 * Update an existing variable charge
 * @param id - Charge ID
 * @param request - Update request (all fields optional)
 * @returns Updated charge
 */
export const updateVariableCharge = async (
  id: number,
  request: UpdateVariableChargeRequest,
): Promise<VariableChargeResponse> => {
  const { data } = await apiClient.put<ApiResponse<VariableChargeResponse>>(
    `/charges/variable/${id}`,
    request,
  );
  return data.data;
};

/**
 * Delete a variable charge
 * @param id - Charge ID
 */
export const deleteVariableCharge = async (id: number): Promise<void> => {
  await apiClient.delete(`/charges/variable/${id}`);
};

// ==================== Number Formatting Utilities ====================

/** Allow digits, spaces (thousands), and comma (decimal) - normalize '.' to ',' */
const normalizeAmountInput = (value: string): string => {
  // Allow digits, space, comma. Replace dot with comma for consistency
  let result = value.replace(/\./g, ",").replace(/[^\d\s,]/g, "");
  // Ensure only one decimal separator (comma)
  const commaIndex = result.indexOf(",");
  if (commaIndex !== -1) {
    result =
      result.slice(0, commaIndex + 1) +
      result.slice(commaIndex + 1).replace(/,/g, "");
  }
  return result;
};

/**
 * Parse user input to number (accepts comma as decimal, spaces as thousands)
 */
export const parseAmountInput = (value: string): number => {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};

export { formatAmountForDisplay } from "@/utils/formatAmount";

/**
 * Normalize amount input for TextInput (use in onChangeText)
 */
export const formatAmountInput = normalizeAmountInput;

// ==================== Utility Functions ====================

/**
 * Helper to convert backend enum values to frontend lowercase format
 */
export const convertCategoryToFrontend = (
  category: ChargeCategory,
): "personnel" | "water" | "electricity" | "wifi" => {
  return category.toLowerCase() as
    | "personnel"
    | "water"
    | "electricity"
    | "wifi";
};

export const convertCategoryFromFrontend = (
  category: "personnel" | "water" | "electricity" | "wifi",
): ChargeCategory => {
  return category.toUpperCase() as ChargeCategory;
};

export const convertPeriodToFrontend = (
  period: ChargePeriod,
): "week" | "month" => {
  return period.toLowerCase() as "week" | "month";
};

export const convertPeriodFromFrontend = (
  period: "week" | "month",
): ChargePeriod => {
  return period.toUpperCase() as ChargePeriod;
};

export const convertTrendToFrontend = (
  trend: "UP" | "DOWN" | "STABLE" | null,
): "up" | "down" | "stable" | undefined => {
  if (!trend) return undefined;
  return trend.toLowerCase() as "up" | "down" | "stable";
};

/**
 * Convert backend EmployeeType to frontend PersonnelType
 */
export const convertEmployeeTypeToFrontend = (
  type: EmployeeType,
): "server" | "barman" | "cleaner" => {
  return type.toLowerCase() as "server" | "barman" | "cleaner";
};

/**
 * Convert frontend PersonnelType to backend EmployeeType
 */
export const convertEmployeeTypeFromFrontend = (
  type: "server" | "barman" | "cleaner",
): EmployeeType => {
  return type.toUpperCase() as EmployeeType;
};

/**
 * Convert backend FixedChargeResponse to frontend FixedCharge format
 */
export const convertFixedChargeToFrontend = (
  charge: FixedChargeResponse,
): {
  id: string;
  category: "personnel" | "water" | "electricity" | "wifi";
  amount: number;
  period: "week" | "month";
  monthKey?: string;
  weekKey?: string | null;
  trend?: "up" | "down" | "stable";
  trendPercentage?: number;
  abnormalIncrease?: boolean;
  createdAt?: string;
  updatedAt?: string;
} => {
  return {
    id: charge.id.toString(),
    category: convertCategoryToFrontend(charge.category),
    amount: charge.amount,
    period: convertPeriodToFrontend(charge.period),
    monthKey: charge.monthKey,
    weekKey: charge.weekKey,
    trend: convertTrendToFrontend(charge.trend),
    trendPercentage: charge.trendPercentage ?? undefined,
    abnormalIncrease: charge.abnormalIncrease,
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };
};

/**
 * Convert backend FixedChargeDetailResponse to frontend FixedChargeDetail format
 */
export const convertFixedChargeDetailToFrontend = (
  charge: FixedChargeDetailResponse,
): {
  id: string;
  category: "personnel" | "water" | "electricity" | "wifi";
  amount: number;
  period: "week" | "month";
  monthKey?: string;
  weekKey?: string | null;
  trend?: "up" | "down" | "stable";
  trendPercentage?: number;
  abnormalIncrease?: boolean;
  previousAmount?: number;
  notes?: string;
  chartData?: Array<{ period: string; amount: number }>;
  personnelData?: Array<{
    type: "server" | "barman" | "cleaner";
    totalAmount: number;
    employees: Array<{
      id: string;
      name: string;
      salary?: number;
      hours?: number;
      position?: string;
      startDate?: string;
      type?: "server" | "barman" | "cleaner";
      salaryByPeriod?: "week" | "month";
      weekSalary?: number;
      monthSalary?: number;
      weekSalaries?: Record<string, number>;
      // daysLeftSalary is deprecated - removed from type definition
    }>;
  }>;
  createdAt?: string;
  updatedAt?: string;
} => {
  return {
    id: charge.id.toString(),
    category: convertCategoryToFrontend(charge.category),
    amount: charge.amount,
    period: convertPeriodToFrontend(charge.period),
    monthKey: charge.monthKey,
    weekKey: charge.weekKey,
    trend: convertTrendToFrontend(charge.trend),
    trendPercentage: charge.trendPercentage ?? undefined,
    abnormalIncrease: charge.abnormalIncrease,
    previousAmount: charge.previousAmount,
    notes: charge.notes,
    chartData: charge.chartData,
    personnelData: charge.personnelData?.map((group) => ({
      type: convertEmployeeTypeToFrontend(group.type),
      totalAmount: group.totalAmount,
      employees: group.employees.map((emp) => ({
        id: emp.id.toString(), // This is PersonnelEmployee ID, not Employee ID
        name: emp.name,
        salary: emp.salary,
        hours: emp.hours,
        position: emp.position,
        startDate: emp.startDate,
        type: convertEmployeeTypeToFrontend(emp.type),
        salaryByPeriod: emp.salaryByPeriod.toLowerCase() as "week" | "month",
        weekSalary: emp.weekSalary,
        monthSalary: emp.monthSalary,
        weekSalaries: emp.weekSalaries,
        // employeeId is NOT set here - these are PersonnelEmployee IDs, not Employee IDs
        // When saving, backend will match by name/type/position/startDate
        // daysLeftSalary is deprecated - not included in conversion
      })),
    })),
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };
};
