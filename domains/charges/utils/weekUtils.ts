/**
 * Week Utilities for Personnel Charges
 * 
 * Weeks are defined as Monday-Sunday (ISO 8601 standard).
 * Weeks can span across two months, so each week needs a unique identifier
 * based on its actual start date, not just a month-based week number.
 */

export interface WeekInfo {
  weekKey: string; // Format: "YYYY-MM-DD" (Monday date)
  startDate: Date; // Monday of the week
  endDate: Date; // Sunday of the week
  label: string; // Display label like "Jan 29 - Feb 4"
  monthKeys: string[]; // Array of month keys this week spans (e.g., ["2024-01", "2024-02"])
  isComplete: boolean; // True if week has all 7 days within the date range
}

/**
 * Get the Monday of the week containing the given date
 * Monday is day 1, Sunday is day 0
 */
export const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
};

/**
 * Get the Sunday of the week containing the given date
 */
export const getSundayOfWeek = (date: Date): Date => {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

/**
 * Generate a unique week key based on the Monday start date
 * Format: "YYYY-MM-DD" (the Monday date)
 * This ensures uniqueness even when weeks span months
 */
export const generateWeekKey = (mondayDate: Date): string => {
  const year = mondayDate.getFullYear();
  const month = String(mondayDate.getMonth() + 1).padStart(2, '0');
  const day = String(mondayDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a week key back to a Date (Monday)
 * @param weekKey - Week key in format "YYYY-MM-DD"
 * @returns Date object for the Monday
 */
export const parseWeekKey = (weekKey: string): Date => {
  const [year, month, day] = weekKey.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid week key format: ${weekKey}. Expected YYYY-MM-DD`);
  }
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid week key date: ${weekKey}`);
  }
  return date;
};

/**
 * Get month key from date
 * Format: "YYYY-MM"
 */
export const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get all month keys that a week spans
 */
export const getMonthKeysForWeek = (startDate: Date, endDate: Date): string[] => {
  const monthKeys = new Set<string>();
  const current = new Date(startDate);
  
  while (current <= endDate) {
    monthKeys.add(getMonthKey(current));
    current.setDate(current.getDate() + 1);
  }
  
  return Array.from(monthKeys).sort();
};

/**
 * Format week label for display
 * Examples: "Jan 29 - Feb 4", "Mar 4-10"
 */
export const formatWeekLabel = (startDate: Date, endDate: Date): string => {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

/**
 * Get all weeks that belong to a given month (where Monday is in the month)
 * IMPORTANT: Only returns weeks where the Monday falls within the specified month
 * This means weeks that span months are only returned for the month where their Monday falls
 */
export const getWeeksBelongingToMonth = (monthKey: string): WeekInfo[] => {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0); // Last day of month
  monthEnd.setHours(23, 59, 59, 999);
  
  // Get Monday of the week containing month start
  let currentMonday = getMondayOfWeek(monthStart);
  
  // If the Monday is before the month start, move to next Monday
  if (currentMonday < monthStart) {
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  const weeks: WeekInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate weeks where Monday is in this month
  while (currentMonday <= monthEnd) {
    const weekMonthKey = getMonthKey(currentMonday);
    
    // Only include weeks where Monday is in this month
    if (weekMonthKey === monthKey) {
      const sunday = getSundayOfWeek(currentMonday);
      const weekKey = generateWeekKey(currentMonday);
      const monthKeys = getMonthKeysForWeek(currentMonday, sunday);
      const label = formatWeekLabel(currentMonday, sunday);
      
      // Week is complete if it has all 7 days and is in the past
      const isComplete = sunday < today && (sunday.getTime() - currentMonday.getTime()) === 6 * 24 * 60 * 60 * 1000;
      
      weeks.push({
        weekKey,
        startDate: new Date(currentMonday),
        endDate: new Date(sunday),
        label,
        monthKeys,
        isComplete,
      });
    }
    
    // Move to next week (next Monday)
    currentMonday.setDate(currentMonday.getDate() + 7);
    
    // Safety limit
    if (weeks.length > 6) break;
  }
  
  return weeks;
};

/**
 * Get all weeks that overlap with a given month
 * Includes weeks that start in the month or end in the month
 * Use this when you need to display all weeks that overlap with the month for selection
 */
export const getWeeksForMonth = (monthKey: string): WeekInfo[] => {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0); // Last day of month
  monthEnd.setHours(23, 59, 59, 999);
  
  // Get Monday of the week containing month start
  let currentMonday = getMondayOfWeek(monthStart);
  
  // Also include the week before if it overlaps with the month
  const weekBeforeMonday = new Date(currentMonday);
  weekBeforeMonday.setDate(weekBeforeMonday.getDate() - 7);
  if (getSundayOfWeek(weekBeforeMonday) >= monthStart) {
    currentMonday = weekBeforeMonday;
  }
  
  const weeks: WeekInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate weeks until we're past the month
  while (currentMonday <= monthEnd) {
    const sunday = getSundayOfWeek(currentMonday);
    
    // Check if this week overlaps with the month
    if (sunday >= monthStart && currentMonday <= monthEnd) {
      const weekKey = generateWeekKey(currentMonday);
      const monthKeys = getMonthKeysForWeek(currentMonday, sunday);
      const label = formatWeekLabel(currentMonday, sunday);
      
      // Week is complete if it has all 7 days and is in the past
      const isComplete = sunday < today && (sunday.getTime() - currentMonday.getTime()) === 6 * 24 * 60 * 60 * 1000;
      
      weeks.push({
        weekKey,
        startDate: new Date(currentMonday),
        endDate: new Date(sunday),
        label,
        monthKeys,
        isComplete,
      });
    }
    
    // Move to next week (next Monday)
    currentMonday.setDate(currentMonday.getDate() + 7);
    
    // Safety limit
    if (weeks.length > 6) break;
  }
  
  return weeks;
};

/**
 * Get all weeks for a date range
 */
export const getWeeksForDateRange = (startDate: Date, endDate: Date): WeekInfo[] => {
  const weeks: WeekInfo[] = [];
  const startMonday = getMondayOfWeek(startDate);
  let currentMonday = new Date(startMonday);
  
  while (currentMonday <= endDate) {
    const sunday = getSundayOfWeek(currentMonday);
    
    // Check if week overlaps with date range
    if (sunday >= startDate && currentMonday <= endDate) {
      const weekKey = generateWeekKey(currentMonday);
      const monthKeys = getMonthKeysForWeek(currentMonday, sunday);
      const label = formatWeekLabel(currentMonday, sunday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isComplete = sunday < today && (sunday.getTime() - currentMonday.getTime()) === 6 * 24 * 60 * 60 * 1000;
      
      weeks.push({
        weekKey,
        startDate: new Date(currentMonday),
        endDate: new Date(sunday),
        label,
        monthKeys,
        isComplete,
      });
    }
    
    currentMonday.setDate(currentMonday.getDate() + 7);
    
    // Safety limit
    if (weeks.length > 100) break;
  }
  
  return weeks;
};

/**
 * Get week number within a month (for display purposes)
 * Returns the week's position in the list of weeks for that month
 */
export const getWeekNumberInMonth = (weekKey: string, monthKey: string): number => {
  const weeks = getWeeksForMonth(monthKey);
  const index = weeks.findIndex(w => w.weekKey === weekKey);
  return index >= 0 ? index + 1 : 1;
};

/**
 * Determine which month a week belongs to based on its Monday (start date)
 * A week belongs to the month where its Monday falls, regardless of how many days extend into the next month
 * 
 * @param weekKey - Week key (Monday date in YYYY-MM-DD format)
 * @returns Month key (YYYY-MM format) where the week belongs
 */
export const getMonthForWeek = (weekKey: string): string => {
  const monday = parseWeekKey(weekKey);
  return getMonthKey(monday);
};

/**
 * Calculate how many days of a week fall within a specific month
 * 
 * IMPORTANT: If the week's Monday is in the given month, return 7 (full week).
 * If the week's Monday is not in the given month, return 0 (week belongs to another month).
 * 
 * This means weeks are attributed entirely to the month where their Monday falls,
 * even if the week extends into the next month.
 */
export const getDaysInMonthForWeek = (weekKey: string, monthKey: string): number => {
  const weekMonthKey = getMonthForWeek(weekKey);
  
  // If the week's Monday is in the given month, the entire week belongs to that month
  if (weekMonthKey === monthKey) {
    return 7; // Full week (Monday-Sunday)
  }
  
  // Week belongs to another month
  return 0;
};

/**
 * Check if a date falls within a week
 */
export const isDateInWeek = (date: Date, weekKey: string): boolean => {
  const weekStart = parseWeekKey(weekKey);
  const weekEnd = getSundayOfWeek(weekStart);
  return date >= weekStart && date <= weekEnd;
};

/**
 * Validate that a week key is a valid Monday date
 * @param weekKey - Week key in format "YYYY-MM-DD"
 * @returns True if the week key is valid and represents a Monday
 */
export const validateWeekKey = (weekKey: string): boolean => {
  try {
    const date = parseWeekKey(weekKey);
    return isMonday(date);
  } catch {
    return false;
  }
};

/**
 * Check if a date is a Monday
 */
export const isMonday = (date: Date): boolean => {
  return date.getDay() === 1;
};

/**
 * Validate that a week belongs to a specific month
 * A week belongs to the month where its Monday falls
 * @param weekKey - Week key in format "YYYY-MM-DD"
 * @param monthKey - Month key in format "YYYY-MM"
 * @returns True if the week belongs to the month
 */
export const validateWeekMonth = (weekKey: string, monthKey: string): boolean => {
  const weekMonthKey = getMonthForWeek(weekKey);
  return weekMonthKey === monthKey;
};

/**
 * Format week key for display
 * @param weekKey - Week key in format "YYYY-MM-DD"
 * @returns Formatted string like "Jan 1 - Jan 7, 2024" or "Jan 29 - Feb 4, 2024"
 */
export const formatWeekKeyForDisplay = (weekKey: string): string => {
  try {
    const monday = parseWeekKey(weekKey);
    const sunday = getSundayOfWeek(monday);
    return formatWeekLabel(monday, sunday);
  } catch {
    return weekKey;
  }
};
