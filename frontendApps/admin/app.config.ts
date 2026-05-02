import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ETA Eats Admin',
  slug: 'eta-eats-admin',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'etaeatsadmin',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#F5F5F2',
    resizeMode: 'contain',
  },
  ios: {
    bundleIdentifier: 'app.etaeats.admin',
    supportsTablet: true,
  },
  android: {
    package: 'app.etaeats.admin',
    adaptiveIcon: {
      backgroundColor: '#F5F5F2',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-local-authentication',
      { faceIDPermission: 'Allow ETA Eats Admin to use Face ID for authentication.' },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    wsBaseUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000',
    appEnv: process.env.EXPO_PUBLIC_ENV ?? 'development',
    appName: 'admin',
  },
});
