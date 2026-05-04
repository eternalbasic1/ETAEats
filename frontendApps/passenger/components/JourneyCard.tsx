import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, ViewProps, Dimensions } from 'react-native';
import { passengerFontFaces } from '../theme/passengerTheme';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Polygon,
  G,
  Path,
  Ellipse,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Animated wrappers ────────────────────────────────────────────────────────
const AnimatedG       = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ─── Layout constants ─────────────────────────────────────────────────────────
const CARD_WIDTH   = SCREEN_WIDTH;
const CARD_HEIGHT  = 220;   // extra 20px of fade room at the bottom
const ROAD_Y       = 155;
const FADE_START_Y = 160;   // where the bottom fade begins — just below the road

const HOTEL_X    = CARD_WIDTH - 90;
const HOTEL_Y    = ROAD_Y - 10;
const BUS_STOP_X = HOTEL_X - 155;

// ─── Time-of-day detection ────────────────────────────────────────────────────
function isNightTime(): boolean {
  const h = new Date().getHours();
  return h >= 19 || h < 6; // 7 PM – 6 AM = night
}

// ─── Sky colors (exported so home.tsx can match the background) ──────────────
export const SKY_DAY_TOP   = '#E0F2FE';
export const SKY_NIGHT_TOP = '#0F172A';

export function getSkyTopColor(): string {
  return isNightTime() ? SKY_NIGHT_TOP : SKY_DAY_TOP;
}
const BUS_THEMES = [
  { body: '#F97316', stripe: '#C2410C' },
  { body: '#3B82F6', stripe: '#1D4ED8' },
  { body: '#10B981', stripe: '#047857' },
  { body: '#8B5CF6', stripe: '#6D28D9' },
  { body: '#EF4444', stripe: '#B91C1C' },
  { body: '#EAB308', stripe: '#A16207' },
];

// ─── Sky / background ─────────────────────────────────────────────────────────
const DaySky = () => (
  <Defs>
    <LinearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0"   stopColor="#E0F2FE" stopOpacity="1" />
      <Stop offset="1"   stopColor="#F5F5F2" stopOpacity="1" />
    </LinearGradient>
    {/* Bottom fade — blends card into page bg */}
    <LinearGradient id="dayFade" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0"   stopColor="#F5F5F2" stopOpacity="0" />
      <Stop offset="1"   stopColor="#F5F5F2" stopOpacity="1" />
    </LinearGradient>
  </Defs>
);

const NightSky = () => (
  <Defs>
    <LinearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0"   stopColor="#0F172A" stopOpacity="1" />
      <Stop offset="0.6" stopColor="#1E293B" stopOpacity="1" />
      <Stop offset="1"   stopColor="#334155" stopOpacity="1" />
    </LinearGradient>
    {/* Bottom fade — blends card into page bg */}
    <LinearGradient id="nightFade" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0"   stopColor="#F5F5F2" stopOpacity="0" />
      <Stop offset="1"   stopColor="#F5F5F2" stopOpacity="1" />
    </LinearGradient>
    {/* Street-lamp cone glow */}
    <RadialGradient id="lampGlow" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
      <Stop offset="0"   stopColor="#FDE68A" stopOpacity="0.55" />
      <Stop offset="1"   stopColor="#FDE68A" stopOpacity="0"    />
    </RadialGradient>
    {/* Headlight beam */}
    <RadialGradient id="headBeam" cx="0%" cy="50%" r="100%" fx="0%" fy="50%">
      <Stop offset="0"   stopColor="#FEF9C3" stopOpacity="0.7" />
      <Stop offset="1"   stopColor="#FEF9C3" stopOpacity="0"   />
    </RadialGradient>
  </Defs>
);

