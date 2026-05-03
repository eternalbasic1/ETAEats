import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  disabled = false,
  accessibilityLabel,
  containerStyle,
  inputStyle,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.errorBorder
    : focused
      ? theme.colors.borderStrong
      : theme.colors.border;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {},
        label: {
          ...theme.typography.label,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[1],
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 48,
          borderWidth: 1,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing[3],
        },
        rowDisabled: {
          backgroundColor: theme.colors.surfaceSunk,
          opacity: 0.6,
        },
        leadingSlot: {
          marginRight: theme.spacing[2],
        },
        trailingSlot: {
          marginLeft: theme.spacing[2],
        },
        input: {
          flex: 1,
          ...theme.typography.body,
          color: theme.colors.textPrimary,
          paddingVertical: theme.spacing[3],
          minHeight: 44,
        },
        hint: {
          ...theme.typography.caption,
          color: theme.colors.textTertiary,
          marginTop: theme.spacing[1],
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.errorFg,
          marginTop: theme.spacing[1],
        },
      }),
    [theme],
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.row,
          { borderColor },
          disabled && styles.rowDisabled,
        ]}
      >
        {leading && <View style={styles.leadingSlot}>{leading}</View>}

        <TextInput
          {...rest}
          editable={!disabled}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, inputStyle]}
        />

        {trailing && <View style={styles.trailingSlot}>{trailing}</View>}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
