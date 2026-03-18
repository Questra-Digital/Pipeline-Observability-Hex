import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '@/axios/axios';

export const fetchAnalytics = createAsyncThunk(
    'analytics/fetchAnalytics',
    async (_, thunkAPI) => {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const token = userData?.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            const [analyticsRes, runsRes] = await Promise.all([
                instance.get('/api/github/analytics', { headers }),
                instance.get('/api/github/runs', { headers })
            ]);
            return {
                analytics: analyticsRes.data,
                runs: runsRes.data
            };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState: {
        data: null,
        runs: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnalytics.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.analytics;
                state.runs = action.payload.runs;
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default analyticsSlice.reducer;
