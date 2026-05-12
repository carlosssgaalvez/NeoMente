import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AppState, ScrollView, Modal, Dimensions,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Tipos de mariposas (emoji + color lógico) ---
const MARIPOSAS = [
  { id: 'roja',     emoji: '🦋', color: '#E53935', nombre: 'Roja',     plural: 'ROJAS',     bg: '#FFCDD2' },
  { id: 'azul',     emoji: '🦋', color: '#1E88E5', nombre: 'Azul',     plural: 'AZULES',    bg: '#BBDEFB' },
  { id: 'verde',    emoji: '🦋', color: '#43A047', nombre: 'Verde',    plural: 'VERDES',    bg: '#C8E6C9' },
  { id: 'amarilla', emoji: '🦋', color: '#FDD835', nombre: 'Amarilla', plural: 'AMARILLAS', bg: '#FFF9C4' },
  { id: 'naranja',  emoji: '🦋', color: '#FB8C00', nombre: 'Naranja',  plural: 'NARANJAS',  bg: '#FFE0B2' },
  { id: 'morada',   emoji: '🦋', color: '#8E24AA', nombre: 'Morada',   plural: 'MORADAS',   bg: '#E1BEE7' },
];

// --- Zona de juego (padding para evitar bordes) ---
const GAME_PADDING = 24;
const BUTTERFLY_SIZE = 56;

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Cazador de mariposas experto! Increíble precisión 🌟',
    '¡Perfecto! Tus reflejos son asombrosos 🏆',
    '¡Extraordinario! No se te escapa ninguna 🦋✨',
  ],
  bueno: [
    '¡Muy bien! Cada vez cazas más rápido 🌿',
    '¡Buen trabajo! Tu atención mejora cada día 💪',
    '¡Genial! Solo unas pocas se te escaparon 🌈',
  ],
  regular: [
    '¡Bien hecho! Las mariposas son rápidas 🦋',
    '¡Sigue así! Tu coordinación mejora cada intento 🌻',
    '¡Ánimo! Con práctica atraparás muchas más 💚',
  ],
  bajo: [
    '¡No te rindas! Las mariposas son escurridizas 🌱',
    '¡Buen intento! Fíjate bien en el color indicado 💪',
    '¡Cada partida entrena tu atención visual! Tú puedes 🦋',
  ],
};

/**
 * Selecciona un mensaje de refuerzo según puntuación.
 * @param {number} score - Puntuación 0-100.
 * @returns {string}
 */
