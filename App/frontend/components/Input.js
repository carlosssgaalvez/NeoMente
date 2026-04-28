import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useFonts } from '../hooks/useFonts';

/**
 * Campo de texto reutilizable con etiqueta visible encima.
 * Accesibilidad: la etiqueta siempre es visible para que el usuario
 * sepa qué dato se espera, incluso mientras escribe.
 * @param {Object} props
 * @param {string} props.label - Etiqueta visible sobre el campo.
 * @param {string} [props.placeholder] - Texto de placeholder (opcional).
 * @param {string} props.value - Valor actual.
 * @param {Function} props.onChangeText - Callback al cambiar texto.
 * @param {boolean} [props.secureTextEntry=false] - Ocultar texto (contraseñas).
 * @param {string} [props.keyboardType='default'] - Tipo de teclado.
 * @param {string} [props.error] - Mensaje de error a mostrar bajo el campo.
 */
export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  onFocus,
  onBlur,
}) {
  const f = useFonts();
  const s = f.s;

  return (
    <View style={[styles.container, { marginBottom: s(20) }]}>
      {label ? (
        <Text style={[styles.label, { fontSize: f.small, marginBottom: s(6) }]} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          { fontSize: f.body, borderRadius: s(12), paddingHorizontal: s(18), paddingVertical: s(16) },
          error ? styles.inputError : null,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        accessibilityLabel={label || placeholder}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {error ? (
        <Text style={[styles.errorText, { fontSize: f.small, marginTop: s(6) }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: fonts.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: fonts.small,
    color: colors.danger,
    marginTop: 6,
    fontWeight: fonts.semibold,
  },
});
