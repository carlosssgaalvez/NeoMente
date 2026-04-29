/**
 * Tests de validación de entrada (email, password, username).
 */
const { describe, test, expect } = require('@jest/globals');
const { isValidEmail, isValidPassword, isValidUsername } = require('./helpers');

describe('isValidEmail', () => {
  test('acepta email válido', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  test('acepta email con subdominio', () => {
    expect(isValidEmail('a@b.co.uk')).toBe(true);
  });

  test('rechaza email sin @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  test('rechaza email sin dominio', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  test('rechaza email con espacios', () => {
    expect(isValidEmail('user @mail.com')).toBe(false);
  });

  test('rechaza string vacío', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  test('acepta contraseña válida', () => {
    const result = isValidPassword('TestPass1');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  test('rechaza contraseña corta (<8)', () => {
    const result = isValidPassword('Te1');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('8 caracteres');
  });

  test('rechaza contraseña sin mayúscula', () => {
    const result = isValidPassword('testpass1');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('mayúscula');
  });

  test('rechaza contraseña sin minúscula', () => {
    const result = isValidPassword('TESTPASS1');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('minúscula');
  });

  test('rechaza contraseña sin número', () => {
    const result = isValidPassword('TestPasss');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('número');
  });

  test('acepta contraseña con exactamente 8 caracteres', () => {
    const result = isValidPassword('Abcdefg1');
    expect(result.valid).toBe(true);
  });

  test('acepta contraseña larga', () => {
    const result = isValidPassword('AbCdEfGh1234567890!@#');
    expect(result.valid).toBe(true);
  });

  test('rechaza string vacío', () => {
    const result = isValidPassword('');
    expect(result.valid).toBe(false);
  });
});

describe('isValidUsername', () => {
  test('acepta username de 3 caracteres', () => {
    expect(isValidUsername('abc')).toBe(true);
  });

  test('acepta username de 50 caracteres', () => {
    expect(isValidUsername('a'.repeat(50))).toBe(true);
  });

  test('rechaza username de 2 caracteres', () => {
    expect(isValidUsername('ab')).toBe(false);
  });

  test('rechaza username de 51 caracteres', () => {
    expect(isValidUsername('a'.repeat(51))).toBe(false);
  });

  test('rechaza string vacío', () => {
    expect(isValidUsername('')).toBe(false);
  });

  test('acepta username con números', () => {
    expect(isValidUsername('user123')).toBe(true);
  });

  test('acepta username con caracteres especiales', () => {
    expect(isValidUsername('mi_usuario.test')).toBe(true);
  });
});