function getRefuerzo(score) {
  const cat = score >= 90 ? 'excelente'
    : score >= 70 ? 'bueno'
    : score >= 45 ? 'regular'
    : 'bajo';
  const msgs = REFUERZOS[cat];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/**
 * Convierte nivel de dificultad (0-100) a configuración de partida.
 * @param {number} nivel - Nivel 0-100.
 * @returns {{ duracionSeg: number, numColores: number, mariposasSimultaneas: number, intervaloMs: number, velocidad: number, cambioObjetivo: boolean }}
 */
function nivelAConfig(nivel) {
  //                        duracion  colores  simult  intervalo  veloc  cambio  meta(objetivos a cazar)
  if (nivel <= 10) return { duracionSeg: 35, numColores: 3, mariposasSimultaneas: 4, intervaloMs: 1600, velocidad: 1.2, cambioObjetivo: false, objetivoMeta: 8  };
  if (nivel <= 22) return { duracionSeg: 40, numColores: 3, mariposasSimultaneas: 5, intervaloMs: 1400, velocidad: 1.4, cambioObjetivo: false, objetivoMeta: 10 };
  if (nivel <= 36) return { duracionSeg: 40, numColores: 4, mariposasSimultaneas: 5, intervaloMs: 1300, velocidad: 1.6, cambioObjetivo: false, objetivoMeta: 12 };
  if (nivel <= 50) return { duracionSeg: 45, numColores: 4, mariposasSimultaneas: 6, intervaloMs: 1200, velocidad: 1.8, cambioObjetivo: false, objetivoMeta: 14 };
  if (nivel <= 64) return { duracionSeg: 45, numColores: 5, mariposasSimultaneas: 6, intervaloMs: 1100, velocidad: 2.0, cambioObjetivo: false, objetivoMeta: 16 };
  if (nivel <= 78) return { duracionSeg: 50, numColores: 5, mariposasSimultaneas: 7, intervaloMs: 1000, velocidad: 2.2, cambioObjetivo: true,  objetivoMeta: 18 };
  if (nivel <= 90) return { duracionSeg: 50, numColores: 6, mariposasSimultaneas: 7, intervaloMs: 900,  velocidad: 2.5, cambioObjetivo: true,  objetivoMeta: 20 };
  return              { duracionSeg: 55, numColores: 6, mariposasSimultaneas: 8, intervaloMs: 750,  velocidad: 3.0, cambioObjetivo: true,  objetivoMeta: 24 };
}

/**
 * Nombre temático del nivel.
 * @param {number} nivel - Nivel 0-100.
 * @returns {string}
 */
function getNivelLabel(nivel) {
  if (nivel <= 10) return 'Aprendiz';
  if (nivel <= 22) return 'Aficionado';
  if (nivel <= 36) return 'Explorador';
  if (nivel <= 50) return 'Rastreador';
  if (nivel <= 64) return 'Cazador';
  if (nivel <= 78) return 'Experto';
  if (nivel <= 90) return 'Maestro';
  return 'Leyenda del jardín';
}

/**
 * Genera una posición aleatoria dentro de la zona de juego.
 * @param {object} area - { width, height } del área de juego real.
 * @returns {{ x: number, y: number }}
 */
function randomPosition(area) {
  const maxX = Math.max(0, area.width - BUTTERFLY_SIZE - GAME_PADDING * 2);
  const maxY = Math.max(0, area.height - BUTTERFLY_SIZE - GAME_PADDING);
  return {
    x: GAME_PADDING + Math.random() * maxX,
    y: GAME_PADDING + Math.random() * maxY,
  };
}

/**
 * Genera un desplazamiento aleatorio para la animación.
 * @param {number} velocidad - Multiplicador de velocidad.
 * @returns {{ dx: number, dy: number }}
 */
function randomDelta(velocidad) {
  const angle = Math.random() * Math.PI * 2;
  const dist = (40 + Math.random() * 60) * velocidad;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
  };
}

/**
 * Elige N colores aleatorios del pool de mariposas.
 * @param {number} n - Número de colores.
 * @returns {Array}
 */
function elegirColores(n) {
  const shuffled = [...MARIPOSAS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, MARIPOSAS.length));
}

let nextButterflyId = 0;

/**
 * Crea una mariposa con posición, tipo y animación.
 * @param {Array} coloresActivos - Colores disponibles.
 * @param {string} objetivoId - ID del color objetivo.
 * @param {number} velocidad - Multiplicador de velocidad.
 * @param {object} area - { width, height } del área de juego real.
 * @returns {object}
 */
function crearMariposa(coloresActivos, objetivoId, velocidad, area) {
  // Probabilidad de que sea del color objetivo (~30%)
  const esObjetivo = Math.random() < 0.3;
  const tipo = esObjetivo
    ? coloresActivos.find((c) => c.id === objetivoId)
    : coloresActivos[Math.floor(Math.random() * coloresActivos.length)];

  const pos = randomPosition(area);
  const delta = randomDelta(velocidad);

  // Clampar destino dentro del área
  const maxX = Math.max(0, area.width - BUTTERFLY_SIZE - GAME_PADDING * 2);
  const maxY = Math.max(0, area.height - BUTTERFLY_SIZE - GAME_PADDING);
  const tX = Math.max(GAME_PADDING, Math.min(GAME_PADDING + maxX, pos.x + delta.dx));
  const tY = Math.max(GAME_PADDING, Math.min(GAME_PADDING + maxY, pos.y + delta.dy));

  nextButterflyId++;
  return {
    id: nextButterflyId,
    tipo,
    x: new Animated.Value(pos.x),
    y: new Animated.Value(pos.y),
    opacity: new Animated.Value(1),
    scale: new Animated.Value(0),
    targetX: tX,
    targetY: tY,
    velocidad,
    esObjetivo: tipo.id === objetivoId,
    capturada: false,
    area,
  };
}

