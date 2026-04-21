import axios from 'axios';

// Cambiamos según la IP que se esté usando en ese momento (.104)
const API_URL = 'http://192.168.68.104:8000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para errores globales (Opcional pero recomendado)
 * Te avisará en la consola si el servidor está caído o la IP ha cambiado.
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("❌ Error de red: El servidor no responde. ¿Está encendido el Mac y es la IP correcta?");
    }
    return Promise.reject(error);
  }
);

export default client;