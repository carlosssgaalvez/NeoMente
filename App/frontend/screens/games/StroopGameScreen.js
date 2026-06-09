import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AppState, ScrollView, Modal, Dimensions, Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Colores del juego Stroop ---
const COLORES = [
  { nombre: 'ROJO',     hex: '#D32F2F', hexClaro: '#FFCDD2' },
  { nombre: 'AZUL',     hex: '#1565C0', hexClaro: '#BBDEFB' },
  { nombre: 'VERDE',    hex: '#2E7D32', hexClaro: '#C8E6C9' },
  { nombre: 'AMARILLO', hex: '#F9A825', hexClaro: '#FFF9C4' },
  { nombre: 'NARANJA',  hex: '#E65100', hexClaro: '#FFE0B2' },
  { nombre: 'MORADO',   hex: '#7B1FA2', hexClaro: '#E1BEE7' },
];

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Atención de semáforo en verde! Impresionante 🌟',
    '¡Perfecto! Tu concentración es inmejorable 🏆',
    '¡Extraordinario! Ningún color te confunde 🧠✨',
  ],
  bueno: [
    '¡Muy bien! Tu atención mejora cada día 🚦',
    '¡Buen trabajo! Casi no te confundes 💪',
    '¡Genial! Resistes muy bien los engaños 🌈',
  ],
  regular: [
    '¡Bien hecho! El truco de los colores es difícil 🚥',
    '¡Sigue así! Cada intento fortalece tu atención 🌿',
    '¡Ánimo! Es normal confundirse, pronto lo dominarás 💚',
  ],
  bajo: [
    '¡No te rindas! Este juego engaña a cualquiera 🌱',
    '¡Buen intento! Lee despacio y fíjate en el color 💪',
    '¡Cada partida entrena tu atención! Tú puedes 🚦',
  ],
};

/**
 * Selecciona un mensaje de refuerzo positivo aleatorio según puntuación.
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
 * Convierte nivel de dificultad (0-100) a configuración de ronda.
 * @param {number} nivel - Nivel 0-100.
 * @returns {{ totalRondas: number, numOpciones: number, tiempoPorRonda: number, incluirInvertidas: boolean }}
 */
function nivelAConfig(nivel) {
  // numOpciones: botones de color para elegir
  // tiempoPorRonda: ms para responder (0 = sin límite)
  // incluirInvertidas: rondas donde se pide la PALABRA en vez del color
  if (nivel <= 10) return { totalRondas: 8,  numOpciones: 3, tiempoPorRonda: 0,    incluirInvertidas: false };
  if (nivel <= 22) return { totalRondas: 10, numOpciones: 3, tiempoPorRonda: 8000, incluirInvertidas: false };
  if (nivel <= 36) return { totalRondas: 10, numOpciones: 4, tiempoPorRonda: 7000, incluirInvertidas: false };
  if (nivel <= 50) return { totalRondas: 12, numOpciones: 4, tiempoPorRonda: 6000, incluirInvertidas: false };
  if (nivel <= 64) return { totalRondas: 12, numOpciones: 5, tiempoPorRonda: 5000, incluirInvertidas: false };
  if (nivel <= 78) return { totalRondas: 14, numOpciones: 5, tiempoPorRonda: 4500, incluirInvertidas: true };
  if (nivel <= 90) return { totalRondas: 14, numOpciones: 6, tiempoPorRonda: 4000, incluirInvertidas: true };
  return              { totalRondas: 16, numOpciones: 6, tiempoPorRonda: 3500, incluirInvertidas: true };
}

/**
 * Genera una ronda Stroop.
 * @param {number} numOpciones - Número de botones de color.
 * @param {boolean} invertida - Si true, se pide la PALABRA en vez del color.
 * @returns {{ palabra: string, colorPalabra: object, colorTexto: object, opciones: Array, correcta: object, invertida: boolean }}
 */
