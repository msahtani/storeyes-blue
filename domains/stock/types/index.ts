/**
 * Stock domain types - aligned with backoffice StockProduct model
 * Extended with unitPrice for value calculation on mobile.
 */

export type StockUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece';

export type StockProductType = 'raw_material' | 'finished_good';

/** Stock product with unit price for value calculation */
export interface StockProductWithPrice {
  id: string;
  name: string;
  category: string;
  type: StockProductType;
  unit: StockUnit;
  quantity: number;
  minimalThreshold: number;
  unitPrice: number; // price per unit (per kg, per piece, etc.)
  location?: string;
  isActive: boolean;
}

/** Category with aggregated value and products */
export interface CategoryWithValue {
  name: string;
  totalValue: number;
  productCount: number;
  products: StockProductWithPrice[];
}

/** Product below threshold - needs restocking */
export interface ProductToBuy {
  product: StockProductWithPrice;
  actualQuantity: number;
  thresholdQuantity: number;
  quantityToBuy: number; // suggested buy quantity (e.g. threshold - actual, or 2x threshold)
}

/** Manual inventory entry - user-counted vs system */
export interface ManualInventoryEntry {
  productId: string;
  productName: string;
  category: string;
  unit: StockUnit;
  unitPrice: number; // for total value calculation
  minimalThreshold: number; // for "what to buy" based on real quantity
  systemQuantity: number; // from revenue/recipes
  manualQuantity: number; // user input (real count)
  difference: number; // manualQuantity - systemQuantity
}
