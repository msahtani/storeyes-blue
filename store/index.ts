import { configureStore } from '@reduxjs/toolkit';

import appReducer from './slices/appSlice';
import alertsReducer from '@/domains/alerts/store/alertsSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    alerts: alertsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

