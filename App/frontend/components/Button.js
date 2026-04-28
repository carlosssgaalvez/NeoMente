import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useFonts } from '../hooks/useFonts';

/**
 * Botón reutilizable con variantes de color y tamaño.
 * Diseñado con touch targets grandes para accesibilidad (personas mayores).
 * Soporta escalado de fuente desde SettingsContext.
 * @param {Object} props
 * @param {string} props.title - Texto del botón.
 * @param {Function} props.onPress - Callback al pulsar.
 * @param {'primary'|'secondary'|'danger'} [props.variant='primary'] - Variante de color.
 * @param {'large'|'medium'} [props.size='medium'] - Tamaño del botón.
 */
export default function Button({ title, onPress, variant = 'primary', size = 'medium', disabled = false }) {
  const f = useFonts();
  const dynamicFontSize = size === 'large' ? f.h2 : f.body;
  const s = f.s;

  const dynamicSize = size === 'large'
    ? { paddingVertical: s(22), minHeight: s(70), marginVertical: s(12) }
    : { paddingVertical: s(16), minHeight: s(56), marginVertical: s(8) };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { paddingHorizontal: s(20), borderRadius: s(12) },
        dynamicSize,
        styles[variant],
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      <Text style={[
        styles.text,
        styles[`${variant}Text`],
        { fontSize: dynamicFontSize },
        disabled && styles.disabledText,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    alignSelf: 'stretch',
  },
  large: {
    paddingVertical: 22,
    minHeight: 70,
    marginVertical: 12,
  },
  medium: {
    paddingVertical: 16,
    minHeight: 56,
    marginVertical: 8,
  },
  // Variantes de color
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  // Texto
  text: {
    fontWeight: fonts.bold,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  dangerText: {
    color: colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.white,
  },
});
