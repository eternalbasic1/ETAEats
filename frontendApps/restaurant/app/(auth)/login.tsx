import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Input, OTPInput } from '@eta/ui-components';
import { useAuth, tokenStore } from '@eta/auth';
import { authEndpoints } from '@eta/api-client';
import { ChefHat, ArrowLeft } from 'lucide-react-native';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);

  const { requestOTP, verifyOTP, loading } = useAuth({
    requestOtpFn: async (phoneNumber: string) => {
      await authEndpoints.requestOtp({ phone_number: phoneNumber });
    },
    verifyOtpFn: async (phoneNumber: string, code: string) => {
      const res = await authEndpoints.verifyOtp({ phone_number: phoneNumber, code });
      return {
        user: {
          id: res.data.user.id,
          phone_number: res.data.user.phone_number,
          role: res.data.user.role as any,
          first_name: res.data.user.first_name,
          last_name: res.data.user.last_name,
          email: res.data.user.email,
          memberships: res.data.user.memberships,
        },
        tokens: res.data.tokens,
      };
    },
    logoutFn: async (refreshToken: string) => {
      await authEndpoints.logout(refreshToken).catch(() => {});
    },
    getRefreshToken: async () => {
      const tokens = await tokenStore.get();
      return tokens?.refresh ?? null;
    },
    onLoginSuccess: () => {
      router.replace('/(dashboard)/orders');
    },
  });

  const handleRequestOTP = useCallback(async () => {
    setRoleError(null);
    const ok = await requestOTP(phone);
    if (ok) setStep('otp');
  }, [phone, requestOTP]);

  const handleVerifyOTP = useCallback(
    async (code: string) => {
      setRoleError(null);
      const result = await verifyOTP(phone, code);
      if (result.success && result.user) {
        if (result.user.role !== 'RESTAURANT_STAFF') {
          setRoleError('This app is for restaurant staff only. Please use the correct app for your role.');
          return;
        }
      }
    },
    [phone, verifyOTP],
  );

  const handleBack = useCallback(() => {
    setStep('phone');
    setRoleError(null);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
            backgroundColor: t.colors.bg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'otp' && (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={t.colors.textPrimary} />
          </Pressable>
        )}

        <View style={styles.hero}>
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: t.colors.accentSoftCream, borderRadius: t.radius.hero },
            ]}
          >
            <ChefHat size={32} color={t.colors.accentSoftCreamInk} />
          </View>

          <Text
            style={[
              styles.eyebrow,
              {
                ...t.typography.label,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textMuted,
              },
            ]}
          >
            {step === 'phone' ? 'KITCHEN LOGIN' : 'VERIFICATION'}
          </Text>

          <Text
            style={[
              styles.title,
              {
                ...t.typography.h1,
                fontFamily: t.fontFamily.display,
                color: t.colors.textPrimary,
              },
            ]}
          >
            {step === 'phone' ? 'Welcome back, Chef' : 'Enter your code'}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                ...t.typography.body,
                fontFamily: t.fontFamily.sans,
                color: t.colors.textTertiary,
              },
            ]}
          >
            {step === 'phone'
              ? 'Sign in with your phone number to manage your kitchen orders.'
              : `We sent a 6-digit code to ${phone}`}
          </Text>
        </View>

        {roleError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: t.colors.errorBg,
                borderColor: t.colors.errorBorder,
                borderRadius: t.radius.md,
              },
            ]}
          >
            <Text
              style={{
                ...t.typography.bodySm,
                fontFamily: t.fontFamily.sans,
                color: t.colors.errorFg,
              }}
            >
              {roleError}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          {step === 'phone' ? (
            <>
              <Input
                label="Phone number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />
              <View style={styles.buttonWrap}>
                <Button
                  label="Send OTP"
                  onPress={handleRequestOTP}
                  loading={loading}
                  disabled={phone.length < 10}
                />
              </View>
            </>
          ) : (
            <>
              <OTPInput length={6} onComplete={handleVerifyOTP} />
              <View style={styles.buttonWrap}>
                <Button
                  label="Verify & Sign In"
                  onPress={() => {}}
                  loading={loading}
                  disabled={loading}
                />
              </View>

              <Pressable onPress={handleRequestOTP} style={styles.resend}>
                <Text
                  style={{
                    ...t.typography.bodySm,
                    fontFamily: t.fontFamily.sans,
                    color: t.colors.textTertiary,
                  }}
                >
                  Didn't receive the code?{' '}
                  <Text style={{ color: t.colors.textPrimary, fontWeight: '600' }}>
                    Resend
                  </Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  hero: {
    marginBottom: 40,
  },
  iconBubble: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    marginBottom: 8,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    maxWidth: 300,
  },
  errorBanner: {
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  form: {
    gap: 16,
  },
  buttonWrap: {
    marginTop: 8,
  },
  resend: {
    alignItems: 'center',
    marginTop: 16,
  },
});
