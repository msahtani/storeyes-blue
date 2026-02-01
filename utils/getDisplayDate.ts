/**
 * Display date logic: Day X is shown from 21:00 GMT of day X until 21:00 GMT of day X+1.
 * All dates are in UTC/GMT terms for consistency across timezones.
 */

/**
 * Get the current display date as "YYYY-MM-DD" string (UTC).
 * Used when no date is selected - e.g. 12:34 AM GMT+1 Feb 2 = 23:34 UTC Feb 1 → "2026-02-01"
 */
export const getDisplayDateString = (): string => {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();

  let displayYear: number;
  let displayMonth: number;
  let displayDay: number;

  if (utcHours >= 21) {
    displayYear = utcYear;
    displayMonth = utcMonth;
    displayDay = utcDate;
  } else {
    const prevUtc = new Date(Date.UTC(utcYear, utcMonth, utcDate - 1));
    displayYear = prevUtc.getUTCFullYear();
    displayMonth = prevUtc.getUTCMonth();
    displayDay = prevUtc.getUTCDate();
  }

  const year = displayYear;
  const month = String(displayMonth + 1).padStart(2, "0");
  const day = String(displayDay).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get the current display date as a Date object (noon UTC of that day).
 */
export const getDisplayDate = (): Date => {
  const dateStr = getDisplayDateString();
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};
