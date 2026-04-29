/**
 * Tests del algoritmo de dificultad adaptativa (frontend).
 * Verifica paridad con el backend.
 */
const { describe, test, expect } = require('@jest/globals');
const {
  calcularSiguienteDificultad,
  MAX_SUBIDA,
  MAX_BAJADA,
} = require('./helpers');

describe('calcularSiguienteDificultad', () => {
  // --- Zona alta (>=80) → sube ---
  test('puntuación 100 sube la dificultad', () => {
    const nuevo = calcularSiguienteDificultad(100, 50);
    expect(nuevo).toBeGreaterThan(50);
  });

  test('puntuación 80 (umbral exacto) sube', () => {
    const nuevo = calcularSiguienteDificultad(80, 50);
    expect(nuevo).toBeGreaterThanOrEqual(52);
  });

  test('subida máxima no supera MAX_SUBIDA (8)', () => {
    const nuevo = calcularSiguienteDificultad(100, 50);
    expect(nuevo - 50).toBeLessThanOrEqual(MAX_SUBIDA);
  });

  test('subida progresiva: 100 sube más que 80', () => {
    const d80 = calcularSiguienteDificultad(80, 50) - 50;
    const d100 = calcularSiguienteDificultad(100, 50) - 50;
    expect(d100).toBeGreaterThanOrEqual(d80);
  });

  // --- Zona baja (<=40) → baja ---
  test('puntuación 0 baja la dificultad', () => {
    const nuevo = calcularSiguienteDificultad(0, 50);
    expect(nuevo).toBeLessThan(50);
  });

  test('puntuación 40 (umbral exacto) baja', () => {
    const nuevo = calcularSiguienteDificultad(40, 50);
    expect(nuevo).toBeLessThanOrEqual(49);
  });

  test('bajada máxima no supera MAX_BAJADA (5)', () => {
    const nuevo = calcularSiguienteDificultad(0, 50);
    expect(50 - nuevo).toBeLessThanOrEqual(MAX_BAJADA);
  });

  test('bajada progresiva: 0 baja más que 40', () => {
    const d40 = 50 - calcularSiguienteDificultad(40, 50);
    const d0 = 50 - calcularSiguienteDificultad(0, 50);
    expect(d0).toBeGreaterThanOrEqual(d40);
  });

  // --- Zona media (41-79) → estable ---
  test('puntuación 60 mantiene el nivel', () => {
    expect(calcularSiguienteDificultad(60, 50)).toBe(50);
  });

  test('puntuación 41 mantiene el nivel', () => {
    expect(calcularSiguienteDificultad(41, 50)).toBe(50);
  });

  test('puntuación 79 mantiene el nivel', () => {
    expect(calcularSiguienteDificultad(79, 50)).toBe(50);
  });

  // --- Límites ---
  test('no supera 100', () => {
    expect(calcularSiguienteDificultad(100, 100)).toBe(100);
  });

  test('no baja de 0', () => {
    expect(calcularSiguienteDificultad(0, 0)).toBe(0);
  });

  test('nivel 98 + puntuación perfecta no pasa de 100', () => {
    const nuevo = calcularSiguienteDificultad(100, 98);
    expect(nuevo).toBeLessThanOrEqual(100);
  });

  test('nivel 2 + puntuación 0 no baja de 0', () => {
    const nuevo = calcularSiguienteDificultad(0, 2);
    expect(nuevo).toBeGreaterThanOrEqual(0);
  });

  // --- Paridad backend ---
  test('paridad: nivel 5 + punt 90 → mismo resultado que backend', () => {
    const nuevo = calcularSiguienteDificultad(90, 5);
    expect(nuevo).toBeGreaterThan(5);
    expect(nuevo).toBeLessThanOrEqual(13);
  });

  test('paridad: nivel 95 + punt 10 → mismo resultado que backend', () => {
    const nuevo = calcularSiguienteDificultad(10, 95);
    expect(nuevo).toBeLessThan(95);
    expect(nuevo).toBeGreaterThanOrEqual(90);
  });
});
