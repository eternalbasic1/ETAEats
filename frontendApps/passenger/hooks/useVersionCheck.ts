import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { appConfigEndpoints } from '@eta/api-client';

interface VersionCheckState {
  isLoading: boolean;
  forceUpdate: boolean;
  updateMessage: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
}

export function useVersionCheck(): VersionCheckState {
  const [state, setState] = useState<VersionCheckState>({
    isLoading: true,
    forceUpdate: false,
    updateMessage: '',
    androidStoreUrl: '',
    iosStoreUrl: '',
  });

  useEffect(() => {
    async function check() {
      const appName = Constants.expoConfig?.extra?.appName;
      const version = Constants.expoConfig?.version;

      if (!version) {
        console.warn('[useVersionCheck] Constants.expoConfig?.version is undefined; skipping version check.');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await appConfigEndpoints.versionCheck({ app: appName, version });
        setState({
          isLoading: false,
          forceUpdate: response.data.force_update,
          updateMessage: response.data.update_message,
          androidStoreUrl: response.data.android_store_url,
          iosStoreUrl: response.data.ios_store_url,
        });
      } catch {
        // Network error — wait 3 s then retry once
        await new Promise(r => setTimeout(r, 3000));
        try {
          const response = await appConfigEndpoints.versionCheck({ app: appName, version });
          setState({
            isLoading: false,
            forceUpdate: response.data.force_update,
            updateMessage: response.data.update_message,
            androidStoreUrl: response.data.android_store_url,
            iosStoreUrl: response.data.ios_store_url,
          });
        } catch {
          // Retry also failed — fail-open so a backend outage never locks users out
          setState({
            isLoading: false,
            forceUpdate: false,
            updateMessage: '',
            androidStoreUrl: '',
            iosStoreUrl: '',
          });
        }
      }
    }

    check();
  }, []);

  return state;
}
