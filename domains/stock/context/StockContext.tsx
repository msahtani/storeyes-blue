import React, { createContext, useCallback, useContext, useState } from 'react';

import { buildInitialManualInventory, fakeStockProducts } from '../data/fakeStockData';
import type { ManualInventoryEntry } from '../types';

type StockContextValue = {
  manualEntries: ManualInventoryEntry[];
  setManualEntries: React.Dispatch<React.SetStateAction<ManualInventoryEntry[]>>;
  /** Date when the other user submitted stock (differences shown). Null after owner validates. */
  inventoryDifferencesDate: Date | null;
  setInventoryDifferencesDate: (d: Date | null) => void;
  /** Accept real counts as new system baseline and clear differences. */
  acceptAndValidateInventory: () => void;
};

const StockContext = createContext<StockContextValue | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [manualEntries, setManualEntries] = useState<ManualInventoryEntry[]>(
    () => buildInitialManualInventory(fakeStockProducts)
  );
  const [inventoryDifferencesDate, setInventoryDifferencesDate] = useState<Date | null>(() => {
    const entries = buildInitialManualInventory(fakeStockProducts);
    return entries.some((e) => e.difference !== 0) ? new Date() : null;
  });

  const acceptAndValidateInventory = useCallback(() => {
    setManualEntries((prev) =>
      prev.map((e) => ({
        ...e,
        systemQuantity: e.manualQuantity,
        difference: 0,
      }))
    );
    setInventoryDifferencesDate(null);
  }, []);

  return (
    <StockContext.Provider
      value={{
        manualEntries,
        setManualEntries,
        inventoryDifferencesDate,
        setInventoryDifferencesDate,
        acceptAndValidateInventory,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (ctx === undefined) {
    throw new Error('useStock must be used within StockProvider');
  }
  return ctx;
}
