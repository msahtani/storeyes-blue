import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import apiClient from '@/api/client';
import { Alert } from '@/domains/alerts/types/alert';

type AlertsState = {
  items: Alert[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedDate: string;
};

const getDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const initialState: AlertsState = {
  items: [],
  status: 'idle',
  error: null,
  selectedDate: getDefaultDate(),
};

export const fetchAlerts = createAsyncThunk<
  Alert[],
  { date: string; endDate?: string },
  { rejectValue: string }
>('alerts/fetchAlerts', async ({ date, endDate }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get<Alert[]>('/alerts', {
      params: {
        date,
        ...(endDate ? { endDate } : {}),
      },
    });
    return data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch alerts';
    return rejectWithValue(message);
  }
});

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch alerts';
      });
  },
});

export const { setSelectedDate } = alertsSlice.actions;
export default alertsSlice.reducer;

