import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card, useTheme } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { isValidIndianMobile } from '@eta/utils';
import { authEndpoints } from '@eta/api-client';

type LoginStep = 'phone' | 'otp' | 'role_error';

export default function AdminLoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectedRole, setRejectedRole] = useState('');

  const setAuth = useAuthStore((s) => s.setAuth);
  const isValid = isValidIndianMobile(phone);

  async function handleRequestOtp() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await authEndpoints.requestOtp({ phone_number: `+91${phone}` });
      setStep('otp');
    } catch (e: any) {
      setError(e?.message ?? 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await authEndpoints.verifyOtp({
        phone_number: `+91${phone}`,
        code: otp,
        app_type: 'admin',
      });
      const { user, tokens } = res.data;

      if (user.role !== 'ADMIN' && user.role !== 'BUS_OPERATOR') {
        setRejectedRole(user.role);
        setStep('role_error');
        return;
      }

      await setAuth(
        {
          id: user.id,
          phone_number: user.phone_number,
          role: user.role as any,
          full_name: user.full_name,
          email: user.email,
          gender: user.gender ?? '',
          memberships: user.memberships ?? [],
        },
        tokens.access,
        tokens.refresh,
      );
      router.replace('/(dashboard)/overview');
    } catch (e: any) {
      if (e?.statusCode === 403 || e?.code === 'role_mismatch') {
        setError(e?.message ?? "You don't have access to this app. Please contact support.");
      } else {
        setError(e?.message ?? 'Invalid OTP. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === 'role_error') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, backgroundColor: t.colors.bg }]}>
        <View style={styles.content}>
          <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.errorFg }]}>
            ACCESS DENIED
          </Text>
          <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
            Wrong role
          </Text>
          <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
            This app is for platform admins. Your account has the
            role "{rejectedRole}". Please use the correct app for your role.
          </Text>
          <Button
            label="Try a different number"
            onPress={() => {
              setStep('phone');
              setPhone('');
              setOtp('');
              setError('');
            }}
            variant="secondary"
            fullWidth
            size="lg"
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Text style={[styles.eyebrow, { ...t.typography.label, color: t.colors.textMuted }]}>
          ADMIN PORTAL
        </Text>
        <Text style={[styles.title, { ...t.typography.h1, color: t.colors.textPrimary }]}>
          ETA Eats Admin
        </Text>
        <Text style={[styles.subtitle, { ...t.typography.body, color: t.colors.textTertiary }]}>
          {step === 'phone'
            ? 'Sign in with your admin phone number to manage the platform.'
            : `Enter the 6-digit code sent to +91 ${phone}`}
        </Text>

        <Card tone="default" padding="lg" radius="card" style={styles.card}>
          {step === 'phone' ? (
            <>
              <View style={styles.phoneRow}>
                <View style={[styles.countryCode, { borderColor: t.colors.border }]}>
                  <Text style={{ ...t.typography.body, color: t.colors.textPrimary, fontWeight: '600' }}>
                    +91
                  </Text>
                </View>
                <View style={styles.phoneInput}>
                  <Input
                    placeholder="Phone number"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    error={error || ''}
                    accessibilityLabel="Admin phone number"
                    autoFocus
                  />
                </View>
              </View>
              <Button
                label="Send OTP"
                onPress={handleRequestOtp}
                disabled={!isValid}
                loading={loading}
                fullWidth
                size="lg"
              />
            </>
          ) : (
            <>
              <Input
                placeholder="6-digit code"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={error || ''}
                accessibilityLabel="OTP code"
                autoFocus
              />
              <View style={styles.otpActions}>
                <Button
                  label="Verify & Sign In"
                  onPress={handleVerifyOtp}
                  disabled={otp.length < 6}
                  loading={loading}
                  fullWidth
                  size="lg"
                />
              </View>
              <Button
                label="Change number"
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                variant="ghost"
                size="sm"
              />
            </>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  eyebrow: { marginBottom: 8 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  card: { marginTop: 8 },
  phoneRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  countryCode: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    height: 48,
  },
  phoneInput: { flex: 1 },
  otpActions: { marginTop: 16, marginBottom: 12 },
});
