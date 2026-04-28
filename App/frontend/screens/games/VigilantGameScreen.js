import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AppState, ScrollView, Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Símbolos del juego (30 distintos) ---
const SIMBOLOS = [
  '⭐', '🔵', '🟢', '🔺', '🟣', '🔶', '❤️', '🟩', '🔷', '🌙',
  '🍎', '🌸', '🎵', '🔔', '🍀', '☀️', '🌊', '🎯', '🪐', '🍄',
  '🦋', '🐚', '🍋', '🫧', '🧩', '🪻', '🎲', '🏵️', '🪄', '💎',
];

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Vigilante de élite! Tu concentración es impecable 🌟',
    '¡Perfecto! Nada se te escapa 🏆',
    '¡Extraordinario! Atención sostenida de campeón 🧠✨',
  ],
  bueno: [
    '¡Muy bien! Tu vigilancia mejora cada día 👁️',
    '¡Buen trabajo! Casi no se te escapa nada 💪',
    '¡Genial! Mantienes la concentración muy bien 🌈',
  ],
  regular: [
    '¡Bien hecho! Estar atento mucho rato es difícil 🔍',
    '¡Sigue así! Tu resistencia atencional crece 🌿',
    '¡Ánimo! Es normal distraerse, pronto lo dominarás 💚',
  ],
  bajo: [
    '¡No te rindas! La vigilancia se entrena 🌱',
    '¡Buen intento! Pulsa solo cuando veas el objetivo 💪',
    '¡Cada partida entrena tu concentración! Tú puedes 👁️',
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
 * @returns {object} Configuración del nivel.
 */
function nivelAConfig(nivel) {
  // totalEstimulos: cuántos símbolos aparecen en total
  // porcentajeObjetivo: % de estímulos que son el objetivo (más bajo = más difícil)
  // tiempoEstimuloMs: cuánto se muestra cada símbolo
  // tiempoEntreMs: pausa entre símbolos
  // numSimbolos: de cuántos símbolos distintos se elige (15-30)
  // minObjetivos: apariciones mínimas garantizadas del objetivo
  if (nivel <= 10) return { totalEstimulos: 30, porcentajeObjetivo: 35, tiempoEstimuloMs: 1500, tiempoEntreMs: 800,  numSimbolos: 15, minObjetivos: 8  };
  if (nivel <= 22) return { totalEstimulos: 35, porcentajeObjetivo: 30, tiempoEstimuloMs: 1300, tiempoEntreMs: 700,  numSimbolos: 17, minObjetivos: 8  };
  if (nivel <= 36) return { totalEstimulos: 40, porcentajeObjetivo: 27, tiempoEstimuloMs: 1200, tiempoEntreMs: 600,  numSimbolos: 19, minObjetivos: 8  };
  if (nivel <= 50) return { totalEstimulos: 45, porcentajeObjetivo: 24, tiempoEstimuloMs: 1100, tiempoEntreMs: 500,  numSimbolos: 21, minObjetivos: 7  };
  if (nivel <= 64) return { totalEstimulos: 50, porcentajeObjetivo: 22, tiempoEstimuloMs: 1000, tiempoEntreMs: 450,  numSimbolos: 23, minObjetivos: 7  };
  if (nivel <= 78) return { totalEstimulos: 55, porcentajeObjetivo: 20, tiempoEstimuloMs: 900,  tiempoEntreMs: 400,  numSimbolos: 25, minObjetivos: 7  };
  if (nivel <= 90) return { totalEstimulos: 60, porcentajeObjetivo: 18, tiempoEstimuloMs: 800,  tiempoEntreMs: 350,  numSimbolos: 28, minObjetivos: 6  };
  return              { totalEstimulos: 65, porcentajeObjetivo: 16, tiempoEstimuloMs: 700,  tiempoEntreMs: 300,  numSimbolos: 30, minObjetivos: 6  };
}

/**
 * Genera la secuencia de estímulos para una partida.
 * @param {object} config - Configuración del nivel.
 * @returns {{ objetivo: string, secuencia: Array<{ simbolo: string, esObjetivo: boolean }> }}
 */
function generarSecuencia(config) {
  const disponibles = SIMBOLOS.slice(0, config.numSimbolos);
  const objetivo = disponibles[Math.floor(Math.random() * disponibles.length)];
  const distractores = disponibles.filter((s) => s !== objetivo);

  const numPorPorcentaje = Math.round(config.totalEstimulos * config.porcentajeObjetivo / 100);
  const numObjetivos = Math.max(numPorPorcentaje, config.minObjetivos ?? 6);
  const numDistractores = config.totalEstimulos - numObjetivos;

  const secuencia = [];

  // Añadir objetivos
  for (let i = 0; i < numObjetivos; i++) {
    secuencia.push({ simbolo: objetivo, esObjetivo: true });
  }

  // Añadir distractores
  for (let i = 0; i < numDistractores; i++) {
    const dist = distractores[Math.floor(Math.random() * distractores.length)];
    secuencia.push({ simbolo: dist, esObjetivo: false });
  }

  // Barajar (Fisher-Yates) — evitando más de 2 objetivos seguidos
  for (let i = secuencia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [secuencia[i], secuencia[j]] = [secuencia[j], secuencia[i]];
  }

  // Segunda pasada: romper rachas de 3+ objetivos seguidos
  for (let i = 2; i < secuencia.length; i++) {
    if (secuencia[i].esObjetivo && secuencia[i - 1].esObjetivo && secuencia[i - 2].esObjetivo) {
      // Buscar el siguiente no-objetivo para swapear
      for (let k = i + 1; k < secuencia.length; k++) {
        if (!secuencia[k].esObjetivo) {
          [secuencia[i], secuencia[k]] = [secuencia[k], secuencia[i]];
          break;
        }
      }
    }
  }

  return { objetivo, secuencia };
}

/**
 * Calcula la puntuación (0-100).
 * @param {number} aciertos - Objetivos detectados correctamente.
 * @param {number} omisiones - Objetivos que se pasaron sin pulsar.
 * @param {number} falsosPositivos - Pulsaciones en distractores.
 * @param {number} totalObjetivos - Total de estímulos objetivo.
 * @param {number} totalEstimulos - Total de estímulos.
 * @returns {number}
 */
function calcularPuntuacion(aciertos, omisiones, falsosPositivos, totalObjetivos, totalEstimulos) {
  if (totalObjetivos === 0) return 0;
  const sensibilidad = aciertos / totalObjetivos;
  const totalNoObjetivos = totalEstimulos - totalObjetivos;
  const especificidad = totalNoObjetivos > 0 ? 1 - (falsosPositivos / totalNoObjetivos) : 1;
  const raw = sensibilidad * 60 + especificidad * 40;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Nombre temático del nivel.
 * @param {number} nivel - Nivel 0-100.
 * @returns {string}
 */
function getNivelLabel(nivel) {
  if (nivel <= 10) return 'Novato';
  if (nivel <= 22) return 'Observador';
  if (nivel <= 36) return 'Centinela';
  if (nivel <= 50) return 'Guardia';
  if (nivel <= 64) return 'Detective';
  if (nivel <= 78) return 'Inspector';
  if (nivel <= 90) return 'Vigilante';
  return 'Ojo de halcón';
}

// --- Pantalla principal del juego ---
export default function VigilantGameScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;

  // Estado del juego
  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [secuencia, setSecuencia] = useState([]);
  const [objetivo, setObjetivo] = useState('');
  const [estimuloIdx, setEstimuloIdx] = useState(0);
  const [mostrando, setMostrando] = useState(true); // true = mostrando símbolo, false = pausa entre
  const [respondido, setRespondido] = useState(false); // si ya respondió al estímulo actual
  const [aciertos, setAciertos] = useState(0);
  const [omisiones, setOmisiones] = useState(0);
  const [falsosPositivos, setFalsosPositivos] = useState(0);
  const [gameState, setGameState] = useState('loading');
  // loading | countdown | playing | finished
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);
  const [feedbackFlash, setFeedbackFlash] = useState(null); // 'acierto' | 'fallo' | null
  const [countdownNum, setCountdownNum] = useState(3);
  const [tiempoTotal, setTiempoTotal] = useState(0);

  // Historial para el resumen
  const [historial, setHistorial] = useState([]); // { simbolo, esObjetivo, respuesta: 'acierto'|'omision'|'falsoPositivo'|null }

  // Refs
  const estimuloTimeoutRef = useRef(null);
  const pausaTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const timerRef = useRef(null);
  const timerValueRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);
  const prevGameStateRef = useRef('loading');
  const respondidoRef = useRef(false);
  const estimuloIdxRef = useRef(0);
  const aciertosRef = useRef(0);
  const omisionesRef = useRef(0);
  const falsosPositivosRef = useRef(0);
  const historialRef = useRef([]);
  const secuenciaRef = useRef([]);
  const configRef = useRef(null);
  const gameStateRef = useRef('loading');
  const resultSavedRef = useRef(false);
  const nivelRef = useRef(null);
  const mostrandoRef = useRef(true);
  const isNewGameRef = useRef(false);

  // Animaciones
  const symbolScale = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // Mantener refs sincronizados
  useEffect(() => { timerValueRef.current = tiempoTotal; }, [tiempoTotal]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- Limpiar todos los timers ---
  const clearAllTimers = useCallback(() => {
    if (estimuloTimeoutRef.current) { clearTimeout(estimuloTimeoutRef.current); estimuloTimeoutRef.current = null; }
    if (pausaTimeoutRef.current) { clearTimeout(pausaTimeoutRef.current); pausaTimeoutRef.current = null; }
    if (countdownTimeoutRef.current) { clearTimeout(countdownTimeoutRef.current); countdownTimeoutRef.current = null; }
    if (feedbackTimeoutRef.current) { clearTimeout(feedbackTimeoutRef.current); feedbackTimeoutRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // --- AppState: pausar si el usuario minimiza ---
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

  // --- Finalizar partida ---
  const finalizarPartida = useCallback(() => {
    clearAllTimers();
    const ac = aciertosRef.current;
    const om = omisionesRef.current;
    const fp = falsosPositivosRef.current;
    const cfg = configRef.current;
    const totalObj = secuenciaRef.current.filter((e) => e.esObjetivo).length;
    const score = calcularPuntuacion(ac, om, fp, totalObj, cfg.totalEstimulos);
    setPuntuacion(score);
    setRefuerzoMsg(getRefuerzo(score));
    setGameState('finished');

    if (!resultSavedRef.current) {
      resultSavedRef.current = true;
      setResultSaved(true);
      guardarResultado({
        juego_id: juegoId,
        puntuacion: score,
        duracion_segundos: timerValueRef.current,
        nivel_dificultad: nivelRef.current,
      }).catch(() => {});
    }
  }, [juegoId, clearAllTimers]);

  // --- Mostrar siguiente estímulo ---
  const mostrarSiguienteEstimulo = useCallback(() => {
    const idx = estimuloIdxRef.current;
    const seq = secuenciaRef.current;
    const cfg = configRef.current;

    if (idx >= seq.length) {
      finalizarPartida();
      return;
    }

    setMostrando(true);
    mostrandoRef.current = true;
    setRespondido(false);
    respondidoRef.current = false;
    setFeedbackFlash(null);

    // Animar entrada del símbolo
    symbolScale.setValue(0.3);
    Animated.spring(symbolScale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();

    // Timeout: cuando termine el tiempo del estímulo
    estimuloTimeoutRef.current = setTimeout(() => {
      const esObj = seq[idx]?.esObjetivo;

      if (!respondidoRef.current && esObj) {
        // Omisión: era objetivo y no pulsó
        omisionesRef.current += 1;
        setOmisiones(omisionesRef.current);
        historialRef.current.push({
          simbolo: seq[idx].simbolo,
          esObjetivo: true,
          respuesta: 'omision',
        });
        setHistorial([...historialRef.current]);

        // Flash de omisión
        setFeedbackFlash('omision');
        flashOpacity.setValue(1);
        Animated.timing(flashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      } else if (!respondidoRef.current && !esObj) {
        // Correcto: no pulsó en distractor (no registramos flash)
        historialRef.current.push({
          simbolo: seq[idx].simbolo,
          esObjetivo: false,
          respuesta: null,
        });
        setHistorial([...historialRef.current]);
      }

      // Pausa entre estímulos
      setMostrando(false);
      mostrandoRef.current = false;
      estimuloIdxRef.current = idx + 1;
      setEstimuloIdx(idx + 1);

      pausaTimeoutRef.current = setTimeout(() => {
        mostrarSiguienteEstimulo();
      }, cfg.tiempoEntreMs);
    }, cfg.tiempoEstimuloMs);
  }, [finalizarPartida, symbolScale, flashOpacity]);

  // --- Handle tap (el jugador pulsa) ---
  const handleTap = useCallback(() => {
    if (gameStateRef.current !== 'playing' || !mostrandoRef.current || respondidoRef.current) return;

    respondidoRef.current = true;
    setRespondido(true);

    const idx = estimuloIdxRef.current;
    const esObj = secuenciaRef.current[idx]?.esObjetivo;

    if (esObj) {
      // Acierto
      aciertosRef.current += 1;
      setAciertos(aciertosRef.current);
      historialRef.current.push({
        simbolo: secuenciaRef.current[idx].simbolo,
        esObjetivo: true,
        respuesta: 'acierto',
      });
      setFeedbackFlash('acierto');
    } else {
      // Falso positivo
      falsosPositivosRef.current += 1;
      setFalsosPositivos(falsosPositivosRef.current);
      historialRef.current.push({
        simbolo: secuenciaRef.current[idx].simbolo,
        esObjetivo: false,
        respuesta: 'falsoPositivo',
      });
      setFeedbackFlash('fallo');
    }
    setHistorial([...historialRef.current]);

    // Flash visual
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, [flashOpacity]);

  // --- Helper para iniciar partida ---
  const iniciarPartida = useCallback((cfg) => {
    const { objetivo: obj, secuencia: seq } = generarSecuencia(cfg);

    setSecuencia(seq);
    secuenciaRef.current = seq;
    setObjetivo(obj);
    setEstimuloIdx(0);
    estimuloIdxRef.current = 0;
    setAciertos(0);
    aciertosRef.current = 0;
    setOmisiones(0);
    omisionesRef.current = 0;
    setFalsosPositivos(0);
    falsosPositivosRef.current = 0;
    setHistorial([]);
    historialRef.current = [];
    setMostrando(true);
    setRespondido(false);
    respondidoRef.current = false;
    setTiempoTotal(0);
    timerValueRef.current = 0;
    setPuntuacion(null);
    setRefuerzoMsg('');
    setResultSaved(false);
    resultSavedRef.current = false;
    setFeedbackFlash(null);
    wantsToLeaveRef.current = false;
    configRef.current = cfg;
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

  // --- Arrancar secuencia cuando empieza a jugar ---
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!isNewGameRef.current) return;
    isNewGameRef.current = false;

    // Arrancar cronómetro
    timerRef.current = setInterval(() => {
      timerValueRef.current += 1;
      setTiempoTotal(timerValueRef.current);
    }, 1000);

    // Arrancar primer estímulo
    mostrarSiguienteEstimulo();

    return () => {
      // No limpiamos aquí para permitir pausa/resume
    };
  }, [gameState, mostrarSiguienteEstimulo]);

  // --- Cargar nivel al montar ---
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      let nivelRec = 0;
      try {
        const data = await getProximoNivel(juegoId);
        nivelRec = data.nivel_recomendado ?? 0;
      } catch {
        // Sin historial — nivel 0
      }
      if (!mounted) return;
      setNivel(nivelRec);
      nivelRef.current = nivelRec;
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

  // --- Pausa / Resume ---
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
      // Reiniciar cronómetro
      timerRef.current = setInterval(() => {
        timerValueRef.current += 1;
        setTiempoTotal(timerValueRef.current);
      }, 1000);
      setGameState('playing');
      // Reanudar la secuencia desde el estímulo actual
      mostrarSiguienteEstimulo();
    }
  }, [gameState, mostrarSiguienteEstimulo]);

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
    nivelRef.current = nivelRec;
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

  const totalObjetivos = useMemo(
    () => secuencia.filter((e) => e.esObjetivo).length,
    [secuencia],
  );

  const progreso = secuencia.length > 0 ? estimuloIdx / secuencia.length : 0;

  const nivelLabel = getNivelLabel(nivel ?? 0);

  // ==============================
  // RENDER: Loading
  // ==============================
  if (gameState === 'loading' || !config) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingEmoji}>👁️</Text>
        <Text style={styles.loadingText}>Preparando la guardia...</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.countdownEmoji}>👁️</Text>
        <Text style={styles.countdownText}>¿Preparado?</Text>
        <Text style={styles.countdownTarget}>
          Pulsa solo cuando veas: {objetivo}
        </Text>
        <Text style={styles.countdownNum}>{countdownNum}</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Finished
  // ==============================
  if (gameState === 'finished') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.resultContent}
      >
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {puntuacion >= 80 ? '🏆' : puntuacion >= 50 ? '👁️' : '🌱'}
          </Text>
          <Text style={styles.resultTitle}>¡Guardia terminada!</Text>
          <Text style={styles.refuerzoText}>{refuerzoMsg}</Text>

          <View style={styles.resultDivider} />

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Puntuación</Text>
            <Text style={[
              styles.resultValue,
              { color: puntuacion >= 70 ? '#2E7D32' : puntuacion >= 45 ? '#F57F17' : '#C62828' },
            ]}>{puntuacion}/100</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>✅ Detectados</Text>
            <Text style={styles.resultValue}>{aciertos}/{totalObjetivos}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>⚠️ Omisiones</Text>
            <Text style={[styles.resultValue, omisiones > 0 && { color: '#E65100' }]}>
              {omisiones}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>❌ Falsas alarmas</Text>
            <Text style={[styles.resultValue, falsosPositivos > 0 && { color: '#C62828' }]}>
              {falsosPositivos}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>⏱️ Tiempo</Text>
            <Text style={styles.resultValue}>{formatTime(tiempoTotal)}</Text>
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
              <Text style={styles.btnPrimaryText}>👁️ Jugar de nuevo</Text>
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
  // RENDER: Playing
  // ==============================
  const estimuloActual = secuencia[estimuloIdx];

  return (
    <View style={styles.gameContainer}>
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
              <Text style={styles.pauseInfoText}>Detectados: {aciertos}</Text>
              <Text style={styles.pauseInfoText}>Fallos: {omisiones + falsosPositivos}</Text>
              <Text style={styles.pauseInfoText}>Tiempo: {formatTime(tiempoTotal)}</Text>
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

      {/* Header con info */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarLabel}>Objetivo:</Text>
          <Text style={styles.topBarTarget}>{objetivo}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Pausar juego"
          style={styles.pauseTopBtn}
          disabled={gameState !== 'playing'}
          onPress={handlePause}
        >
          <Text style={styles.pauseTopBtnIcon}>⏸️</Text>
          <Text style={styles.pauseTopBtnLabel}>Pausa</Text>
        </TouchableOpacity>
      </View>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>⏱️ Tiempo</Text>
          <Text style={styles.infoValue}>{formatTime(tiempoTotal)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>✅ Detectados</Text>
          <Text style={styles.infoValue}>{aciertos}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>❌ Fallos</Text>
          <Text style={styles.infoValue}>{omisiones + falsosPositivos}</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${Math.round(progreso * 100)}%` }]} />
      </View>

      {/* Instrucción */}
      <View style={styles.instructionBar}>
        <Text style={styles.instructionText} numberOfLines={1} adjustsFontSizeToFit>
          Pulsa solo cuando veas {objetivo}
        </Text>
      </View>

      {/* Zona del estímulo — área de toque */}
      <TouchableOpacity
        style={styles.stimulusArea}
        activeOpacity={0.7}
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel={
          mostrando && estimuloActual
            ? `Símbolo ${estimuloActual.simbolo}. Pulsa si es el objetivo`
            : 'Esperando siguiente símbolo'
        }
      >
        {mostrando && estimuloActual ? (
          <Animated.Text
            style={[
              styles.stimulusEmoji,
              { transform: [{ scale: symbolScale }] },
            ]}
          >
            {estimuloActual.simbolo}
          </Animated.Text>
        ) : (
          <View style={styles.stimulusDot} />
        )}

        {/* Flash de feedback */}
        {feedbackFlash && (
          <Animated.View
            style={[
              styles.feedbackFlash,
              {
                opacity: flashOpacity,
                backgroundColor:
                  feedbackFlash === 'acierto' ? 'rgba(46,125,50,0.25)'
                    : feedbackFlash === 'omision' ? 'rgba(230,81,0,0.25)'
                    : 'rgba(198,40,40,0.25)',
              },
            ]}
          >
            <Text style={styles.feedbackFlashText}>
              {feedbackFlash === 'acierto' ? '✅' : feedbackFlash === 'omision' ? '⚠️' : '❌'}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Contador de progreso */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>
          Estímulo {Math.min(estimuloIdx + 1, secuencia.length)} de {secuencia.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Contenedores principales ---
  centerContainer: {
    flex: 1,
    backgroundColor: '#1A237E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#E8EAF6',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#E8EAF6',
  },
  resultContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --- Loading ---
  loadingEmoji: { fontSize: 64, marginBottom: 16 },
  loadingText: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.white,
    textAlign: 'center',
  },

  // --- Countdown ---
  countdownEmoji: { fontSize: 72, marginBottom: 12 },
  countdownText: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: 8,
  },
  countdownTarget: {
    fontSize: fonts.body,
    color: '#C5CAE9',
    marginBottom: 24,
    textAlign: 'center',
  },
  countdownNum: {
    fontSize: 80,
    fontWeight: fonts.bold,
    color: '#FFAB00',
  },

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#283593',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarLabel: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#C5CAE9',
  },
  topBarTarget: {
    fontSize: 36,
  },
  pauseTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pauseTopBtnIcon: { fontSize: 18 },
  pauseTopBtnLabel: {
    fontSize: fonts.small,
    color: colors.white,
    fontWeight: fonts.semibold,
  },

  // --- Info bar ---
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#303F9F',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#9FA8DA' },
  infoValue: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: colors.white,
  },

  // --- Progress bar ---
  progressBarBg: {
    height: 6,
    backgroundColor: '#C5CAE9',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#FFAB00',
  },

  // --- Instruction bar ---
  instructionBar: {
    backgroundColor: '#3949AB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: colors.white,
  },

  // --- Stimulus area ---
  stimulusArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stimulusEmoji: {
    fontSize: 120,
  },
  stimulusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9FA8DA',
  },

  // --- Feedback flash ---
  feedbackFlash: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackFlashText: {
    fontSize: 60,
  },

  // --- Bottom bar ---
  bottomBar: {
    backgroundColor: '#283593',
    paddingVertical: 12,
    alignItems: 'center',
    paddingBottom: 30,
  },
  bottomText: {
    fontSize: fonts.small,
    color: '#9FA8DA',
    fontWeight: fonts.semibold,
  },

  // --- Pause modal ---
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

  // --- Result card ---
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  resultEmoji: { fontSize: 56, marginBottom: 4 },
  resultTitle: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.text,
  },
  refuerzoText: {
    fontSize: fonts.body,
    color: colors.lightText,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
  },
  resultLabel: {
    fontSize: fonts.body,
    color: colors.lightText,
  },
  resultValue: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: colors.text,
  },
  resultBadge: {
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
  },
  resultBadgeText: {
    fontSize: fonts.small,
    color: '#1B5E20',
    textAlign: 'center',
    fontWeight: fonts.semibold,
  },

  // --- Buttons ---
  resultButtons: {
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#283593',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },
  btnSecondary: {
    backgroundColor: '#E8EAF6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnSecondaryText: {
    color: '#283593',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
