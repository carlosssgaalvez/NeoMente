import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'userData';
const GUEST_ID_KEY = 'guestUserId';
const GUEST_REFRESH_KEY = 'guestRefreshToken';

/**
 * Guarda los tokens de acceso y refresco de forma cifrada.
 * @param {string} accessToken - Token de acceso JWT.
 * @param {string} refreshToken - Token de refresco JWT.
 */
export const saveTokens = async (accessToken, refreshToken) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const removeTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const saveUser = async (user) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const data = await SecureStore.getItemAsync(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const removeUser = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

/**
 * Limpia la sesión activa (tokens + usuario) pero NO borra los datos
 * del invitado para poder restaurarlos o convertirlos más adelante.
 */
export const clearAll = async () => {
  await removeTokens();
  await removeUser();
};

// --- Persistencia de datos del invitado (sobrevive al logout) ---

/**
 * Guarda el ID y el refresh token del invitado para poder
 * restaurar la sesión o convertir la cuenta en el futuro.
 */
export const saveGuestData = async (guestId, refreshToken) => {
  await SecureStore.setItemAsync(GUEST_ID_KEY, String(guestId));
  await SecureStore.setItemAsync(GUEST_REFRESH_KEY, refreshToken);
};

export const getGuestId = async () => {
  const id = await SecureStore.getItemAsync(GUEST_ID_KEY);
  return id ? parseInt(id, 10) : null;
};

export const getGuestRefreshToken = async () => {
  return await SecureStore.getItemAsync(GUEST_REFRESH_KEY);
};

/**
 * Limpia los datos persistentes del invitado (al convertir o al iniciar sesión).
 */
export const clearGuestData = async () => {
  await SecureStore.deleteItemAsync(GUEST_ID_KEY);
  await SecureStore.deleteItemAsync(GUEST_REFRESH_KEY);
};

// --- Preferencias de usuario (ajustes) ---
const SETTINGS_KEY = 'userSettings';

export const saveSettings = async (settings) => {
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = async () => {
  const data = await SecureStore.getItemAsync(SETTINGS_KEY);
  return data ? JSON.parse(data) : null;
};

export const removeSettings = async () => {
  await SecureStore.deleteItemAsync(SETTINGS_KEY);
};
