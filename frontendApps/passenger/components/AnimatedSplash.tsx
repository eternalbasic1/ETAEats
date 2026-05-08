/**
 * AnimatedSplash — Premium launch experience for ETA Eats
 *
 * Cinematic sequence:
 *   0ms    Background warms in
 *   180ms  Ambient glow blooms
 *   480ms  Logo card arrives (spring, from below)
 *   760ms  Brand name reveals per-character
 *   1150ms Tagline fades up
 *   ongoing Logo breathes + shimmer sweeps
 *   exit   Content lifts + fades — app "opens"
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const LOGO_SIZE   = 82;
const CARD_SIZE   = LOGO_SIZE + 28;
const MIN_SPLASH  = 3400;

const BRAND = 'ETA Eats'.split('');
const TAGLINE = 'Pre-order on the go';

interface Props { ready: boolean; onDone: () => void; }

export default function AnimatedSplash({ ready, onDone }: Props) {

  // ── Animated values ────────────────────────────────────────────────────────
  const bgOpacity      = useRef(new Animated.Value(0)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;
  const glowScale      = useRef(new Animated.Value(0.35)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.55)).current;
  const logoY          = useRef(new Animated.Value(22)).current;
  const breatheScale   = useRef(new Animated.Value(1)).current;
  const shimmerX       = useRef(new Animated.Value(-CARD_SIZE)).current;
  const charOps        = useRef(BRAND.map(() => new Animated.Value(0))).current;
  const charYs         = useRef(BRAND.map(() => new Animated.Value(10))).current;
  const taglineOp      = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(12)).current;
  const bottomOp       = useRef(new Animated.Value(0)).current;
  // Exit — whole content lifts + fades
  const exitOp         = useRef(new Animated.Value(1)).current;
  const exitScale      = useRef(new Animated.Value(1)).current;
  const exitY          = useRef(new Animated.Value(0)).current;

  // ── Coordination ───────────────────────────────────────────────────────────
  const readyRef   = useRef(false);
  const minRef     = useRef(false);
  const exitingRef = useRef(false);
  const breatheRef = useRef<Animated.CompositeAnimation | null>(null);

  function triggerExit() {
    if (exitingRef.current || !readyRef.current || !minRef.current) return;
    exitingRef.current = true;
    breatheRef.current?.stop();

    Animated.parallel([
      Animated.timing(exitOp, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 1.06,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(exitY, {
        toValue: -20,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => { if (finished) onDone(); });
  }

  useEffect(() => {
    const SP = { tension: 48, friction: 9, useNativeDriver: true };

    // Background
    Animated.timing(bgOpacity, {
      toValue: 1, duration: 700,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    // Glow bloom
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.48, duration: 1100,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(glowScale, { toValue: 1, ...SP }),
      ]),
    ]).start();

    // Logo card
    Animated.sequence([
      Animated.delay(480),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 520,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(logoScale, { toValue: 1, ...SP }),
        Animated.spring(logoY,     { toValue: 0, ...SP }),
      ]),
    ]).start(() => {
      // Breathing pulse
      breatheRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheScale, {
            toValue: 1.022, duration: 2400,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.timing(breatheScale, {
            toValue: 1, duration: 2400,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
        ]),
      );
      breatheRef.current.start();

      // Shimmer — 2 sweeps then stops
      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(shimmerX, {
            toValue: CARD_SIZE * 1.4, duration: 820,
            easing: Easing.inOut(Easing.quad), useNativeDriver: true,
          }),
          Animated.timing(shimmerX, {
            toValue: -CARD_SIZE, duration: 0, useNativeDriver: true,
          }),
        ]),
        { iterations: 2 },
      ).start();
    });

    // Brand name — staggered per character
    Animated.parallel(
      BRAND.map((_, i) =>
        Animated.sequence([
          Animated.delay(760 + i * 52),
          Animated.parallel([
            Animated.timing(charOps[i], {
              toValue: 1, duration: 400,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(charYs[i], {
              toValue: 0, duration: 400,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
          ]),
        ]),
      ),
    ).start();

    // Tagline
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(taglineOp, {
          toValue: 1, duration: 650,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0, duration: 650,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Bottom wordmark
    Animated.sequence([
      Animated.delay(1600),
      Animated.timing(bottomOp, {
        toValue: 1, duration: 700,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Min display time
    const t = setTimeout(() => { minRef.current = true; triggerExit(); }, MIN_SPLASH);
    return () => { clearTimeout(t); breatheRef.current?.stop(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    readyRef.current = true;
    triggerExit();
  }, [ready]);

  return (
    <Animated.View
      style={[
        styles.root,
        { opacity: exitOp, transform: [{ scale: exitScale }, { translateY: exitY }] },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Background ──────────────────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <View style={styles.bgBase} />
        {/* Warm amber bloom — top centre */}
        <View style={styles.blobAmber} />
        {/* Cool blue whisper — bottom right */}
        <View style={styles.blobBlue} />
        {/* Soft inner vignette */}
        <View style={styles.vignette} />
      </Animated.View>

      {/* ── Ambient glow ────────────────────────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* ── Centre stage ────────────────────────────────────────────────── */}
      <View style={styles.stage}>

        {/* Logo card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: logoOpacity,
              transform: [
                { translateY: logoY },
                { scale: Animated.multiply(logoScale, breatheScale) },
              ],
            },
          ]}
        >
          {/* Layered glass surface */}
          <View style={styles.cardGlass} />
          <View style={styles.cardRim} />

          {/* Logo */}
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Shimmer sweep */}
          <Animated.View
            pointerEvents="none"
            style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { rotate: '18deg' }] }]}
          />

          {/* Top-edge specular highlight */}
          <View style={styles.specular} pointerEvents="none" />
        </Animated.View>

        {/* Brand name */}
        <View style={styles.brandRow}>
          {BRAND.map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.brandChar,
                ch === ' ' && { width: 11 },
                { opacity: charOps[i], transform: [{ translateY: charYs[i] }] },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOp, transform: [{ translateY: taglineY }] },
          ]}
        >
          {TAGLINE}
        </Animated.Text>
      </View>

      {/* ── Bottom wordmark ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.bottom, { opacity: bottomOp }]}>
        <View style={styles.bottomLine} />
        <View style={styles.bottomRow}>
          <View style={styles.dot} />
          <Text style={styles.bottomText}>FOOD  ·  TRAVEL  ·  ETA</Text>
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    overflow: 'hidden',
  },

  // Background
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F6F3EE',
  },
  blobAmber: {
    position: 'absolute',
    top: -H * 0.12,
    left: W * 0.05,
    width: W * 0.9,
    height: H * 0.52,
    borderRadius: W,
    backgroundColor: '#FFF5E6',
    opacity: 0.85,
  },
  blobBlue: {
    position: 'absolute',
    bottom: -H * 0.08,
    right: -W * 0.1,
    width: W * 0.7,
    height: H * 0.38,
    borderRadius: W,
    backgroundColor: '#EBF2FF',
    opacity: 0.5,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 72,
    borderColor: 'rgba(0,0,0,0.035)',
  },

  // Glow
  glow: {
    position: 'absolute',
    width: W * 0.78,
    height: W * 0.78,
    borderRadius: W * 0.39,
    backgroundColor: '#F59E0B',
  },

  // Stage
  stage: {
    alignItems: 'center',
  },

  // Card
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 36,
    // Multi-layer shadow for depth
    shadowColor: '#B8720A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 18,
  },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.98)',
  },
  cardRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.14)',
    backgroundColor: 'transparent',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    zIndex: 2,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 3,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1.2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 1,
    zIndex: 4,
  },

  // Brand name
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  brandChar: {
    fontSize: 40,
    fontWeight: '700',
    color: '#18120A',
    letterSpacing: -0.8,
    lineHeight: 48,
  },

  // Tagline
  tagline: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#9C7E55',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },

  // Bottom
  bottom: {
    position: 'absolute',
    bottom: 44,
    alignItems: 'center',
    gap: 10,
  },
  bottomLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(180,150,110,0.35)',
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#C8A87A',
  },
  bottomText: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#C8A87A',
    letterSpacing: 3,
  },
});
