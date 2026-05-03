import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button } from '@eta/ui-components';

// ─── Slide stubs (replaced in Tasks 3–6) ──────────────────────────────────

function SlideWelcome() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      {/* Illustration */}
      <View style={slideStyles.illustrationBox}>
        <Text style={{ fontSize: 52, letterSpacing: 4 }}>🏠🌳{'  '}🚌{'  '}🌳🏨</Text>
        <View style={{
          marginTop: 10,
          width: '70%',
          height: 6,
          backgroundColor: t.colors.borderStrong,
          borderRadius: 3,
        }} />
      </View>

      {/* Text */}
      <View style={slideStyles.textBlock}>
        <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>
          Order food before{'\n'}your bus stops.
        </Text>
        <Text style={[slideStyles.mt16, { ...t.typography.body, color: t.colors.textTertiary }]}>
          ETAEats lets bus travelers pre-order from restaurants assigned to their route. Food is ready when you arrive.
        </Text>

        {/* Feature pills */}
        <View style={[slideStyles.pillRow, slideStyles.mt24]}>
          {(['🚌 Highway food', '✅ Verified restaurants', '⚡ No waiting'] as const).map((label) => (
            <View
              key={label}
              style={[slideStyles.pill, { backgroundColor: t.colors.surfaceSunk, borderColor: t.colors.border }]}
            >
              <Text style={{ ...t.typography.caption, color: t.colors.textSecondary }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const STEPS = [
  {
    number: '1',
    color: '#E8703A',
    title: 'Scan the QR in your bus',
    body: 'Every ETAEats bus has a QR code or a 6-digit code. Scan it to reveal the restaurant assigned to your route.',
  },
  {
    number: '2',
    color: '#4A90D9',
    title: 'Browse the menu & order',
    body: "See what's available, pick your meal, pay in-app. That's it.",
  },
  {
    number: '3',
    color: '#2E5D38',
    title: 'Pick up at your stop',
    body: 'Your order is timed to your bus ETA. Walk off. Collect. Eat.',
  },
] as const;

function SlideHowItWorks() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      <Text style={[slideStyles.label, { ...t.typography.label, color: t.colors.successFg }]}>
        HOW IT WORKS
      </Text>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>
        3 steps.{'\n'}That's all.
      </Text>

      <View style={slideStyles.mt24}>
        {STEPS.map((step) => (
          <View key={step.number} style={howStyles.stepRow}>
            <View style={[howStyles.circle, { backgroundColor: step.color }]}>
              <Text style={howStyles.circleText}>{step.number}</Text>
            </View>
            <View style={howStyles.stepText}>
              <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>{step.title}</Text>
              <Text style={[slideStyles.mt8, { ...t.typography.bodySm, color: t.colors.textTertiary }]}>
                {step.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* QR card */}
      <View style={[howStyles.qrCard, { backgroundColor: t.colors.primary }]}>
        <Text style={{ fontSize: 28 }}>⬛</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ ...t.typography.h4, color: t.colors.textOnDark }}>
            Scan Bus QR or enter code
          </Text>
          <Text style={[slideStyles.mt8, { ...t.typography.bodySm, color: '#AAAAAA' }]}>
            One scan reveals your bus restaurant
          </Text>
        </View>
      </View>
    </View>
  );
}

const howStyles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Lora',
  },
  stepText: { flex: 1 },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
});

function SlideEtaSync() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>ETA Sync</Text>
    </View>
  );
}

function SlideTrusted() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>Trusted</Text>
    </View>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────

const SLIDES_DATA = [
  { key: 'welcome', component: SlideWelcome },
  { key: 'how-it-works', component: SlideHowItWorks },
  { key: 'eta-sync', component: SlideEtaSync },
  { key: 'trusted', component: SlideTrusted },
];

const SLIDE_COUNT = SLIDES_DATA.length;

// ─── Screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  function goToSlide(index: number) {
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }

  function handleNext() {
    if (currentIndex < SLIDE_COUNT - 1) goToSlide(currentIndex + 1);
  }

  const isLast = currentIndex === SLIDE_COUNT - 1;

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Progress bar */}
      <View style={[styles.progressRow, { paddingTop: insets.top + 12, paddingHorizontal: 20 }]}>
        {Array.from({ length: SLIDE_COUNT }, (_, i) => i).map((i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i <= currentIndex ? t.colors.primary : t.colors.border },
            ]}
          />
        ))}
      </View>

      {/* Pager */}
      <FlatList
        ref={flatListRef}
        data={SLIDES_DATA}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const SlideComponent = item.component;
          return (
            <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
              <SlideComponent />
            </View>
          );
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={styles.pager}
      />

      {/* Bottom chrome */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, paddingHorizontal: 20 }]}>
        <Button
          label={currentIndex === 0 ? 'Get Started' : isLast ? 'Create Account →' : 'Next →'}
          onPress={isLast ? () => router.replace('/(auth)/signup') : handleNext}
          fullWidth
          size="lg"
        />
        {currentIndex === 0 && (
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.secondaryBtn} accessibilityRole="button">
            <Text style={{ ...t.typography.body, color: t.colors.textSecondary, textAlign: 'center' }}>
              I have an account
            </Text>
          </Pressable>
        )}
        {isLast && (
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.secondaryBtn} accessibilityRole="button">
            <Text style={{ ...t.typography.bodySm, color: t.colors.textTertiary, textAlign: 'center' }}>
              Already joined?{' '}
              <Text style={{ color: t.colors.primary, fontWeight: '600' }}>Sign in</Text>
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Shared slide styles (used by Tasks 3–6) ──────────────────────────────

export const slideStyles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  illustrationBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  textBlock: {
    paddingBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    marginBottom: 8,
  },
  mt8:  { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
});

// ─── Screen styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingBottom: 12,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  pager: { flex: 1 },
  bottomBar: {
    paddingTop: 12,
    gap: 4,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
