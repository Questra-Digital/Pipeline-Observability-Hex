import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./features/user/userSlice";
import configuredAppsSlice from "./features/configuredApps/configuredAppsSlice";
import appsSlice from "./features/apps/appsSlice";
import analyticsSlice from "./features/analytics/analyticsSlice";

export const store = configureStore({
    reducer: {
        user: userSlice,
        configuredApps: configuredAppsSlice,
        apps: appsSlice,
        analytics: analyticsSlice
    }
})