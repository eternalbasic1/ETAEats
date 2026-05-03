import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@eta/ui-components';
import { useTheme } from '@eta/ui-components';
import { useAuthStore } from '@eta/auth';
import { authEndpoints } from '@eta/api-client';

function formatPhoneDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 10);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)} ${clean.slice(5)}`;
}

export default function SignupScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const initialPhone = (params.phone as string) || '';

  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [phone, setPhone] = useState(initialPhone);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [hasHydrated, isAuthenticated]);

  const digits = phone.replace(/\D/g, '').slice(0, 10);
  const isValidPhone = digits.length === 10;
  const isValidName = fullName.trim().length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = isValidPhone && isValidName && isValidEmail;

  async function handleContinue() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await authEndpoints.signup({
        phone_number: `+91${digits}`,
        full_name: fullName.trim(),
        email: email.trim(),
      });
      // The signup endpoint automatically creates the user and sends an OTP
      router.push({ pathname: '/(auth)/otp', params: { phone: digits } });
    } catch (e: any) {
      setError(
        e?.response?.data?.error?.message
          ?? e?.response?.data?.detail
          ?? Object.values(e?.response?.data || {}).flat()[0] // e.g. "A user with this email already exists."
          ?? 'Could not create account. Try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: t.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <Text style={{ ...t.typography.h2, color: t.colors.textPrimary, fontWeight: '700' }}>
              ETA Eats
            </Text>
          </View>

          {/* Form card */}
          <Card tone="default" padding="lg" radius="card" border style={styles.card}>
            <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
              Create Account
            </Text>
            <Text style={[styles.mt3, { ...t.typography.h1, color: t.colors.textPrimary }]}>
              Join the journey
            </Text>
            <Text style={[styles.mt2, { ...t.typography.bodySm, color: t.colors.textTertiary }]}>
              Looks like you're new here. Fill in your details to continue.
            </Text>

            <View style={styles.formWrap}>
              <View style={styles.inputSpacing}>
                <Input
                  label="Mobile number"
                  placeholder="99999 99999"
                  keyboardType="number-pad"
                  leading={
                    <Text style={{ ...t.typography.body, color: t.colors.textSecondary, fontWeight: '600' }}>
                      +91
                    </Text>
                  }
                  value={formatPhoneDisplay(digits)}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
                  autoFocus={!initialPhone}
                  accessibilityLabel="Mobile number"
                />
              </View>

              <View style={styles.inputSpacing}>
                <Input
                  label="Full Name"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoFocus={!!initialPhone}
                  accessibilityLabel="Full Name"
                />
              </View>

              <View style={styles.inputSpacing}>
                <Input
                  label="Email Address"
                  placeholder="jane@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  error={error || undefined}
                  accessibilityLabel="Email Address"
                />
              </View>
            </View>

            <Button
              label="Create account"
              onPress={handleContinue}
              disabled={!isValid || loading}
              loading={loading}
              fullWidth
              size="lg"
            />

            <Text style={[styles.footer, { ...t.typography.caption, color: t.colors.textMuted }]}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  brand: { alignItems: 'center', marginBottom: 32 },
  card: {},
  mt3: { marginTop: 12 },
  mt2: { marginTop: 8 },
  formWrap: { marginTop: 28, marginBottom: 24 },
  inputSpacing: { marginBottom: 16 },
  footer: { marginTop: 20, textAlign: 'center' },
});