// ─── Stars (night only) ───────────────────────────────────────────────────────
const Stars = () => {
  const positions = [
    [20, 18], [55, 10], [90, 25], [130, 8], [170, 20],
    [210, 12], [260, 28], [300, 6], [340, 18], [380, 10],
    [CARD_WIDTH - 40, 15], [CARD_WIDTH - 80, 25], [CARD_WIDTH - 120, 8],
  ] as [number, number][];
  return (
    <G>
      {positions.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1} fill="#F8FAFC" opacity={0.7} />
      ))}
    </G>
  );
};

// ─── Road ─────────────────────────────────────────────────────────────────────
const Road = ({ night }: { night: boolean }) => {
  const roadColor = night ? '#1E293B' : '#4B5563';
  const dashColor = night ? '#475569' : '#D1D5DB';
  return (
    <G>
      <Path
        d={`M -50 ${ROAD_Y + 5} L ${CARD_WIDTH + 50} ${ROAD_Y + 5}`}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={26}
        strokeLinecap="round"
      />
      <Path
        d={`M -50 ${ROAD_Y} L ${CARD_WIDTH + 50} ${ROAD_Y}`}
        stroke={roadColor}
        strokeWidth={22}
        strokeLinecap="round"
      />
      <Path
        d={`M -50 ${ROAD_Y} L ${CARD_WIDTH + 50} ${ROAD_Y}`}
        stroke={dashColor}
        strokeWidth={2}
        strokeDasharray="20 20"
      />
    </G>
  );
};

// ─── Street lamp ─────────────────────────────────────────────────────────────
const StreetLamp = ({ x, night }: { x: number; night: boolean }) => {
  if (!night) return null;
  return (
    <G x={x} y={ROAD_Y - 60}>
      {/* Glow cone */}
      <Ellipse cx={0} cy={0} rx={38} ry={55} fill="url(#lampGlow)" />
      {/* Pole */}
      <Rect x={-2} y={0} width={4} height={60} fill="#475569" rx={2} />
      {/* Arm */}
      <Path d={`M 0 0 Q 14 -8 18 -8`} stroke="#475569" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* Lamp head */}
      <Rect x={12} y={-14} width={12} height={6} fill="#334155" rx={2} />
      {/* Bulb */}
      <Circle cx={18} cy={-11} r={4} fill="#FDE68A" opacity={0.95} />
    </G>
  );
};

// ─── Tree ─────────────────────────────────────────────────────────────────────
const Tree = ({ x, y, scale = 1, night }: { x: number; y: number; scale?: number; night: boolean }) => {
  const leafDark  = night ? '#064E3B' : '#059669';
  const leafLight = night ? '#065F46' : '#10B981';
  const leafShine = night ? '#047857' : '#34D399';
  return (
    <G x={x} y={y} scale={scale}>
      <Ellipse cx={0} cy={2} rx={18} ry={4} fill="rgba(0,0,0,0.1)" />
      <Rect x={-4} y={-35} width={8} height={35} fill={night ? '#3B1F0A' : '#78350F'} rx={2} />
      <Circle cx={0}   cy={-45} r={20} fill={leafDark} />
      <Circle cx={-12} cy={-30} r={15} fill={leafLight} />
      <Circle cx={12}  cy={-30} r={15} fill={leafLight} />
      <Circle cx={-6}  cy={-48} r={6}  fill={leafShine} opacity={night ? 0.2 : 0.5} />
    </G>
  );
};

