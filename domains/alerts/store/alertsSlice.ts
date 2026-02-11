import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import apiClient from "@/api/client";
import { Alert } from "@/domains/alerts/types/alert";
import { getDisplayDateString } from "@/utils/getDisplayDate";

export type AlertTabType = "notTapped" | "return";

type AlertsState = {
  items: Alert[];
  notTappedItems: Alert[];
  returnItems: Alert[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  selectedDate: string;
  activeTab: AlertTabType;
};

const getDefaultDate = () => getDisplayDateString();

const initialState: AlertsState = {
  items: [],
  notTappedItems: [],
  returnItems: [],
  status: "idle",
  error: null,
  selectedDate: getDefaultDate(),
  activeTab: "notTapped",
};

export const fetchAlerts = createAsyncThunk<
  Alert[],
  {
    date: string;
    endDate?: string;
    alertType?: "NOT_TAPPED" | "RETURN";
    /** When true, fetches all alerts (both types) - used e.g. for home screen count */
    allAlerts?: boolean;
  },
  { rejectValue: string; state: { alerts: AlertsState } }
>("alerts/fetchAlerts", async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const { date, endDate } = payload;
    // allAlerts=true: no filter (both NOT_TAPPED and RETURN). Otherwise use activeTab or payload.alertType
    const alertType = payload?.allAlerts
      ? undefined
      : (payload?.alertType ??
        (state.alerts.activeTab === "return" ? "RETURN" : "NOT_TAPPED"));

    const { data } = await apiClient.get<Alert[]>("/alerts", {
      params: {
        date,
        ...(endDate ? { endDate } : {}),
        ...(alertType ? { alertType } : {}),
      },
    });
    return data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch alerts";
    return rejectWithValue(message);
  }
});

/** Fetches both NOT_TAPPED and RETURN alerts in parallel - used for alerts screen (tabs + counts) */
export const fetchAlertsForDate = createAsyncThunk<
  { notTapped: Alert[]; return: Alert[] },
  { date: string; endDate?: string },
  { rejectValue: string }
>("alerts/fetchAlertsForDate", async ({ date, endDate }, { rejectWithValue }) => {
  try {
    const [notTappedRes, returnRes] = await Promise.all([
      apiClient.get<Alert[]>("/alerts", {
        params: { date, ...(endDate ? { endDate } : {}), alertType: "NOT_TAPPED" },
      }),
      apiClient.get<Alert[]>("/alerts", {
        params: { date, ...(endDate ? { endDate } : {}), alertType: "RETURN" },
      }),
    ]);
    return {
      notTapped: notTappedRes.data,
      return: returnRes.data,
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch alerts";
    return rejectWithValue(message);
  }
});

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<AlertTabType>) => {
      state.activeTab = action.payload;
      state.items =
        action.payload === "notTapped" ? state.notTappedItems : state.returnItems;
    },
    updateAlertHumanJudgement: (
      state,
      action: PayloadAction<{ id: number; humanJudgement: string }>
    ) => {
      const item = state.items.find((a) => a.id === action.payload.id);
      if (item) {
        item.humanJudgement = action.payload.humanJudgement;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch alerts";
      })
      .addCase(fetchAlertsForDate.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAlertsForDate.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notTappedItems = action.payload.notTapped;
        state.returnItems = action.payload.return;
        state.items =
          state.activeTab === "notTapped"
            ? action.payload.notTapped
            : action.payload.return;
      })
      .addCase(fetchAlertsForDate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch alerts";
      });
  },
});

export const {
  setSelectedDate,
  setActiveTab,
  updateAlertHumanJudgement,
} = alertsSlice.actions;
export default alertsSlice.reducer;
