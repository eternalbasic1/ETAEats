import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, ViewProps, Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Polygon,
  G,
  Path,
  Ellipse,
  Text as SvgText
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ------------------------------------------------------------------
// Animated Wrappers
// ------------------------------------------------------------------
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const CARD_WIDTH = SCREEN_WIDTH;
const CARD_HEIGHT = 180; 
const ROAD_Y = 140; 

const HOTEL_X = CARD_WIDTH - 90; // Anchor to the right edge
const HOTEL_Y = ROAD_Y - 10;
const BUS_STOP_X = HOTEL_X - 155; // Stop just before the Dhaba's awning

// Static Colors
const ROAD_COLOR = '#4B5563'; 
const DASH_COLOR = '#D1D5DB';

// Dynamic Bus Themes
const BUS_THEMES = [
  { body: '#F97316', stripe: '#C2410C' }, // Orange (Default)
  { body: '#3B82F6', stripe: '#1D4ED8' }, // Blue
  { body: '#10B981', stripe: '#047857' }, // Emerald Green
  { body: '#8B5CF6', stripe: '#6D28D9' }, // Violet
  { body: '#EF4444', stripe: '#B91C1C' }, // Red
  { body: '#EAB308', stripe: '#A16207' }, // Yellow
];

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------
const Road = () => {
  return (
    <G>
      {/* Road Shadow */}
      <Path d={`M -50 ${ROAD_Y + 5} L ${CARD_WIDTH + 50} ${ROAD_Y + 5}`} stroke="rgba(0,0,0,0.05)" strokeWidth={24} strokeLinecap="round" />
      {/* Main road */}
      <Path
        d={`M -50 ${ROAD_Y} L ${CARD_WIDTH + 50} ${ROAD_Y}`}
        stroke={ROAD_COLOR}
        strokeWidth={20}
        strokeLinecap="round"
      />
      {/* Dashed center line */}
      <Path
        d={`M -50 ${ROAD_Y} L ${CARD_WIDTH + 50} ${ROAD_Y}`}
        stroke={DASH_COLOR}
        strokeWidth={2}
        strokeDasharray="20 20"
      />
    </G>
  );
};

const Tree = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => {
  return (
    <G x={x} y={y} scale={scale}>
      {/* Drop Shadow */}
      <Ellipse cx={0} cy={2} rx={18} ry={4} fill="rgba(0,0,0,0.1)" />
      {/* Trunk */}
      <Rect x={-4} y={-35} width={8} height={35} fill="#78350F" rx={2} />
      {/* Leaves Cluster */}
      <Circle cx={0} cy={-45} r={20} fill="#059669" />
      <Circle cx={-12} cy={-30} r={15} fill="#10B981" />
      <Circle cx={12} cy={-30} r={15} fill="#10B981" />
      {/* Highlight/Detail */}
      <Circle cx={-6} cy={-48} r={6} fill="#34D399" opacity={0.5} />
    </G>
  );
};

