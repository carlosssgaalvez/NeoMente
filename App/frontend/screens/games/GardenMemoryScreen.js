import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  Alert, AppState, ScrollView, Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Catálogo de plantas (emoji + nombre) ---
const PLANTAS = [
  { emoji: '🌻', nombre: 'Girasol' },
  { emoji: '🌹', nombre: 'Rosa' },
  { emoji: '🌷', nombre: 'Tulipán' },
  { emoji: '🌵', nombre: 'Cactus' },
  { emoji: '🌸', nombre: 'Cerezo' },
  { emoji: '🪻', nombre: 'Lavanda' },
  { emoji: '🌺', nombre: 'Hibisco' },
  { emoji: '🍀', nombre: 'Trébol' },
  { emoji: '🌾', nombre: 'Trigo' },
  { emoji: '🌿', nombre: 'Helecho' },
  { emoji: '🪴', nombre: 'Planta' },
  { emoji: '🌼', nombre: 'Margarita' },
];

// --- Mensajes de refuerzo positivo según puntuación ---
const REFUERZOS = {
  excelente: [
    '¡Increíble! Tu memoria es asombrosa 🌟',
    '¡Perfecto! Tu jardín brilla con fuerza 🏆',
    '¡Extraordinario! Eres un verdadero jardinero mental 🧠✨',
  ],
  bueno: [
    '¡Muy bien! Tu jardín florece con cada partida 🌻',
    '¡Buen trabajo! Cada día tu memoria se fortalece 💪',
    '¡Genial! Estás progresando de maravilla 🌈',
  ],
  regular: [
    '¡Bien hecho! La práctica hace al maestro 🌱',
    '¡Sigue así! Tu jardín crece poco a poco 🌿',
    '¡Ánimo! Cada intento cuenta y te hace mejor 💚',
  ],
  bajo: [
    '¡No te rindas! Los mejores jardines necesitan paciencia 🌱',
    '¡Buen intento! La próxima vez lo harás mejor 💪',
    '¡Cada partida es un paso adelante! Tú puedes 🌻',
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
 * Convierte nivel de dificultad (0-100) a configuración de tablero.
 * 10 escalones para progresión gradual.
 */
function nivelAConfig(nivel) {
  // cols×rows optimizados para pantalla móvil (~390×844).
  // Regla: cols×rows >= pares×2. Filas centradas si sobran huecos.
  if (nivel <= 5)  return { pares: 2,  cols: 2, rows: 2, tiempoVistazo: 8000 };  //  4 cartas → 2×2
  if (nivel <= 12) return { pares: 3,  cols: 3, rows: 2, tiempoVistazo: 7000 };  //  6 cartas → 3×2
  if (nivel <= 22) return { pares: 4,  cols: 3, rows: 3, tiempoVistazo: 6000 };  //  8 cartas → 3×3
  if (nivel <= 32) return { pares: 5,  cols: 4, rows: 3, tiempoVistazo: 5000 };  // 10 cartas → 4×3
  if (nivel <= 42) return { pares: 6,  cols: 4, rows: 3, tiempoVistazo: 4400 };  // 12 cartas → 4×3
  if (nivel <= 55) return { pares: 7,  cols: 4, rows: 4, tiempoVistazo: 4000 };  // 14 cartas → 4×4
  if (nivel <= 65) return { pares: 8,  cols: 4, rows: 4, tiempoVistazo: 3400 };  // 16 cartas → 4×4
  if (nivel <= 75) return { pares: 9,  cols: 4, rows: 5, tiempoVistazo: 2800 };  // 18 cartas → 4×5
  if (nivel <= 85) return { pares: 10, cols: 4, rows: 5, tiempoVistazo: 2200 };  // 20 cartas → 4×5
  if (nivel <= 93) return { pares: 11, cols: 4, rows: 6, tiempoVistazo: 1600 };  // 22 cartas → 4×6
  return               { pares: 12, cols: 4, rows: 6, tiempoVistazo: 1000 };  // 24 cartas → 4×6
}

/**
 * Baraja un array usando Fisher-Yates.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Genera el tablero de macetas con las parejas de plantas.
 */
function generarTablero(pares) {
  const seleccion = shuffle(PLANTAS).slice(0, pares);
  const cartas = [];
  seleccion.forEach((planta, idx) => {
    cartas.push({ id: cartas.length, plantaIdx: idx, planta });
    cartas.push({ id: cartas.length, plantaIdx: idx, planta });
  });
  return shuffle(cartas);
}

/**
 * Calcula la puntuación de la partida (0-100).
 */
function calcularPuntuacion(pares, intentos, segundos, tiempoLimite) {
  const eficiencia = pares / Math.max(intentos, pares);
  const tiempoFactor = Math.max(0, 1 - (segundos / tiempoLimite) * 0.5);
  const raw = eficiencia * 70 + tiempoFactor * 30;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Nombre temático del nivel.
 */
function getNivelLabel(nivel) {
  if (nivel <= 5)  return 'Semillero';
  if (nivel <= 12) return 'Brote';
  if (nivel <= 22) return 'Plantón';
  if (nivel <= 32) return 'Arbusto';
  if (nivel <= 42) return 'Pradera';
  if (nivel <= 55) return 'Jardín';
  if (nivel <= 65) return 'Huerto';
  if (nivel <= 75) return 'Bosque';
  if (nivel <= 85) return 'Jungla';
  if (nivel <= 93) return 'Selva';
  return 'Edén';
}

// --- Componente de una maceta (memo para evitar re-renders innecesarios) ---
const Maceta = React.memo(function Maceta({ carta, isFlipped, isMatched, shouldShake, onPress, size }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const matchAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.spring(flipAnim, {
      toValue: isFlipped || isMatched ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [isFlipped, isMatched, flipAnim]);

  useEffect(() => {
    if (isMatched) {
      const anim = Animated.sequence([
        Animated.timing(matchAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
        Animated.timing(matchAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }
  }, [isMatched, matchAnim]);

  useEffect(() => {
    if (shouldShake) {
      const anim = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }
  }, [shouldShake, shakeAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isFlipped || isMatched}
      activeOpacity={0.8}
      accessible
      accessibilityRole="button"
      accessibilityLabel={isMatched ? `${carta.planta.nombre} encontrada` : 'Maceta cerrada'}
      accessibilityHint={!isMatched ? 'Pulsa para descubrir la planta' : ''}
    >
      <Animated.View style={[
        styles.macetaContainer,
        { width: size, height: size, transform: [{ translateX: shakeAnim }, { scale: matchAnim }] },
      ]}>
        {/* Reverso (maceta cerrada) */}
        <Animated.View style={[
          styles.macetaFace, styles.macetaBack,
          { width: size, height: size, transform: [{ rotateY: backInterpolate }] },
        ]}>
          <Text style={styles.macetaEmoji}>🪴</Text>
          <View style={styles.macetaTierra} />
        </Animated.View>
        {/* Frente (planta revelada) */}
        <Animated.View style={[
          styles.macetaFace, styles.macetaFront,
          isMatched && styles.macetaMatched,
          { width: size, height: size, transform: [{ rotateY: frontInterpolate }] },
        ]}>
          <Text style={[styles.plantaEmoji, { fontSize: size * 0.45 }]}>{carta.planta.emoji}</Text>
          <Text style={styles.plantaNombre}>{carta.planta.nombre}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// --- Pantalla principal del juego ---
export default function GardenMemoryScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;
  const insets = useSafeAreaInsets();

  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [tablero, setTablero] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [shaking, setShaking] = useState([]);
  const [intentos, setIntentos] = useState(0);
  const [paresEncontrados, setParesEncontrados] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading | countdown | preview | playing | paused | finished
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [previewSeconds, setPreviewSeconds] = useState(0);

  const timerRef = useRef(null);
  const lockRef = useRef(false);
  const flippedRef = useRef([]);
  const previewTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const previewTimerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);

  // Mantener flippedRef sincronizado para evitar stale closures en handlePress
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);

  // --- AppState: pausar si el usuario minimiza o cambia de app ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        setGameState((prev) => {
          if (prev === 'playing' || prev === 'countdown') return 'paused';
          return prev;
        });
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // --- Helper para inicializar/reiniciar partida ---
  const iniciarPartida = useCallback((cfg) => {
    const nuevoTablero = generarTablero(cfg.pares);
    setTablero(nuevoTablero);
    setFlipped(nuevoTablero.map((_, i) => i));
    setMatched([]);
    setShaking([]);
    setIntentos(0);
    setParesEncontrados(0);
    setTimer(0);
    setPuntuacion(null);
    setRefuerzoMsg('');
    setResultSaved(false);
    lockRef.current = false;
    wantsToLeaveRef.current = false;
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    setGameState('countdown');
  }, []);

  // --- Countdown 3-2-1 → preview ---
  useEffect(() => {
    if (gameState !== 'countdown') return;
    setCountdownNum(3);
    let count = 3;

    const tick = () => {
      count--;
      if (count <= 0) {
        // Transición a preview: mostrar todas las cartas
        const totalSec = Math.ceil((config?.tiempoVistazo ?? 5000) / 1000);
        setPreviewSeconds(totalSec);
        setGameState('preview');
        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(() => {
          setFlipped([]);
          setGameState('playing');
        }, config?.tiempoVistazo ?? 5000);
      } else {
        setCountdownNum(count);
        countdownTimeoutRef.current = setTimeout(tick, 800);
      }
    };
    countdownTimeoutRef.current = setTimeout(tick, 800);

    return () => {
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, [gameState, config]);

  // --- Cuenta atrás visual durante preview ---
  useEffect(() => {
    if (gameState === 'preview') {
      previewTimerRef.current = setInterval(() => {
        setPreviewSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    } else {
      if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    }
    return () => {
      if (previewTimerRef.current) { clearInterval(previewTimerRef.current); previewTimerRef.current = null; }
    };
  }, [gameState]);

  // --- Cargar nivel recomendado al montar ---
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      let nivelRec = 0;
      try {
        const data = await getProximoNivel(juegoId);
        nivelRec = data.nivel_recomendado ?? 0;
      } catch {
        // Sin historial o error de red — nivel 0
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
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, [juegoId, iniciarPartida]);

  // --- Cronómetro: solo corre en estado 'playing' ---
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [gameState]);

  // --- Comprobar fin de partida ---
  useEffect(() => {
    if (!config || gameState !== 'playing' || resultSaved) return;
    if (paresEncontrados === config.pares) {
      setGameState('finished');
      const tiempoLimite = config.pares * 15;
      const score = calcularPuntuacion(config.pares, intentos, timer, tiempoLimite);
      setPuntuacion(score);
      setRefuerzoMsg(getRefuerzo(score));
      setResultSaved(true);

      guardarResultado({
        juego_id: juegoId,
        puntuacion: score,
        duracion_segundos: timer,
        nivel_dificultad: nivel,
      }).catch(() => {});
    }
  }, [paresEncontrados, config, gameState, intentos, timer, nivel, juegoId, resultSaved]);

  // --- Handler de pulsación (usa ref para evitar stale closure) ---
  const handlePress = useCallback((index) => {
    if (lockRef.current || gameState !== 'playing') return;
    const currentFlipped = flippedRef.current;
    // No permitir más de 2 cartas, ni re-pulsar una ya volteada/emparejada
    if (currentFlipped.length >= 2) return;
    if (currentFlipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...currentFlipped, index];
    // Bloquear inmediatamente si se alcanza el par
    if (newFlipped.length === 2) lockRef.current = true;
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setIntentos((i) => i + 1);

      const [first, second] = newFlipped;
      if (tablero[first].plantaIdx === tablero[second].plantaIdx) {
        setTimeout(() => {
          setMatched((m) => [...m, first, second]);
          setParesEncontrados((p) => p + 1);
          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setShaking([first, second]);
        setTimeout(() => {
          setFlipped([]);
          setShaking([]);
          lockRef.current = false;
        }, 900);
      }
    }
  }, [matched, tablero, gameState]);

  // --- Pausa / Reanudación ---
  const handlePause = useCallback(() => {
    if (gameState === 'playing' || gameState === 'countdown') {
      if (countdownTimeoutRef.current) { clearTimeout(countdownTimeoutRef.current); countdownTimeoutRef.current = null; }
      setGameState('paused');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'paused') {
      lockRef.current = false;
      setGameState('playing');
    }
  }, [gameState]);

  // --- Replay ---
  const handleReplay = useCallback(async () => {
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
  }, [juegoId, nivel, iniciarPartida]);

  // --- Salir con confirmación (pausa el timer mientras decide) ---
  const handleExit = useCallback(() => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : prev));
    Alert.alert(
      'Salir del juego',
      '¿Seguro que quieres abandonar la partida? No se guardará el progreso.',
      [
        {
          text: 'Seguir jugando',
          style: 'cancel',
          onPress: () => { wantsToLeaveRef.current = false; setGameState('playing'); },
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => { wantsToLeaveRef.current = true; navigation.goBack(); },
        },
      ],
      { cancelable: false },
    );
  }, [navigation]);

  // --- Salir directamente (desde modal de pausa, sin doble confirmación) ---
  const handleForceExit = useCallback(() => {
    wantsToLeaveRef.current = true;
    navigation.goBack();
  }, [navigation]);

  // --- Interceptar gesto "back" del sistema / swipe ---
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gameState === 'finished' || gameState === 'loading') return;
      if (wantsToLeaveRef.current) return; // permitir salir si ya confirmó
      e.preventDefault();
      handleExit();
    });
    return unsubscribe;
  }, [navigation, gameState, handleExit]);

  // --- Tamaño de macetas (ajustado a ancho Y alto disponible) ---
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const cols = config?.cols || 2;
  const rows = config?.rows || 2;
  const gap = 10;
  const padding = 16;
  // Espacio ocupado por elementos fijos:
  // topBar(~82) + infoBar(~48) + previewBanner(~40) + progressBar(~42)
  // + fences(12) + gardenPadding(24) + márgenes extra(12)
  const fixedVertical = 260;
  const macetaSize = useMemo(() => {
    const maxByWidth = Math.floor((screenWidth - padding * 2 - gap * (cols - 1)) / cols);
    const availableHeight = screenHeight - fixedVertical;
    const maxByHeight = Math.floor((availableHeight - gap * (rows - 1)) / rows);
    // Mínimo 55px para que sea pulsable por mayores
    return Math.max(55, Math.min(maxByWidth, maxByHeight));
  }, [screenWidth, screenHeight, cols, rows]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ==============================
  // RENDER: Loading
  // ==============================
  if (gameState === 'loading' || !config) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingEmoji}>🌱</Text>
        <Text style={styles.loadingText}>Preparando tu jardín...</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.primary }]}>
        <View style={styles.countdownBorder}>
          <Text style={styles.countdownEmoji}>🌻</Text>
          <Text style={styles.countdownQuestion}>¿Preparado?</Text>
          <Text style={styles.countdownNum}>{countdownNum}</Text>
          <View style={styles.countdownDivider} />
          <Text style={styles.countdownHint}>Memoriza las parejas de plantas</Text>
          <Text style={styles.countdownNivel}>{getNivelLabel(nivel)} · Nivel {nivel}</Text>
        </View>
      </View>
    );
  }

  // ==============================
  // RENDER: Resultado
  // ==============================
  if (gameState === 'finished') {
    const nivelLabel = getNivelLabel(nivel);

    return (
      <ScrollView
        style={styles.resultScroll}
        contentContainerStyle={styles.resultContainer}
      >
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {puntuacion >= 90 ? '🏆' : puntuacion >= 70 ? '🌳' : puntuacion >= 45 ? '🌿' : '🌱'}
          </Text>
          <Text style={styles.resultTitle} accessibilityRole="header">
            ¡Jardín completado!
          </Text>

          {/* Refuerzo positivo */}
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
            <Text style={styles.resultLabel}>Parejas</Text>
            <Text style={styles.resultValue}>{config.pares}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Intentos</Text>
            <Text style={styles.resultValue}>{intentos}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tiempo</Text>
            <Text style={styles.resultValue}>{formatTime(timer)}</Text>
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
              <Text style={styles.btnPrimaryText}>🌱 Jugar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.goBack()}
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
  // RENDER: Tablero de juego
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
              <Text style={styles.pauseInfoText}>Parejas: {paresEncontrados}/{config.pares}</Text>
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
        <Text style={styles.topBarTitle}>🌻 Jardín de la Memoria</Text>
        <TouchableOpacity
          onPress={handlePause}
          accessibilityRole="button"
          accessibilityLabel="Pausar juego"
          style={styles.pauseBtn}
          disabled={gameState !== 'playing'}
        >
          <Text style={styles.pauseBtnIcon}>⏸️</Text>
          <Text style={styles.pauseBtnLabel}>Pausa</Text>
        </TouchableOpacity>
      </View>

      {/* Info de partida */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Parejas</Text>
          <Text style={styles.infoValue}>{paresEncontrados}/{config.pares}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Intentos</Text>
          <Text style={styles.infoValue}>{intentos}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tiempo</Text>
          <Text style={styles.infoValue}>{formatTime(timer)}</Text>
        </View>
      </View>

      {/* Indicador de vista previa */}
      {gameState === 'preview' && (
        <View style={styles.previewBanner} accessibilityRole="alert">
          <Text style={styles.previewText}>👀 ¡Memoriza las plantas!</Text>
          <View style={styles.previewCountdown}>
            <Text style={styles.previewCountdownNum}>{previewSeconds}</Text>
            <Text style={styles.previewCountdownLabel}>seg</Text>
          </View>
        </View>
      )}

      {/* Jardín de macetas */}
      <View style={styles.gardenContainer}>
        <View style={styles.fence} />
        <View style={[styles.garden, { paddingHorizontal: padding }]}>
          {Array.from({ length: config.rows }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.gardenRow}>
              {tablero.slice(rowIdx * cols, rowIdx * cols + cols).map((carta, colIdx) => {
                const globalIdx = rowIdx * cols + colIdx;
                return (
                  <Maceta
                    key={`${carta.id}-${globalIdx}`}
                    carta={carta}
                    isFlipped={flipped.includes(globalIdx)}
                    isMatched={matched.includes(globalIdx)}
                    shouldShake={shaking.includes(globalIdx)}
                    onPress={() => handlePress(globalIdx)}
                    size={macetaSize}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.fence} />
      </View>

      {/* Barra de progreso inferior */}
      <View style={styles.progressBar}>
        {Array.from({ length: config.pares }).map((_, i) => (
          <Text
            key={i}
            style={[styles.progressDot, i < paresEncontrados && styles.progressDotActive]}
          >
            {i < paresEncontrados ? '🌸' : '·'}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Layout general ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  loadingEmoji: { fontSize: 60, marginBottom: 16 },
  loadingText: { fontSize: fonts.h2, color: colors.primary, fontWeight: fonts.semibold },

  // --- Countdown ---
  countdownBorder: {
    borderWidth: 3,
    borderColor: '#A5D6A7',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  countdownEmoji: { fontSize: 56, marginBottom: 8 },
  countdownQuestion: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  countdownNum: {
    fontSize: 80,
    fontWeight: fonts.bold,
    color: '#A5D6A7',
  },
  countdownDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#66BB6A',
    marginVertical: 14,
    borderRadius: 1,
  },
  countdownHint: {
    fontSize: fonts.small,
    color: '#C8E6C9',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownNivel: {
    fontSize: 14,
    color: '#A5D6A7',
    fontWeight: fonts.semibold,
    letterSpacing: 1,
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
    backgroundColor: colors.primary,
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
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pauseBtnIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  pauseBtnLabel: {
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGreen,
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 13, color: colors.lightText, marginBottom: 2 },
  infoValue: { fontSize: fonts.body, fontWeight: fonts.bold, color: colors.text },

  // --- Preview ---
  previewBanner: {
    backgroundColor: '#FFF9C4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#F57F17',
    flex: 1,
    textAlign: 'center',
  },
  previewCountdown: {
    backgroundColor: '#F57F17',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 8,
  },
  previewCountdownNum: {
    fontSize: 18,
    fontWeight: fonts.bold,
    color: '#FFFFFF',
  },
  previewCountdownLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 2,
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

  // --- Jardín ---
  gardenContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fence: {
    height: 6,
    backgroundColor: '#8D6E63',
    marginHorizontal: 10,
    borderRadius: 3,
    opacity: 0.4,
  },
  garden: {
    paddingVertical: 12,
  },
  gardenRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 10,
  },

  // --- Maceta ---
  macetaContainer: {
    position: 'relative',
  },
  macetaFace: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  macetaBack: {
    backgroundColor: '#A1887F',
    borderWidth: 2,
    borderColor: '#8D6E63',
  },
  macetaEmoji: { fontSize: 32 },
  macetaTierra: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#6D4C41',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    opacity: 0.4,
  },
  macetaFront: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGreen,
  },
  macetaMatched: {
    backgroundColor: '#F1F8E9',
    borderColor: '#66BB6A',
    borderWidth: 2,
  },
  plantaEmoji: { marginBottom: 2 },
  plantaNombre: {
    fontSize: 11,
    color: colors.lightText,
    fontWeight: fonts.semibold,
    textAlign: 'center',
  },

  // --- Progreso ---
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGreen,
  },
  progressDot: {
    fontSize: 20,
    marginHorizontal: 3,
    color: colors.placeholder,
  },
  progressDotActive: {
    color: '#E91E63',
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
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  resultEmoji: { fontSize: 64, marginBottom: 8 },
  resultTitle: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  refuerzoContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  refuerzoText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#F57F17',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultDivider: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lightGreen,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: colors.primary,
    textAlign: 'center',
  },
  resultButtons: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
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
    borderColor: colors.primary,
  },
  btnSecondaryText: {
    color: colors.primary,
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
