import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export default function Button({ title, onPress, variant = 'primary' }) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 20,        // Aumentado de 14
    paddingHorizontal: 20,
    borderRadius: 12,           // Esquinas más redondeadas
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,         // Aumentado de 10
    minHeight: 60,              // Altura mínima para dedos grandes
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: {
    fontSize: fonts.body,       // 20px
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
});