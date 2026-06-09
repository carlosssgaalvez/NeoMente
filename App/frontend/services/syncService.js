import NetInfo from '@react-native-community/netinfo';
import { getAccessToken } from '../utils/storage';
import { getUnsyncedResultados, markResultadoSynced, importRemoteResultados, getJuegosLocal, insertJuegos, getPendingActions, clearPendingAction } from '../database/localDB';
import * as gameAPI from '../api/gameServices';

let syncInProgress = false;
let listeners = [];

function addSyncListener(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

function notifyListeners(status) {
  listeners.forEach((fn) => fn(status));
}

async function isOnline() {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
}

async function isAuthenticated() {
  const token = await getAccessToken();
  return !!token;
}

async function syncToServer() {
  if (syncInProgress) return { synced: 0, error: null };
  syncInProgress = true;
  notifyListeners('syncing');

  try {
    const online = await isOnline();
    const authenticated = await isAuthenticated();

    if (!online || !authenticated) {
      syncInProgress = false;
      notifyListeners('idle');
      return { synced: 0, error: null };
    }

    await processPendingActions();

    const unsynced = await getUnsyncedResultados();
    if (unsynced.length === 0) {
      syncInProgress = false;
      notifyListeners('synced');
      return { synced: 0, error: null };
    }

    let syncedCount = 0;
    for (const resultado of unsynced) {
      try {
        const remote = await gameAPI.guardarResultado({
          juego_id: resultado.juego_id,
          puntuacion: resultado.puntuacion,
          duracion_segundos: resultado.duracion_segundos,
          nivel_dificultad: resultado.nivel_dificultad,
        });
        await markResultadoSynced(resultado.id, remote.id);
        syncedCount++;
      } catch {
        break;
      }
    }

    notifyListeners(syncedCount > 0 ? 'synced' : 'error');
    return { synced: syncedCount, error: null };
  } catch (err) {
    notifyListeners('error');
    return { synced: 0, error: err.message };
  } finally {
    syncInProgress = false;
  }
}

const ACTION_HANDLERS = {
  DELETE_STATS: () => gameAPI.borrarEstadisticas(),
};

async function processPendingActions() {
  const actions = await getPendingActions();
  for (const action of actions) {
    const handler = ACTION_HANDLERS[action.action];
    if (!handler) {
      await clearPendingAction(action.id);
      continue;
    }
    try {
      await handler(action.payload);
      await clearPendingAction(action.id);
    } catch {
      break;
    }
  }
}

async function syncFromServer() {
  try {
    const online = await isOnline();
    const authenticated = await isAuthenticated();
    if (!online || !authenticated) return;

    try {
      const remotos = await gameAPI.getJuegos();
      if (remotos && remotos.length > 0) {
        await insertJuegos(remotos);
      }
    } catch (err) {
      console.log('[Sync] Error fetching juegos from server:', err.message);
    }

    const juegos = await getJuegosLocal();
    for (const juego of juegos) {
      try {
        const remoteResults = await gameAPI.getResultadosPorJuego(juego.id);
        if (remoteResults && remoteResults.length > 0) {
          await importRemoteResultados(remoteResults, juego.id);
        }
      } catch {
        // 404 = sin resultados para ese juego, ignorar
      }
    }
  } catch {
    // Error de sincronización descendente, se reintentará
  }
}

async function fullSync() {
  await syncFromServer();
  await syncToServer();
}

let unsubscribeNetInfo = null;

function startAutoSync() {
  if (unsubscribeNetInfo) return;

  unsubscribeNetInfo = NetInfo.addEventListener(async (state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      await syncToServer();
    }
  });
}

function stopAutoSync() {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}

export {
  isOnline,
  syncToServer,
  syncFromServer,
  fullSync,
  startAutoSync,
  stopAutoSync,
  addSyncListener,
};
