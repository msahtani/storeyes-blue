/**
 * Shared amount formatting utilities for consistent display across charges, statistics, and cash-register.
 * - Space between each 3 digits (thousands separator)
 * - Comma for decimal separator
 * - Whole numbers (e.g. 100.00) shown as int without ",00"
 * - MAD currency
 */

/**
 * Format number for display: space between each 3 digits, comma for decimal.
 * Whole numbers (e.g. 100.00) are shown as int without ",00".
 * e.g. 1234.56 -> "1 234,56", 1234.00 -> "1 234"
 */
export const formatAmountForDisplay = (value: number, decimals = 2): string => {
  const rounded =
    Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const isWhole = rounded === Math.round(rounded);
  const numStr = isWhole ? rounded.toString() : rounded.toFixed(decimals);
  const parts = numStr.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decPart = parts[1];
  return decPart ? `${intPart},${decPart}` : intPart;
};

/**
 * Format amount as MAD currency for display.
 * Uses fr-FR style: space thousands, comma decimal, hides ,00 for whole numbers.
 */
export const formatAmountMAD = (amount: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
