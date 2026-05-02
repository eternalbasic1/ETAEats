import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ETA Eats Kitchen',
  slug: 'eta-eats-restaurant',
  version: '0.1.0',
  orientation: 'default',
  scheme: 'etaeatskitchen',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#F5F5F2',
    resizeMode: 'contain',
  },
  ios: {
    bundleIdentifier: 'app.etaeats.kitchen',
    supportsTablet: true,
  },
  android: {
    package: 'app.etaeats.kitchen',
    adaptiveIcon: {
      backgroundColor: '#F5F5F2',
    },
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-font', 'expo-image-picker'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    wsBaseUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000',
    appEnv: process.env.EXPO_PUBLIC_ENV ?? 'development',
    appName: 'restaurant',
  },
});
