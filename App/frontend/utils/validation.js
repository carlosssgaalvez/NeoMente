export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida complejidad de contraseña: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número.
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const isValidPassword = (password) => {
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
};

export const isValidUsername = (username) => {
  return username.length >= 3 && username.length <= 50;
};
