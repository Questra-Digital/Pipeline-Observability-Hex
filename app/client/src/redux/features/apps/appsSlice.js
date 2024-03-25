import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  apps: [],
};

const appsSlice = createSlice({
  name: "apps",
  initialState,
  reducers: {
    addApp: (state, action) => {
      const foundIndex = state.apps.findIndex((app) => app.name === action.payload.name);
      if (foundIndex === -1) {
        state.apps.push({ name: action.payload.name, status: true });
      }
    },
    deleteApp: (state, action) => {
      const index = state.apps.findIndex((app) => app.name === action.payload);
      if (index !== -1) {
        state.apps.splice(index, 1);
      }
    },
  },
});

export const { addApp, deleteApp } = appsSlice.actions;
export default appsSlice.reducer;
