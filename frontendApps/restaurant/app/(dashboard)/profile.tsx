import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Card } from '@eta/ui-components';
import { useAuthStore, useAuth, tokenStore } from '@eta/auth';
import { Store, Phone, Shield, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { logout, loading } = useAuth({
    requestOtpFn: async () => {},
    verifyOtpFn: async () => {
      throw new Error('Not implemented');
    },
    logoutFn: async () => {},
    getRefreshToken: async () => {
      const tokens = await tokenStore.get();
      return tokens?.refresh ?? null;
    },
    onLogout: () => {
      router.replace('/(auth)/login');
    },
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const restaurantMembership = user?.memberships?.find(
    (m) => m.org_type === 'restaurant' && m.is_active,
  );

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text
            style={{
              ...t.typography.label,
              fontFamily: t.fontFamily.sans,
              color: t.colors.textMuted,
            }}
          >
            ACCOUNT
          </Text>
          <Text
            style={[
              styles.pageTitle,
              {
                ...t.typography.h1,
                fontFamily: t.fontFamily.display,
                color: t.colors.textPrimary,
              },
            ]}
          >
            Profile
          </Text>
          <Text
            style={[
              styles.description,
              {
                ...t.typography.body,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textTertiary,
              },
            ]}
          >
            Your account details and restaurant information.
          </Text>
        </View>

        {restaurantMembership && (
          <Card tone="cream" padding="lg" border style={styles.card}>
            <View style={styles.row}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: t.colors.accentSoftCream, borderRadius: t.radius.sm },
                ]}
              >
                <Store size={18} color={t.colors.accentSoftCreamInk} />
              </View>
              <View style={styles.infoText}>
                <Text
                  style={{
                    ...t.typography.caption,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textMuted,
                  }}
                >
                  Restaurant
                </Text>
                <Text
                  style={{
                    ...t.typography.h4,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textPrimary,
                  }}
                >
                  {restaurantMembership.org_name}
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card tone="default" padding="lg" border style={styles.card}>
          <View style={styles.detailRow}>
            <View style={styles.row}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: t.colors.surfaceSunk, borderRadius: t.radius.sm },
                ]}
              >
                <Phone size={18} color={t.colors.textTertiary} />
              </View>
              <View style={styles.infoText}>
                <Text
                  style={{
                    ...t.typography.caption,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textMuted,
                  }}
                >
                  Phone
                </Text>
                <Text
                  style={{
                    ...t.typography.body,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textPrimary,
                  }}
                >
                  {user?.phone_number ?? '—'}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: t.colors.borderSubtle }]}
          />

          <View style={styles.detailRow}>
            <View style={styles.row}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: t.colors.surfaceSunk, borderRadius: t.radius.sm },
                ]}
              >
                <Shield size={18} color={t.colors.textTertiary} />
              </View>
              <View style={styles.infoText}>
                <Text
                  style={{
                    ...t.typography.caption,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textMuted,
                  }}
                >
                  Role
                </Text>
                <Text
                  style={{
                    ...t.typography.body,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textPrimary,
                  }}
                >
                  Restaurant Staff
                </Text>
              </View>
            </View>
          </View>

          {user?.first_name && (
            <>
              <View
                style={[styles.divider, { backgroundColor: t.colors.borderSubtle }]}
              />
              <View style={styles.detailRow}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.infoIcon,
                      { backgroundColor: t.colors.surfaceSunk, borderRadius: t.radius.sm },
                    ]}
                  >
                    <Text
                      style={{
                        ...t.typography.body,
                        fontFamily: t.fontFamily.sans,
                        color: t.colors.textTertiary,
                        textAlign: 'center',
                      }}
                    >
                      {user.first_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.infoText}>
                    <Text
                      style={{
                        ...t.typography.caption,
                        fontFamily: t.fontFamily.sans,
                        color: t.colors.textMuted,
                      }}
                    >
                      Name
                    </Text>
                    <Text
                      style={{
                        ...t.typography.body,
                        fontFamily: t.fontFamily.sans,
                        color: t.colors.textPrimary,
                      }}
                    >
                      {user.first_name} {user.last_name}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </Card>

        <View style={styles.signOut}>
          <Button
            label="Sign Out"
            variant="secondary"
            onPress={handleSignOut}
            loading={loading}
            icon={<LogOut size={18} color={t.colors.textPrimary} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  hero: {
    marginBottom: 32,
  },
  pageTitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  description: {
    maxWidth: 300,
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  detailRow: {
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  signOut: {
    marginTop: 16,
  },
});
