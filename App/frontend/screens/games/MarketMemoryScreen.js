import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  Alert, AppState, ScrollView, Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Catálogo de productos del mercado ---
const PRODUCTOS = [
  { emoji: '🍅', nombre: 'Tomates' },
  { emoji: '🥖', nombre: 'Pan' },
  { emoji: '🥛', nombre: 'Leche' },
  { emoji: '🥚', nombre: 'Huevos' },
  { emoji: '🍎', nombre: 'Manzanas' },
  { emoji: '🧀', nombre: 'Queso' },
  { emoji: '🍋', nombre: 'Limones' },
  { emoji: '🥕', nombre: 'Zanahorias' },
  { emoji: '🍌', nombre: 'Plátanos' },
  { emoji: '🫒', nombre: 'Aceitunas' },
  { emoji: '🍊', nombre: 'Naranjas' },
  { emoji: '🥑', nombre: 'Aguacates' },
  { emoji: '🍇', nombre: 'Uvas' },
  { emoji: '🧅', nombre: 'Cebollas' },
  { emoji: '🥬', nombre: 'Lechuga' },
  { emoji: '🍞', nombre: 'Barra' },
];

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Memoria prodigiosa! Nunca olvidas un precio 🌟',
    '¡Compra perfecta! Eres el rey del mercado 🏆',
    '¡Extraordinario! Ningún vendedor te engaña 🧠✨',
  ],
  bueno: [
    '¡Muy bien! Tu lista de la compra es envidiable 🛒',
    '¡Buen trabajo! Cada día recuerdas más precios 💪',
    '¡Genial! El mercado no tiene secretos para ti 🌈',
  ],
  regular: [
    '¡Bien hecho! La práctica hace al comprador experto 🛍️',
    '¡Sigue así! Pronto recordarás todos los precios 🌿',
    '¡Ánimo! Cada visita al mercado te hace mejor 💚',
  ],
  bajo: [
    '¡No te rindas! Los mejores compradores practican mucho 🌱',
    '¡Buen intento! La próxima vez recordarás más 💪',
    '¡Cada partida es un paso adelante! Tú puedes 🛒',
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
 * Genera precios aleatorios realistas (1-9€, en pasos de 0.50).
 */
function generarPrecio(nivel) {
  if (nivel <= 30) {
    // Precios enteros sencillos
    return Math.floor(Math.random() * 5) + 1;
  }
  if (nivel <= 60) {
    // Precios enteros más variados
    return Math.floor(Math.random() * 8) + 1;
  }
  // Precios con decimales (.50)
  const base = Math.floor(Math.random() * 9) + 1;
  const decimal = Math.random() > 0.5 ? 0.5 : 0;
  return base + decimal;
}

/**
 * Formatea el precio para mostrar.
 */
function formatPrecio(precio) {
  return Number.isInteger(precio) ? `${precio}€` : `${precio.toFixed(2).replace('.', ',')}€`;
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
 * Convierte nivel de dificultad (0-100) a configuración de ronda.
 */
function nivelAConfig(nivel) {
  if (nivel <= 8)  return { productos: 3, opciones: 3, tiempoVistazo: 8000 };
  if (nivel <= 18) return { productos: 3, opciones: 4, tiempoVistazo: 7000 };
  if (nivel <= 28) return { productos: 4, opciones: 4, tiempoVistazo: 7000 };
  if (nivel <= 38) return { productos: 4, opciones: 5, tiempoVistazo: 6000 };
  if (nivel <= 48) return { productos: 5, opciones: 5, tiempoVistazo: 6000 };
  if (nivel <= 58) return { productos: 5, opciones: 6, tiempoVistazo: 5000 };
  if (nivel <= 68) return { productos: 6, opciones: 6, tiempoVistazo: 5000 };
  if (nivel <= 78) return { productos: 6, opciones: 7, tiempoVistazo: 4000 };
  if (nivel <= 88) return { productos: 7, opciones: 7, tiempoVistazo: 4000 };
  if (nivel <= 95) return { productos: 7, opciones: 8, tiempoVistazo: 3000 };
  return             { productos: 8, opciones: 8, tiempoVistazo: 3000 };
}

/**
 * Genera la lista de productos con precios para una ronda.
 */
function generarRonda(numProductos, numOpciones, nivel) {
  const seleccion = shuffle(PRODUCTOS).slice(0, numProductos);
  const lista = seleccion.map((prod) => ({
    ...prod,
    precio: generarPrecio(nivel),
  }));

  // Generar opciones de precio por producto (incluye la correcta)
  const productosConOpciones = lista.map((prod) => {
    const opcionesSet = new Set([prod.precio]);
    while (opcionesSet.size < numOpciones) {
      opcionesSet.add(generarPrecio(nivel));
    }
    return {
      ...prod,
      opciones: shuffle([...opcionesSet]),
    };
  });

  return productosConOpciones;
}

/**
 * Calcula la puntuación (0-100).
 */
function calcularPuntuacion(aciertos, totalProductos, segundos, tiempoLimite) {
  const precision = aciertos / totalProductos;
  const tiempoFactor = Math.max(0, 1 - (segundos / tiempoLimite) * 0.4);
  const raw = precision * 75 + tiempoFactor * 25;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Nombre temático del nivel.
 */
function getNivelLabel(nivel) {
  if (nivel <= 8)  return 'Aprendiz';
  if (nivel <= 18) return 'Comprador';
  if (nivel <= 38) return 'Cliente fiel';
  if (nivel <= 58) return 'Experto';
  if (nivel <= 78) return 'Tendero';
  if (nivel <= 95) return 'Mayorista';
  return 'Maestro del mercado';
}

// --- Componente de producto con animación ---
const ProductoCard = React.memo(function ProductoCard({
  producto, showPrecio, onSelectPrecio, selectedPrecio, isCorrect, size,
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [scaleAnim]);

  useEffect(() => {
    if (isCorrect === false) {
      const anim = Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }
  }, [isCorrect, shakeAnim]);

  return (
    <Animated.View
      style={[
        styles.productoCard,
        { transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${producto.nombre}${showPrecio ? `, ${formatPrecio(producto.precio)}` : ''}`}
    >
      <Text style={styles.productoEmoji}>{producto.emoji}</Text>
      <Text style={styles.productoNombre}>{producto.nombre}</Text>
      {showPrecio && (
        <View style={styles.precioTag}>
          <Text style={styles.precioText}>{formatPrecio(producto.precio)}</Text>
        </View>
      )}
      {/* Resultado — ✅ o ❌ si ya respondió */}
      {selectedPrecio != null && (
        <View style={[
          styles.resultIcon,
          { backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE' },
        ]}>
          <Text style={styles.resultIconText}>{isCorrect ? '✅' : '❌'}</Text>
          {!isCorrect && (
            <Text style={styles.correctPriceHint}>{formatPrecio(producto.precio)}</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
});

// --- Pantalla principal del juego ---
export default function MarketMemoryScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;
  const insets = useSafeAreaInsets();

  // Estado del juego
  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [productos, setProductos] = useState([]);
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState('loading');
  // loading | countdown | memorize | answering | feedback | finished
  const [currentProductIdx, setCurrentProductIdx] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [memorizeSeconds, setMemorizeSeconds] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const timerValueRef = useRef(0);
  const memorizeTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const memorizeTimerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);
  const prevGameStateRef = useRef('loading');
  const gameStateRef = useRef('loading'); // evita doble toque con estado stale

  // Mantener timerValueRef sincronizado
  useEffect(() => { timerValueRef.current = timer; }, [timer]);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- AppState: pausar si el usuario minimiza ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        setGameState((prev) => {
          if (prev === 'answering' || prev === 'memorize' || prev === 'countdown') {
            prevGameStateRef.current = prev;
            if (prev === 'memorize' && memorizeTimeoutRef.current) {
              clearTimeout(memorizeTimeoutRef.current);
              memorizeTimeoutRef.current = null;
            }
            if (prev === 'countdown' && countdownTimeoutRef.current) {
              clearTimeout(countdownTimeoutRef.current);
              countdownTimeoutRef.current = null;
            }
            return 'paused';
          }
          return prev;
        });
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // --- Helper para iniciar partida ---
  const iniciarPartida = useCallback((cfg, nivelVal) => {
    const nuevosProductos = generarRonda(cfg.productos, cfg.opciones, nivelVal);
    setProductos(nuevosProductos);
    setCurrentProductIdx(0);
    setRespuestas([]);
    setTimer(0);
    setPuntuacion(null);
    setRefuerzoMsg('');
    setResultSaved(false);
    wantsToLeaveRef.current = false;
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    setGameState('countdown');

    if (memorizeTimeoutRef.current) clearTimeout(memorizeTimeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  // --- Countdown 3-2-1 → memorize ---
  useEffect(() => {
    if (gameState !== 'countdown') return;
    setCountdownNum(3);
    let count = 3;

    const tick = () => {
      count--;
      if (count <= 0) {
        const totalSec = Math.ceil((config?.tiempoVistazo ?? 5000) / 1000);
        setMemorizeSeconds(totalSec);
        setGameState('memorize');
        if (memorizeTimeoutRef.current) clearTimeout(memorizeTimeoutRef.current);
        memorizeTimeoutRef.current = setTimeout(() => {
          setGameState('answering');
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

  // --- Cuenta atrás visual durante memorización ---
  useEffect(() => {
    if (gameState === 'memorize') {
      memorizeTimerRef.current = setInterval(() => {
        setMemorizeSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    } else {
      if (memorizeTimerRef.current) { clearInterval(memorizeTimerRef.current); memorizeTimerRef.current = null; }
    }
    return () => {
      if (memorizeTimerRef.current) { clearInterval(memorizeTimerRef.current); memorizeTimerRef.current = null; }
    };
  }, [gameState]);

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
      iniciarPartida(cfg, nivelRec);
    };
    cargar();
    return () => {
      mounted = false;
      if (memorizeTimeoutRef.current) clearTimeout(memorizeTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, [juegoId, iniciarPartida]);

  // --- Cronómetro (corre en memorize y answering) ---
  useEffect(() => {
    if (gameState === 'answering') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [gameState]);

  // --- Handler de respuesta ---
  const handleSelectPrecio = useCallback((precioSeleccionado) => {
    if (gameStateRef.current !== 'answering') return;
    gameStateRef.current = 'feedback';
    const producto = productos[currentProductIdx];
    const correcto = precioSeleccionado === producto.precio;
    const nuevaRespuesta = { productoIdx: currentProductIdx, precioSeleccionado, correcto };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    setGameState('feedback');

    // Feedback breve antes de pasar al siguiente
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      const nextIdx = currentProductIdx + 1;
      if (nextIdx >= productos.length) {
        // Fin de la ronda
        finalizarPartida(nuevasRespuestas);
      } else {
        setCurrentProductIdx(nextIdx);
        setGameState('answering');
      }
    }, correcto ? 800 : 1500); // Más tiempo en error para ver precio correcto
  }, [productos, currentProductIdx, respuestas, finalizarPartida]);

  // --- Finalizar partida (usa timerValueRef para evitar stale closure) ---
  const finalizarPartida = useCallback((todasRespuestas) => {
    const aciertos = todasRespuestas.filter((r) => r.correcto).length;
    const tiempoLimite = productos.length * 12;
    const tiempoActual = timerValueRef.current;
    const score = calcularPuntuacion(aciertos, productos.length, tiempoActual, tiempoLimite);
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
  }, [productos, juegoId, nivel, resultSaved]);

  // --- Pausa / Reanudación ---
  const handlePause = useCallback(() => {
    if (gameState === 'answering' || gameState === 'memorize' || gameState === 'countdown') {
      prevGameStateRef.current = gameState;
      if (gameState === 'memorize' && memorizeTimeoutRef.current) {
        clearTimeout(memorizeTimeoutRef.current);
        memorizeTimeoutRef.current = null;
      }
      if (gameState === 'countdown' && countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
        countdownTimeoutRef.current = null;
      }
      setGameState('paused');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState !== 'paused') return;
    const prev = prevGameStateRef.current;
    if (prev === 'countdown') {
      setGameState('countdown');
    } else if (prev === 'memorize' && config) {
      setGameState('memorize');
      const tiempoRestante = Math.max(2000, config.tiempoVistazo / 2);
      if (memorizeTimeoutRef.current) clearTimeout(memorizeTimeoutRef.current);
      memorizeTimeoutRef.current = setTimeout(() => {
        setGameState('answering');
      }, tiempoRestante);
    } else {
      setGameState('answering');
    }
  }, [gameState, config]);

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
    iniciarPartida(cfg, nivelRec);
  }, [juegoId, nivel, iniciarPartida]);

  // --- Salir con confirmación ---
  const handleExit = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'answering' || prev === 'memorize') return 'paused';
      return prev;
    });
    Alert.alert(
      'Salir del juego',
      '¿Seguro que quieres abandonar la partida? No se guardará el progreso.',
      [
        {
          text: 'Seguir jugando',
          style: 'cancel',
          onPress: () => handleResume(),
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => { wantsToLeaveRef.current = true; navigation.goBack(); },
        },
      ],
      { cancelable: false },
    );
  }, [navigation, handleResume]);

  // --- Salir directo (desde modal de pausa) ---
  const handleForceExit = useCallback(() => {
    wantsToLeaveRef.current = true;
    navigation.goBack();
  }, [navigation]);

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
        <Text style={styles.loadingEmoji}>🛒</Text>
        <Text style={styles.loadingText}>Preparando el mercado...</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: '#E65100' }]}>
        <View style={styles.countdownBorder}>
          <Text style={styles.countdownEmoji}>🛒</Text>
          <Text style={styles.countdownQuestion}>¿Preparado?</Text>
          <Text style={styles.countdownNum}>{countdownNum}</Text>
          <View style={styles.countdownDivider} />
          <Text style={styles.countdownHint}>Memoriza los precios del mercado</Text>
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
    const totalProductos = productos.length;

    return (
      <ScrollView
        style={styles.resultScroll}
        contentContainerStyle={styles.resultContainer}
      >
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {puntuacion >= 90 ? '🏆' : puntuacion >= 70 ? '🛒' : puntuacion >= 45 ? '🛍️' : '🌱'}
          </Text>
          <Text style={styles.resultTitle} accessibilityRole="header">
            ¡Compra completada!
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
            <Text style={styles.resultLabel}>Aciertos</Text>
            <Text style={styles.resultValue}>{aciertos}/{totalProductos}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tiempo</Text>
            <Text style={styles.resultValue}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nivel</Text>
            <Text style={styles.resultValue}>{nivelLabel} ({nivel})</Text>
          </View>

          {/* Resumen de productos */}
          <View style={styles.resumenContainer}>
            <Text style={styles.resumenTitle}>Resumen de la compra</Text>
            {productos.map((prod, idx) => {
              const resp = respuestas[idx];
              return (
                <View key={idx} style={styles.resumenRow}>
                  <Text style={styles.resumenEmoji}>{prod.emoji}</Text>
                  <Text style={styles.resumenNombre}>{prod.nombre}</Text>
                  <Text style={styles.resumenPrecio}>{formatPrecio(prod.precio)}</Text>
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
              <Text style={styles.btnPrimaryText}>🛒 Jugar de nuevo</Text>
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
  // RENDER: Memorizar / Responder
  // ==============================
  const productoActual = productos[currentProductIdx];
  const respuestaActual = respuestas.find((r) => r.productoIdx === currentProductIdx);

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
              <Text style={styles.pauseInfoText}>Productos: {respuestas.length}/{productos.length}</Text>
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
        <Text style={styles.topBarTitle}>🛒 El Mercado</Text>
        <TouchableOpacity
          onPress={handlePause}
          accessibilityRole="button"
          accessibilityLabel="Pausar juego"
          style={styles.pauseBtn}
          disabled={gameState !== 'answering' && gameState !== 'memorize'}
        >
          <Text style={styles.pauseBtnIcon}>⏸️</Text>
          <Text style={styles.pauseBtnLabel}>Pausa</Text>
        </TouchableOpacity>
      </View>

      {/* Info de partida */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Producto</Text>
          <Text style={styles.infoValue}>
            {gameState === 'memorize' ? '-' : `${currentProductIdx + 1}/${productos.length}`}
          </Text>
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

      {/* Fase de memorización */}
      {gameState === 'memorize' && (
        <ScrollView
          style={styles.memorizeScroll}
          contentContainerStyle={styles.memorizeContainer}
        >
          <View style={styles.memorizeBanner} accessibilityRole="alert">
            <Text style={styles.memorizeIcon}>👀</Text>
            <View style={styles.memorizeTextContainer}>
              <Text style={styles.memorizeText}>¡Memoriza los precios!</Text>
              <Text style={styles.memorizeSubtext}>Pronto desaparecerán...</Text>
            </View>
            <View style={styles.memorizeCountdown}>
              <Text style={styles.memorizeCountdownNum}>{memorizeSeconds}</Text>
              <Text style={styles.memorizeCountdownLabel}>seg</Text>
            </View>
          </View>

          <View style={styles.productGrid}>
            {productos.map((prod, idx) => (
              <View key={idx} style={styles.memorizeCard}>
                <Text style={styles.memorizeCardEmoji}>{prod.emoji}</Text>
                <Text style={styles.memorizeCardNombre}>{prod.nombre}</Text>
                <View style={styles.memorizeCardPrecio}>
                  <Text style={styles.memorizeCardPrecioText}>{formatPrecio(prod.precio)}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Fase de respuesta */}
      {(gameState === 'answering' || gameState === 'feedback') && productoActual && (
        <ScrollView
          style={styles.answerScroll}
          contentContainerStyle={styles.answerContainer}
        >
          {/* Indicador de progreso */}
          <View style={styles.progressDots}>
            {productos.map((_, idx) => {
              const resp = respuestas.find((r) => r.productoIdx === idx);
              return (
                <View
                  key={idx}
                  style={[
                    styles.progressDot,
                    idx === currentProductIdx && styles.progressDotCurrent,
                    resp?.correcto === true && styles.progressDotCorrect,
                    resp?.correcto === false && styles.progressDotWrong,
                  ]}
                />
              );
            })}
          </View>

          {/* Producto actual */}
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>¿Cuánto costaba...</Text>
            <Text style={styles.questionEmoji}>{productoActual.emoji}</Text>
            <Text style={styles.questionNombre}>{productoActual.nombre}?</Text>
          </View>

          {/* Opciones de precio */}
          <View style={styles.opcionesGrid}>
            {productoActual.opciones.map((precio, idx) => {
              const isSelected = respuestaActual?.precioSeleccionado === precio;
              const isCorrectAnswer = precio === productoActual.precio;
              const showResult = gameState === 'feedback';

              let btnStyle = styles.opcionBtn;
              if (showResult && isSelected && respuestaActual?.correcto) {
                btnStyle = [styles.opcionBtn, styles.opcionCorrect];
              } else if (showResult && isSelected && !respuestaActual?.correcto) {
                btnStyle = [styles.opcionBtn, styles.opcionWrong];
              } else if (showResult && isCorrectAnswer) {
                btnStyle = [styles.opcionBtn, styles.opcionCorrectHint];
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={btnStyle}
                  onPress={() => handleSelectPrecio(precio)}
                  disabled={gameState === 'feedback'}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatPrecio(precio)}`}
                >
                  <Text style={[
                    styles.opcionText,
                    showResult && isSelected && respuestaActual?.correcto && styles.opcionTextCorrect,
                    showResult && isSelected && !respuestaActual?.correcto && styles.opcionTextWrong,
                    showResult && isCorrectAnswer && !isSelected && styles.opcionTextCorrectHint,
                  ]}>
                    {formatPrecio(precio)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback text */}
          {gameState === 'feedback' && respuestaActual && (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackText}>
                {respuestaActual.correcto
                  ? '¡Correcto! 🎉'
                  : `Era ${formatPrecio(productoActual.precio)} 🤔`}
              </Text>
            </View>
          )}
        </ScrollView>
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
    backgroundColor: '#FFF8E1',
  },
  loadingEmoji: { fontSize: 60, marginBottom: 16 },
  loadingText: { fontSize: fonts.h2, color: '#E65100', fontWeight: fonts.semibold },

  // --- Countdown ---
  countdownBorder: {
    borderWidth: 3,
    borderColor: '#FFCC80',
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
    color: '#FFCC80',
  },
  countdownDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#FFB74D',
    marginVertical: 14,
    borderRadius: 1,
  },
  countdownHint: {
    fontSize: fonts.small,
    color: '#FFE0B2',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownNivel: {
    fontSize: 14,
    color: '#FFCC80',
    fontWeight: fonts.semibold,
    letterSpacing: 1,
  },

  gameContainer: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E65100',
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
    borderBottomColor: '#FFE0B2',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 13, color: colors.lightText, marginBottom: 2 },
  infoValue: { fontSize: fonts.body, fontWeight: fonts.bold, color: colors.text },

  // --- Memorización ---
  memorizeScroll: { flex: 1 },
  memorizeContainer: {
    padding: 16,
    alignItems: 'center',
  },
  memorizeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF9C4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
  },
  memorizeIcon: { fontSize: 32, marginRight: 10 },
  memorizeTextContainer: {
    flex: 1,
  },
  memorizeText: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: '#F57F17',
  },
  memorizeSubtext: {
    fontSize: fonts.small,
    color: '#F9A825',
    marginTop: 2,
  },
  memorizeCountdown: {
    backgroundColor: '#F57F17',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 8,
  },
  memorizeCountdownNum: {
    fontSize: 18,
    fontWeight: fonts.bold,
    color: '#FFFFFF',
  },
  memorizeCountdownLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  memorizeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: Dimensions.get('window').width / 2 - 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  memorizeCardEmoji: { fontSize: 40, marginBottom: 6 },
  memorizeCardNombre: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  memorizeCardPrecio: {
    backgroundColor: '#E65100',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  memorizeCardPrecioText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },

  // --- Respuesta ---
  answerScroll: { flex: 1 },
  answerContainer: {
    padding: 16,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressDotCurrent: {
    backgroundColor: '#E65100',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressDotCorrect: {
    backgroundColor: '#4CAF50',
  },
  progressDotWrong: {
    backgroundColor: '#F44336',
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  questionLabel: {
    fontSize: fonts.small,
    color: colors.lightText,
    marginBottom: 8,
  },
  questionEmoji: { fontSize: 64, marginBottom: 8 },
  questionNombre: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: '#E65100',
  },
  opcionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  opcionBtn: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#FFE0B2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    minWidth: Dimensions.get('window').width / 2 - 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  opcionCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  opcionWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  opcionCorrectHint: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
    borderStyle: 'dashed',
  },
  opcionText: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: '#E65100',
  },
  opcionTextCorrect: {
    color: '#2E7D32',
  },
  opcionTextWrong: {
    color: '#C62828',
  },
  opcionTextCorrectHint: {
    color: '#2E7D32',
  },
  feedbackBanner: {
    backgroundColor: '#FFF9C4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  feedbackText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#F57F17',
  },

  // --- Producto card (genérico) ---
  productoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  productoEmoji: { fontSize: 36 },
  productoNombre: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: colors.text,
  },
  precioTag: {
    backgroundColor: '#E65100',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
  },
  precioText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },
  resultIcon: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultIconText: { fontSize: 20 },
  correctPriceHint: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: fonts.semibold,
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
    backgroundColor: '#FFF8E1',
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
    color: '#E65100',
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
    backgroundColor: '#FFE0B2',
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF3E0',
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
  resumenContainer: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 16,
  },
  resumenTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#E65100',
    marginBottom: 10,
    textAlign: 'center',
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  resumenEmoji: { fontSize: 22, marginRight: 8 },
  resumenNombre: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.text,
  },
  resumenPrecio: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#E65100',
    marginRight: 8,
  },
  resumenIcon: { fontSize: 18 },
  resultBadge: {
    marginTop: 16,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#E65100',
    textAlign: 'center',
  },
  resultButtons: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#E65100',
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
    borderColor: '#E65100',
  },
  btnSecondaryText: {
    color: '#E65100',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
