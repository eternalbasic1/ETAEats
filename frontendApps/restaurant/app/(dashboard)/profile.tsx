import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Card } from '@eta/ui-components';
import { useAuthStore, useAuth, tokenStore } from '@eta/auth';
import { authEndpoints, restaurantEndpoints } from '@eta/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Phone, Shield, LogOut, User, Mail, MapPin, FileText } from 'lucide-react-native';

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const { logout, loading } = useAuth({
    requestOtpFn: async () => {},
    verifyOtpFn: async () => { throw new Error('Not implemented'); },
    logoutFn: async (refreshToken: string) => {
      await authEndpoints.logout(refreshToken).catch(() => {});
    },
    getRefreshToken: async () => {
      const tokens = await tokenStore.get();
      return tokens?.refresh ?? null;
    },
    onLogout: () => {
      router.replace('/(auth)/login');
    },
  });

  const restaurantMembership = user?.memberships?.find(
    (m) => m.org_type === 'restaurant' && m.is_active,
  );

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', restaurantMembership?.org_id],
    queryFn: () => restaurantEndpoints.get(restaurantMembership!.org_id).then(r => r.data),
    enabled: !!restaurantMembership?.org_id,
  });

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { data } = await authEndpoints.updateMe({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
      });
      setUser(data as any);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const displayName = user?.full_name?.trim() || 'Staff';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>ACCOUNT</Text>
          <Text style={[styles.pageTitle, { ...t.typography.h1, color: t.colors.textPrimary }]}>Profile</Text>
        </View>

        {/* Identity card */}
        <Card tone="powder" padding="lg" radius="card" style={styles.card}>
          <View style={styles.identityRow}>
            <View style={[styles.avatar, { backgroundColor: t.colors.primary }]}>
              <Text style={{ fontSize: 26, fontWeight: '600', color: t.colors.textOnDark }}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.typography.label, color: t.colors.accentPowderBlueInk }}>Restaurant Staff</Text>
              <Text style={{ ...t.typography.h2, color: t.colors.textPrimary, marginTop: 4 }} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>{user?.phone_number}</Text>
            </View>
          </View>
        </Card>

        {/* Edit profile */}
        <Card tone="default" padding="lg" radius="card" border style={styles.card}>
          <Text style={{ ...t.typography.label, color: t.colors.textMuted, marginBottom: 16 }}>EDIT PROFILE</Text>
          <View style={styles.fieldGroup}>
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginBottom: 4 }}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={t.colors.textMuted}
              style={[styles.input, { backgroundColor: t.colors.surface2, borderColor: t.colors.border, color: t.colors.textPrimary }]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginBottom: 4 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={t.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: t.colors.surface2, borderColor: t.colors.border, color: t.colors.textPrimary }]}
            />
          </View>
          <Button label="Save changes" onPress={handleSaveProfile} loading={saving} style={{ marginTop: 8 }} />
        </Card>

        {/* Restaurant info */}
        {restaurant && (
          <Card tone="cream" padding="lg" radius="card" border style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Store size={18} color={t.colors.accentSoftCreamInk} />
              <Text style={{ ...t.typography.label, color: t.colors.accentSoftCreamInk }}>YOUR RESTAURANT</Text>
            </View>

            <Text style={{ ...t.typography.h3, color: t.colors.textPrimary, marginBottom: 12 }}>
              {restaurant.name}
            </Text>

            {restaurant.address && (
              <View style={styles.infoRow}>
                <MapPin size={14} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, flex: 1 }}>{restaurant.address}</Text>
              </View>
            )}
            {restaurant.phone_number && (
              <View style={styles.infoRow}>
                <Phone size={14} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>{restaurant.phone_number}</Text>
              </View>
            )}
            {restaurant.fssai_license && (
              <View style={styles.infoRow}>
                <FileText size={14} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>FSSAI: {restaurant.fssai_license}</Text>
              </View>
            )}
            {restaurant.hygiene_rating && (
              <View style={styles.infoRow}>
                <Shield size={14} color={t.colors.textMuted} />
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>Hygiene: {restaurant.hygiene_rating}/5</Text>
              </View>
            )}
          </Card>
        )}

        {/* Contact info */}
        <Card tone="default" padding="lg" radius="card" border style={styles.card}>
          <InfoDetailRow
            icon={<Phone size={18} color={t.colors.textTertiary} />}
            label="Phone"
            value={user?.phone_number ?? '—'}
            t={t}
          />
          <View style={[styles.divider, { backgroundColor: t.colors.borderSubtle }]} />
          <InfoDetailRow
            icon={<Shield size={18} color={t.colors.textTertiary} />}
            label="Security"
            value="OTP-based sign in"
            t={t}
          />
        </Card>

        <View style={styles.signOut}>
          <Button
            label="Sign Out"
            variant="secondary"
            onPress={handleSignOut}
            loading={loading}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoDetailRow({ icon, label, value, t }: { icon: React.ReactNode; label: string; value: string; t: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>{label}</Text>
        <Text style={{ ...t.typography.body, color: t.colors.textPrimary }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  hero: { marginBottom: 24 },
  pageTitle: { marginTop: 4 },
  card: { marginBottom: 16 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 16 },
  input: {
    height: 48, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 16, fontSize: 15,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  divider: { height: 1, marginVertical: 12 },
  signOut: { marginTop: 16 },
});
