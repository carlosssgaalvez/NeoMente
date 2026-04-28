import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { useFonts } from '../hooks/useFonts';

/**
 * Tarjeta contenedora reutilizable con fondo blanco y sombra sutil.
 * Diseñada con bordes redondeados grandes para accesibilidad visual.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido de la tarjeta.
 * @param {Object} [props.style] - Estilos adicionales opcionales.
 */
export default function Card({ children, style }) {
  const f = useFonts();
  const s = f.s;

  return (
    <View
      style={[
        styles.card,
        { borderRadius: s(24), paddingVertical: s(40), paddingHorizontal: s(30), marginHorizontal: s(24) },
        style,
      ]}
      accessibilityRole="summary"
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
