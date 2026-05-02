import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button, Card } from '@eta/ui-components';
import { router } from 'expo-router';
import { Camera, QrCode } from 'lucide-react-native';

const TOKEN_LENGTH = 6;

export default function ScanScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [chars, setChars] = useState<string[]>(Array(TOKEN_LENGTH).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const token = chars.join('');

  function handleCharChange(index: number, raw: string) {
    const value = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 1) {
      const pasted = value.slice(0, TOKEN_LENGTH);
      const next = Array(TOKEN_LENGTH).fill('');
      pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
      setChars(next);
      inputRefs.current[Math.min(pasted.length, TOKEN_LENGTH - 1)]?.focus();
      return;
    }
    const next = [...chars];
    next[index] = value;
    setChars(next);
    if (value && index < TOKEN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !chars[index] && index > 0) {
      const next = [...chars];
      next[index - 1] = '';
      setChars(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleSubmit() {
    if (token.length !== TOKEN_LENGTH) return;
    router.push(`/scan/${encodeURIComponent(token)}`);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
        STEP 1
      </Text>
      <Text style={[styles.mt2, { ...t.typography.h1, color: t.colors.textPrimary }]}>
        Find your bus's QR
      </Text>
      <Text style={[styles.mt2, { ...t.typography.bodySm, color: t.colors.textTertiary, maxWidth: 340 }]}>
        Scan the sticker inside your bus — usually on the seat back or ceiling — or enter the 6-character code printed below it.
      </Text>

      {/* Camera scanner card */}
      <Pressable style={styles.cardWrap} onPress={() => {}}>
        <Card tone="default" padding="md" radius="card">
          <View style={styles.cameraRow}>
            <View style={[styles.iconCircle, { backgroundColor: t.colors.accentPowderBlue }]}>
              <Camera size={20} strokeWidth={1.8} color={t.colors.accentPowderBlueInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>
                Open camera scanner
              </Text>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary }}>
                Point your phone at the QR sticker
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>

      {/* Manual code entry */}
      <View style={styles.cardWrap}>
        <Card tone="default" padding="md" radius="card">
          <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
            Or enter 6-digit code
          </Text>

          <View style={styles.codeRow}>
            {Array.from({ length: TOKEN_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                value={chars[i] || ''}
                onChangeText={(text) => handleCharChange(i, text)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                maxLength={1}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: t.colors.surface2,
                    borderColor: chars[i] ? t.colors.borderStrong : t.colors.border,
                    color: t.colors.textPrimary,
                  },
                ]}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.hintRow}>
            <QrCode size={14} color={t.colors.textMuted} />
            <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>
              Format: A1B2C3 — uppercase letters & numbers
            </Text>
          </View>

          <Button
            label="Continue to menu"
            onPress={handleSubmit}
            disabled={token.length !== TOKEN_LENGTH}
            fullWidth
            size="lg"
            style={{ marginTop: 20 }}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  mt2: { marginTop: 8 },
  cardWrap: { marginTop: 16 },
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  codeBox: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 },
});
