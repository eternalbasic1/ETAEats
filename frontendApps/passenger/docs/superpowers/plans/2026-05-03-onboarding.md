# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-slide horizontal pager onboarding shown to every unauthenticated user, ending with navigation to signup or login.

**Architecture:** Single file FlatList pager (`scrollEnabled: false`, button-driven). Root `index.tsx` redirects unauthenticated users to the new `/(onboarding)/` group. 4 slide functions defined locally in `index.tsx`. Shared `slideStyles` object used across all slides. Per-slide style objects (`howStyles`, `etaStyles`, `trustedStyles`) defined immediately after their slide function.

**Tech Stack:** Expo Router, React Native FlatList, react-native-safe-area-context, @eta/ui-components (Button, useTheme)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/index.tsx` | Modify | Change unauthenticated redirect to `/(onboarding)/` |
| `app/(onboarding)/_layout.tsx` | Create | Stack layout, no header, bg `#F5F5F2` |
| `app/(onboarding)/index.tsx` | Create | Pager shell + progress bar + bottom chrome + 4 slide components |

---

### Task 1: Routing scaffolding

**Files:**
- Create: `app/(onboarding)/_layout.tsx`
- Modify: `app/index.tsx`

- [ ] **Step 1: Create `app/(onboarding)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F5F2' },
      }}
    />
  );
}
```

- [ ] **Step 2: Update `app/index.tsx` — redirect unauthenticated to onboarding**

Full file replacement:

```tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@eta/auth';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(onboarding)/" />;
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/_layout.tsx" app/index.tsx
git commit -m "feat: add onboarding route group, redirect unauthenticated users to onboarding"
```

---

### Task 2: Pager shell — progress bar + bottom chrome + stub slides

**Files:**
- Create: `app/(onboarding)/index.tsx`

- [ ] **Step 1: Create `app/(onboarding)/index.tsx` with pager shell and stub slides**

```tsx
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button } from '@eta/ui-components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Slide stubs (replaced in Tasks 3–6) ──────────────────────────────────

function SlideWelcome() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>Welcome</Text>
    </View>
  );
}

function SlideHowItWorks() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>How it Works</Text>
    </View>
  );
}

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

// ─── Screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  function goToSlide(index: number) {
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }

  function handleNext() {
    if (currentIndex < 3) goToSlide(currentIndex + 1);
  }

  const isLast = currentIndex === 3;

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Progress bar */}
      <View style={[styles.progressRow, { paddingTop: insets.top + 12, paddingHorizontal: 20 }]}>
        {[0, 1, 2, 3].map((i) => (
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
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.secondaryBtn}>
            <Text style={{ ...t.typography.body, color: t.colors.textSecondary, textAlign: 'center' }}>
              I have an account
            </Text>
          </Pressable>
        )}
        {isLast && (
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.secondaryBtn}>
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
```

- [ ] **Step 2: Verify shell — open app logged out, confirm 4 progress segments appear and are filled up to the active slide, "Get Started" advances the pager, "I have an account" navigates to login**

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/index.tsx"
git commit -m "feat: onboarding pager shell with progress bar and bottom chrome"
```

---

### Task 3: SlideWelcome — illustration + headline + pills

**Files:**
- Modify: `app/(onboarding)/index.tsx` — replace stub `SlideWelcome`

- [ ] **Step 1: Replace stub `SlideWelcome` with full implementation**

Replace the existing `SlideWelcome` function (keep everything else):

```tsx
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
```

- [ ] **Step 2: Verify Slide 0 — emoji illustration scene visible, headline on two lines, body text, 3 feature pills below**

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/index.tsx"
git commit -m "feat: onboarding slide 0 — welcome with illustration and feature pills"
```

---

### Task 4: SlideHowItWorks — label + headline + 3 steps + QR card

**Files:**
- Modify: `app/(onboarding)/index.tsx` — replace stub `SlideHowItWorks`, add `STEPS` constant and `howStyles`

- [ ] **Step 1: Add `STEPS` constant and replace `SlideHowItWorks`**

Add `STEPS` immediately before `SlideHowItWorks`, then replace the stub function:

```tsx
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
```