function generarRonda(numOpciones, invertida) {
  // Elegir la palabra (nombre del color) y el color del texto (diferente)
  const indices = [...Array(COLORES.length).keys()];
  // Barajar
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const colorPalabra = COLORES[indices[0]]; // Lo que dice la palabra
  let colorTexto = COLORES[indices[1]];     // Color con el que se pinta

  // Asegurar que palabra ≠ color del texto (efecto Stroop)
  if (colorPalabra.nombre === colorTexto.nombre) {
    colorTexto = COLORES[indices[2]];
  }

  // La respuesta correcta depende del modo
  const correcta = invertida ? colorPalabra : colorTexto;

  // Generar opciones: incluir siempre la correcta + llenar con distractores
  const opcionesSet = new Set([correcta.nombre]);
  // Añadir la otra (el "engaño" Stroop) como distractor
  const engano = invertida ? colorTexto : colorPalabra;
  opcionesSet.add(engano.nombre);

  // Llenar con colores aleatorios
  const coloresBarajados = [...indices].map((i) => COLORES[i]);
  for (const c of coloresBarajados) {
    if (opcionesSet.size >= numOpciones) break;
    opcionesSet.add(c.nombre);
  }

  // Barajar opciones
  const opcionesArr = [...opcionesSet];
  for (let i = opcionesArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opcionesArr[i], opcionesArr[j]] = [opcionesArr[j], opcionesArr[i]];
  }
  const opciones = opcionesArr.map((nombre) => COLORES.find((c) => c.nombre === nombre));

  return {
    palabra: colorPalabra.nombre,
    colorPalabra,
    colorTexto,
    opciones,
    correcta,
    invertida,
  };
}

/**
 * Genera todas las rondas para una partida.
 * @param {object} config - Configuración del nivel.
 * @returns {Array}
 */
function generarPartida(config) {
  const rondas = [];
  for (let i = 0; i < config.totalRondas; i++) {
    // Si incluirInvertidas, ~25% de las rondas son invertidas
    const invertida = config.incluirInvertidas && Math.random() < 0.25;
    rondas.push(generarRonda(config.numOpciones, invertida));
  }
  return rondas;
}

/**
 * Calcula la puntuación (0-100).
 * @param {number} aciertos - Respuestas correctas.
 * @param {number} total - Total de rondas.
 * @param {number} segundos - Tiempo total.
 * @param {number} totalRondas - Para calcular tiempo ideal.
 * @returns {number}
 */
