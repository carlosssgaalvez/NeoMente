/**
 * Tests de las funciones de clampeo (lógica de insertResultado).
 */
const { describe, test, expect } = require('@jest/globals');
const { clampPuntuacion, clampNivel } = require('./helpers');

describe('clampPuntuacion', () => {
  test('valor dentro de rango queda igual', () => {
    expect(clampPuntuacion(75)).toBe(75);
  });

  test('valor 0 queda 0', () => {
    expect(clampPuntuacion(0)).toBe(0);
  });

  test('valor 100 queda 100', () => {
    expect(clampPuntuacion(100)).toBe(100);
  });

  test('valor >100 se clampea a 100', () => {
    expect(clampPuntuacion(150)).toBe(100);
  });

  test('valor negativo se clampea a 0', () => {
    expect(clampPuntuacion(-10)).toBe(0);
  });

  test('null se trata como 0', () => {
    expect(clampPuntuacion(null)).toBe(0);
  });

  test('undefined se trata como 0', () => {
    expect(clampPuntuacion(undefined)).toBe(0);
  });
});

describe('clampNivel', () => {
  test('valor dentro de rango queda igual', () => {
    expect(clampNivel(50)).toBe(50);
  });

  test('valor >100 se clampea a 100', () => {
    expect(clampNivel(200)).toBe(100);
  });

  test('valor negativo se clampea a 0', () => {
    expect(clampNivel(-5)).toBe(0);
  });

  test('null se trata como 0', () => {
    expect(clampNivel(null)).toBe(0);
  });
});