- [ ] **Step 2: Verify Slide 1 — green "HOW IT WORKS" label, headline, 3 numbered steps with orange/blue/green circles, dark QR card at the bottom**

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/index.tsx"
git commit -m "feat: onboarding slide 1 — how it works with numbered steps and QR card"
```

---

### Task 5: SlideEtaSync — label + headline + dark live-sync card + feature tags

**Files:**
- Modify: `app/(onboarding)/index.tsx` — replace stub `SlideEtaSync`, add `etaStyles`

- [ ] **Step 1: Replace `SlideEtaSync` stub and add `etaStyles`**

Replace the existing `SlideEtaSync` function:

```tsx
function SlideEtaSync() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      <Text style={[slideStyles.label, { ...t.typography.label, color: t.colors.accentPowderBlueInk }]}>
        SMART ETA SYNC
      </Text>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>
        Food ready exactly{'\n'}when you arrive.
      </Text>
      <Text style={[slideStyles.mt16, { ...t.typography.body, color: t.colors.textTertiary }]}>
        We track your bus in real-time and alert the restaurant when to start cooking — so it's fresh, not cold.
      </Text>

      {/* Live sync card */}
      <View style={[etaStyles.card, slideStyles.mt24]}>
        <Text style={etaStyles.cardLabel}>LIVE SYNC</Text>
        <View style={etaStyles.columns}>
          {([
            { icon: '🚌', value: '12 min', sub: 'Bus ETA' },
            { icon: '🍳', value: '10 min', sub: 'Prep time' },
            { icon: '✅', value: 'Stop', sub: 'Ready at' },
          ] as const).map((col, i) => (
            <View key={i} style={etaStyles.col}>
              <Text style={{ fontSize: 22 }}>{col.icon}</Text>
              <Text style={etaStyles.colValue}>{col.value}</Text>
              <Text style={etaStyles.colSub}>{col.sub}</Text>
            </View>
          ))}
        </View>

        {/* Route bar */}
        <View style={etaStyles.routeRow}>
          <Text style={etaStyles.routeCity}>Mumbai</Text>
          <View style={etaStyles.routeLine}>
            <View style={etaStyles.liveDot} />
          </View>
          <Text style={etaStyles.routeStop}>← Nashik Bus Stand</Text>
          <View style={etaStyles.routeLine} />
          <Text style={etaStyles.routeCity}>Pune</Text>
        </View>
      </View>

      {/* Feature tags */}
      <View style={[slideStyles.pillRow, slideStyles.mt16]}>
        {(['🔴 Live GPS', '⚡ Kitchen auto-alert', '❄️ No cold food guarantee'] as const).map((tag) => (
          <View
            key={tag}
            style={[slideStyles.pill, { backgroundColor: t.colors.surfaceSunk, borderColor: t.colors.border }]}
          >
            <Text style={{ ...t.typography.caption, color: t.colors.textSecondary }}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const etaStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 1.2,
    marginBottom: 12,
    fontFamily: 'Lora',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  col: { alignItems: 'center', gap: 4 },
  colValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Lora' },
  colSub: { fontSize: 11, color: '#888888', fontFamily: 'Lora' },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  routeCity: { fontSize: 11, color: '#AAAAAA', fontFamily: 'Lora' },
  routeStop: { fontSize: 10, color: '#FFFFFF', fontFamily: 'Lora', fontWeight: '600' },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#333333',
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
});
```

- [ ] **Step 2: Verify Slide 2 — blue "SMART ETA SYNC" label, headline, body text, dark card with 3 columns + route bar with red live dot, 3 feature tags below**

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/index.tsx"
git commit -m "feat: onboarding slide 2 — ETA sync with live card and feature tags"
```

---

### Task 6: SlideTrusted — label + headline + restaurant rows

**Files:**
- Modify: `app/(onboarding)/index.tsx` — replace stub `SlideTrusted`, add `RESTAURANTS` constant and `trustedStyles`

- [ ] **Step 1: Add `RESTAURANTS` constant, replace `SlideTrusted` stub, add `trustedStyles`**

Add `RESTAURANTS` immediately before `SlideTrusted`, then replace the stub:

```tsx
const RESTAURANTS = [
  { name: 'Shreeji Dhaba',   cuisine: 'North Indian · Thali', rating: '4.7', badge: 'FSSAI ✓',   badgeColor: '#2E5D38' },
  { name: 'Highway Biryani', cuisine: 'Biryani · Mughlai',    rating: '4.8', badge: 'Hygiene A+', badgeColor: '#2B4A63' },
  { name: 'Café Pit Stop',   cuisine: 'Snacks · Coffee',      rating: '4.4', badge: 'FSSAI ✓',   badgeColor: '#2E5D38' },
] as const;

function SlideTrusted() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      <Text style={[slideStyles.label, { ...t.typography.label, color: t.colors.successFg }]}>
        TRUSTED FOOD ONLY
      </Text>
      <Text style={{ ...t.typography.h1, color: t.colors.textPrimary }}>
        Only clean,{'\n'}verified dhabas.
      </Text>
      <Text style={[slideStyles.mt16, { ...t.typography.body, color: t.colors.textTertiary }]}>
        Every restaurant is FSSAI-certified and reviewed by thousands of real highway travelers.
      </Text>

      {/* Restaurant list */}
      <View style={[
        trustedStyles.card,
        slideStyles.mt24,
        { backgroundColor: t.colors.surface, borderColor: t.colors.border },
      ]}>
        {RESTAURANTS.map((r, i) => (
          <View
            key={r.name}
            style={[
              trustedStyles.row,
              i < RESTAURANTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.colors.border },
            ]}
          >
            <View style={[trustedStyles.photo, { backgroundColor: t.colors.surfaceSunk }]}>
              <Text style={{ fontSize: 20 }}>🍽</Text>
            </View>
            <View style={trustedStyles.info}>
              <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>{r.name}</Text>
              <Text style={[slideStyles.mt8, { ...t.typography.caption, color: t.colors.textTertiary }]}>
                {r.cuisine}
              </Text>
            </View>
            <View style={trustedStyles.right}>
              <Text style={{ ...t.typography.bodySm, color: t.colors.textPrimary, fontWeight: '600' }}>
                ★ {r.rating}
              </Text>
              <View style={[trustedStyles.badge, { backgroundColor: r.badgeColor + '1A' }]}>
                <Text style={[trustedStyles.badgeText, { color: r.badgeColor }]}>{r.badge}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const trustedStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  photo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Lora',
  },
});
```

- [ ] **Step 2: End-to-end verification**
  - Open app logged out → lands on Slide 0 (Welcome)
  - Tap "Get Started" → Slide 1, second progress segment fills
  - Tap "Next →" → Slide 2, third segment fills
  - Tap "Next →" → Slide 3, all 4 segments filled, button reads "Create Account →"
  - Tap "Create Account →" → arrives at signup screen
  - Log out / open fresh → Slide 0 again
  - On Slide 0 tap "I have an account" → login screen
  - On Slide 3 tap "Already joined? Sign in" → login screen
  - Log in → goes directly to `/(tabs)/home`, no onboarding shown

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/index.tsx"
git commit -m "feat: onboarding slide 3 — trusted dhabas with restaurant rows, completes onboarding flow"
```
