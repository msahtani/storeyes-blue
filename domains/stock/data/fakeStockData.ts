import type {
  StockProductWithPrice,
  CategoryWithValue,
  ProductToBuy,
  ManualInventoryEntry,
} from '../types';

/**
 * Fake stock data for testing - aligned with backoffice StockProduct model
 * Includes unit prices for value calculation.
 */
export const fakeStockProducts: StockProductWithPrice[] = [
  {
    id: 'sp1',
    name: 'Coffee beans 1kg',
    category: 'Beverages',
    type: 'raw_material',
    unit: 'kg',
    quantity: 12,
    minimalThreshold: 2,
    unitPrice: 85,
    location: 'Dry storage',
    isActive: true,
  },
  {
    id: 'sp2',
    name: 'Whole milk 1L',
    category: 'Dairy',
    type: 'raw_material',
    unit: 'ml',
    quantity: 24000,
    minimalThreshold: 5000,
    unitPrice: 0.008, // 8 MAD per L
    location: 'Fridge 1',
    isActive: true,
  },
  {
    id: 'sp3',
    name: 'Paper cup',
    category: 'Packaging',
    type: 'raw_material',
    unit: 'piece',
    quantity: 500,
    minimalThreshold: 100,
    unitPrice: 0.35,
    location: 'Dry storage',
    isActive: true,
  },
  {
    id: 'sp4',
    name: 'Sugar',
    category: 'Pantry',
    type: 'raw_material',
    unit: 'g',
    quantity: 5000,
    minimalThreshold: 500,
    unitPrice: 0.006, // 6 MAD per kg
    location: 'Dry storage',
    isActive: true,
  },
  {
    id: 'sp5',
    name: 'Burger bun',
    category: 'Bakery',
    type: 'raw_material',
    unit: 'piece',
    quantity: 80,
    minimalThreshold: 20,
    unitPrice: 2.5,
    location: 'Fridge 1',
    isActive: true,
  },
  {
    id: 'sp6',
    name: 'Beef patty',
    category: 'Meat',
    type: 'raw_material',
    unit: 'piece',
    quantity: 8,
    minimalThreshold: 15,
    unitPrice: 12,
    location: 'Fridge 1',
    isActive: true,
  },
  {
    id: 'sp7',
    name: 'Coca Cola 33cl',
    category: 'Beverages',
    type: 'finished_good',
    unit: 'piece',
    quantity: 120,
    minimalThreshold: 24,
    unitPrice: 5,
    location: 'Dry storage',
    isActive: true,
  },
  {
    id: 'sp8',
    name: 'Water 50cl',
    category: 'Beverages',
    type: 'finished_good',
    unit: 'piece',
    quantity: 15,
    minimalThreshold: 30,
    unitPrice: 2,
    location: 'Dry storage',
    isActive: true,
  },
  {
    id: 'sp9',
    name: 'Lettuce',
    category: 'Produce',
    type: 'raw_material',
    unit: 'piece',
    quantity: 3,
    minimalThreshold: 5,
    unitPrice: 4,
    location: 'Fridge 1',
    isActive: true,
  },
  {
    id: 'sp10',
    name: 'Tomato',
    category: 'Produce',
    type: 'raw_material',
    unit: 'piece',
    quantity: 30,
    minimalThreshold: 8,
    unitPrice: 1.5,
    location: 'Fridge 1',
    isActive: true,
  },
];

/** Get product value (quantity * unitPrice) */
export function getProductValue(p: StockProductWithPrice): number {
  return p.quantity * p.unitPrice;
}

/** Build categories with values from products */
export function buildCategoriesWithValues(
  products: StockProductWithPrice[]
): CategoryWithValue[] {
  const byCategory = new Map<string, StockProductWithPrice[]>();
  for (const p of products) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  return Array.from(byCategory.entries()).map(([name, prods]) => {
    const totalValue = prods.reduce((sum, p) => sum + getProductValue(p), 0);
    return {
      name,
      totalValue,
      productCount: prods.length,
      products: prods,
    };
  });
}

/** Build list of products to buy (below threshold) from product list */
export function buildProductsToBuy(
  products: StockProductWithPrice[]
): ProductToBuy[] {
  return products
    .filter((p) => p.quantity <= p.minimalThreshold)
    .map((p) => ({
      product: p,
      actualQuantity: p.quantity,
      thresholdQuantity: p.minimalThreshold,
      quantityToBuy: Math.max(
        p.minimalThreshold - p.quantity + p.minimalThreshold,
        p.minimalThreshold
      ),
    }))
    .sort((a, b) => a.product.category.localeCompare(b.product.category));
}

/** Build "to buy" list from manual entries (real quantity <= threshold) */
export function buildProductsToBuyFromEntries(
  entries: ManualInventoryEntry[]
): { entry: ManualInventoryEntry; quantityToBuy: number }[] {
  return entries
    .filter((e) => e.manualQuantity <= e.minimalThreshold)
    .map((e) => ({
      entry: e,
      quantityToBuy: Math.max(
        e.minimalThreshold - e.manualQuantity + e.minimalThreshold,
        e.minimalThreshold
      ),
    }))
    .sort((a, b) => a.entry.category.localeCompare(b.entry.category));
}

/** Default manual counts - include example variances so Inventory comparison is visible */
export function buildInitialManualInventory(
  products: StockProductWithPrice[]
): ManualInventoryEntry[] {
  const entries = products.map((p) => ({
    productId: p.id,
    productName: p.name,
    category: p.category,
    unit: p.unit,
    unitPrice: p.unitPrice,
    minimalThreshold: p.minimalThreshold,
    systemQuantity: p.quantity,
    manualQuantity: p.quantity,
    difference: 0,
  }));

  // Example variances: a few products with manual count different from system (for demo)
  const varianceExamples: { id: string; manualDelta: number }[] = [
    { id: 'sp1', manualDelta: -2 },
    { id: 'sp3', manualDelta: 50 },
    { id: 'sp6', manualDelta: 3 },
    { id: 'sp8', manualDelta: -10 },
    { id: 'sp9', manualDelta: 5 },
  ];
  const byId = new Map(entries.map((e) => [e.productId, e]));
  for (const { id, manualDelta } of varianceExamples) {
    const e = byId.get(id);
    if (e) {
      e.manualQuantity = Math.max(0, e.systemQuantity + manualDelta);
      e.difference = e.manualQuantity - e.systemQuantity;
    }
  }
  return entries;
}

/** Group manual inventory entries by category */
export function groupInventoryByCategory(
  entries: ManualInventoryEntry[]
): { name: string; entries: ManualInventoryEntry[] }[] {
  const byCategory = new Map<string, ManualInventoryEntry[]>();
  for (const e of entries) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }
  return Array.from(byCategory.entries()).map(([name, entries]) => ({
    name,
    entries,
  }));
}

/** Total value from system quantities and unit prices */
export function getSystemTotalFromEntries(entries: ManualInventoryEntry[]): number {
  return entries.reduce((sum, e) => sum + e.systemQuantity * e.unitPrice, 0);
}

/** Total value from manual quantities and unit prices */
export function getManualTotalFromEntries(entries: ManualInventoryEntry[]): number {
  return entries.reduce((sum, e) => sum + e.manualQuantity * e.unitPrice, 0);
}
