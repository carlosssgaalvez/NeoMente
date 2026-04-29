import * as SQLite from 'expo-sqlite';

let db = null;
let tablesCreated = false;

async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('neomente_local.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }
  if (!tablesCreated) {
    await createTables(db);
    tablesCreated = true;
  }
  return db;
}

async function createTables(database) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS juegos (
      id INTEGER PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      area_cognitiva TEXT NOT NULL,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS resultados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      juego_id INTEGER NOT NULL,
      puntuacion REAL NOT NULL,
      duracion_segundos INTEGER NOT NULL,
      nivel_dificultad INTEGER DEFAULT 0,
      fecha_realizacion TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      remote_id INTEGER,
      FOREIGN KEY (juego_id) REFERENCES juegos(id)
    );

    CREATE TABLE IF NOT EXISTS usuario_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id INTEGER,
      nombre TEXT,
      usuario TEXT,
      es_invitado INTEGER DEFAULT 1,
      fecha_registro TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed de juegos si la tabla está vacía
  const count = await database.getFirstAsync('SELECT COUNT(*) as c FROM juegos');
  if (!count || count.c === 0) {
    const seed = [
      [1, 'Jardín de la Memoria', 'Memoria', 'Memoriza y reproduce secuencias de flores en el jardín.'],
      [2, 'El Mercado', 'Memoria', 'Recuerda la lista de la compra y selecciona los productos correctos.'],
      [3, 'La Receta de la Abuela', 'Memoria', 'Memoriza los ingredientes y pasos de una receta.'],
      [4, 'El Semáforo', 'Atención', 'Responde rápidamente al color correcto del semáforo.'],
      [5, 'Cazamariposas', 'Atención', 'Atrapa las mariposas del color indicado.'],
      [6, 'El Vigilante', 'Atención', 'Detecta los cambios en la escena observada.'],
      [7, 'Refranes Perdidos', 'Lenguaje', 'Completa los refranes con la palabra correcta.'],
      [8, 'La Oveja Perdida', 'Lenguaje', 'Encuentra la palabra que no pertenece al grupo.'],
      [9, 'El Reloj de Letras', 'Lenguaje', 'Forma palabras con las letras disponibles antes de que se agote el tiempo.'],
    ];
    for (const [id, nombre, area, desc] of seed) {
      await database.runAsync(
        'INSERT OR IGNORE INTO juegos (id, nombre, area_cognitiva, descripcion) VALUES (?, ?, ?, ?)',
        [id, nombre, area, desc]
      );
    }
  }
}

// ======================== JUEGOS ========================

async function insertJuegos(juegos) {
  const database = await getDB();
  for (const j of juegos) {
    await database.runAsync(
      `INSERT OR REPLACE INTO juegos (id, nombre, area_cognitiva, descripcion) VALUES (?, ?, ?, ?)`,
      [j.id, j.nombre, j.area_cognitiva, j.descripcion || '']
    );
  }
}

async function getJuegosLocal() {
  const database = await getDB();
  return await database.getAllAsync('SELECT * FROM juegos ORDER BY area_cognitiva, nombre');
}

async function getJuegoLocal(juegoId) {
  const database = await getDB();
  return await database.getFirstAsync('SELECT * FROM juegos WHERE id = ?', [juegoId]);
}

// ======================== RESULTADOS ========================

