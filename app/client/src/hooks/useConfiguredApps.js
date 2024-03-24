import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConfiguredApps } from '@/redux/features/configuredApps/configuredAppsSlice';
import { addApp } from '@/redux/features/apps/appsSlice';

export const useConfiguredApps = () => {
  const dispatch = useDispatch();
  const configuredApps = useSelector(state => state.configuredApps.configuredApps);
-
  useEffect(() => {
    if (!configuredApps) {
      dispatch(fetchConfiguredApps());
    }
  }, [dispatch, configuredApps]);

  useEffect(() => {
    if (configuredApps) {
      const processedItems = Object.entries(configuredApps)
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => ({
          name: key,
        }));
      processedItems.forEach(app => dispatch(addApp(app)));
    }
  }, [configuredApps, dispatch]);

  return configuredApps;
};
