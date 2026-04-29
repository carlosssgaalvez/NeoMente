import * as localDB from '../database/localDB';
import * as gameAPI from '../api/gameServices';
import { isOnline, syncToServer } from './syncService';
import { getAccessToken } from '../utils/storage';
import { getUsuarioLocal } from '../database/localDB';

async function isGuest() {
  const u = await getUsuarioLocal();
  return !u || u.es_invitado;
}

async function isRegisteredAndOnline() {
  const guest = await isGuest();
  if (guest) return false;
  const online = await isOnline();
  const token = await getAccessToken();
  return online && !!token;
}

async function getJuegos() {
  const locales = await localDB.getJuegosLocal();
  if (locales.length > 0) return locales;

  const guest = await isGuest();
  if (!guest) {
    try {
      const remotos = await gameAPI.getJuegos();
      await localDB.insertJuegos(remotos);
      return remotos;
    } catch {
      return locales;
    }
  }

  return locales;
}

async function guardarResultado(resultado) {
  const local = await localDB.insertResultado({
    ...resultado,
    synced: 0,
  });

  const guest = await isGuest();
  if (!guest) {
    try {
      const canSync = await isRegisteredAndOnline();
      if (canSync) {
        const remote = await gameAPI.guardarResultado(resultado);
        await localDB.markResultadoSynced(local.id, remote.id);
        return remote;
      }
    } catch {
      // Queda encolado localmente para sincronizar después
    }
  }

  return local;
}

async function getEstadisticas() {
  const guest = await isGuest();
  if (guest) {
    return await localDB.getEstadisticasLocal();
  }

  try {
    const canSync = await isRegisteredAndOnline();
    if (canSync) {
      await syncToServer();
      const remote = await gameAPI.getEstadisticas();
      return remote;
    }
  } catch {
    // Fallo remoto, usar datos locales
  }

  return await localDB.getEstadisticasLocal();
}

async function getProximoNivel(juegoId) {
  return await localDB.getProximoNivelLocal(juegoId);
}

async function getResultadosPorJuego(juegoId) {
  const guest = await isGuest();
  if (guest) {
    return await localDB.getResultadosPorJuegoLocal(juegoId);
  }

  try {
    const canSync = await isRegisteredAndOnline();
    if (canSync) {
      return await gameAPI.getResultadosPorJuego(juegoId);
    }
  } catch {
    // Fallo remoto, usar datos locales
  }

  return await localDB.getResultadosPorJuegoLocal(juegoId);
}

async function borrarEstadisticas() {
  await localDB.clearResultadosLocal();

  const guest = await isGuest();
  if (!guest) {
    try {
      const canSync = await isRegisteredAndOnline();
      if (canSync) {
        await gameAPI.borrarEstadisticas();
      } else {
        await localDB.queuePendingAction('DELETE_STATS', null);
      }
    } catch {
      await localDB.queuePendingAction('DELETE_STATS', null);
    }
  }
}

export {
  getJuegos,
  guardarResultado,
  getEstadisticas,
  getProximoNivel,
  getResultadosPorJuego,
  borrarEstadisticas,
};
