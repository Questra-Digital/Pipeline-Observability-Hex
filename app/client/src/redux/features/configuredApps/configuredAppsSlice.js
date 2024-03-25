import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import instance from "@/axios/axios";

const initialState = {
  configuredApps: null,
  loading: false,
  error: null,
};

export const fetchConfiguredApps = createAsyncThunk(
  "configuredApps/fetchConfiguredApps",
  async (_, thunkAPI) => {
    const token = JSON.parse(localStorage.getItem("userData")).token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await instance.get("/api/apps/", { headers });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const configuredAppsSlice = createSlice({
  name: "configuredApps",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfiguredApps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConfiguredApps.fulfilled, (state, action) => {
        state.loading = false;
        state.configuredApps = action.payload;
      })
      .addCase(fetchConfiguredApps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default configuredAppsSlice.reducer;
