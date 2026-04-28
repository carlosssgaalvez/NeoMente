import { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { scale } from '../utils/responsive';

const fallback = {
  ...require('../constants/fonts').fonts,
  s: scale,
};

/**
 * Hook que devuelve las fuentes escaladas y la función de escala dimensional.
 * Combina la escala del sistema (accesibilidad del SO) + la preferencia del usuario.
 * Incluye f.s(valor) para escalar dimensiones proporcionalmente a la pantalla.
 * @returns {{ h1: number, h2: number, body: number, small: number, bold: string, semibold: string, normal: string, s: function }}
 */
export function useFonts() {
  const ctx = useContext(SettingsContext);
  return ctx?.scaledFonts || fallback;
}
