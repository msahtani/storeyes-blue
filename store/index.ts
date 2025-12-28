import { configureStore } from '@reduxjs/toolkit';

import alertsReducer from '@/domains/alerts/store/alertsSlice';
import authReducer from '@/domains/auth/store/authSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    alerts: alertsReducer,
    auth: authReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

