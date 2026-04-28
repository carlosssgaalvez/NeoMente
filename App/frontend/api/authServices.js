import client from './client';

/**
 * Inicia sesión y devuelve tokens + usuario_id.
 * @param {string} usuario - Nombre de usuario.
 * @param {string} password - Contraseña.
 * @returns {Promise<Object>} { access_token, refresh_token, token_type, usuario_id }
 */
export const login = async (usuario, password) => {
  const response = await client.post('/usuarios/login', { usuario, password });
  return response.data;
};

/**
 * Registra un nuevo usuario.
 * @param {string} nombre - Nombre completo.
 * @param {string} usuario - Nombre de usuario.
 * @param {string} password - Contraseña.
 * @returns {Promise<Object>} Datos del usuario creado.
 */
export const registro = async (nombre, usuario, password) => {
  const response = await client.post('/usuarios/registro', {
    nombre,
    usuario,
    password,
    es_invitado: false,
  });
  return response.data;
};

/**
 * Crea un perfil invitado (sin credenciales).
 * @returns {Promise<Object>} Datos del usuario invitado creado.
 */
export const crearInvitado = async () => {
  const response = await client.post('/usuarios/invitado');
  return response.data;
};

/**
 * Obtiene el perfil del usuario autenticado.
 * @returns {Promise<Object>} Datos del perfil.
 */
export const getPerfil = async () => {
  const response = await client.get('/usuarios/perfil');
  return response.data;
};

/**
 * Convierte un perfil invitado en usuario registrado.
 * @param {string} nombre - Nombre completo.
 * @param {string} usuario - Nombre de usuario deseado.
 * @param {string} password - Contraseña.
 * @returns {Promise<Object>} Datos del usuario convertido.
 */
export const convertirInvitado = async (nombre, usuario, password) => {
  const response = await client.post('/usuarios/convertir', { nombre, usuario, password });
  return response.data;
};

/**
 * Actualiza el perfil del usuario (nombre y/o usuario).
 * @param {{ nombre?: string, usuario?: string }} datos
 * @returns {Promise<Object>} Datos del usuario actualizado.
 */
export const actualizarPerfil = async (datos) => {
  const response = await client.put('/usuarios/perfil', datos);
  return response.data;
};

/**
 * Cambia la contraseña del usuario autenticado.
 * @param {string} passwordActual - Contraseña actual.
 * @param {string} passwordNueva - Nueva contraseña.
 * @returns {Promise<Object>} Mensaje de confirmación.
 */
export const cambiarPassword = async (passwordActual, passwordNueva) => {
  const response = await client.put('/usuarios/cambiar-password', {
    password_actual: passwordActual,
    password_nueva: passwordNueva,
  });
  return response.data;
};

/**
 * Elimina un usuario invitado por su ID (requiere autenticación).
 * @param {number} guestId - ID del usuario invitado a eliminar.
 * @returns {Promise<Object>} Mensaje de confirmación.
 */
export const eliminarInvitado = async (guestId) => {
  const response = await client.delete(`/usuarios/invitado/${guestId}`);
  return response.data;
};

/**
 * Refresca los tokens de acceso.
 * @param {string} refreshToken - Token de refresco actual.
 * @returns {Promise<Object>} { access_token, refresh_token, token_type, usuario_id }
 */
export const refreshTokens = async (refreshToken) => {
  const response = await client.post('/usuarios/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
};

/**
 * Elimina la cuenta del usuario autenticado y todos sus datos.
 * @returns {Promise<Object>} Mensaje de confirmación.
 */
export const eliminarCuenta = async () => {
  const response = await client.delete('/usuarios/cuenta');
  return response.data;
};
