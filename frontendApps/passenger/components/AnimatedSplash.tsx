/**
 * AnimatedSplash — Premium ETA Eats launch screen
 *
 * Design: Clean warm cream background, SVG logo renders transparently,
 * no card box, no visible circles. Subtle depth via layered opacity blobs
 * that are so soft they read as light, not shapes.
 *
 * Sequence:
 *   0ms    Warm background fades in
 *   300ms  Logo scales up from 0.7 + fades in (spring)
 *   700ms  Brand name reveals per-character
 *   1100ms Tagline fades up
 *   1500ms Bottom wordmark appears
 *   ongoing Logo breathes (1.0 → 1.018)
 *   exit   Everything scales up 1.05 + fades — app "opens"
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import LogoSvg from '../assets/logo.svg';

const { width: W, height: H } = Dimensions.get('window');
const LOGO_SIZE  = 96;
const MIN_SPLASH = 3200;

const BRAND   = 'ETA Eats'.split('');
const TAGLINE = 'Pre-order on the go';

interface Props { ready: boolean; onDone: () => void; }

export default function AnimatedSplash({ ready, onDone }: Props) {

  // ── Values ─────────────────────────────────────────────────────────────────
  const bgOp       = useRef(new Animated.Value(0)).current;
  const logoOp     = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.68)).current;
  const logoY      = useRef(new Animated.Value(16)).current;
  const breathe    = useRef(new Animated.Value(1)).current;
  const charOps    = useRef(BRAND.map(() => new Animated.Value(0))).current;
  const charYs     = useRef(BRAND.map(() => new Animated.Value(8))).current;
  const tagOp      = useRef(new Animated.Value(0)).current;
  const tagY       = useRef(new Animated.Value(10)).current;
  const bottomOp   = useRef(new Animated.Value(0)).current;
  const exitOp     = useRef(new Animated.Value(1)).current;
  const exitScale  = useRef(new Animated.Value(1)).current;
  const exitY      = useRef(new Animated.Value(0)).current;

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
        toValue: 0, duration: 680,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 1.05, duration: 680,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(exitY, {
        toValue: -16, duration: 680,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start(({ finished }) => { if (finished) onDone(); });
  }

  useEffect(() => {
    const SP = { tension: 50, friction: 10, useNativeDriver: true };

    // Background
    Animated.timing(bgOp, {
      toValue: 1, duration: 600,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    // Logo
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOp, {
          toValue: 1, duration: 550,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(logoScale, { toValue: 1, ...SP }),
        Animated.spring(logoY,     { toValue: 0, ...SP }),
      ]),
    ]).start(() => {
      // Breathing
      breatheRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, {
            toValue: 1.018, duration: 2600,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
          Animated.timing(breathe, {
            toValue: 1, duration: 2600,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true,
          }),
        ]),
      );
      breatheRef.current.start();
    });

    // Brand name — staggered per character
    Animated.parallel(
      BRAND.map((_, i) =>
        Animated.sequence([
          Animated.delay(700 + i * 50),
          Animated.parallel([
            Animated.timing(charOps[i], {
              toValue: 1, duration: 420,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(charYs[i], {
              toValue: 0, duration: 420,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
          ]),
        ]),
      ),
    ).start();

    // Tagline
    Animated.sequence([
      Animated.delay(1150),
      Animated.parallel([
        Animated.timing(tagOp, {
          toValue: 1, duration: 600,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(tagY, {
          toValue: 0, duration: 600,
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

    // Min time
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
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOp }]}>
        {/* Warm cream base */}
        <View style={styles.bgBase} />
        {/* Very soft warm light — top, barely visible */}
        <View style={styles.lightTop} />
        {/* Very soft cool whisper — bottom right */}
        <View style={styles.lightBottom} />
      </Animated.View>

      {/* ── Centre content ───────────────────────────────────────────────── */}
      <View style={styles.stage}>

        {/* Logo — SVG renders transparently on the background */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOp,
              transform: [
                { translateY: logoY },
                { scale: Animated.multiply(logoScale, breathe) },
              ],
            },
          ]}
        >
          <LogoSvg
            width={LOGO_SIZE}
            height={LOGO_SIZE}
          />
        </Animated.View>

        {/* Brand name */}
        <View style={styles.brandRow}>
          {BRAND.map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.brandChar,
                ch === ' ' && { width: 12 },
                { opacity: charOps[i], transform: [{ translateY: charYs[i] }] },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>

        {/* Thin accent line between brand and tagline */}
        <Animated.View style={[styles.accentLine, { opacity: tagOp }]} />

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: tagOp, transform: [{ translateY: tagY }] },
          ]}
        >
          {TAGLINE}
        </Animated.Text>
      </View>

      {/* ── Bottom wordmark ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.bottom, { opacity: bottomOp }]}>
        <View style={styles.bottomSep} />
        <Text style={styles.bottomText}>FOOD  ·  TRAVEL  ·  ETA</Text>
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

  // Background — three layers, all very subtle
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F2ED',  // warm parchment — premium, not clinical
  },
  lightTop: {
    position: 'absolute',
    top: -H * 0.25,
    alignSelf: 'center',
    width: W * 1.2,
    height: H * 0.65,
    borderRadius: W,
    backgroundColor: '#FFF8F0',
    opacity: 0.6,
  },
  lightBottom: {
    position: 'absolute',
    bottom: -H * 0.15,
    right: -W * 0.2,
    width: W * 0.8,
    height: H * 0.45,
    borderRadius: W,
    backgroundColor: '#EDF3FF',
    opacity: 0.35,
  },

  // Stage
  stage: {
    alignItems: 'center',
    gap: 0,
  },

  // Logo — no card, no box, just the SVG floating
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    // Soft shadow so logo has depth against background
    shadowColor: '#8B6914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },

  // Brand name
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  brandChar: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1208',
    letterSpacing: -1,
    lineHeight: 50,
  },

  // Accent line
  accentLine: {
    width: 32,
    height: 1,
    backgroundColor: '#C4A06A',
    marginBottom: 14,
    borderRadius: 1,
  },

  // Tagline
  tagline: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9C7E55',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
  },

  // Bottom
  bottom: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 10,
  },
  bottomSep: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(180,150,100,0.3)',
    marginBottom: 4,
  },
  bottomText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#C4A06A',
    letterSpacing: 3.2,
  },
});
