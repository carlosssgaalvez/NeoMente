import client from './client';

/**
 * Obtiene el catálogo de juegos desde el backend.
 * @returns {Promise<Array>} Lista de juegos disponibles.
 */
export const getJuegos = async () => {
  const response = await client.get('/juegos/');
  return response.data;
};

/**
 * Obtiene los detalles de un juego específico.
 * @param {number} juegoId - ID del juego.
 * @returns {Promise<Object>} Datos del juego.
 */
export const getJuego = async (juegoId) => {
  const response = await client.get(`/juegos/${juegoId}`);
  return response.data;
};

/**
 * Guarda el resultado de un ejercicio (requiere token).
 * @param {Object} resultado - { juego_id, puntuacion, duracion_segundos, nivel_dificultad }
 * @returns {Promise<Object>} Resultado guardado.
 */
export const guardarResultado = async (resultado) => {
  const response = await client.post('/resultados/', resultado);
  return response.data;
};

/**
 * Obtiene el nivel recomendado para el siguiente ejercicio.
 * @param {number} juegoId - ID del juego.
 * @returns {Promise<Object>} { nivel_recomendado }
 */
export const getProximoNivel = async (juegoId) => {
  const response = await client.get(`/resultados/proximo-nivel/${juegoId}`);
  return response.data;
};

/**
 * Obtiene los resultados del usuario en un juego específico.
 * @param {number} juegoId - ID del juego.
 * @returns {Promise<Array>} Lista de resultados.
 */
export const getResultadosPorJuego = async (juegoId) => {
  const response = await client.get(`/resultados/juego/${juegoId}`);
  return response.data;
};

/**
 * Obtiene las estadísticas del usuario en todos los juegos.
 * @returns {Promise<Object>} Estadísticas agrupadas por juego.
 */
export const getEstadisticas = async () => {
  const response = await client.get('/resultados/estadisticas');
  return response.data;
};

/**
 * Elimina todas las estadísticas del usuario autenticado.
 * @returns {Promise<Object>} Mensaje de confirmación.
 */
export const borrarEstadisticas = async () => {
  const response = await client.delete('/resultados/estadisticas');
  return response.data;
};