const Hotel = ({ glow }: { glow: Animated.Value }) => {
  return (
    <G>
      {/* Dhaba Drop Shadow */}
      <Ellipse cx={HOTEL_X} cy={HOTEL_Y} rx={60} ry={6} fill="rgba(0,0,0,0.1)" />
      
      {/* Main Building Base (warm rustic tone) */}
      <Rect x={HOTEL_X - 40} y={HOTEL_Y - 50} width={80} height={50} fill="#FEF3C7" rx={2} />
      
      {/* Base trim */}
      <Rect x={HOTEL_X - 40} y={HOTEL_Y - 10} width={80} height={10} fill="#B91C1C" rx={2} />

      {/* Awning/Tin Roof */}
      <Polygon points={`${HOTEL_X - 50},${HOTEL_Y - 50} ${HOTEL_X + 50},${HOTEL_Y - 50} ${HOTEL_X + 30},${HOTEL_Y - 70} ${HOTEL_X - 30},${HOTEL_Y - 70}`} fill="#C2410C" />
      <Rect x={HOTEL_X - 50} y={HOTEL_Y - 50} width={100} height={5} fill="#9A3412" />

      {/* Awning Pillars */}
      <Rect x={HOTEL_X - 45} y={HOTEL_Y - 45} width={4} height={45} fill="#4B5563" />
      <Rect x={HOTEL_X + 41} y={HOTEL_Y - 45} width={4} height={45} fill="#4B5563" />

      {/* Signboard */}
      <Rect x={HOTEL_X - 25} y={HOTEL_Y - 82} width={50} height={14} fill="#FCD34D" rx={2} stroke="#B45309" strokeWidth={2} />
      <SvgText
        x={HOTEL_X}
        y={HOTEL_Y - 72}
        fill="#92400E"
        fontSize="10"
        fontWeight="bold"
        textAnchor="middle"
        letterSpacing="1"
      >
        DHABA
      </SvgText>

      {/* Open counter style */}
      <Rect x={HOTEL_X - 25} y={HOTEL_Y - 35} width={50} height={15} fill="#4B5563" rx={2} />
      
      {/* Glowing Bulbs / Hanging Lights */}
      <AnimatedG opacity={glow}>
        <Circle cx={HOTEL_X - 20} cy={HOTEL_Y - 40} r={4} fill="#FBBF24" />
        <Circle cx={HOTEL_X} cy={HOTEL_Y - 40} r={4} fill="#FBBF24" />
        <Circle cx={HOTEL_X + 20} cy={HOTEL_Y - 40} r={4} fill="#FBBF24" />
        
        <Path d={`M ${HOTEL_X - 20} ${HOTEL_Y - 50} L ${HOTEL_X - 20} ${HOTEL_Y - 44}`} stroke="#4B5563" strokeWidth={1} />
        <Path d={`M ${HOTEL_X} ${HOTEL_Y - 50} L ${HOTEL_X} ${HOTEL_Y - 44}`} stroke="#4B5563" strokeWidth={1} />
        <Path d={`M ${HOTEL_X + 20} ${HOTEL_Y - 50} L ${HOTEL_X + 20} ${HOTEL_Y - 44}`} stroke="#4B5563" strokeWidth={1} />
      </AnimatedG>
      
      {/* Small door/entrance area */}
      <Rect x={HOTEL_X - 35} y={HOTEL_Y - 35} width={10} height={25} fill="#9CA3AF" rx={1} />
    </G>
  );
};

const Bus = ({ position, bounce, theme }: { position: Animated.Value; bounce: Animated.Value; theme: { body: string; stripe: string } }) => {
  // Drop shadow shrinks/grows with bounce to give realistic depth
  const shadowScale = bounce.interpolate({
    inputRange: [-2, 0, 2],
    outputRange: [1.02, 1, 0.98],
    extrapolate: 'clamp',
  });

  return (
    <AnimatedG x={position}>
      {/* Soft shadow under bus */}
      <AnimatedEllipse cx={50} cy={ROAD_Y + 8} rx={55} ry={5} fill="rgba(0,0,0,0.15)" scale={shadowScale} originX={50} originY={ROAD_Y + 8} />

      <AnimatedG y={bounce}>
        {/* Sleek Modern Bus Body */}
        <Rect x={0} y={ROAD_Y - 45} width={100} height={40} fill={theme.body} rx={12} />
        
        {/* Continuous sleek tinted glass panel (Electric bus aesthetic) */}
        <Path 
          d={`M 15 ${ROAD_Y - 40} L 85 ${ROAD_Y - 40} Q 95 ${ROAD_Y - 40} 95 ${ROAD_Y - 30} L 95 ${ROAD_Y - 18} L 10 ${ROAD_Y - 18} Z`} 
          fill="#111827" 
        />
        
        {/* Subtle accent line below windows */}
        <Rect x={10} y={ROAD_Y - 15} width={85} height={3} fill={theme.stripe} />
        
        {/* Wheels with modern rims */}
        <Circle cx={25} cy={ROAD_Y - 5} r={9} fill="#1F2937" />
        <Circle cx={25} cy={ROAD_Y - 5} r={4} fill="#E5E7EB" />
        
        <Circle cx={75} cy={ROAD_Y - 5} r={9} fill="#1F2937" />
        <Circle cx={75} cy={ROAD_Y - 5} r={4} fill="#E5E7EB" />
        
        {/* Modern LED Headlight */}
        <Rect x={95} y={ROAD_Y - 10} width={4} height={6} fill="#FCD34D" rx={2} />
        {/* Headlight beam */}
        <Ellipse cx={120} cy={ROAD_Y - 7} rx={35} ry={12} fill="#FDE047" opacity={0.3} />
        
        {/* Taillight */}
        <Rect x={0} y={ROAD_Y - 12} width={3} height={8} fill="#EF4444" rx={1} />
      </AnimatedG>
    </AnimatedG>
  );
};