// ─── Hotel / Dhaba ────────────────────────────────────────────────────────────
const Hotel = ({ glow, night }: { glow: Animated.Value; night: boolean }) => {
  const wallColor   = night ? '#1E293B' : '#FEF3C7';
  const trimColor   = night ? '#7F1D1D' : '#B91C1C';
  const roofColor   = night ? '#7C2D12' : '#C2410C';
  const roofEdge    = night ? '#6B2110' : '#9A3412';
  const pillarColor = night ? '#0F172A' : '#4B5563';
  const signBg      = night ? '#92400E' : '#FCD34D';
  const signText    = night ? '#FDE68A' : '#92400E';
  const signBorder  = night ? '#78350F' : '#B45309';
  const counterBg   = night ? '#0F172A' : '#4B5563';
  const doorColor   = night ? '#1E293B' : '#9CA3AF';

  return (
    <G>
      <Ellipse cx={HOTEL_X} cy={HOTEL_Y} rx={60} ry={6} fill="rgba(0,0,0,0.12)" />

      {/* Building */}
      <Rect x={HOTEL_X - 40} y={HOTEL_Y - 50} width={80} height={50} fill={wallColor} rx={2} />

      {/* Night: window glow on building wall */}
      {night && (
        <AnimatedG opacity={glow}>
          {/* Left window */}
          <Rect x={HOTEL_X - 32} y={HOTEL_Y - 44} width={14} height={12} fill="#FDE68A" rx={2} opacity={0.9} />
          <Rect x={HOTEL_X - 32} y={HOTEL_Y - 44} width={14} height={12} fill="#FEF9C3" rx={2} opacity={0.3} />
          {/* Right window */}
          <Rect x={HOTEL_X + 18} y={HOTEL_Y - 44} width={14} height={12} fill="#FDE68A" rx={2} opacity={0.9} />
          <Rect x={HOTEL_X + 18} y={HOTEL_Y - 44} width={14} height={12} fill="#FEF9C3" rx={2} opacity={0.3} />
        </AnimatedG>
      )}

      {/* Base trim */}
      <Rect x={HOTEL_X - 40} y={HOTEL_Y - 10} width={80} height={10} fill={trimColor} rx={2} />

      {/* Roof */}
      <Polygon
        points={`${HOTEL_X - 50},${HOTEL_Y - 50} ${HOTEL_X + 50},${HOTEL_Y - 50} ${HOTEL_X + 30},${HOTEL_Y - 70} ${HOTEL_X - 30},${HOTEL_Y - 70}`}
        fill={roofColor}
      />
      <Rect x={HOTEL_X - 50} y={HOTEL_Y - 50} width={100} height={5} fill={roofEdge} />

      {/* Pillars */}
      <Rect x={HOTEL_X - 45} y={HOTEL_Y - 45} width={4} height={45} fill={pillarColor} />
      <Rect x={HOTEL_X + 41} y={HOTEL_Y - 45} width={4} height={45} fill={pillarColor} />

      {/* Signboard */}
      <Rect
        x={HOTEL_X - 25} y={HOTEL_Y - 82} width={50} height={14}
        fill={signBg} rx={2} stroke={signBorder} strokeWidth={2}
      />
      <SvgText
        x={HOTEL_X} y={HOTEL_Y - 72}
        fill={signText}
        fontFamily={passengerFontFaces.bold}
        fontSize="10" fontWeight="700"
        textAnchor="middle" letterSpacing="1"
      >
        DHABA
      </SvgText>

      {/* Counter */}
      <Rect x={HOTEL_X - 25} y={HOTEL_Y - 35} width={50} height={15} fill={counterBg} rx={2} />

      {/* Hanging bulbs — always rendered, opacity driven by glow anim */}
      <AnimatedG opacity={night ? glow : 0}>
        <Circle cx={HOTEL_X - 20} cy={HOTEL_Y - 40} r={4} fill="#FBBF24" />
        <Circle cx={HOTEL_X}      cy={HOTEL_Y - 40} r={4} fill="#FBBF24" />
        <Circle cx={HOTEL_X + 20} cy={HOTEL_Y - 40} r={4} fill="#FBBF24" />
        <Path d={`M ${HOTEL_X - 20} ${HOTEL_Y - 50} L ${HOTEL_X - 20} ${HOTEL_Y - 44}`} stroke={pillarColor} strokeWidth={1} />
        <Path d={`M ${HOTEL_X}      ${HOTEL_Y - 50} L ${HOTEL_X}      ${HOTEL_Y - 44}`} stroke={pillarColor} strokeWidth={1} />
        <Path d={`M ${HOTEL_X + 20} ${HOTEL_Y - 50} L ${HOTEL_X + 20} ${HOTEL_Y - 44}`} stroke={pillarColor} strokeWidth={1} />
        {/* Warm glow halos around bulbs */}
        <Circle cx={HOTEL_X - 20} cy={HOTEL_Y - 40} r={9}  fill="#FDE68A" opacity={0.25} />
        <Circle cx={HOTEL_X}      cy={HOTEL_Y - 40} r={9}  fill="#FDE68A" opacity={0.25} />
        <Circle cx={HOTEL_X + 20} cy={HOTEL_Y - 40} r={9}  fill="#FDE68A" opacity={0.25} />
      </AnimatedG>

      {/* Door */}
      <Rect x={HOTEL_X - 35} y={HOTEL_Y - 35} width={10} height={25} fill={doorColor} rx={1} />
    </G>
  );
};

