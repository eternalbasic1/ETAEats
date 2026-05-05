import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '@eta/ui-components';
import { useTheme } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { authEndpoints } from '@eta/api-client';
import Logo from '../../assets/logo.svg';

export default function OTPScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);

  const formattedPhone = phone
    ? (phone.length > 5 ? `${phone.slice(0, 5)} ${phone.slice(5, 10)}` : phone)
    : '';

  async function handleVerify() {
    if (otp.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await authEndpoints.verifyOtp({
        phone_number: `+91${phone}`,
        code: otp,
        app_type: 'passenger',
      });
      const { user, tokens } = res.data;
      if (user.role !== 'PASSENGER') {
        setError("You don't have access to this app. Please contact support.");
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
      router.replace('/(tabs)/home');
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

  async function handleResend() {
    try {
      await authEndpoints.requestOtp({ phone_number: `+91${phone}` });
    } catch {}
  }

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const otpChars = otp.split('').concat(Array(6 - otp.length).fill(''));

  function handleOtpChange(index: number, char: string) {
    const cleaned = char.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 6);
      setOtp(pasted);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const chars = otp.split('');
    chars[index] = cleaned;
    const newOtp = chars.join('').slice(0, 6);
    setOtp(newOtp);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !otpChars[index] && index > 0) {
      const chars = otp.split('');
      chars[index - 1] = '';
      setOtp(chars.join(''));
      inputRefs.current[index - 1]?.focus();
    }
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
          <Card tone="default" padding="lg" radius="card" border>
            {/* Brand */}
            <Logo width={80} height={80} />
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 2 }}>
              Secure passenger sign-in
            </Text>

            <View style={{ marginTop: 32 }}>
              <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
                Verify
              </Text>
              <Text style={[styles.mt3, { ...t.typography.h1, color: t.colors.textPrimary }]}>
                Enter OTP
              </Text>
              <Text style={[styles.mt2, { ...t.typography.bodySm, color: t.colors.textTertiary }]}>
                Code sent to{' '}
                <Text style={{ color: t.colors.textPrimary, fontWeight: '500' }}>
                  +91 {formattedPhone}
                </Text>
              </Text>
            </View>

            {/* OTP tiles */}
            <View style={styles.otpRow}>
              {Array.from({ length: 6 }).map((_, i) => {
                const isFilled  = !!otpChars[i];
                // active = the next empty slot; if all filled, last cell stays active
                const isActive  = !error && (otp.length === i || (otp.length >= 6 && i === 5));
                const isError   = !!error;
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpTile,
                      {
                        backgroundColor: t.colors.surface,
                        borderColor: isError
                          ? t.colors.errorFg
                          : isActive
                            ? t.colors.primary
                            : isFilled
                              ? t.colors.borderStrong
                              : t.colors.border,
                        borderWidth: isActive ? 2 : 1.5,
                      },
                    ]}
                  >
                    <TextInput
                      ref={(ref) => { inputRefs.current[i] = ref; }}
                      value={otpChars[i] || ''}
                      onChangeText={(text) => handleOtpChange(i, text)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      autoFocus={i === 0}
                      caretHidden
                      selectTextOnFocus
                      style={[
                        styles.otpInput,
                        {
                          color: isError ? t.colors.errorFg : t.colors.textPrimary,
                          fontFamily: 'Lora_500Bold',
                          fontSize: 24,
                          fontWeight: '700',
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                        },
                      ]}
                      accessibilityLabel={`OTP digit ${i + 1}`}
                    />
                  </View>
                );
              })}
            </View>

            {/* Status line below tiles */}
            <View style={styles.statusRow}>
              {error ? (
                <Text style={[styles.statusText, { color: t.colors.errorFg }]}>
                  {error}
                </Text>
              ) : loading ? (
                <Text style={[styles.statusText, { color: t.colors.textMuted }]}>
                  Verifying your OTP…
                </Text>
              ) : null}
            </View>

            <Button
              label="Verify & continue"
              onPress={handleVerify}
              disabled={otp.length < 6 || loading}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: 20 }}
            />

            <View style={styles.links}>
              <Pressable onPress={handleResend} disabled={loading} hitSlop={10}>
                <Text style={{ ...t.typography.bodySm, color: t.colors.primary, fontWeight: '600' }}>
                  Resend OTP
                </Text>
              </Pressable>
              <Pressable onPress={() => router.back()} hitSlop={10}>
                <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, fontWeight: '500' }}>
                  Change number
                </Text>
              </Pressable>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const TILE_SIZE = 52;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  mt3: { marginTop: 12 },
  mt2: { marginTop: 8 },

  // ── OTP tiles
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  otpTile: {
    flex: 1,
    height: TILE_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  otpInput: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    textAlign: 'center',
    letterSpacing: 0,
    backgroundColor: 'transparent',
  },

  // ── Status line
  statusRow: {
    minHeight: 22,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Footer links
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 2,
  },
});
