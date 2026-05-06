import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Keyboard,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface OTPInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  onComplete,
  error = false,
  autoFocus = true,
}: OTPInputProps) {
  const t = useTheme();
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  React.useEffect(() => {
    if (error) shake();
  }, [error, shake]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Handle paste of full code
      if (text.length === length) {
        const digits = text.split('').slice(0, length);
        setValues(digits);
        Keyboard.dismiss();
        onComplete?.(digits.join(''));
        return;
      }

      const digit = text.slice(-1);
      const next = [...values];
      next[index] = digit;
      setValues(next);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (digit && index === length - 1) {
        const code = next.join('');
        if (code.length === length) {
          Keyboard.dismiss();
          onComplete?.(code);
        }
      }
    },
    [values, length, onComplete],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...values];
        next[index - 1] = '';
        setValues(next);
      }
    },
    [values],
  );

  return (
    <Animated.View
      style={[styles.row, { transform: [{ translateX: shakeAnim }] }]}
    >
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputRefs.current[i] = ref; }}
          value={values[i]}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          autoFocus={autoFocus && i === 0}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          textContentType={i === 0 ? 'oneTimeCode' : 'none'}
          accessibilityLabel={`OTP digit ${i + 1} of ${length}`}
          style={[
            styles.cell,
            {
              ...t.typography.h2,
              borderColor: error ? t.colors.errorFg : values[i] ? t.colors.borderStrong : t.colors.border,
              borderRadius: t.radius.sm,
              color: t.colors.textPrimary,
            },
          ]}
          selectionColor={t.colors.accentPowderBlue}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    textAlign: 'center',
  },
});
