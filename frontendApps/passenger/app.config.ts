import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ETA Eats',
  slug: 'eta-eats-passenger',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'etaeats',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#F5F5F2',
    resizeMode: 'contain',
  },
  ios: {
    bundleIdentifier: 'app.etaeats.passenger',
    supportsTablet: false,
  },
  android: {
    package: 'app.etaeats.passenger',
    adaptiveIcon: {
      backgroundColor: '#F5F5F2',
    },
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
    wsBaseUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000',
    appEnv: process.env.EXPO_PUBLIC_ENV ?? 'development',
    appName: 'passenger',
    razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY ?? 'rzp_test_placeholder',
  },
});