// ============================================================
// Componente principal
// ============================================================
export default function ButterflyGameScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;
  const insets = useSafeAreaInsets();

  // Estado del juego
  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [gameState, setGameState] = useState('loading');
  // loading | countdown | playing | finished
  const [countdownNum, setCountdownNum] = useState(3);
  const [timer, setTimer] = useState(0);
  const [mariposas, setMariposas] = useState([]);
  const [coloresActivos, setColoresActivos] = useState([]);
  const [objetivoActual, setObjetivoActual] = useState(null);
  const [aciertos, setAciertos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [totalObjetivos, setTotalObjetivos] = useState(0);
  const [objetivoMeta, setObjetivoMeta] = useState(0);
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);
  const [colorChangeCountdown, setColorChangeCountdown] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const timerValueRef = useRef(0);
  const spawnRef = useRef(null);
  const moveRef = useRef(null);
  const objetivoChangeRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);
  const prevGameStateRef = useRef('loading');
  const mariposasRef = useRef([]);
  const aciertosRef = useRef(0);
  const fallosRef = useRef(0);
  const totalObjetivosRef = useRef(0);
  const objetivoMetaRef = useRef(0);
  const objetivoRef = useRef(null);
  const coloresRef = useRef([]);
  const configRef = useRef(null);
  const isNewGameRef = useRef(false);
  const playAreaRef = useRef({ width: SCREEN_WIDTH, height: 400 });
  const colorCountdownRef = useRef(null);

  // Sincronizar refs
  useEffect(() => { timerValueRef.current = timer; }, [timer]);
  useEffect(() => { aciertosRef.current = aciertos; }, [aciertos]);
  useEffect(() => { fallosRef.current = fallos; }, [fallos]);
  useEffect(() => { totalObjetivosRef.current = totalObjetivos; }, [totalObjetivos]);

  // --- Limpiar todos los timers ---
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null; }
    if (moveRef.current) { clearInterval(moveRef.current); moveRef.current = null; }
    if (objetivoChangeRef.current) { clearInterval(objetivoChangeRef.current); objetivoChangeRef.current = null; }
    if (countdownTimeoutRef.current) { clearTimeout(countdownTimeoutRef.current); countdownTimeoutRef.current = null; }
    if (colorCountdownRef.current) { clearInterval(colorCountdownRef.current); colorCountdownRef.current = null; }
    setColorChangeCountdown(0);
  }, []);

  // --- AppState: pausar si minimiza ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        setGameState((prev) => {
          if (prev === 'playing' || prev === 'countdown') {
            prevGameStateRef.current = prev;
            clearAllTimers();
            return 'paused';
          }
          return prev;
        });
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [clearAllTimers]);

  // --- Calcular puntuación ---
  const calcularPuntuacion = useCallback((hits, misses, totalObj, segundos, duracionSeg) => {
    if (totalObj === 0) return 0;
    const precision = hits / totalObj;
    const penalizacion = Math.min(0.3, misses * 0.05);
    const tiempoFactor = Math.max(0, 1 - (segundos / duracionSeg) * 0.2);
    const raw = (precision - penalizacion) * 80 + tiempoFactor * 20;
    return Math.round(Math.min(100, Math.max(0, raw)));
  }, []);

  // --- Finalizar partida ---
  const finalizarPartida = useCallback(() => {
    clearAllTimers();
    const hits = aciertosRef.current;
    const misses = fallosRef.current;
    const meta = objetivoMetaRef.current;
    const remaining = timerValueRef.current;
    const cfg = configRef.current;
    const duracion = cfg?.duracionSeg ?? 30;
    const elapsed = duracion - remaining;

    const score = calcularPuntuacion(hits, misses, meta, remaining, duracion);
    setPuntuacion(score);
    setRefuerzoMsg(getRefuerzo(score));
    setGameState('finished');

    if (!resultSaved) {
      setResultSaved(true);
      guardarResultado({
        juego_id: juegoId,
        puntuacion: score,
        duracion_segundos: elapsed,
        nivel_dificultad: nivel,
      }).catch(() => {});
    }
  }, [juegoId, nivel, resultSaved, clearAllTimers, calcularPuntuacion]);

  // --- Spawn de mariposas ---
  const spawnButterfly = useCallback(() => {
    const cfg = configRef.current;
    const objetivo = objetivoRef.current;
    const colores = coloresRef.current;
    if (!cfg || !objetivo || colores.length === 0) return;

    setMariposas((prev) => {
      // Limpiar capturadas
      const vivas = prev.filter((m) => !m.capturada);
      if (vivas.length >= cfg.mariposasSimultaneas) return prev;

      // Contar objetivos y distractores visibles
      const objetivosVisibles = vivas.filter((m) => m.tipo.id === objetivo.id).length;
      const distractoresVisibles = vivas.filter((m) => m.tipo.id !== objetivo.id).length;
      const quedanPorSpawnear = totalObjetivosRef.current < objetivoMetaRef.current;

      const nueva = crearMariposa(colores, objetivo.id, cfg.velocidad, playAreaRef.current);

      // Forzar objetivo si no hay ninguno visible y quedan por spawnear
      if (objetivosVisibles === 0 && quedanPorSpawnear && !nueva.esObjetivo) {
        nueva.esObjetivo = true;
        nueva.tipo = colores.find((c) => c.id === objetivo.id);
      }
      // Forzar distractor si no hay ninguno visible (para que el jugador pueda equivocarse)
      else if (distractoresVisibles === 0 && nueva.esObjetivo) {
        nueva.esObjetivo = false;
        const distractores = colores.filter((c) => c.id !== objetivo.id);
        if (distractores.length > 0) {
          nueva.tipo = distractores[Math.floor(Math.random() * distractores.length)];
        }
      }

      if (nueva.esObjetivo) {
        // Solo contar si aún no alcanzamos la meta de spawns
        if (quedanPorSpawnear) {
          totalObjetivosRef.current++;
          setTotalObjetivos(totalObjetivosRef.current);
        } else {
          // Ya hay suficientes objetivos spawneados, cambiar a distractor
          nueva.esObjetivo = false;
          const distractores = colores.filter((c) => c.id !== objetivo.id);
          if (distractores.length > 0) {
            nueva.tipo = distractores[Math.floor(Math.random() * distractores.length)];
          }
        }
      }

      // Animación de entrada
      Animated.spring(nueva.scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      mariposasRef.current = [...vivas, nueva];
      return [...vivas, nueva];
    });
  }, []);

  // --- Mover mariposas ---
  const moverMariposas = useCallback(() => {
    setMariposas((prev) => {
      return prev.map((m) => {
        if (m.capturada) return m;
        const area = m.area || playAreaRef.current;
        const maxX = Math.max(0, area.width - BUTTERFLY_SIZE - GAME_PADDING * 2);
        const maxY = Math.max(0, area.height - BUTTERFLY_SIZE - GAME_PADDING);
        const delta = randomDelta(m.velocidad * 0.5);
        const newX = Math.max(GAME_PADDING, Math.min(GAME_PADDING + maxX, m.targetX + delta.dx));
        const newY = Math.max(GAME_PADDING, Math.min(GAME_PADDING + maxY, m.targetY + delta.dy));

        Animated.timing(m.x, { toValue: newX, duration: 1500, useNativeDriver: true }).start();
        Animated.timing(m.y, { toValue: newY, duration: 1500, useNativeDriver: true }).start();

        return { ...m, targetX: newX, targetY: newY };
      });
    });
  }, []);

  // --- Cambiar color objetivo (niveles avanzados) ---
  const cambiarObjetivo = useCallback(() => {
    const colores = coloresRef.current;
    if (colores.length <= 1) return;
    // Elegir un color diferente al actual
    const actual = objetivoRef.current;
    const otros = colores.filter((c) => c.id !== actual?.id);
    const nuevo = otros.length > 0
      ? otros[Math.floor(Math.random() * otros.length)]
      : colores[Math.floor(Math.random() * colores.length)];
    objetivoRef.current = nuevo;
    setObjetivoActual(nuevo);
    setColorChangeCountdown(0);
  }, []);

  // --- Iniciar partida ---
  const iniciarPartida = useCallback((cfg) => {
    const colores = elegirColores(cfg.numColores);
    const objetivo = colores[Math.floor(Math.random() * colores.length)];

    setColoresActivos(colores);
    setObjetivoActual(objetivo);
    setMariposas([]);
    setAciertos(0);
    setFallos(0);
    setTotalObjetivos(0);
    setObjetivoMeta(cfg.objetivoMeta);
    setTimer(0);
    setPuntuacion(null);
    setRefuerzoMsg('');
    setResultSaved(false);
    wantsToLeaveRef.current = false;

    coloresRef.current = colores;
    objetivoRef.current = objetivo;
    configRef.current = cfg;
    mariposasRef.current = [];
    aciertosRef.current = 0;
    fallosRef.current = 0;
    totalObjetivosRef.current = 0;
    objetivoMetaRef.current = cfg.objetivoMeta;
    timerValueRef.current = 0;
    nextButterflyId = 0;
    isNewGameRef.current = true;

    clearAllTimers();
    setGameState('countdown');
  }, [clearAllTimers]);

  // --- Countdown 3-2-1 ---
  useEffect(() => {
    if (gameState !== 'countdown') return;
    setCountdownNum(3);
    let count = 3;

    const tick = () => {
      count--;
      if (count <= 0) {
        setGameState('playing');
      } else {
        setCountdownNum(count);
        countdownTimeoutRef.current = setTimeout(tick, 800);
      }
    };
    countdownTimeoutRef.current = setTimeout(tick, 800);

    return () => {
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, [gameState]);

  // --- Playing: iniciar timers ---
  useEffect(() => {
    if (gameState !== 'playing') return;
    const cfg = configRef.current;
    if (!cfg) return;

    // Solo spawn inicial y reset timer en partida nueva (no al reanudar)
    if (isNewGameRef.current) {
      isNewGameRef.current = false;
      for (let i = 0; i < cfg.mariposasSimultaneas; i++) {
        spawnButterfly();
      }
      setTimer(cfg.duracionSeg);
      timerValueRef.current = cfg.duracionSeg;
    }

    // Cronómetro (cuenta atrás)
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        const next = t - 1;
        timerValueRef.current = next;
        if (next <= 0) {
          finalizarPartida();
          return 0;
        }
        return next;
      });
    }, 1000);

    // Spawn periódico
    spawnRef.current = setInterval(spawnButterfly, cfg.intervaloMs);

    // Movimiento
    moveRef.current = setInterval(moverMariposas, 1500);

    // Cambio de objetivo con cuenta atrás (si aplica)
    // Ciclo: 7s normal → 3s countdown (3,2,1) → cambio → repeat
    if (cfg.cambioObjetivo) {
      const startColorCycle = () => {
        objetivoChangeRef.current = setTimeout(() => {
          // Iniciar cuenta atrás 3-2-1
          let count = 3;
          setColorChangeCountdown(count);
          colorCountdownRef.current = setInterval(() => {
            count--;
            if (count <= 0) {
              if (colorCountdownRef.current) { clearInterval(colorCountdownRef.current); colorCountdownRef.current = null; }
              cambiarObjetivo();
              startColorCycle();
            } else {
              setColorChangeCountdown(count);
            }
          }, 1000);
        }, 7000);
      };
      startColorCycle();
    }

    return () => clearAllTimers();
  }, [gameState, spawnButterfly, moverMariposas, cambiarObjetivo, finalizarPartida, clearAllTimers]);

  // --- Cargar nivel al montar ---
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      let nivelRec = 0;
      try {
        const data = await getProximoNivel(juegoId);
        nivelRec = data.nivel_recomendado ?? 0;
      } catch {
        // Sin historial
      }
      if (!mounted) return;
      setNivel(nivelRec);
      const cfg = nivelAConfig(nivelRec);
      setConfig(cfg);
      iniciarPartida(cfg);
    };
    cargar();
    return () => {
      mounted = false;
      clearAllTimers();
    };
  }, [juegoId, iniciarPartida, clearAllTimers]);

  // --- Tocar mariposa ---
  const handleTap = useCallback((mariposa) => {
    if (gameState !== 'playing' || mariposa.capturada) return;

    const objetivo = objetivoRef.current;
    const esCorrecta = mariposa.tipo.id === objetivo?.id;

    // Marcar como capturada
    mariposa.capturada = true;

    if (esCorrecta) {
      const newAciertos = aciertosRef.current + 1;
      aciertosRef.current = newAciertos;
      setAciertos(newAciertos);
      // Animación de éxito: escalar y desvanecer
      Animated.parallel([
        Animated.timing(mariposa.scale, { toValue: 1.5, duration: 300, useNativeDriver: true }),
        Animated.timing(mariposa.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      // Comprobar si se alcanzó la meta
      if (newAciertos >= objetivoMetaRef.current) {
        setTimeout(() => finalizarPartida(), 350);
        return;
      }
    } else {
      setFallos((f) => f + 1);
      // Animación de error: sacudida + rojo
      Animated.sequence([
        Animated.timing(mariposa.x, { toValue: mariposa.targetX - 15, duration: 80, useNativeDriver: true }),
        Animated.timing(mariposa.x, { toValue: mariposa.targetX + 15, duration: 80, useNativeDriver: true }),
        Animated.timing(mariposa.x, { toValue: mariposa.targetX, duration: 80, useNativeDriver: true }),
        Animated.timing(mariposa.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    // Limpiar tras animación
    setTimeout(() => {
      setMariposas((prev) => prev.filter((m) => m.id !== mariposa.id));
    }, 400);
  }, [gameState, finalizarPartida]);

  // --- Pausa / Reanudación ---
  const handlePause = useCallback(() => {
    if (gameState === 'playing' || gameState === 'countdown') {
      prevGameStateRef.current = gameState;
      clearAllTimers();
      setGameState('paused');
    }
  }, [gameState, clearAllTimers]);

  const handleResume = useCallback(() => {
    if (gameState !== 'paused') return;
    const prev = prevGameStateRef.current;
    if (prev === 'countdown') {
      setGameState('countdown');
    } else {
      setGameState('playing');
    }
  }, [gameState]);

  // --- Replay ---
  const handleReplay = useCallback(async () => {
    clearAllTimers();
    setGameState('loading');
    let nivelRec = nivel ?? 0;
    try {
      const data = await getProximoNivel(juegoId);
      nivelRec = data.nivel_recomendado ?? 0;
    } catch {
      // Mantener nivel actual
    }
    setNivel(nivelRec);
    const cfg = nivelAConfig(nivelRec);
    setConfig(cfg);
    iniciarPartida(cfg);
  }, [juegoId, nivel, iniciarPartida, clearAllTimers]);

  // --- Salir ---
  const handleExit = useCallback(() => {
    if (gameState === 'playing' || gameState === 'countdown') {
      prevGameStateRef.current = gameState;
      clearAllTimers();
      setGameState('paused');
    }
  }, [gameState, clearAllTimers]);

  const handleForceExit = useCallback(() => {
    clearAllTimers();
    wantsToLeaveRef.current = true;
    navigation.goBack();
  }, [navigation, clearAllTimers]);

  // --- Interceptar gesto back ---
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gameState === 'finished' || gameState === 'loading') return;
      if (wantsToLeaveRef.current) return;
      e.preventDefault();
      handleExit();
    });
    return unsubscribe;
  }, [navigation, gameState, handleExit]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ==============================
  // RENDER: Loading
  // ==============================
  if (gameState === 'loading' || !config) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingEmoji}>🦋</Text>
        <Text style={styles.loadingText}>Preparando el jardín...</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.countdownEmoji}>🦋</Text>
        <Text style={styles.countdownText}>¿Preparado?</Text>
        <Text style={styles.countdownNum}>{countdownNum}</Text>
        <Text style={styles.countdownHint}>
          Toca solo las mariposas del color indicado
        </Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Resultado
  // ==============================
  if (gameState === 'finished') {
    const nivelLabel = getNivelLabel(nivel);
    const precision = objetivoMeta > 0
      ? Math.round((aciertos / objetivoMeta) * 100) : 0;

    return (
      <ScrollView
        style={styles.resultScroll}
        contentContainerStyle={styles.resultContainer}
      >
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {puntuacion >= 90 ? '🏆' : puntuacion >= 70 ? '🦋' : puntuacion >= 45 ? '🌻' : '🌱'}
          </Text>
          <Text style={styles.resultTitle} accessibilityRole="header">
            ¡Caza completada!
          </Text>

          <View style={styles.refuerzoContainer}>
            <Text style={styles.refuerzoText} accessibilityRole="text">
              {refuerzoMsg}
            </Text>
          </View>

          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Puntuación</Text>
            <Text style={styles.resultValue}>{puntuacion}/100</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Mariposas atrapadas</Text>
            <Text style={styles.resultValue}>{aciertos}/{objetivoMeta}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Precisión</Text>
            <Text style={styles.resultValue}>{precision}%</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Toques incorrectos</Text>
            <Text style={styles.resultValue}>{fallos}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nivel</Text>
            <Text style={styles.resultValue}>{nivelLabel} ({nivel})</Text>
          </View>

          {puntuacion >= 80 && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>⬆️ ¡Dificultad aumentada para el próximo reto!</Text>
            </View>
          )}
          {puntuacion > 40 && puntuacion < 80 && (
            <View style={[styles.resultBadge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.resultBadgeText, { color: '#0D47A1' }]}>🔄 Nivel estable — sigue practicando</Text>
            </View>
          )}
          {puntuacion <= 40 && (
            <View style={[styles.resultBadge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.resultBadgeText, { color: '#E65100' }]}>🌱 Se ajustará la dificultad para ayudarte</Text>
            </View>
          )}

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleReplay}
              accessibilityRole="button"
              accessibilityLabel="Jugar de nuevo"
            >
              <Text style={styles.btnPrimaryText}>🦋 Jugar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => { clearAllTimers(); navigation.goBack(); }}
              accessibilityRole="button"
              accessibilityLabel="Volver a juegos"
            >
              <Text style={styles.btnSecondaryText}>← Volver a juegos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==============================
  // RENDER: Playing (+ Paused modal)
  // ==============================
  return (
    <View style={[styles.gameContainer, { paddingBottom: insets.bottom }]}>
      {/* Modal de pausa */}
      <Modal
        visible={gameState === 'paused'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleResume}
      >
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseEmoji}>⏸️</Text>
            <Text style={styles.pauseTitle} accessibilityRole="header">
              Juego en pausa
            </Text>
            <Text style={styles.pauseSubtitle}>
              Tómate tu tiempo. Cuando estés listo, continúa.
            </Text>

            <View style={styles.pauseInfo}>
              <Text style={styles.pauseInfoText}>Atrapadas: {aciertos}/{objetivoMeta}</Text>
              <Text style={styles.pauseInfoText}>Tiempo restante: {formatTime(timer)}</Text>
            </View>

            <TouchableOpacity
              style={styles.pauseBtnPrimary}
              onPress={handleResume}
              accessibilityRole="button"
              accessibilityLabel="Reanudar juego"
            >
              <Text style={styles.pauseBtnPrimaryText}>▶️  Continuar jugando</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pauseBtnSecondary}
              onPress={handleForceExit}
              accessibilityRole="button"
              accessibilityLabel="Salir del juego"
            >
              <Text style={styles.pauseBtnSecondaryText}>← Salir del juego</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleExit}
          accessibilityRole="button"
          accessibilityLabel="Salir del juego"
          style={styles.topBarBtn}
        >
          <Text style={styles.topBarBack}>← Salir</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>🦋 Cazamariposas</Text>
        <TouchableOpacity
          onPress={handlePause}
          accessibilityRole="button"
          accessibilityLabel="Pausar juego"
          style={styles.pauseTopBtn}
          disabled={gameState !== 'playing'}
        >
          <Text style={styles.pauseTopBtnIcon}>⏸️</Text>
          <Text style={styles.pauseTopBtnLabel}>Pausa</Text>
        </TouchableOpacity>
      </View>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>⏱️ Tiempo</Text>
          <Text style={[
            styles.infoValue,
            timer <= 10 && { color: '#FF5252' },
          ]}>{formatTime(timer)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>✅ Atrapadas</Text>
          <Text style={styles.infoValue}>{aciertos}/{objetivoMeta}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>❌ Fallos</Text>
          <Text style={styles.infoValue}>{fallos}</Text>
        </View>
      </View>

      {/* Instrucción: color objetivo */}
      {objetivoActual && (
        <View style={[styles.objectiveBar, { backgroundColor: objetivoActual.bg }]}>
          <Text style={styles.objectiveText} numberOfLines={1} adjustsFontSizeToFit>
            ¡Atrapa las mariposas{' '}
            <Text style={[styles.objectiveBold, { color: objetivoActual.color }]}>
              {objetivoActual.plural}
            </Text>
            !
          </Text>
          <View style={[styles.objectiveDot, { backgroundColor: objetivoActual.color }]} />
        </View>
      )}

      {/* Aviso de cambio de color inminente */}
      {colorChangeCountdown > 0 && (
        <View style={styles.changeWarningBanner}>
          <Text style={styles.changeWarningEmoji}>🔄</Text>
          <Text style={styles.changeWarningBannerText}>
            ¡Cambio de color en {colorChangeCountdown}!
          </Text>
        </View>
      )}

      {/* Zona de juego — mariposas animadas */}
      <View
        style={styles.playArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            playAreaRef.current = { width, height };
          }
        }}
      >
        {mariposas.filter((m) => !m.capturada).map((m) => (
          <Animated.View
            key={m.id}
            style={[
              styles.butterflyWrapper,
              {
                transform: [
                  { translateX: m.x },
                  { translateY: m.y },
                  { scale: m.scale },
                ],
                opacity: m.opacity,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleTap(m)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Mariposa ${m.tipo.nombre}`}
              style={styles.butterflyTouchable}
            >
              <Text style={[styles.butterflyEmoji, { textShadowColor: m.tipo.color }]}>
                {m.tipo.emoji}
              </Text>
              <View style={[styles.butterflyGlow, { backgroundColor: m.tipo.color }]} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Layout ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  loadingEmoji: { fontSize: 60, marginBottom: 16 },
  loadingText: { fontSize: fonts.h2, color: '#2E7D32', fontWeight: fonts.semibold },

  // --- Countdown ---
  countdownEmoji: { fontSize: 60, marginBottom: 16 },
  countdownText: {
    fontSize: fonts.h2,
    color: '#2E7D32',
    fontWeight: fonts.semibold,
    marginBottom: 12,
  },
  countdownNum: {
    fontSize: 72,
    fontWeight: fonts.bold,
    color: '#1B5E20',
    marginBottom: 16,
  },
  countdownHint: {
    fontSize: fonts.body,
    color: '#558B2F',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  gameContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2E7D32',
  },
  topBarBtn: {
    padding: 4,
    minWidth: 50,
  },
  topBarBack: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  topBarTitle: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    flex: 1,
    textAlign: 'center',
  },
  pauseTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pauseTopBtnIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  pauseTopBtnLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: fonts.semibold,
  },

  // --- Info bar ---
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#388E3C',
    borderBottomWidth: 1,
    borderBottomColor: '#2E7D32',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  infoValue: { fontSize: fonts.body, fontWeight: fonts.bold, color: colors.white },

  // --- Objetivo ---
  objectiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  objectiveText: {
    flex: 1,
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#1A1A1A',
  },
  objectiveBold: {
    fontWeight: fonts.bold,
    fontSize: fonts.body,
  },
  objectiveDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  changeWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6F00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  changeWarningEmoji: {
    fontSize: 22,
  },
  changeWarningBannerText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    textAlign: 'center',
  },

  // --- Zona de juego ---
  playArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  butterflyWrapper: {
    position: 'absolute',
    width: BUTTERFLY_SIZE,
    height: BUTTERFLY_SIZE,
  },
  butterflyTouchable: {
    width: BUTTERFLY_SIZE,
    height: BUTTERFLY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  butterflyEmoji: {
    fontSize: 40,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    zIndex: 2,
  },
  butterflyGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.3,
    zIndex: 1,
  },

  // --- Pausa ---
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pauseCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  pauseEmoji: { fontSize: 48, marginBottom: 12 },
  pauseTitle: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  pauseSubtitle: {
    fontSize: fonts.small,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: 20,
  },
  pauseInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  pauseInfoText: {
    fontSize: fonts.small,
    color: colors.text,
    fontWeight: fonts.semibold,
    marginVertical: 2,
  },
  pauseBtnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  pauseBtnPrimaryText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: fonts.bold,
  },
  pauseBtnSecondary: {
    marginTop: 14,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E57373',
    width: '100%',
  },
  pauseBtnSecondaryText: {
    color: '#E57373',
    fontSize: 16,
    fontWeight: fonts.semibold,
  },

  // --- Resultado ---
  resultScroll: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  resultEmoji: { fontSize: 64, marginBottom: 8 },
  resultTitle: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  refuerzoContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  refuerzoText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultDivider: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C8E6C9',
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  resultLabel: {
    fontSize: fonts.body,
    color: '#558B2F',
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  resultValue: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: '#1B5E20',
    flexShrink: 0,
  },
  resultBadge: {
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#2E7D32',
    textAlign: 'center',
  },
  resultButtons: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A5D6A7',
  },
  btnSecondaryText: {
    color: '#2E7D32',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
