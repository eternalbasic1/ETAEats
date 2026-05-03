import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button } from '@eta/ui-components';
import { passengerFontFaces } from '../../theme/passengerTheme';

/** Max readable column width; centered on wide phones / small tablets */
const SLIDE_CONTENT_MAX = 400;

// ─── Shared slide styles ──────────────────────────────────────────────────────

const slideStyles = StyleSheet.create({
  /** Full slide width; centers a max-width column */
  root: {
    flex: 1,
    width: '100%',
    paddingTop: 8,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: SLIDE_CONTENT_MAX,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  illustrationBox: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 160,
    maxHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    width: '100%',
    paddingBottom: 8,
  },
  /** Hero / marketing copy */
  textCenter: {
    width: '100%',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    marginBottom: 10,
    width: '100%',
    textAlign: 'center',
  },
  sectionTitle: {
    width: '100%',
    textAlign: 'center',
  },
  sectionBody: {
    width: '100%',
    textAlign: 'center',
  },
  mt8:  { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt24: { marginTop: 24 },
});

// ─── Food illustration (scene-style SVG, same genre as JourneyCard) ───────────

const FOOD_SCENE_W = 280;
const FOOD_SCENE_H = 176;

function SteamWisp({ mirror = false }: { mirror?: boolean }) {
  return (
    <Svg width={14} height={30} viewBox="0 0 14 30">
      <Path
        d={mirror ? 'M7 30 Q11 22 7 14 Q3 7 7 0' : 'M7 30 Q3 22 7 14 Q11 7 7 0'}
        stroke="#A8A29E"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
    </Svg>
  );
}

/** Counter + brass handi + plated food + dhaba-style accents */
function FoodIllustrationScene() {
  return (
    <Svg width={FOOD_SCENE_W} height={FOOD_SCENE_H} viewBox={`0 0 ${FOOD_SCENE_W} ${FOOD_SCENE_H}`}>
      <Defs>
        <LinearGradient id="onbWood" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#A16207" />
          <Stop offset="100%" stopColor="#57320F" />
        </LinearGradient>
        <LinearGradient id="onbBrass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="35%" stopColor="#CA8A04" />
          <Stop offset="100%" stopColor="#713F12" />
        </LinearGradient>
        <LinearGradient id="onbRice" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFBEB" />
          <Stop offset="100%" stopColor="#FDE68A" />
        </LinearGradient>
        <LinearGradient id="onbPlate" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FEFCE8" />
          <Stop offset="100%" stopColor="#E7D5B4" />
        </LinearGradient>
      </Defs>

      {/* Warm vignette */}
      <Ellipse cx={138} cy={88} rx={124} ry={76} fill="#FFF7E8" opacity={0.92} />

      {/* Counter / table (perspective slab, JourneyCard road-adjacent dhaba tone) */}
      <Path
        d={`M -8 ${FOOD_SCENE_H} L -8 136 Q${FOOD_SCENE_W / 2} 118 ${FOOD_SCENE_W + 8} 136 L ${FOOD_SCENE_W + 8} ${FOOD_SCENE_H} Z`}
        fill="url(#onbWood)"
      />
      <Path
        d={`M 0 132 Q${FOOD_SCENE_W / 2} 120 ${FOOD_SCENE_W} 132`}
        stroke="rgba(0,0,0,0.14)"
        strokeWidth={10}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M 12 128 Q${FOOD_SCENE_W / 2} 118 ${FOOD_SCENE_W - 12} 128`}
        stroke="#D97706"
        strokeWidth={2}
        opacity={0.45}
        strokeLinecap="round"
        fill="none"
      />

      {/* Mini awning edge + bulbs (echo JourneyCard hotel lights) */}
      <Rect x={32} y={118} width={72} height={5} fill="#9A3412" rx={1} />
      <Polygon points="32,118 104,118 92,108 44,108" fill="#B45309" />
      <Circle cx={48} cy={112} r={3} fill="#FBBF24" opacity={0.95} />
      <Circle cx={68} cy={112} r={3} fill="#FBBF24" opacity={0.95} />
      <Circle cx={88} cy={112} r={3} fill="#FBBF24" opacity={0.95} />
      <Path d="M 48 108 L 48 104" stroke="#57534E" strokeWidth={1} />
      <Path d="M 68 108 L 68 104" stroke="#57534E" strokeWidth={1} />
      <Path d="M 88 108 L 88 104" stroke="#57534E" strokeWidth={1} />

      {/* Handi shadow on wood */}
      <Ellipse cx={138} cy={138} rx={46} ry={9} fill="rgba(0,0,0,0.2)" />

      {/* Brass handles */}
      <Rect x={82} y={98} width={9} height={22} rx={3} fill="#57320F" />
      <Rect x={185} y={98} width={9} height={22} rx={3} fill="#57320F" />

      {/* Handi body */}
      <Path
        d="M 98 90 C98 72 138 64 138 64 C178 64 178 72 178 90 L 182 122 Q138 138 94 122 Z"
        fill="url(#onbBrass)"
      />
      <Path
        d="M 102 88 C102 76 174 76 174 88"
        stroke="#FEF3C7"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.45}
        fill="none"
      />
      <Ellipse cx={138} cy={90} rx={36} ry={11} fill="#713F12" opacity={0.22} />
      <Ellipse cx={138} cy={88} rx={32} ry={9} fill="#1C1917" opacity={0.12} />

      {/* Rice mound + depth inside pot */}
      <Path
        d="M 108 90 Q138 76 168 90 Q166 100 138 102 Q110 100 108 90"
        fill="url(#onbRice)"
      />
      <Path
        d="M 114 88 Q138 80 162 88"
        stroke="#F59E0B"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.55}
        fill="none"
      />
      <Path
        d="M 118 94 Q138 88 158 94"
        stroke="#EA580C"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.4}
        fill="none"
      />

      {/* Protein + garnish (layered, not flat circles only) */}
      <Ellipse cx={122} cy={86} rx={8} ry={6} fill="#C2410C" />
      <Ellipse cx={148} cy={85} rx={7} ry={5} fill="#9A3412" />
      <Ellipse cx={134} cy={82} rx={6} ry={5} fill="#7C2D12" />
      <Circle cx={108} cy={88} r={4} fill="#B45309" opacity={0.9} />
      <Circle cx={156} cy={90} r={3.5} fill="#B45309" opacity={0.85} />
      <Path d="M 126 78 Q132 72 138 74 Q144 72 150 78" stroke="#166534" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Circle cx={130} cy={76} r={3} fill="#15803D" />
      <Circle cx={146} cy={75} r={2.5} fill="#16A34A" opacity={0.85} />

      {/* Rim highlight */}
      <Ellipse cx={138} cy={92} rx={34} ry={10} fill="none" stroke="#FDE047" strokeWidth={1.2} opacity={0.5} />

      {/* Side plate with served portion */}
      <Ellipse cx={218} cy={142} rx={38} ry={11} fill="rgba(0,0,0,0.12)" />
      <Ellipse cx={218} cy={138} rx={38} ry={11} fill="url(#onbPlate)" />
      <Ellipse cx={218} cy={136} rx={32} ry={8} fill="#FEF3C7" />
      <Path d="M 200 136 Q218 128 236 136 Q232 142 218 144 Q204 142 200 136" fill="#FDE68A" />
      <Path d="M 208 134 Q218 130 228 134" stroke="#D97706" strokeWidth={1.2} opacity={0.5} fill="none" />
      <Circle cx={212} cy={133} r={3} fill="#C2410C" />
      <Circle cx={226} cy={132} r={2.5} fill="#9A3412" />
      <Ellipse cx={218} cy={138} rx={38} ry={11} fill="none" stroke="#D6BC94" strokeWidth={1.2} />

      {/* Napkin / cloth corner */}
      <Polygon points="188,148 210,138 222,152 198,158" fill="#FEF3C7" opacity={0.95} />
      <Path d="M 194 150 L 206 144" stroke="#D6D3D1" strokeWidth={1} opacity={0.6} />
    </Svg>
  );
}

function FoodIllustration() {
  const floatY = useRef(new Animated.Value(0)).current;
  const entryScale = useRef(new Animated.Value(0.82)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const s1O = useRef(new Animated.Value(0)).current;
  const s1Y = useRef(new Animated.Value(0)).current;
  const s2O = useRef(new Animated.Value(0)).current;
  const s2Y = useRef(new Animated.Value(0)).current;
  const s3O = useRef(new Animated.Value(0)).current;
  const s3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -9,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const entry = Animated.parallel([
      Animated.timing(entryScale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]);

    const mkSteamOpacity = (v: Animated.Value, delayMs: number) =>
      Animated.sequence([Animated.delay(delayMs), Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.8, duration: 650, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 750, useNativeDriver: true }),
        ]),
      )]);

    const mkSteamY = (v: Animated.Value, delayMs: number) =>
      Animated.sequence([Animated.delay(delayMs), Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.timing(v, { toValue: -28, duration: 1400, useNativeDriver: true }),
        ]),
      )]);

    entry.start();
    floatLoop.start();
    mkSteamOpacity(s1O, 100).start();
    mkSteamY(s1Y, 100).start();
    mkSteamOpacity(s2O, 550).start();
    mkSteamY(s2Y, 550).start();
    mkSteamOpacity(s3O, 1000).start();
    mkSteamY(s3Y, 1000).start();

    return () => {
      floatLoop.stop();
      entry.stop();
      floatY.stopAnimation();
      entryScale.stopAnimation();
      entryOpacity.stopAnimation();
      s1O.stopAnimation();
      s1Y.stopAnimation();
      s2O.stopAnimation();
      s2Y.stopAnimation();
      s3O.stopAnimation();
      s3Y.stopAnimation();
    };
  }, []);

  const wrapStyle = {
    opacity: entryOpacity,
    transform: [{ scale: entryScale }],
  };
  const floatStyle = { transform: [{ translateY: floatY }] };
  const st1 = { opacity: s1O, transform: [{ translateY: s1Y }] };
  const st2 = { opacity: s2O, transform: [{ translateY: s2Y }] };
  const st3 = { opacity: s3O, transform: [{ translateY: s3Y }] };

  return (
    <Animated.View style={[{ alignItems: 'center' }, wrapStyle]}>
      <Animated.View style={[{ width: FOOD_SCENE_W, height: FOOD_SCENE_H }, floatStyle]}>
        {/* Steam aligned over handi opening */}
        <View
          style={{
            position: 'absolute',
            top: 4,
            left: 0,
            right: 0,
            zIndex: 2,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 20,
            pointerEvents: 'none',
          }}
        >
          <Animated.View style={st1}>
            <SteamWisp />
          </Animated.View>
          <Animated.View style={st2}>
            <SteamWisp mirror />
          </Animated.View>
          <Animated.View style={st3}>
            <SteamWisp />
          </Animated.View>
        </View>

        <FoodIllustrationScene />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Slide components ────────────────────────────────────────────────────────

function SlideWelcome() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      <View style={slideStyles.content}>
        <View style={slideStyles.illustrationBox}>
          <FoodIllustration />
        </View>

        <View style={slideStyles.textBlock}>
          <Text style={[slideStyles.textCenter, { ...t.typography.h1, color: t.colors.textPrimary }]}>
            Order food before{'\n'}your bus stops.
          </Text>
          <Text
            style={[
              slideStyles.mt16,
              slideStyles.textCenter,
              { ...t.typography.body, color: t.colors.textTertiary, lineHeight: 24 },
            ]}
          >
            ETAEats lets bus travelers pre-order from restaurants assigned to their route. Food is ready when you arrive.
          </Text>

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
      <View style={slideStyles.content}>
        <Text style={[slideStyles.label, { ...t.typography.label, color: t.colors.successFg }]}>
          HOW IT WORKS
        </Text>
        <Text style={[slideStyles.sectionTitle, { ...t.typography.h1, color: t.colors.textPrimary }]}>
          {`3 steps.\nThat's all.`}
        </Text>

        <View style={[howStyles.stepsCard, slideStyles.mt24, { backgroundColor: t.colors.surfaceSunk, borderColor: t.colors.border }]}>
          {STEPS.map((step, index) => (
            <View
              key={step.number}
              style={[
                howStyles.stepRow,
                index < STEPS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
              ]}
            >
              <View style={[howStyles.circle, { backgroundColor: step.color }]}>
                <Text style={howStyles.circleText}>{step.number}</Text>
              </View>
              <View style={howStyles.stepText}>
                <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>{step.title}</Text>
                <Text style={[slideStyles.mt8, { ...t.typography.bodySm, color: t.colors.textTertiary, lineHeight: 20 }]}>
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[howStyles.qrCard, slideStyles.mt20, { backgroundColor: t.colors.primary }]}>
          <Text style={{ fontSize: 28 }}>⬛</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...t.typography.h4, color: t.colors.textOnDark }}>
              Scan bus QR or enter code
            </Text>
            <Text style={[slideStyles.mt8, { ...t.typography.bodySm, color: 'rgba(255,255,255,0.72)' }]}>
              One scan reveals your bus restaurant
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const howStyles = StyleSheet.create({
  stepsCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    fontFamily: passengerFontFaces.bold,
  },
  stepText: { flex: 1 },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
});

function SlideEtaSync() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      <View style={slideStyles.content}>
        <Text style={[slideStyles.label, { ...t.typography.label, color: t.colors.accentPowderBlueInk }]}>
          SMART ETA SYNC
        </Text>
        <Text style={[slideStyles.sectionTitle, { ...t.typography.h1, color: t.colors.textPrimary }]}>
          {`Food ready exactly\nwhen you arrive.`}
        </Text>
        <Text
          style={[
            slideStyles.mt16,
            slideStyles.sectionBody,
            { ...t.typography.body, color: t.colors.textTertiary, lineHeight: 24 },
          ]}
        >
          {`We track your bus in real-time and alert the restaurant when to start cooking — so it's fresh, not cold.`}
        </Text>

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
    fontFamily: passengerFontFaces.semibold,
    textAlign: 'center',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  col: { alignItems: 'center', gap: 4 },
  colValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: passengerFontFaces.bold },
  colSub: { fontSize: 11, color: '#888888', fontFamily: passengerFontFaces.medium },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  routeCity: { fontSize: 11, color: '#AAAAAA', fontFamily: passengerFontFaces.medium },
  routeStop: { fontSize: 10, color: '#FFFFFF', fontFamily: passengerFontFaces.semibold, fontWeight: '600' },
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

const RESTAURANTS = [
  { name: 'Shreeji Dhaba',   cuisine: 'North Indian · Thali', rating: '4.7', badge: 'FSSAI ✓',   badgeColor: '#2E5D38' },
  { name: 'Highway Biryani', cuisine: 'Biryani · Mughlai',    rating: '4.8', badge: 'Hygiene A+', badgeColor: '#2B4A63' },
  { name: 'Café Pit Stop',   cuisine: 'Snacks · Coffee',      rating: '4.4', badge: 'FSSAI ✓',   badgeColor: '#2E5D38' },
] as const;

function SlideTrusted() {
  const t = useTheme();
  return (
    <View style={slideStyles.root}>
      <View style={slideStyles.content}>
        <Text style={[slideStyles.label, { ...t.typography.label, color: t.colors.successFg }]}>
          TRUSTED FOOD ONLY
        </Text>
        <Text style={[slideStyles.sectionTitle, { ...t.typography.h1, color: t.colors.textPrimary }]}>
          {`Only clean,\nverified dhabas.`}
        </Text>
        <Text
          style={[
            slideStyles.mt16,
            slideStyles.sectionBody,
            { ...t.typography.body, color: t.colors.textTertiary, lineHeight: 24 },
          ]}
        >
          Every restaurant is FSSAI-certified and reviewed by thousands of real highway travelers.
        </Text>

        <View
          style={[
            trustedStyles.card,
            slideStyles.mt24,
            { backgroundColor: t.colors.surface, borderColor: t.colors.border },
          ]}
        >
          {RESTAURANTS.map((r, i) => (
            <View
              key={r.name}
              style={[
                trustedStyles.row,
                i < RESTAURANTS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border },
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
    fontFamily: passengerFontFaces.bold,
  },
});

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
      <View style={[styles.progressRow, { paddingTop: insets.top + 12, paddingHorizontal: 24 }]}>
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
        contentContainerStyle={{ flexGrow: 1 }}
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
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, paddingHorizontal: 24 }]}>
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
