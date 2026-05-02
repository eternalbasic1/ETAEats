import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Spinner } from '@eta/ui-components';
import { api } from '@eta/api-client';
import { Utensils, AlertCircle } from 'lucide-react-native';
import { useJourneyStore } from '../../stores/journey.store';
import { useCartStore } from '../../stores/cart.store';

export default function ScanResolveScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { qr_token } = useLocalSearchParams<{ qr_token: string }>();
  const [error, setError] = useState<string | null>(null);
  const setJourneyFromScan = useJourneyStore((s) => s.setJourneyFromScan);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (!qr_token) return;

    async function resolve() {
      try {
        const { data } = await api.get(`/restaurants/scan/${qr_token}/`);

        if (!data.restaurant) {
          setError('This bus doesn\'t have a highway kitchen assigned right now. Please check with the bus operator.');
          return;
        }

        clearCart();

        setJourneyFromScan({
          qrToken: qr_token,
          bus: {
            id: data.bus.id,
            name: data.bus.name,
            numberPlate: data.bus.number_plate || '',
          },
          restaurant: {
            id: data.restaurant.id,
            name: data.restaurant.name,
            address: data.restaurant.address || '',
            hygieneRating: data.restaurant.hygiene_rating || null,
          },
          source: 'manual',
        });

        router.replace('/(tabs)/menu');
      } catch (e: any) {
        const msg =
          e?.response?.data?.error?.message
          ?? e?.response?.data?.detail
          ?? 'This QR code is invalid, expired, or could not be initialized.';
        setError(msg);
      }
    }

    resolve();
  }, [qr_token]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg, paddingTop: insets.top }]}>
      {!error ? (
        <View style={styles.loadingWrap}>
          <View style={[styles.iconBubble, { backgroundColor: t.colors.accentPowderBlue }]}>
            <Utensils size={40} strokeWidth={1.6} color={t.colors.accentPowderBlueInk} />
          </View>
          <Text style={{ ...t.typography.label, color: t.colors.textMuted, marginTop: 32 }}>
            CONNECTING
          </Text>
          <Text style={{ ...t.typography.h2, color: t.colors.textPrimary, marginTop: 12 }}>
            Preparing your menu
          </Text>
          <View style={styles.spinnerRow}>
            <Spinner size="small" />
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>
              Matching your bus with a highway kitchen…
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.errorWrap}>
          <View style={[styles.errorBubble, { backgroundColor: t.colors.errorBg, borderColor: t.colors.errorBorder }]}>
            <AlertCircle size={28} strokeWidth={1.7} color={t.colors.errorFg} />
          </View>
          <Text style={{ ...t.typography.h2, color: t.colors.textPrimary, marginTop: 20, textAlign: 'center' }}>
            Invalid QR code
          </Text>
          <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
            {error}
          </Text>
          <Text style={{ ...t.typography.caption, color: t.colors.textMuted, marginTop: 16, textAlign: 'center' }}>
            Check the sticker inside your bus and try again.
          </Text>
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/scan')}
            style={{ marginTop: 24 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingWrap: { alignItems: 'center' },
  iconBubble: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  spinnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  errorWrap: { alignItems: 'center', maxWidth: 340 },
  errorBubble: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
