import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Button } from '@eta/ui-components';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, PermissionStatus } from 'expo-camera';
import { Camera, Keyboard, QrCode, X, AlertCircle, Settings, ChevronRight } from 'lucide-react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_LENGTH = 6;
const QR_TOKEN_REGEX = /^[A-Z0-9]{6}$/;

// ─── Types ────────────────────────────────────────────────────────────────────

type ScannerState = 'idle' | 'scanning' | 'success' | 'error';
type ActiveTab = 'scan' | 'enter';

// ─── Sub-component: Full-screen QR scanner overlay ───────────────────────────

interface QRScannerProps {
  onClose: () => void;
  onScanned: (token: string) => void;
}

function QRScanner({ onClose, onScanned }: QRScannerProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [scannerState, setScannerState] = useState<ScannerState>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const hasScanned = useRef(false);

  // Animated border pulse for the viewfinder
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  // Flash animation on success
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  function handleBarcodeScanned({ data }: { data: string }) {
    if (hasScanned.current) return;

    // Extract token — QR may encode just the token or a full URL ending in /token
    const raw = data.trim().toUpperCase();
    const token = raw.split('/').pop() ?? raw;

    if (!QR_TOKEN_REGEX.test(token)) {
      if (hasScanned.current) return;
      hasScanned.current = true;
      setScannerState('error');
      setErrorMsg('Not a valid bus QR code. Try the manual entry below.');
      // Allow retry after 2 s
      setTimeout(() => {
        hasScanned.current = false;
        setScannerState('scanning');
        setErrorMsg('');
      }, 2000);
      return;
    }

    hasScanned.current = true;
    setScannerState('success');

    // Flash green, then navigate
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onScanned(token);
    });
  }

  const viewfinderBorderColor =
    scannerState === 'success'
      ? '#22C55E'
      : scannerState === 'error'
        ? t.colors.errorFg
        : t.colors.accentPowderBlueInk;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Camera feed */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scannerState === 'scanning' ? handleBarcodeScanned : undefined}
      />

      {/* Dark overlay with cutout effect via four surrounding panels */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top */}
        <View style={[styles.overlayPanel, styles.overlayTop, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        {/* Bottom */}
        <View style={[styles.overlayPanel, styles.overlayBottom, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        {/* Left */}
        <View style={[styles.overlayPanel, styles.overlayLeft, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />
        {/* Right */}
        <View style={[styles.overlayPanel, styles.overlayRight, { backgroundColor: 'rgba(0,0,0,0.62)' }]} />

        {/* Viewfinder border */}
        <Animated.View
          style={[
            styles.viewfinder,
            {
              borderColor: viewfinderBorderColor,
              opacity: pulseAnim,
            },
          ]}
        />

        {/* Corner accents */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
          <View
            key={corner}
            style={[
              styles.corner,
              styles[`corner_${corner}`],
              { borderColor: viewfinderBorderColor },
            ]}
          />
        ))}
      </View>

      {/* Success flash */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#22C55E', opacity: flashAnim },
        ]}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[styles.scannerTopBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          hitSlop={12}
          accessibilityLabel="Close scanner"
          accessibilityRole="button"
        >
          <X size={20} color="#fff" strokeWidth={2} />
        </Pressable>
        <Text style={styles.scannerTitle}>Scan Bus QR</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bottom hint / status */}
      <View style={[styles.scannerBottom, { paddingBottom: insets.bottom + 24 }]}>
        {scannerState === 'error' ? (
          <View style={styles.scannerStatusRow}>
            <AlertCircle size={16} color="#FCA5A5" />
            <Text style={[styles.scannerHint, { color: '#FCA5A5' }]}>{errorMsg}</Text>
          </View>
        ) : scannerState === 'success' ? (
          <Text style={[styles.scannerHint, { color: '#86EFAC' }]}>QR code detected!</Text>
        ) : (
          <Text style={styles.scannerHint}>
            Align the QR sticker within the frame
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Sub-component: Permission denied state ───────────────────────────────────

interface PermissionDeniedProps {
  onRequestAgain: () => void;
}

function PermissionDenied({ onRequestAgain }: PermissionDeniedProps) {
  const t = useTheme();
  return (
    <View style={[styles.permDeniedWrap, { backgroundColor: t.colors.errorBg, borderColor: t.colors.errorBorder }]}>
      <View style={styles.permDeniedRow}>
        <AlertCircle size={16} color={t.colors.errorFg} />
        <Text style={{ ...t.typography.bodySm, color: t.colors.errorFg, flex: 1 }}>
          Camera access was denied. Enable it in Settings to scan QR codes.
        </Text>
      </View>
      <View style={styles.permDeniedActions}>
        <Pressable onPress={() => Linking.openSettings()} style={styles.permLink}>
          <Settings size={13} color={t.colors.errorFg} />
          <Text style={{ ...t.typography.caption, color: t.colors.errorFg, fontWeight: '600' }}>
            Open Settings
          </Text>
        </Pressable>
        <Pressable onPress={onRequestAgain} style={styles.permLink}>
          <Text style={{ ...t.typography.caption, color: t.colors.errorFg, fontWeight: '600' }}>
            Try again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Sub-component: Segmented toggle ─────────────────────────────────────────

interface SegmentedToggleProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

function SegmentedToggle({ active, onChange }: SegmentedToggleProps) {
  const t = useTheme();
  const slideAnim = useRef(new Animated.Value(active === 'scan' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: active === 'scan' ? 0 : 1,
      useNativeDriver: false,
      tension: 280,
      friction: 28,
    }).start();
  }, [active, slideAnim]);

  return (
    <View
      style={[
        styles.toggleTrack,
        { backgroundColor: t.colors.surface2, borderColor: t.colors.border },
      ]}
    >
      {/* Sliding pill */}
      <Animated.View
        style={[
          styles.togglePill,
          {
            backgroundColor: t.colors.primary,
            left: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['2%', '51%'],
            }),
          },
        ]}
      />
      {/* Scan QR tab */}
      <Pressable
        style={styles.toggleTab}
        onPress={() => onChange('scan')}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'scan' }}
        accessibilityLabel="Scan QR tab"
      >
        <Camera
          size={15}
          strokeWidth={active === 'scan' ? 2.2 : 1.8}
          color={active === 'scan' ? t.colors.textOnDark : t.colors.textTertiary}
        />
        <Text
          style={[
            styles.toggleLabel,
            { color: active === 'scan' ? t.colors.textOnDark : t.colors.textTertiary },
          ]}
        >
          Scan QR
        </Text>
      </Pressable>
      {/* Enter Code tab */}
      <Pressable
        style={styles.toggleTab}
        onPress={() => onChange('enter')}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'enter' }}
        accessibilityLabel="Enter code tab"
      >
        <Keyboard
          size={15}
          strokeWidth={active === 'enter' ? 2.2 : 1.8}
          color={active === 'enter' ? t.colors.textOnDark : t.colors.textTertiary}
        />
        <Text
          style={[
            styles.toggleLabel,
            { color: active === 'enter' ? t.colors.textOnDark : t.colors.textTertiary },
          ]}
        >
          Enter Code
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Sub-component: Scan QR panel ────────────────────────────────────────────

interface ScanPanelProps {
  onOpen: () => void;
  permDenied: boolean;
  onRequestPermAgain: () => void;
}

function ScanPanel({ onOpen, permDenied, onRequestPermAgain }: ScanPanelProps) {
  const t = useTheme();
  const pressAnim = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }

  return (
    <View style={styles.panelWrap}>
      {/* Permission denied banner */}
      {permDenied && (
        <PermissionDenied onRequestAgain={onRequestPermAgain} />
      )}

      {/* Big tappable camera launch area */}
      <Pressable
        onPress={onOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Open camera to scan QR code"
        style={{ marginTop: permDenied ? 12 : 0 }}
      >
        <Animated.View
          style={[
            styles.scanLaunchCard,
            {
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              transform: [{ scale: pressAnim }],
            },
          ]}
        >
          {/* Large icon area */}
          <View
            style={[
              styles.scanIconWrap,
              { backgroundColor: t.colors.accentPowderBlue },
            ]}
          >
            <Camera size={40} strokeWidth={1.5} color={t.colors.accentPowderBlueInk} />
          </View>

          <Text
            style={[styles.scanLaunchTitle, { color: t.colors.textPrimary }]}
          >
            Open Camera Scanner
          </Text>
          <Text
            style={[styles.scanLaunchSub, { color: t.colors.textTertiary }]}
          >
            Point your phone at the QR sticker on the seat back or ceiling
          </Text>

          {/* CTA button row */}
          <View
            style={[
              styles.scanCTARow,
              { backgroundColor: t.colors.primary },
            ]}
          >
            <Camera size={16} strokeWidth={2} color={t.colors.textOnDark} />
            <Text style={[styles.scanCTALabel, { color: t.colors.textOnDark }]}>
              Tap to scan
            </Text>
            <ChevronRight size={16} strokeWidth={2.5} color={t.colors.textOnDark} />
          </View>
        </Animated.View>
      </Pressable>

      {/* Tip row */}
      <View style={[styles.tipRow, { backgroundColor: t.colors.accentSoftCream, borderColor: t.colors.borderSubtle }]}>
        <QrCode size={14} color={t.colors.textMuted} />
        <Text style={{ ...styles.tipText, color: t.colors.textMuted }}>
          The QR sticker is usually on the seat back or overhead panel
        </Text>
      </View>
    </View>
  );
}

// ─── Sub-component: Enter code panel ─────────────────────────────────────────

interface EnterPanelProps {
  chars: string[];
  inputRefs: React.RefObject<Array<TextInput | null>>;
  onCharChange: (index: number, raw: string) => void;
  onKeyPress: (index: number, key: string) => void;
  onSubmit: () => void;
}

function EnterPanel({ chars, inputRefs, onCharChange, onKeyPress, onSubmit }: EnterPanelProps) {
  const t = useTheme();
  const token = chars.join('');
  const filled = chars.filter(Boolean).length;

  return (
    <View style={styles.panelWrap}>
      <View
        style={[
          styles.enterCard,
          { backgroundColor: t.colors.surface, borderColor: t.colors.border },
        ]}
      >
        {/* Header */}
        <View style={styles.enterHeader}>
          <View
            style={[styles.enterIconCircle, { backgroundColor: t.colors.accentSoftCream }]}
          >
            <Keyboard size={18} strokeWidth={1.8} color={t.colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...t.typography.h4, color: t.colors.textPrimary }}>
              Enter bus code
            </Text>
            <Text style={{ ...t.typography.caption, color: t.colors.textTertiary }}>
              6-character code printed below the QR sticker
            </Text>
          </View>
        </View>

        {/* Code tiles — square, same pattern as OTP screen */}
        <View style={styles.codeRow}>
          {Array.from({ length: TOKEN_LENGTH }).map((_, i) => {
            const isFilled = !!chars[i];
            const isActive = filled === i || (filled >= TOKEN_LENGTH && i === TOKEN_LENGTH - 1);
            return (
              <View
                key={i}
                style={[
                  styles.codeTile,
                  {
                    backgroundColor: t.colors.surface,
                    borderColor: isActive
                      ? t.colors.primary
                      : isFilled
                        ? t.colors.borderStrong
                        : t.colors.border,
                    borderWidth: isActive ? 2 : 1.5,
                  },
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  value={chars[i] || ''}
                  onChangeText={(text) => onCharChange(i, text)}
                  onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
                  maxLength={1}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  spellCheck={false}
                  keyboardType="default"
                  caretHidden
                  selectTextOnFocus
                  style={[
                    styles.codeInput,
                    {
                      color: t.colors.textPrimary,
                      fontFamily: 'Lora_500Bold',
                      fontSize: 22,
                      fontWeight: '700',
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    },
                  ]}
                  accessibilityLabel={`Character ${i + 1} of ${TOKEN_LENGTH}`}
                />
              </View>
            );
          })}
        </View>

        {/* Hint */}
        <View style={styles.hintRow}>
          <QrCode size={13} color={t.colors.textMuted} />
          <Text style={{ ...t.typography.caption, color: t.colors.textMuted }}>
            Format: A1B2C3 — letters and numbers only
          </Text>
        </View>

        {/* Submit */}
        <Button
          label="Continue to menu"
          onPress={onSubmit}
          disabled={token.length !== TOKEN_LENGTH}
          fullWidth
          size="lg"
          style={{ marginTop: 20 }}
        />
      </View>

      {/* Tip row */}
      <View style={[styles.tipRow, { backgroundColor: t.colors.accentSoftCream, borderColor: t.colors.borderSubtle }]}>
        <Camera size={14} color={t.colors.textMuted} />
        <Text style={{ ...styles.tipText, color: t.colors.textMuted }}>
          Can't find the code? Switch to Scan QR to use your camera
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  // Tab state — default to 'scan', but honour the `tab` param from home.tsx
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    tab === 'enter' ? 'enter' : 'scan',
  );

  // Manual entry state
  const [chars, setChars] = useState<string[]>(Array(TOKEN_LENGTH).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const token = chars.join('');

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // On every focus: sync the tab from the param.
  // useFocusEffect runs on every navigation to this screen, so stale params
  // from a previous visit are always overridden.
  useFocusEffect(
    useCallback(() => {
      const targetTab: ActiveTab = tab === 'enter' ? 'enter' : 'scan';
      setActiveTab(targetTab);
      setPermDenied(false);

      // Close camera when leaving the screen
      return () => {
        setCameraOpen(false);
      };
    }, [tab]),
  );

  // ── Manual entry handlers ──────────────────────────────────────────────────

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

  function handleManualSubmit() {
    if (token.length !== TOKEN_LENGTH) return;
    router.push(`/scan/${encodeURIComponent(token)}`);
  }

  // ── Camera handlers ────────────────────────────────────────────────────────

  async function handleOpenCamera() {
    setPermDenied(false);

    if (!permission) return;

    if (permission.status === PermissionStatus.GRANTED) {
      setCameraOpen(true);
      return;
    }

    if (permission.status === PermissionStatus.DENIED && !permission.canAskAgain) {
      setPermDenied(true);
      return;
    }

    const result = await requestPermission();
    if (result.granted) {
      setCameraOpen(true);
    } else {
      setPermDenied(true);
    }
  }

  function handleScanned(scannedToken: string) {
    setCameraOpen(false);
    router.push(`/scan/${encodeURIComponent(scannedToken)}`);
  }

  // ── Tab change ─────────────────────────────────────────────────────────────

  function handleTabChange(tab: ActiveTab) {
    setActiveTab(tab);
    // Reset permission denied banner when switching away from scan
    if (tab !== 'scan') setPermDenied(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: t.colors.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page header */}
        <Text style={{ ...t.typography.label, color: t.colors.textMuted }}>
          STEP 1
        </Text>
        <Text style={[styles.mt2, { ...t.typography.h1, color: t.colors.textPrimary }]}>
          Find your bus's QR
        </Text>
        <Text
          style={[
            styles.mt2,
            { ...t.typography.bodySm, color: t.colors.textTertiary, maxWidth: 340 },
          ]}
        >
          Scan the sticker inside your bus or enter the 6-character code printed below it.
        </Text>

        {/* Segmented toggle */}
        <View style={styles.toggleWrap}>
          <SegmentedToggle active={activeTab} onChange={handleTabChange} />
        </View>

        {/* Active panel */}
        {activeTab === 'scan' ? (
          <ScanPanel
            onOpen={handleOpenCamera}
            permDenied={permDenied}
            onRequestPermAgain={handleOpenCamera}
          />
        ) : (
          <EnterPanel
            chars={chars}
            inputRefs={inputRefs}
            onCharChange={handleCharChange}
            onKeyPress={handleKeyPress}
            onSubmit={handleManualSubmit}
          />
        )}
      </ScrollView>

      {/* Full-screen camera overlay */}
      {cameraOpen && (
        <View style={StyleSheet.absoluteFill}>
          <QRScanner
            onClose={() => setCameraOpen(false)}
            onScanned={handleScanned}
          />
        </View>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VIEWFINDER_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CODE_TILE_SIZE = 52;

const styles = StyleSheet.create({
  // ── Screen
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  mt2: { marginTop: 8 },

  // ── Toggle
  toggleWrap: { marginTop: 20 },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    position: 'relative',
    height: 48,
  },
  togglePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    borderRadius: 999,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Panel wrapper
  panelWrap: { marginTop: 16, gap: 10 },

  // ── Scan panel
  scanLaunchCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  scanIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scanLaunchTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  scanLaunchSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  scanCTARow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    width: '100%',
  },
  scanCTALabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // ── Enter panel
  enterCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  enterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  enterIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Code tiles (matches OTP tile style)
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeTile: {
    flex: 1,
    height: CODE_TILE_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  codeInput: {
    width: CODE_TILE_SIZE,
    height: CODE_TILE_SIZE,
    textAlign: 'center',
    letterSpacing: 0,
    backgroundColor: 'transparent',
    textTransform: 'uppercase',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
  },

  // ── Tip row (shared)
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  // ── Permission denied
  permDeniedWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  permDeniedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  permDeniedActions: { flexDirection: 'row', gap: 16, paddingLeft: 24 },
  permLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // ── Scanner overlay
  scannerTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scannerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  scannerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // ── Overlay panels
  overlayPanel: { position: 'absolute' },
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
    bottom: `${50 + (VIEWFINDER_SIZE / 2 / 8.44)}%` as any,
  },
  overlayBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    top: `${50 + (VIEWFINDER_SIZE / 2 / 8.44)}%` as any,
  },
  overlayLeft: {
    top: `${50 - (VIEWFINDER_SIZE / 2 / 8.44)}%` as any,
    bottom: `${50 - (VIEWFINDER_SIZE / 2 / 8.44)}%` as any,
    left: 0,
    width: `${50 - (VIEWFINDER_SIZE / 2 / 3.9)}%` as any,
  },
  overlayRight: {
    top: `${50 - (VIEWFINDER_SIZE / 2 / 8.44)}%` as any,
    bottom: `${50 - (VIEWFINDER_SIZE / 2 / 8.44)}%` as any,
    right: 0,
    width: `${50 - (VIEWFINDER_SIZE / 2 / 3.9)}%` as any,
  },

  // ── Viewfinder
  viewfinder: {
    position: 'absolute',
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderWidth: 1.5,
    borderRadius: 16,
    alignSelf: 'center',
    top: '50%',
    marginTop: -(VIEWFINDER_SIZE / 2),
  },

  // ── Corner accents
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  corner_tl: {
    top: '50%',
    marginTop: -(VIEWFINDER_SIZE / 2) - 1,
    left: '50%',
    marginLeft: -(VIEWFINDER_SIZE / 2) - 1,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 16,
  },
  corner_tr: {
    top: '50%',
    marginTop: -(VIEWFINDER_SIZE / 2) - 1,
    right: '50%',
    marginRight: -(VIEWFINDER_SIZE / 2) - 1,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 16,
  },
  corner_bl: {
    bottom: '50%',
    marginBottom: -(VIEWFINDER_SIZE / 2) - 1,
    left: '50%',
    marginLeft: -(VIEWFINDER_SIZE / 2) - 1,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 16,
  },
  corner_br: {
    bottom: '50%',
    marginBottom: -(VIEWFINDER_SIZE / 2) - 1,
    right: '50%',
    marginRight: -(VIEWFINDER_SIZE / 2) - 1,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 16,
  },
});
