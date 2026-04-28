import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Referencia: iPhone 15 (393 x 852 puntos lógicos)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * Escala un valor proporcional al ancho de pantalla respecto al iPhone 15.
 * Usa factor moderado (0.5) para que el efecto no sea demasiado agresivo.
 * @param {number} size - Valor en puntos diseñado para iPhone 15.
 * @param {number} [factor=0.5] - Factor de moderación (0 = sin escalar, 1 = escalar completo).
 * @returns {number} Valor escalado redondeado.
 */
export function scale(size, factor = 0.5) {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  const scaled = size + (size * (ratio - 1)) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

/**
 * Escala un valor proporcional a la altura de pantalla.
 * Útil para padding vertical y espaciados que dependen del alto.
 * @param {number} size - Valor en puntos.
 * @param {number} [factor=0.5] - Factor de moderación.
 * @returns {number}
 */
export function verticalScale(size, factor = 0.5) {
  const ratio = SCREEN_HEIGHT / BASE_HEIGHT;
  const scaled = size + (size * (ratio - 1)) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

/**
 * Devuelve el factor de escala de fuente del sistema (Accesibilidad del SO).
 * @returns {number} Factor (1.0 = normal, >1.0 = texto grande en ajustes del SO)
 */
export function getSystemFontScale() {
  return PixelRatio.getFontScale();
}

/**
 * Ancho y alto de pantalla para cálculos relativos.
 */
export const SCREEN = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };
