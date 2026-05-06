import { Stack } from 'expo-router';
import { useTheme } from '@eta/ui-components';

export default function AuthLayout() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.bg },
      }}
    />
  );
}
