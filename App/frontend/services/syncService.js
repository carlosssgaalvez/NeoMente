import NetInfo from '@react-native-community/netinfo';
import { getAccessToken } from '../utils/storage';
import { getUnsyncedResultados, markResultadoSynced, importRemoteResultados, getJuegosLocal, insertJuegos } from '../database/localDB';
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
  return state.isConnected && state.isInternetReachable !== false;
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
      } catch (err) {
        console.log('[Sync] Error uploading resultado:', resultado.id, err.message);
        break;
      }
    }

    notifyListeners(syncedCount > 0 ? 'synced' : 'error');
    return { synced: syncedCount, error: null };
  } catch (err) {
    console.log('[Sync] Unexpected error:', err.message);
    notifyListeners('error');
    return { synced: 0, error: err.message };
  } finally {
    syncInProgress = false;
  }
}

async function syncFromServer() {
  try {
    const online = await isOnline();
    const authenticated = await isAuthenticated();
    if (!online || !authenticated) return;

    const juegosLocales = await getJuegosLocal();
    if (juegosLocales.length === 0) {
      try {
        const remotos = await gameAPI.getJuegos();
        await insertJuegos(remotos);
      } catch (err) {
        console.log('[Sync] Error fetching juegos from server:', err.message);
      }
    }

    const juegos = await getJuegosLocal();
    for (const juego of juegos) {
      try {
        const remoteResults = await gameAPI.getResultadosPorJuego(juego.id);
        if (remoteResults && remoteResults.length > 0) {
          await importRemoteResultados(remoteResults, juego.id);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log('[Sync] Error importing results for juego', juego.id, err.message);
        }
      }
    }
  } catch (err) {
    console.log('[Sync] syncFromServer error:', err.message);
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
      console.log('[Sync] Connection detected, starting sync...');
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