async function insertResultado(resultado) {
  const database = await getDB();
  const fecha = resultado.fecha_realizacion || new Date().toISOString();
  const nivelClamped = Math.max(0, Math.min(100, resultado.nivel_dificultad || 0));
  const puntuacionClamped = Math.max(0, Math.min(100, resultado.puntuacion || 0));
  const res = await database.runAsync(
    `INSERT INTO resultados (juego_id, puntuacion, duracion_segundos, nivel_dificultad, fecha_realizacion, synced)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      resultado.juego_id,
      puntuacionClamped,
      resultado.duracion_segundos,
      nivelClamped,
      fecha,
      resultado.synced || 0,
    ]
  );
  return { id: res.lastInsertRowId, ...resultado, puntuacion: puntuacionClamped, nivel_dificultad: nivelClamped, fecha_realizacion: fecha };
}

async function getResultadosPorJuegoLocal(juegoId) {
  const database = await getDB();
  return await database.getAllAsync(
    'SELECT * FROM resultados WHERE juego_id = ? ORDER BY fecha_realizacion DESC',
    [juegoId]
  );
}

async function getEstadisticasLocal() {
  const database = await getDB();

  const juegos = await database.getAllAsync('SELECT * FROM juegos');
  const resultados = await database.getAllAsync(
    'SELECT * FROM resultados ORDER BY fecha_realizacion DESC'
  );

  if (resultados.length === 0) return [];

  const porJuego = {};
  for (const r of resultados) {
    if (!porJuego[r.juego_id]) porJuego[r.juego_id] = [];
    porJuego[r.juego_id].push(r);
  }

  const juegosMap = {};
  for (const j of juegos) juegosMap[j.id] = j;

  const estadisticas = [];
  for (const [juegoId, results] of Object.entries(porJuego)) {
    const juego = juegosMap[juegoId];
    if (!juego) continue;

    estadisticas.push({
      juego_id: Number(juegoId),
      nombre_juego: juego.nombre,
      area_cognitiva: juego.area_cognitiva,
      resultados: results.map((r) => ({
        puntuacion: r.puntuacion,
        duracion_segundos: r.duracion_segundos,
        nivel_dificultad: r.nivel_dificultad,
        fecha: r.fecha_realizacion,
      })),
    });
  }

  return estadisticas;
}

const MIN_DIFICULTAD = 0;
const MAX_DIFICULTAD = 100;
const MAX_SUBIDA = 8;
const MAX_BAJADA = 5;
const UMBRAL_ALTO = 80;
const UMBRAL_BAJO = 40;

function calcularSiguienteDificultad(puntuacion, nivelActual) {
  let delta;
  if (puntuacion >= UMBRAL_ALTO) {
    const factor = (puntuacion - UMBRAL_ALTO) / (100 - UMBRAL_ALTO);
    delta = Math.round(2 + factor * (MAX_SUBIDA - 2));
  } else if (puntuacion <= UMBRAL_BAJO) {
    const factor = (UMBRAL_BAJO - puntuacion) / UMBRAL_BAJO;
    delta = -Math.round(1 + factor * (MAX_BAJADA - 1));
  } else {
    delta = 0;
  }
  const nuevo = nivelActual + delta;
  return Math.max(MIN_DIFICULTAD, Math.min(MAX_DIFICULTAD, nuevo));
}

async function getProximoNivelLocal(juegoId) {
  const database = await getDB();
  const ultimo = await database.getFirstAsync(
    'SELECT puntuacion, nivel_dificultad FROM resultados WHERE juego_id = ? ORDER BY fecha_realizacion DESC LIMIT 1',
    [juegoId]
  );

  if (!ultimo) return { nivel_recomendado: 0 };

  const recomendado = calcularSiguienteDificultad(ultimo.puntuacion, ultimo.nivel_dificultad);
  return { nivel_recomendado: recomendado };
}

// ======================== SYNC QUEUE ========================

async function getUnsyncedResultados() {
  const database = await getDB();
  return await database.getAllAsync(
    'SELECT * FROM resultados WHERE synced = 0 ORDER BY fecha_realizacion ASC'
  );
}

async function markResultadoSynced(localId, remoteId) {
  const database = await getDB();
  await database.runAsync(
    'UPDATE resultados SET synced = 1, remote_id = ? WHERE id = ?',
    [remoteId, localId]
  );
}

async function markAllSynced(syncedPairs) {
  const database = await getDB();
  for (const { localId, remoteId } of syncedPairs) {
    await database.runAsync(
      'UPDATE resultados SET synced = 1, remote_id = ? WHERE id = ?',
      [remoteId, localId]
    );
  }
}

async function importRemoteResultados(resultados, juegoId) {
  const database = await getDB();
  for (const r of resultados) {
    const exists = await database.getFirstAsync(
      'SELECT id FROM resultados WHERE remote_id = ?',
      [r.id]
    );
    if (!exists) {
      await database.runAsync(
        `INSERT INTO resultados (juego_id, puntuacion, duracion_segundos, nivel_dificultad, fecha_realizacion, synced, remote_id)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [juegoId, r.puntuacion, r.duracion_segundos, r.nivel_dificultad || 0, r.fecha_realizacion, r.id]
      );
    }
  }
}

