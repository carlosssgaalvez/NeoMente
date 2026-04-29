/**
 * Funciones puras extraídas para testing (sin dependencias de Expo/RN).
 * Estas funciones son copias exactas de las usadas en la app.
 */

// ======================== VALIDACIÓN ========================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Debe contener al menos una mayúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Debe contener al menos una minúscula' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Debe contener al menos un número' };
  }
  return { valid: true, message: '' };
}

function isValidUsername(username) {
  return username.length >= 3 && username.length <= 50;
}

// ======================== DIFICULTAD ADAPTATIVA ========================

const MIN_DIFICULTAD = 0;
const MAX_DIFICULTAD = 100;
const MAX_SUBIDA = 8;
const MAX_BAJADA = 5;
const UMBRAL_ALTO = 80;
const UMBRAL_BAJO = 40;

function calcularSiguienteDificultad(puntuacion, nivelActual) {
  let delta;
  if (puntuacion >= UMBRAL_ALTO) {
    const factor = (puntuacion - UMBRAL_ALTO) / (100 - UMBRAL_ALTO);
    delta = Math.round(2 + factor * (MAX_SUBIDA - 2));
  } else if (puntuacion <= UMBRAL_BAJO) {
    const factor = (UMBRAL_BAJO - puntuacion) / UMBRAL_BAJO;
    delta = -Math.round(1 + factor * (MAX_BAJADA - 1));
  } else {
    delta = 0;
  }
  const nuevo = nivelActual + delta;
  return Math.max(MIN_DIFICULTAD, Math.min(MAX_DIFICULTAD, nuevo));
}

// ======================== CLAMP (insertResultado logic) ========================

function clampPuntuacion(value) {
  return Math.max(0, Math.min(100, value || 0));
}

function clampNivel(value) {
  return Math.max(0, Math.min(100, value || 0));
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  calcularSiguienteDificultad,
  clampPuntuacion,
  clampNivel,
  MIN_DIFICULTAD,
  MAX_DIFICULTAD,
  MAX_SUBIDA,
  MAX_BAJADA,
  UMBRAL_ALTO,
  UMBRAL_BAJO,
};