// ─── Bus ──────────────────────────────────────────────────────────────────────
const Bus = ({
  position, bounce, theme, night,
}: {
  position: Animated.Value;
  bounce: Animated.Value;
  theme: { body: string; stripe: string };
  night: boolean;
}) => {
  const shadowScale = bounce.interpolate({
    inputRange: [-2, 0, 2],
    outputRange: [1.02, 1, 0.98],
    extrapolate: 'clamp',
  });

  return (
    <AnimatedG x={position}>
      <AnimatedEllipse
        cx={50} cy={ROAD_Y + 8} rx={55} ry={5}
        fill="rgba(0,0,0,0.15)"
        scale={shadowScale}
        originX={50} originY={ROAD_Y + 8}
      />

      <AnimatedG y={bounce}>
        {/* Body */}
        <Rect x={0} y={ROAD_Y - 45} width={100} height={40} fill={theme.body} rx={12} />

        {/* Tinted glass panel */}
        <Path
          d={`M 15 ${ROAD_Y - 40} L 85 ${ROAD_Y - 40} Q 95 ${ROAD_Y - 40} 95 ${ROAD_Y - 30} L 95 ${ROAD_Y - 18} L 10 ${ROAD_Y - 18} Z`}
          fill={night ? '#0F172A' : '#111827'}
        />

        {/* Night: interior cabin glow through glass */}
        {night && (
          <Path
            d={`M 15 ${ROAD_Y - 40} L 85 ${ROAD_Y - 40} Q 95 ${ROAD_Y - 40} 95 ${ROAD_Y - 30} L 95 ${ROAD_Y - 18} L 10 ${ROAD_Y - 18} Z`}
            fill="#FDE68A"
            opacity={0.08}
          />
        )}

        {/* Accent stripe */}
        <Rect x={10} y={ROAD_Y - 15} width={85} height={3} fill={theme.stripe} />

        {/* Wheels */}
        <Circle cx={25} cy={ROAD_Y - 5} r={9} fill="#1F2937" />
        <Circle cx={25} cy={ROAD_Y - 5} r={4} fill={night ? '#94A3B8' : '#E5E7EB'} />
        <Circle cx={75} cy={ROAD_Y - 5} r={9} fill="#1F2937" />
        <Circle cx={75} cy={ROAD_Y - 5} r={4} fill={night ? '#94A3B8' : '#E5E7EB'} />

        {/* Headlight — always present, beam only at night */}
        <Rect x={95} y={ROAD_Y - 10} width={4} height={6} fill={night ? '#FEF9C3' : '#9CA3AF'} rx={2} />
        {night && (
          <Ellipse cx={130} cy={ROAD_Y - 7} rx={50} ry={16} fill="url(#headBeam)" />
        )}

        {/* Taillight — red glow only at night */}
        <Rect
          x={0} y={ROAD_Y - 12} width={3} height={8}
          fill={night ? '#EF4444' : '#6B7280'}
          rx={1}
        />
        {night && (
          <Ellipse cx={-8} cy={ROAD_Y - 8} rx={12} ry={6} fill="#EF4444" opacity={0.35} />
        )}
      </AnimatedG>
    </AnimatedG>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export interface JourneyCardProps extends ViewProps {
  children?: React.ReactNode;
}

export const JourneyCard = ({ children, style, ...props }: JourneyCardProps) => {
  const [themeIndex, setThemeIndex] = useState(0);
  const [night, setNight] = useState(isNightTime());
  const theme = BUS_THEMES[themeIndex % BUS_THEMES.length] as { body: string; stripe: string };

  const busPosition = useRef(new Animated.Value(-200)).current;
  const busBounce   = useRef(new Animated.Value(0)).current;
  const hotelGlow   = useRef(new Animated.Value(0.4)).current;

  const currentThemeIndex = useRef(0);
  const isMounted = useRef(true);

  // Re-check time every minute so the card switches at sunrise/sunset
  useEffect(() => {
    const interval = setInterval(() => {
      setNight(isNightTime());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const runBusCycle = () => {
    if (!isMounted.current) return;
    busPosition.setValue(-200);

    Animated.sequence([
      Animated.timing(busPosition, {
        toValue: BUS_STOP_X,
        duration: 3500,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
        useNativeDriver: false,
      }),
      Animated.delay(5000),
      Animated.timing(busPosition, {
        toValue: CARD_WIDTH + 150,
        duration: 3000,
        easing: Easing.bezier(0.5, 0, 0.75, 0),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished && isMounted.current) {
        currentThemeIndex.current = (currentThemeIndex.current + 1) % BUS_THEMES.length;
        setThemeIndex(currentThemeIndex.current);
        setTimeout(() => { if (isMounted.current) runBusCycle(); }, 800);
      }
    });
  };

  useEffect(() => {
    isMounted.current = true;

    Animated.loop(
      Animated.sequence([
        Animated.timing(busBounce, { toValue: 1,   duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(busBounce, { toValue: 0,   duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(hotelGlow, { toValue: 1,   duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(hotelGlow, { toValue: 0.5, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    ).start();

    const timer = setTimeout(() => { runBusCycle(); }, 500);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      busPosition.stopAnimation();
      busBounce.stopAnimation();
      hotelGlow.stopAnimation();
    };
  }, []);

  const bgFill = night ? 'url(#nightSky)' : 'url(#daySky)';

  return (
    <View style={[styles.container, style]} {...props}>
      <Svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      >
        {/* Gradient defs */}
        {night ? <NightSky /> : <DaySky />}

        {/* Sky background */}
        <Rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill={bgFill} rx={0} />

        {/* Stars (night only) */}
        {night && <Stars />}

        {/* Ground strip */}
        <Rect
          x={0} y={ROAD_Y - 20}
          width={CARD_WIDTH} height={CARD_HEIGHT - ROAD_Y + 20}
          fill={night ? '#0F172A' : '#D1FAE5'}
          opacity={night ? 1 : 0.4}
        />

        <Road night={night} />

        {/* Street lamps (night only) */}
        <StreetLamp x={60}                  night={night} />
        <StreetLamp x={CARD_WIDTH / 2 - 20} night={night} />
        <StreetLamp x={HOTEL_X - 110}       night={night} />

        {/* Trees */}
        <Tree x={30}  y={ROAD_Y - 5}  scale={0.8} night={night} />
        <Tree x={85}  y={ROAD_Y - 12} scale={1.1} night={night} />
        <Tree x={140} y={ROAD_Y - 2}  scale={0.9} night={night} />

        <Hotel glow={hotelGlow} night={night} />
        <Bus position={busPosition} bounce={busBounce} theme={theme} night={night} />

        {/* Bottom fade — starts just below road, covers full remaining height */}
        <Rect
          x={0} y={FADE_START_Y}
          width={CARD_WIDTH} height={CARD_HEIGHT - FADE_START_Y}
          fill={night ? 'url(#nightFade)' : 'url(#dayFade)'}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'transparent',
    transform: [{ translateX: -20 }],
    marginTop: 0,
    marginBottom: 0,
    // No borderRadius / overflow:hidden — they clip the bottom fade gradient
  },
});
