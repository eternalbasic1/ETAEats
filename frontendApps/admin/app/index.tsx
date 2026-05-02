import { Redirect } from 'expo-router';
import { useAuthStore } from '@eta/auth';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(dashboard)/overview" />;
  }

  return <Redirect href="/(auth)/login" />;
}