// ------------------------------------------------------------------
// Main Card Component
// ------------------------------------------------------------------
export interface JourneyCardProps extends ViewProps {
  children?: React.ReactNode;
}

export const JourneyCard = ({ children, style, ...props }: JourneyCardProps) => {
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = BUS_THEMES[themeIndex];
  
  const busPosition = useRef(new Animated.Value(-200)).current;
  const busBounce = useRef(new Animated.Value(0)).current;
  const hotelGlow = useRef(new Animated.Value(0.4)).current;
  
  const currentThemeIndex = useRef(0);
  const isMounted = useRef(true);

  const runBusCycle = () => {
    if (!isMounted.current) return;
    
    // Reset bus to left side
    busPosition.setValue(-200);

    Animated.sequence([
      // 1. Bus arrives at hotel smoothly
      Animated.timing(busPosition, {
        toValue: BUS_STOP_X,
        duration: 3500,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
        useNativeDriver: false,
      }),
      // 2. Bus waits at hotel for 5 seconds
      Animated.delay(5000),
      // 3. Bus departs and drives off-screen right smoothly
      Animated.timing(busPosition, {
        toValue: CARD_WIDTH + 150,
        duration: 3000,
        easing: Easing.bezier(0.5, 0, 0.75, 0),
        useNativeDriver: false,
      })
    ]).start(({ finished }) => {
      if (finished && isMounted.current) {
        // Cycle to the next bus color theme
        currentThemeIndex.current = (currentThemeIndex.current + 1) % BUS_THEMES.length;
        setThemeIndex(currentThemeIndex.current);
        
        // Wait a brief moment before the next bus arrives
        setTimeout(() => {
          if (isMounted.current) runBusCycle();
        }, 800);
      }
    });
  };

  useEffect(() => {
    isMounted.current = true;

    // Start subtle engine hum / idle bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(busBounce, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(busBounce, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
      ])
    ).start();
    
    // Start window glowing pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(hotelGlow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(hotelGlow, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
      ])
    ).start();

    // Start the endless bus arrival cycle
    const timer = setTimeout(() => {
      runBusCycle();
    }, 500);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      busPosition.stopAnimation();
      busBounce.stopAnimation();
      hotelGlow.stopAnimation();
    };
  }, []);

  return (
    <View 
      style={[styles.container, style]}
      {...props}
    >
      <Svg width={CARD_WIDTH} height={CARD_HEIGHT} viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}>
        {/* Transparent Background - Seamlessly merges with app background */}
        <Road />
        
        {/* Scenery Trees */}
        <Tree x={30} y={ROAD_Y - 5} scale={0.8} />
        <Tree x={85} y={ROAD_Y - 12} scale={1.1} />
        <Tree x={140} y={ROAD_Y - 2} scale={0.9} />

        <Hotel glow={hotelGlow} />
        <Bus position={busPosition} bounce={busBounce} theme={theme} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'transparent',
    transform: [{ translateX: -20 }], // Perfect bleed assuming parent has paddingHorizontal: 20
    marginTop: 20,
    marginBottom: 12,
  },
});
