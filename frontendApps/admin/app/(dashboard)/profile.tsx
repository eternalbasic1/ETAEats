import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, Card, Button, Badge } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || 'Admin';

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
        ACCOUNT
      </Text>
      <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Profile
      </Text>
      <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
        Your admin account details.
      </Text>

      <Card tone="default" padding="lg" radius="card" border style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={[{ ...t.typography.h2, color: t.colors.textOnDark }]}>
            {(user?.first_name?.[0] || 'A').toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.profileName, { ...t.typography.h3, color: t.colors.textPrimary }]}>
          {displayName}
        </Text>

        <Badge label="ADMIN" variant="powder" />

        <View style={styles.detailRows}>
          <View style={styles.detailRow}>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textMuted }}>Phone</Text>
            <Text style={{ ...t.typography.body, color: t.colors.textPrimary }}>
              {user?.phone_number || '—'}
            </Text>
          </View>
          <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: t.colors.borderSubtle }]}>
            <Text style={{ ...t.typography.bodySm, color: t.colors.textMuted }}>Email</Text>
            <Text style={{ ...t.typography.body, color: t.colors.textPrimary }}>
              {user?.email || '—'}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.signOut}>
        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="secondary"
          fullWidth
          size="lg"
        />
      </View>

      <Text style={[styles.version, { ...t.typography.caption, color: t.colors.textDisabled }]}>
        ETA Eats Admin v0.1.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 48 },
  eyebrow: { marginBottom: 8 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 24 },
  profileCard: { alignItems: 'center', paddingVertical: 28 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: { marginBottom: 8 },
  detailRows: { width: '100%', marginTop: 20 },
  detailRow: { paddingVertical: 12 },
  signOut: { marginTop: 28 },
  version: { textAlign: 'center', marginTop: 20 },
});
