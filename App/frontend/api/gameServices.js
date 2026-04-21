import client from './client';

/**
 * Obtiene el catálogo de juegos desde el backend
 */
export const getJuegos = async () => {
  try {
    const response = await client.get('/juegos');
    return response.data; // Devuelve el JSON con los juegos
  } catch (error) {
    console.error("Error al obtener el catálogo:", error);
    throw error;
  }
};