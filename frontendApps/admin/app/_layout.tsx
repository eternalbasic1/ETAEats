import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@eta/ui-components';
import { useAuthStore, setAppPrefix, tokenStore } from '@eta/auth';
import { initEnv, getEnv } from '@eta/utils';
import {
  setBaseURL,
  setupInterceptors,
  configureRefresh,
  authEndpoints,
} from '@eta/api-client';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    async function bootstrap() {
      try {
        setAppPrefix('admin');
        if (Constants.expoConfig?.extra) {
          initEnv(Constants.expoConfig.extra);
        }

        const env = getEnv();
        let apiBase = env.apiBaseUrl;
        if (__DEV__ && apiBase.includes('localhost')) {
          const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0]
            ?? Constants.experienceUrl?.match(/\/\/([\d.]+)/)?.[1];
          if (debuggerHost) {
            apiBase = apiBase.replace('localhost', debuggerHost);
          }
        }
        setBaseURL(apiBase.replace(/\/$/, '') + '/api/v1');
        setupInterceptors();
        configureRefresh({
          getTokens: () => tokenStore.get(),
          setTokens: (a, r) => tokenStore.set(a, r),
          clearTokens: () => tokenStore.clear(),
          refreshCall: async (refresh) => {
            const res = await authEndpoints.refreshToken(refresh);
            return res.data;
          },
          onLogout: () => {
            useAuthStore.getState().clearAuth();
          },
        });

        await hydrate();

        const state = useAuthStore.getState();
        if (state.isAuthenticated && !state.user) {
          try {
            const { data: me } = await authEndpoints.me();
            useAuthStore.getState().setUser(me as any);
          } catch {
            await useAuthStore.getState().clearAuth();
          }
        }
      } catch (e) {
        console.warn('Bootstrap error:', e);
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, [hydrate]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F5F5F2' },
              animation: 'slide_from_right',
            }}
          />
          <StatusBar style="dark" />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