function calcularPuntuacion(aciertos, total, segundos, totalRondas) {
  const precision = aciertos / total;
  const tiempoIdeal = totalRondas * 3;
  const tiempoFactor = Math.max(0, 1 - (segundos / tiempoIdeal) * 0.3);
  const raw = precision * 75 + tiempoFactor * 25;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Nombre temático del nivel.
 * @param {number} nivel - Nivel 0-100.
 * @returns {string}
 */
function getNivelLabel(nivel) {
  if (nivel <= 10) return 'Peatón';
  if (nivel <= 22) return 'Ciclista';
  if (nivel <= 36) return 'Conductor';
  if (nivel <= 50) return 'Taxista';
  if (nivel <= 64) return 'Piloto';
  if (nivel <= 78) return 'Controlador';
  if (nivel <= 90) return 'Jefe de tráfico';
  return 'Maestro del semáforo';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Pantalla principal del juego ---
export default function StroopGameScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;
  const insets = useSafeAreaInsets();

  // Estado del juego
  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [rondas, setRondas] = useState([]);
  const [rondaIdx, setRondaIdx] = useState(0);
  const [respuestas, setRespuestas] = useState([]); // { correcto, tiempoMs }
  const [timer, setTimer] = useState(0);
  const [roundTimer, setRoundTimer] = useState(0); // countdown por ronda (ms)
  const [gameState, setGameState] = useState('loading');
  // loading | countdown | playing | feedback | finished
  const [feedbackCorrecto, setFeedbackCorrecto] = useState(null);
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const timerValueRef = useRef(0);
  const roundTimerRef = useRef(null);
  const roundStartRef = useRef(0); // timestamp del inicio de la ronda
  const feedbackTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);
  const prevGameStateRef = useRef('loading');
  const gameStateRef = useRef('loading'); // evita doble toque con estado stale

  // Animaciones
  const wordScaleAnim = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  // Mantener timerValueRef sincronizado
  useEffect(() => { timerValueRef.current = timer; }, [timer]);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- Limpiar todos los timers ---
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }
    if (feedbackTimeoutRef.current) { clearTimeout(feedbackTimeoutRef.current); feedbackTimeoutRef.current = null; }
    if (countdownTimeoutRef.current) { clearTimeout(countdownTimeoutRef.current); countdownTimeoutRef.current = null; }
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

  // --- Helper para iniciar partida ---
  const iniciarPartida = useCallback((cfg) => {
    const nuevasRondas = generarPartida(cfg);
    setRondas(nuevasRondas);
    setRondaIdx(0);
    setRespuestas([]);
    setTimer(0);
    setRoundTimer(0);
    setPuntuacion(null);
    setRefuerzoMsg('');
    setResultSaved(false);
    setFeedbackCorrecto(null);
    wantsToLeaveRef.current = false;
    clearAllTimers();
    // Iniciar con countdown 3-2-1
    setGameState('countdown');
  }, [clearAllTimers]);

  // --- Countdown 3-2-1 ---
  const [countdownNum, setCountdownNum] = useState(3);

  useEffect(() => {
    if (gameState !== 'countdown') return;
    setCountdownNum(3);
    let count = 3;

    const tick = () => {
      count--;
      if (count <= 0) {
        setGameState('playing');
        roundStartRef.current = Date.now();
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

  // --- Animación de palabra al cambiar ronda ---
  useEffect(() => {
    if (gameState === 'playing') {
      wordScaleAnim.setValue(0.5);
      const anim = Animated.spring(wordScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }
  }, [gameState, rondaIdx, wordScaleAnim]);

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

  // --- Cronómetro global (corre en playing y feedback) ---
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'feedback') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
      }
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [gameState]);

  // --- Timer por ronda (countdown visual) ---
  useEffect(() => {
    if (gameState === 'playing' && config?.tiempoPorRonda > 0) {
      setRoundTimer(config.tiempoPorRonda);
      roundStartRef.current = Date.now();

      roundTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - roundStartRef.current;
        const remaining = Math.max(0, config.tiempoPorRonda - elapsed);
        setRoundTimer(remaining);

        if (remaining <= 0) {
          // Tiempo agotado — registrar como fallo
          if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }
          handleTimeout();
        }
      }, 100);
    } else {
      setRoundTimer(0);
      if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }
    }
    return () => {
      if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, rondaIdx]);

  // --- Finalizar partida ---
  const finalizarPartida = useCallback((todasRespuestas) => {
    clearAllTimers();
    const aciertos = todasRespuestas.filter((r) => r.correcto).length;
    const tiempoActual = timerValueRef.current;
    const score = calcularPuntuacion(aciertos, todasRespuestas.length, tiempoActual, rondas.length);
    setPuntuacion(score);
    setRefuerzoMsg(getRefuerzo(score));
    setGameState('finished');

    if (!resultSaved) {
      setResultSaved(true);
      guardarResultado({
        juego_id: juegoId,
        puntuacion: score,
        duracion_segundos: tiempoActual,
        nivel_dificultad: nivel,
      }).catch(() => {
        Alert.alert('Error', 'No se pudo guardar el resultado.');
      });
    }
  }, [rondas, juegoId, nivel, resultSaved, clearAllTimers]);

  // --- Avanzar a siguiente ronda ---
  const avanzarRonda = useCallback((nuevasRespuestas) => {
    const nextIdx = rondaIdx + 1;
    if (nextIdx >= rondas.length) {
      finalizarPartida(nuevasRespuestas);
    } else {
      setRondaIdx(nextIdx);
      setFeedbackCorrecto(null);
      setGameState('playing');
      roundStartRef.current = Date.now();
    }
  }, [rondaIdx, rondas, finalizarPartida]);

  // --- Handler de timeout ---
  const handleTimeout = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    gameStateRef.current = 'feedback';
    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }

    const nuevaRespuesta = { correcto: false, tiempoMs: config?.tiempoPorRonda ?? 0 };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    setFeedbackCorrecto(false);
    setGameState('feedback');

    // Animación feedback
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();

    feedbackTimeoutRef.current = setTimeout(() => {
      avanzarRonda(nuevasRespuestas);
    }, 1200);
  }, [config, respuestas, avanzarRonda, feedbackOpacity]);

  // --- Handler de respuesta ---
  const handleSelectColor = useCallback((colorSeleccionado) => {
    if (gameStateRef.current !== 'playing') return;
    gameStateRef.current = 'feedback';
    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }

    const ronda = rondas[rondaIdx];
    const correcto = colorSeleccionado.nombre === ronda.correcta.nombre;
    const tiempoMs = Date.now() - roundStartRef.current;
    const nuevaRespuesta = { correcto, tiempoMs };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    setFeedbackCorrecto(correcto);
    setGameState('feedback');

    // Animación feedback
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: correcto ? 600 : 800,
      delay: correcto ? 200 : 600,
      useNativeDriver: true,
    }).start();

    feedbackTimeoutRef.current = setTimeout(() => {
      avanzarRonda(nuevasRespuestas);
    }, correcto ? 600 : 1200);
  }, [rondas, rondaIdx, respuestas, avanzarRonda, feedbackOpacity]);

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
      roundStartRef.current = Date.now();
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

  const aciertos = useMemo(
    () => respuestas.filter((r) => r.correcto).length,
    [respuestas],
  );

  // ==============================
  // RENDER: Loading
  // ==============================
  if (gameState === 'loading' || !config) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingEmoji}>🚦</Text>
        <Text style={styles.loadingText}>Preparando el semáforo...</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.countdownEmoji}>🚦</Text>
        <Text style={styles.countdownText}>¿Preparado?</Text>
        <Text style={styles.countdownNum}>{countdownNum}</Text>
        <Text style={styles.countdownHint}>
          Toca el color de las letras, no la palabra
        </Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Resultado
  // ==============================
  if (gameState === 'finished') {
    const nivelLabel = getNivelLabel(nivel);
    const totalRondas = rondas.length;
    const tiempoMedio = respuestas.length > 0
      ? Math.round(respuestas.reduce((sum, r) => sum + r.tiempoMs, 0) / respuestas.length)
      : 0;

    return (
      <ScrollView
        style={styles.resultScroll}
        contentContainerStyle={styles.resultContainer}
      >
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {puntuacion >= 90 ? '🏆' : puntuacion >= 70 ? '🚦' : puntuacion >= 45 ? '🚥' : '🌱'}
          </Text>
          <Text style={styles.resultTitle} accessibilityRole="header">
            ¡Semáforo completado!
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
            <Text style={styles.resultLabel}>Aciertos</Text>
            <Text style={styles.resultValue}>{aciertos}/{totalRondas}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tiempo total</Text>
            <Text style={styles.resultValue}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tiempo medio</Text>
            <Text style={styles.resultValue}>{(tiempoMedio / 1000).toFixed(1)}s</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nivel</Text>
            <Text style={styles.resultValue}>{nivelLabel} ({nivel})</Text>
          </View>

          {/* Resumen ronda a ronda */}
          <View style={styles.resumenContainer}>
            <Text style={styles.resumenTitle}>Resumen de rondas</Text>
            {rondas.map((ronda, idx) => {
              const resp = respuestas[idx];
              return (
                <View key={idx} style={styles.resumenRow}>
                  <Text style={[styles.resumenPalabra, { color: ronda.colorTexto.hex }]}>
                    {ronda.palabra}
                  </Text>
                  <Text style={styles.resumenFlecha}>→</Text>
                  <View style={[styles.resumenColorDot, { backgroundColor: ronda.correcta.hex }]} />
                  <Text style={styles.resumenColorNombre}>{ronda.correcta.nombre}</Text>
                  <Text style={styles.resumenIcon}>{resp?.correcto ? '✅' : '❌'}</Text>
                </View>
              );
            })}
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
              <Text style={styles.btnPrimaryText}>🚦 Jugar de nuevo</Text>
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
  // RENDER: Playing / Feedback
  // ==============================
  const ronda = rondas[rondaIdx];
  if (!ronda) return null;

  const roundProgress = config.tiempoPorRonda > 0
    ? Math.max(0, roundTimer / config.tiempoPorRonda)
    : 1;

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
              <Text style={styles.pauseInfoText}>Ronda: {rondaIdx + 1}/{rondas.length}</Text>
              <Text style={styles.pauseInfoText}>Aciertos: {aciertos}</Text>
              <Text style={styles.pauseInfoText}>Tiempo: {formatTime(timer)}</Text>
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
        <Text style={styles.topBarTitle}>🚦 El Semáforo</Text>
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
          <Text style={styles.infoLabel}>Ronda</Text>
          <Text style={styles.infoValue}>{rondaIdx + 1}/{rondas.length}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Aciertos</Text>
          <Text style={styles.infoValue}>{aciertos}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tiempo</Text>
          <Text style={styles.infoValue}>{formatTime(timer)}</Text>
        </View>
      </View>

      {/* Timer bar (si hay límite de tiempo) */}
      {config.tiempoPorRonda > 0 && gameState === 'playing' && (
        <View style={styles.timerBarContainer}>
          <View
            style={[
              styles.timerBar,
              {
                width: `${roundProgress * 100}%`,
                backgroundColor: roundProgress > 0.4 ? '#4CAF50'
                  : roundProgress > 0.2 ? '#FF9800' : '#F44336',
              },
            ]}
          />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.gameScrollContent}
        bounces={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Instrucción */}
        <View style={styles.instructionBar}>
          <Text style={styles.instructionText}>
            {ronda.invertida
              ? '📖 ¿Qué PALABRA ves?'
              : '🎨 ¿De qué COLOR son las letras?'}
          </Text>
        </View>

        {/* Palabra Stroop */}
        <View style={styles.wordContainer}>
          <Animated.Text
            style={[
              styles.stroopWord,
              { color: ronda.colorTexto.hex, transform: [{ scale: wordScaleAnim }] },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            accessibilityLabel={`La palabra ${ronda.palabra} escrita en color ${ronda.colorTexto.nombre}`}
          >
            {ronda.palabra}
          </Animated.Text>
        </View>

        {/* Botones de color */}
        <View style={styles.optionsContainer}>
          {ronda.opciones.map((color, idx) => {
            const isDisabled = gameState === 'feedback';
            return (
              <TouchableOpacity
                key={`${rondaIdx}-${color.nombre}-${idx}`}
                style={[
                  styles.colorBtn,
                  { backgroundColor: color.hex },
                  isDisabled && styles.colorBtnDisabled,
                ]}
                onPress={() => handleSelectColor(color)}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityLabel={`Color ${color.nombre}`}
              >
                <Text style={styles.colorBtnText}>{color.nombre}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Feedback flotante */}
      {gameState === 'feedback' && feedbackCorrecto !== null && (
        <Animated.View
          style={[
            styles.feedbackFloating,
            { opacity: feedbackOpacity },
          ]}
        >
          <Text style={styles.feedbackText}>
            {feedbackCorrecto ? '✅ ¡Correcto!' : '❌ Incorrecto'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Layout ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#263238',
  },
  loadingEmoji: { fontSize: 60, marginBottom: 16 },
  loadingText: { fontSize: fonts.h2, color: '#B0BEC5', fontWeight: fonts.semibold },

  // --- Countdown ---
  countdownEmoji: { fontSize: 60, marginBottom: 16 },
  countdownText: {
    fontSize: fonts.h2,
    color: '#B0BEC5',
    fontWeight: fonts.semibold,
    marginBottom: 12,
  },
  countdownNum: {
    fontSize: 72,
    fontWeight: fonts.bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  countdownHint: {
    fontSize: fonts.body,
    color: '#78909C',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  gameContainer: {
    flex: 1,
    backgroundColor: '#263238',
  },
  gameScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#37474F',
  },
  topBarBtn: {
    padding: 4,
    minWidth: 50,
  },
  topBarBack: {
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: '#37474F',
    borderBottomWidth: 1,
    borderBottomColor: '#455A64',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#90A4AE', marginBottom: 2 },
  infoValue: { fontSize: fonts.body, fontWeight: fonts.bold, color: colors.white },

  // --- Timer bar ---
  timerBarContainer: {
    height: 6,
    backgroundColor: '#455A64',
    width: '100%',
  },
  timerBar: {
    height: 6,
    borderRadius: 3,
  },

  // --- Instrucción ---
  instructionBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#ECEFF1',
    textAlign: 'center',
  },

  // --- Palabra Stroop ---
  wordContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
    maxHeight: 200,
  },
  stroopWord: {
    fontSize: 56,
    fontWeight: fonts.bold,
    letterSpacing: 4,
    textAlign: 'center',
  },

  // --- Feedback flotante ---
  feedbackFloating: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    zIndex: 10,
  },
  feedbackText: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: colors.white,
  },

  // --- Opciones de color ---
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  colorBtn: {
    minWidth: SCREEN_WIDTH / 2 - 28,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  colorBtnDisabled: {
    opacity: 0.5,
  },
  colorBtnText: {
    color: colors.white,
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: '#263238',
  },
  resultContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultCard: {
    backgroundColor: '#37474F',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resultEmoji: { fontSize: 64, marginBottom: 8 },
  resultTitle: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  refuerzoContainer: {
    backgroundColor: '#263238',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  refuerzoText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#81C784',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultDivider: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#455A64',
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#455A64',
  },
  resultLabel: {
    fontSize: fonts.body,
    color: '#B0BEC5',
  },
  resultValue: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: colors.white,
  },
  resumenContainer: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#263238',
    borderRadius: 16,
    padding: 16,
  },
  resumenTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#B0BEC5',
    marginBottom: 10,
    textAlign: 'center',
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#37474F',
  },
  resumenPalabra: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    width: 85,
  },
  resumenFlecha: {
    fontSize: 14,
    color: '#78909C',
    marginHorizontal: 6,
  },
  resumenColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  resumenColorNombre: {
    flex: 1,
    fontSize: 14,
    color: '#B0BEC5',
  },
  resumenIcon: { fontSize: 18 },
  resultBadge: {
    marginTop: 16,
    backgroundColor: '#263238',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#81C784',
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
    borderColor: '#78909C',
  },
  btnSecondaryText: {
    color: '#B0BEC5',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