// ======================== USUARIO LOCAL ========================

async function saveUsuarioLocal(userData) {
  const database = await getDB();
  await database.execAsync('BEGIN');
  try {
    await database.runAsync('DELETE FROM usuario_local');
    await database.runAsync(
      `INSERT INTO usuario_local (remote_id, nombre, usuario, es_invitado, fecha_registro) VALUES (?, ?, ?, ?, ?)`,
      [userData.id || null, userData.nombre || null, userData.usuario || null, userData.es_invitado ? 1 : 0, userData.fecha_registro || new Date().toISOString()]
    );
    await database.execAsync('COMMIT');
  } catch (e) {
    await database.execAsync('ROLLBACK');
    throw e;
  }
}

async function getUsuarioLocal() {
  const database = await getDB();
  const u = await database.getFirstAsync('SELECT * FROM usuario_local LIMIT 1');
  if (!u) return null;
  return {
    id: u.remote_id,
    nombre: u.nombre,
    usuario: u.usuario,
    es_invitado: u.es_invitado === 1,
    fecha_registro: u.fecha_registro,
  };
}

async function clearUsuarioLocal() {
  const database = await getDB();
  await database.runAsync('DELETE FROM usuario_local');
}

// ======================== LIMPIEZA ========================

async function clearAllLocalData() {
  const database = await getDB();
  await database.execAsync(`
    DELETE FROM resultados;
    DELETE FROM usuario_local;
    DELETE FROM pending_actions;
  `);
}

async function clearResultadosLocal() {
  const database = await getDB();
  await database.runAsync('DELETE FROM resultados');
}

async function queuePendingAction(action, payload) {
  const database = await getDB();
  await database.runAsync(
    'INSERT INTO pending_actions (action, payload, created_at) VALUES (?, ?, ?)',
    [action, payload ? JSON.stringify(payload) : null, new Date().toISOString()]
  );
}

async function getPendingActions() {
  const database = await getDB();
  const rows = await database.getAllAsync('SELECT * FROM pending_actions ORDER BY created_at ASC');
  return rows.map((r) => {
    let parsed = null;
    if (r.payload) {
      try { parsed = JSON.parse(r.payload); } catch { /* payload corrupto, ignorar */ }
    }
    return { ...r, payload: parsed };
  });
}

async function clearPendingAction(id) {
  const database = await getDB();
  await database.runAsync('DELETE FROM pending_actions WHERE id = ?', [id]);
}

async function clearAllPendingActions() {
  const database = await getDB();
  await database.runAsync('DELETE FROM pending_actions');
}

async function getResultadosCount() {
  const database = await getDB();
  const row = await database.getFirstAsync('SELECT COUNT(*) as count FROM resultados');
  return row?.count || 0;
}

export {
  getDB as initDatabase,
  insertJuegos,
  getJuegosLocal,
  getJuegoLocal,
  insertResultado,
  getResultadosPorJuegoLocal,
  getEstadisticasLocal,
  getProximoNivelLocal,
  getUnsyncedResultados,
  markResultadoSynced,
  markAllSynced,
  importRemoteResultados,
  saveUsuarioLocal,
  getUsuarioLocal,
  clearUsuarioLocal,
  clearAllLocalData,
  clearResultadosLocal,
  getResultadosCount,
  queuePendingAction,
  getPendingActions,
  clearPendingAction,
  clearAllPendingActions,
};
