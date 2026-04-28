import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AppState, ScrollView, Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Catálogo de recetas con pasos ---
const RECETAS = [
  {
    nombre: 'Café con leche',
    emoji: '☕',
    pasos: [
      { emoji: '💧', texto: 'Llenar la cafetera con agua' },
      { emoji: '☕', texto: 'Añadir el café molido' },
      { emoji: '🔥', texto: 'Poner la cafetera al fuego' },
      { emoji: '⏳', texto: 'Esperar a que suba el café' },
      { emoji: '🥛', texto: 'Calentar la leche' },
      { emoji: '🫗', texto: 'Servir el café en la taza' },
      { emoji: '🥄', texto: 'Añadir la leche caliente' },
      { emoji: '🍬', texto: 'Endulzar al gusto' },
    ],
  },
  {
    nombre: 'Tortilla española',
    emoji: '🍳',
    pasos: [
      { emoji: '🥔', texto: 'Pelar las patatas' },
      { emoji: '🔪', texto: 'Cortar las patatas en rodajas finas' },
      { emoji: '🧅', texto: 'Picar la cebolla' },
      { emoji: '🫒', texto: 'Calentar aceite en la sartén' },
      { emoji: '🍳', texto: 'Freír las patatas y la cebolla' },
      { emoji: '🥚', texto: 'Batir los huevos en un bol' },
      { emoji: '🫗', texto: 'Mezclar las patatas con el huevo' },
      { emoji: '🔄', texto: 'Dar la vuelta con un plato' },
    ],
  },
  {
    nombre: 'Ensalada mixta',
    emoji: '🥗',
    pasos: [
      { emoji: '🥬', texto: 'Lavar la lechuga' },
      { emoji: '🍅', texto: 'Cortar los tomates' },
      { emoji: '🧅', texto: 'Cortar la cebolla en aros' },
      { emoji: '🫒', texto: 'Añadir aceitunas' },
      { emoji: '🥫', texto: 'Abrir la lata de atún' },
      { emoji: '🧂', texto: 'Echar sal y vinagre' },
      { emoji: '🫒', texto: 'Aliñar con aceite de oliva' },
      { emoji: '🥄', texto: 'Remover todo bien' },
    ],
  },
  {
    nombre: 'Gazpacho',
    emoji: '🍅',
    pasos: [
      { emoji: '🍅', texto: 'Lavar los tomates maduros' },
      { emoji: '🫑', texto: 'Trocear el pimiento verde' },
      { emoji: '🥒', texto: 'Pelar y cortar el pepino' },
      { emoji: '🧄', texto: 'Pelar el diente de ajo' },
      { emoji: '🍞', texto: 'Remojar el pan en agua' },
      { emoji: '🫙', texto: 'Poner todo en la batidora' },
      { emoji: '🧂', texto: 'Añadir sal, aceite y vinagre' },
      { emoji: '🧊', texto: 'Enfriar en la nevera' },
    ],
  },
  {
    nombre: 'Huevos fritos',
    emoji: '🍳',
    pasos: [
      { emoji: '🍳', texto: 'Coger la sartén' },
      { emoji: '🫒', texto: 'Echar abundante aceite' },
      { emoji: '🔥', texto: 'Calentar el aceite' },
      { emoji: '🥚', texto: 'Cascar el huevo con cuidado' },
      { emoji: '🍳', texto: 'Echar el huevo en el aceite caliente' },
      { emoji: '🥄', texto: 'Echar aceite caliente por encima' },
      { emoji: '🧂', texto: 'Echar una pizca de sal' },
      { emoji: '🍽️', texto: 'Servir en un plato con pan' },
    ],
  },
  {
    nombre: 'Sopa de fideos',
    emoji: '🍜',
    pasos: [
      { emoji: '🥕', texto: 'Pelar y trocear la zanahoria' },
      { emoji: '🍗', texto: 'Poner el pollo en la olla' },
      { emoji: '💧', texto: 'Cubrir con agua fría' },
      { emoji: '🔥', texto: 'Llevar a ebullición' },
      { emoji: '🧂', texto: 'Añadir sal y perejil' },
      { emoji: '⏳', texto: 'Cocer a fuego lento 30 minutos' },
      { emoji: '🍝', texto: 'Echar los fideos' },
      { emoji: '⏳', texto: 'Cocer 5 minutos más' },
    ],
  },
  {
    nombre: 'Bizcocho casero',
    emoji: '🍰',
    pasos: [
      { emoji: '🥚', texto: 'Batir los huevos con el azúcar' },
      { emoji: '🫒', texto: 'Añadir el aceite poco a poco' },
      { emoji: '🥛', texto: 'Verter la leche' },
      { emoji: '🍋', texto: 'Rallar la piel del limón' },
      { emoji: '🌾', texto: 'Tamizar la harina con levadura' },
      { emoji: '🥄', texto: 'Mezclar todo con movimientos suaves' },
      { emoji: '🍰', texto: 'Verter en el molde engrasado' },
      { emoji: '🔥', texto: 'Hornear a 180°C durante 40 minutos' },
    ],
  },
  {
    nombre: 'Patatas fritas',
    emoji: '🍟',
    pasos: [
      { emoji: '🥔', texto: 'Pelar las patatas' },
      { emoji: '🔪', texto: 'Cortar en bastones gruesos' },
      { emoji: '💧', texto: 'Lavar y secar bien las patatas' },
      { emoji: '🫒', texto: 'Llenar la sartén con aceite' },
      { emoji: '🔥', texto: 'Calentar el aceite a fuego medio' },
      { emoji: '🍟', texto: 'Freír las patatas sin moverlas mucho' },
      { emoji: '📰', texto: 'Escurrir sobre papel absorbente' },
      { emoji: '🧂', texto: 'Salar inmediatamente' },
    ],
  },
  {
    nombre: 'Tostada con tomate',
    emoji: '🍞',
    pasos: [
      { emoji: '🍞', texto: 'Cortar rebanadas de pan' },
      { emoji: '🔥', texto: 'Tostar el pan en la tostadora' },
      { emoji: '🍅', texto: 'Cortar un tomate por la mitad' },
      { emoji: '🍅', texto: 'Frotar el tomate sobre el pan' },
      { emoji: '🫒', texto: 'Echar un chorrito de aceite de oliva' },
      { emoji: '🧂', texto: 'Añadir una pizca de sal' },
      { emoji: '🧄', texto: 'Frotar ajo si se desea' },
      { emoji: '🍽️', texto: 'Servir recién hecha' },
    ],
  },
  {
    nombre: 'Macarrones',
    emoji: '🍝',
    pasos: [
      { emoji: '💧', texto: 'Hervir agua con sal' },
      { emoji: '🍝', texto: 'Echar los macarrones' },
      { emoji: '⏳', texto: 'Cocer según el tiempo del paquete' },
      { emoji: '🍅', texto: 'Calentar la salsa de tomate' },
      { emoji: '🧄', texto: 'Sofreír ajo picado' },
      { emoji: '🫗', texto: 'Escurrir la pasta' },
      { emoji: '🍝', texto: 'Mezclar pasta con la salsa' },
      { emoji: '🧀', texto: 'Espolvorear queso rallado' },
    ],
  },
  {
    nombre: 'Croquetas de jamón',
    emoji: '🍗',
    pasos: [
      { emoji: '🧈', texto: 'Derretir mantequilla en un cazo' },
      { emoji: '🌾', texto: 'Añadir la harina y remover' },
      { emoji: '🥛', texto: 'Verter la leche poco a poco' },
      { emoji: '🥄', texto: 'Remover sin parar hasta espesar' },
      { emoji: '🥓', texto: 'Añadir el jamón picado' },
      { emoji: '🧊', texto: 'Dejar enfriar la masa en la nevera' },
      { emoji: '🥚', texto: 'Rebozar con huevo y pan rallado' },
      { emoji: '🫒', texto: 'Freír en aceite caliente' },
    ],
  },
  {
    nombre: 'Paella valenciana',
    emoji: '🥘',
    pasos: [
      { emoji: '🍗', texto: 'Dorar el pollo troceado' },
      { emoji: '🫑', texto: 'Sofreír las judías verdes' },
      { emoji: '🍅', texto: 'Añadir el tomate rallado' },
      { emoji: '🧂', texto: 'Echar el pimentón y remover' },
      { emoji: '💧', texto: 'Añadir el agua y dejar hervir' },
      { emoji: '🌾', texto: 'Repartir el arroz uniformemente' },
      { emoji: '🔥', texto: 'Cocer a fuego fuerte 10 minutos' },
      { emoji: '⏳', texto: 'Bajar el fuego y cocer 10 más' },
    ],
  },
  {
    nombre: 'Lentejas estofadas',
    emoji: '🫘',
    pasos: [
      { emoji: '🫘', texto: 'Remojar las lentejas la noche antes' },
      { emoji: '🥕', texto: 'Pelar y trocear la zanahoria' },
      { emoji: '🥔', texto: 'Pelar y cortar la patata en cubos' },
      { emoji: '🧄', texto: 'Sofreír el ajo con un poco de aceite' },
      { emoji: '🫘', texto: 'Añadir las lentejas escurridas' },
      { emoji: '💧', texto: 'Cubrir todo con agua o caldo' },
      { emoji: '🌿', texto: 'Echar laurel y pimentón' },
      { emoji: '⏳', texto: 'Cocer a fuego lento 45 minutos' },
    ],
  },
  {
    nombre: 'Arroz con leche',
    emoji: '🍚',
    pasos: [
      { emoji: '🍚', texto: 'Lavar el arroz con agua fría' },
      { emoji: '💧', texto: 'Hervir el arroz en agua 5 minutos' },
      { emoji: '🫗', texto: 'Escurrir el arroz' },
      { emoji: '🥛', texto: 'Calentar la leche con piel de limón' },
      { emoji: '🍚', texto: 'Añadir el arroz a la leche' },
      { emoji: '🍬', texto: 'Echar el azúcar y remover' },
      { emoji: '⏳', texto: 'Cocer removiendo 30 minutos' },
      { emoji: '✨', texto: 'Espolvorear canela por encima' },
    ],
  },
  {
    nombre: 'Pollo al horno',
    emoji: '🍗',
    pasos: [
      { emoji: '🍗', texto: 'Limpiar bien el pollo' },
      { emoji: '🧂', texto: 'Salpimentar por dentro y fuera' },
      { emoji: '🧄', texto: 'Untar con ajo y hierbas' },
      { emoji: '🫒', texto: 'Rociar con aceite de oliva' },
      { emoji: '🥔', texto: 'Rodear con patatas troceadas' },
      { emoji: '🔥', texto: 'Precalentar el horno a 200°C' },
      { emoji: '🍗', texto: 'Meter al horno durante una hora' },
      { emoji: '🫗', texto: 'Regar con su jugo a mitad' },
    ],
  },
  {
    nombre: 'Pimientos rellenos',
    emoji: '🫑',
    pasos: [
      { emoji: '🫑', texto: 'Lavar y vaciar los pimientos' },
      { emoji: '🥩', texto: 'Preparar el relleno de carne picada' },
      { emoji: '🍚', texto: 'Mezclar la carne con arroz cocido' },
      { emoji: '🧅', texto: 'Añadir cebolla pochada al relleno' },
      { emoji: '🫑', texto: 'Rellenar los pimientos con la mezcla' },
      { emoji: '🍅', texto: 'Cubrir con salsa de tomate' },
      { emoji: '🔥', texto: 'Hornear a 180°C durante 35 minutos' },
      { emoji: '🌿', texto: 'Decorar con perejil fresco' },
    ],
  },
  {
    nombre: 'Salmorejo cordobés',
    emoji: '🍅',
    pasos: [
      { emoji: '🍅', texto: 'Escaldar los tomates y pelarlos' },
      { emoji: '🍞', texto: 'Trocear el pan del día anterior' },
      { emoji: '🧄', texto: 'Pelar un diente de ajo' },
      { emoji: '🫙', texto: 'Triturar tomate, pan y ajo' },
      { emoji: '🫒', texto: 'Añadir aceite de oliva en hilo' },
      { emoji: '🧂', texto: 'Salpimentar al gusto' },
      { emoji: '🧊', texto: 'Enfriar bien en la nevera' },
      { emoji: '🥚', texto: 'Servir con huevo duro y jamón picado' },
    ],
  },
  {
    nombre: 'Fabada asturiana',
    emoji: '🫘',
    pasos: [
      { emoji: '🫘', texto: 'Dejar las fabes en remojo 12 horas' },
      { emoji: '🥩', texto: 'Poner el compango en agua aparte' },
      { emoji: '💧', texto: 'Cubrir las fabes con agua fría' },
      { emoji: '🔥', texto: 'Llevar a ebullición y espumar' },
      { emoji: '🥩', texto: 'Añadir la morcilla y el chorizo' },
      { emoji: '🧂', texto: 'Salar a mitad de cocción' },
      { emoji: '⏳', texto: 'Cocer muy lento durante 2 horas' },
      { emoji: '🍽️', texto: 'Dejar reposar antes de servir' },
    ],
  },
  {
    nombre: 'Flan de huevo',
    emoji: '🍮',
    pasos: [
      { emoji: '🍬', texto: 'Hacer caramelo con azúcar y agua' },
      { emoji: '🍮', texto: 'Cubrir el fondo del molde con caramelo' },
      { emoji: '🥚', texto: 'Batir los huevos suavemente' },
      { emoji: '🥛', texto: 'Calentar la leche con vainilla' },
      { emoji: '🥄', texto: 'Mezclar la leche con los huevos' },
      { emoji: '🫗', texto: 'Verter la mezcla en el molde' },
      { emoji: '💧', texto: 'Cocer al baño maría 45 minutos' },
      { emoji: '🧊', texto: 'Dejar enfriar y desmoldar' },
    ],
  },
  {
    nombre: 'Revuelto de setas',
    emoji: '🍄',
    pasos: [
      { emoji: '🍄', texto: 'Limpiar las setas con un trapo' },
      { emoji: '🔪', texto: 'Trocear las setas en láminas' },
      { emoji: '🧄', texto: 'Picar finamente el ajo' },
      { emoji: '🫒', texto: 'Calentar aceite en la sartén' },
      { emoji: '🧄', texto: 'Dorar el ajo sin que se queme' },
      { emoji: '🍄', texto: 'Saltear las setas a fuego fuerte' },
      { emoji: '🥚', texto: 'Añadir los huevos batidos' },
      { emoji: '🌿', texto: 'Servir con perejil picado' },
    ],
  },
];

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Memoria de chef estrella! La abuela estaría orgullosa 🌟',
    '¡Receta perfecta! Eres un cocinero de primera 🏆',
    '¡Extraordinario! Podrías escribir un libro de cocina 🧠✨',
  ],
  bueno: [
    '¡Muy bien! Tu cocina mejora cada día 🍳',
    '¡Buen trabajo! Casi dominas esta receta 💪',
    '¡Genial! La abuela aprobaría tu memoria 🌈',
  ],
  regular: [
    '¡Bien hecho! La práctica hace al maestro cocinero 🍲',
    '¡Sigue así! Pronto recordarás todas las recetas 🌿',
    '¡Ánimo! Cada intento te acerca a la receta perfecta 💚',
  ],
  bajo: [
    '¡No te rindas! Los mejores cocineros practican mucho 🌱',
    '¡Buen intento! La próxima vez recordarás más pasos 💪',
    '¡Cada partida es un paso adelante en la cocina! 🍳',
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
 * Baraja un array usando Fisher-Yates.
 * @param {Array} arr - Array a barajar.
 * @returns {Array} Copia barajada.
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
 * Sin tiempoVistazo: el usuario memoriza a su ritmo y pulsa cuando está listo.
 * @param {number} nivel - Nivel 0-100.
 * @returns {{ numPasos: number }}
 */
function nivelAConfig(nivel) {
  if (nivel <= 10) return { numPasos: 3 };
  if (nivel <= 22) return { numPasos: 4 };
  if (nivel <= 36) return { numPasos: 5 };
  if (nivel <= 52) return { numPasos: 6 };
  if (nivel <= 70) return { numPasos: 7 };
  return              { numPasos: 8 };
}

/**
 * Genera una ronda: selecciona una receta y toma N pasos.
 * @param {number} numPasos - Número de pasos a usar.
 * @returns {{ receta: object, pasosOrdenados: Array, pasosDesordenados: Array }}
 */
function generarRonda(numPasos) {
  const receta = RECETAS[Math.floor(Math.random() * RECETAS.length)];
  // Tomar los primeros numPasos de la receta (mantiene coherencia)
  const pasosOrdenados = receta.pasos.slice(0, numPasos).map((p, idx) => ({
    ...p,
    ordenCorrecto: idx,
    id: `${idx}-${p.texto}`,
  }));
  // Asegurar que el orden barajado difiere del original (evitar ronda trivial)
  let pasosDesordenados = shuffle(pasosOrdenados);
  let intentos = 0;
  while (
    intentos < 10 &&
    pasosDesordenados.every((p, i) => p.ordenCorrecto === i)
  ) {
    pasosDesordenados = shuffle(pasosOrdenados);
    intentos++;
  }
  return { receta, pasosOrdenados, pasosDesordenados };
}

/**
 * Calcula la puntuación (0-100).
 * Precisión vale 80%, rapidez de ordenación 20%.
 * tiempoLimite: 8s por paso — tiempo generoso para no penalizar excesivamente.
 * @param {Array} selecciones - Índices seleccionados por el usuario.
 * @param {Array} pasosOrdenados - Pasos en orden correcto.
 * @param {number} segundos - Tiempo transcurrido durante la fase de ordenación.
 * @returns {number}
 */
function calcularPuntuacion(selecciones, pasosOrdenados, segundos) {
  let aciertos = 0;
  for (let i = 0; i < selecciones.length; i++) {
    if (selecciones[i] === pasosOrdenados[i].ordenCorrecto) aciertos++;
  }
  const precision = aciertos / pasosOrdenados.length;
  const tiempoLimite = pasosOrdenados.length * 8;
  const tiempoFactor = Math.max(0, 1 - (segundos / tiempoLimite) * 0.5);
  const raw = precision * 80 + tiempoFactor * 20;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Nombre temático del nivel.
 * @param {number} nivel - Nivel 0-100.
 * @returns {string}
 */
function getNivelLabel(nivel) {
  if (nivel <= 8)  return 'Pinche';
  if (nivel <= 18) return 'Ayudante';
  if (nivel <= 38) return 'Cocinero';
  if (nivel <= 58) return 'Chef';
  if (nivel <= 78) return 'Sous Chef';
  if (nivel <= 95) return 'Chef Ejecutivo';
  return 'Maestro de cocina';
}

// --- Pantalla principal del juego ---
export default function RecipeMemoryScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;

  // Estado del juego
  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [receta, setReceta] = useState(null);
  const [pasosOrdenados, setPasosOrdenados] = useState([]);
  const [pasosDesordenados, setPasosDesordenados] = useState([]);
  const [selecciones, setSelecciones] = useState([]); // índices de ordenCorrecto en el orden que el user elige
  const [pasosSeleccionadosIds, setPasosSeleccionadosIds] = useState(new Set());
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState('loading');
  // loading | countdown | memorize | ordering | finished
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);

  // Refs
  const timerRef = useRef(null);
  const timerValueRef = useRef(0);
  const countdownTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);
  const prevGameStateRef = useRef('loading');

  // Mantener timerValueRef sincronizado
  useEffect(() => { timerValueRef.current = timer; }, [timer]);

  // --- AppState: pausar si el usuario minimiza ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        setGameState((prev) => {
          if (prev === 'ordering' || prev === 'countdown') {
            prevGameStateRef.current = prev;
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
  const iniciarPartida = useCallback((cfg) => {
    const { receta: rec, pasosOrdenados: ord, pasosDesordenados: desord } = generarRonda(cfg.numPasos);
    setReceta(rec);
    setPasosOrdenados(ord);
    setPasosDesordenados(desord);
    setSelecciones([]);
    setPasosSeleccionadosIds(new Set());
    setTimer(0);
    setPuntuacion(null);
    setRefuerzoMsg('');
    setResultSaved(false);
    wantsToLeaveRef.current = false;
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    setGameState('countdown');
  }, []);

  // --- Countdown 3-2-1 → memorize ---
  useEffect(() => {
    if (gameState !== 'countdown') return;
    setCountdownNum(3);
    let count = 3;

    const tick = () => {
      count--;
      if (count <= 0) {
        setGameState('memorize');
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
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
  }, [juegoId, iniciarPartida]);

  // --- Cronómetro (corre solo en ordering) ---
  useEffect(() => {
    if (gameState === 'ordering') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [gameState]);

  // --- Finalizar partida ---
  const finalizarPartida = useCallback((todasSelecciones) => {
    const tiempoActual = timerValueRef.current;
    const score = calcularPuntuacion(todasSelecciones, pasosOrdenados, tiempoActual);
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
      }).catch(() => {});
    }
  }, [pasosOrdenados, juegoId, nivel, resultSaved]);

  // --- Handler selección de paso ---
  const handleSelectPaso = useCallback((paso) => {
    if (gameState !== 'ordering') return;
    if (pasosSeleccionadosIds.has(paso.id)) return; // Ya seleccionado

    const nuevasSelecciones = [...selecciones, paso.ordenCorrecto];
    const nuevosIds = new Set(pasosSeleccionadosIds);
    nuevosIds.add(paso.id);

    setSelecciones(nuevasSelecciones);
    setPasosSeleccionadosIds(nuevosIds);

    // Si se seleccionaron todos los pasos, finalizar
    if (nuevasSelecciones.length >= pasosOrdenados.length) {
      finalizarPartida(nuevasSelecciones);
    }
  }, [gameState, selecciones, pasosSeleccionadosIds, pasosOrdenados, finalizarPartida]);

  // --- Deshacer última selección ---
  const handleUndo = useCallback(() => {
    if (gameState !== 'ordering' || selecciones.length === 0) return;

    const nuevasSelecciones = selecciones.slice(0, -1);
    // Encontrar el paso que corresponde a la última selección
    const ultimoOrden = selecciones[selecciones.length - 1];
    const pasoADeshacer = pasosDesordenados.find((p) => p.ordenCorrecto === ultimoOrden);

    const nuevosIds = new Set(pasosSeleccionadosIds);
    if (pasoADeshacer) nuevosIds.delete(pasoADeshacer.id);

    setSelecciones(nuevasSelecciones);
    setPasosSeleccionadosIds(nuevosIds);
  }, [gameState, selecciones, pasosDesordenados, pasosSeleccionadosIds]);

  // --- Transición manual de memorizar a ordenar ---
  const handleStartOrdering = useCallback(() => {
    if (gameState === 'memorize') {
      setGameState('ordering');
    }
  }, [gameState]);

  // --- Pausa / Reanudación (solo durante ordering) ---
  const handlePause = useCallback(() => {
    if (gameState === 'ordering' || gameState === 'countdown') {
      prevGameStateRef.current = gameState;
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
    } else {
      setGameState('ordering');
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

  // --- Salir con confirmación ---
  // En memorize: sale directamente (no hay progreso que perder).
  // En ordering: pausa y muestra el modal con opción de salir.
  const handleExit = useCallback(() => {
    if (gameState === 'memorize') {
      wantsToLeaveRef.current = true;
      navigation.goBack();
      return;
    }
    if (gameState === 'ordering') {
      prevGameStateRef.current = gameState;
      setGameState('paused');
    }
  }, [gameState, navigation]);

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

  const aciertos = useMemo(() => {
    let count = 0;
    for (let i = 0; i < selecciones.length; i++) {
      if (selecciones[i] === pasosOrdenados[i]?.ordenCorrecto) count++;
    }
    return count;
  }, [selecciones, pasosOrdenados]);

  // ==============================
  // RENDER: Loading
  // ==============================
  if (gameState === 'loading' || !config || !receta) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingEmoji}>🍲</Text>
        <Text style={styles.loadingText}>Preparando la receta...</Text>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: '#4E342E' }]}>
        <View style={styles.countdownBorder}>
          <Text style={styles.countdownEmoji}>🍲</Text>
          <Text style={styles.countdownQuestion}>¿Preparado?</Text>
          <Text style={styles.countdownNum}>{countdownNum}</Text>
          <View style={styles.countdownDivider} />
          <Text style={styles.countdownHint}>Memoriza los pasos de la receta</Text>
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
    const totalPasos = pasosOrdenados.length;

    return (
      <ScrollView
        style={styles.resultScroll}
        contentContainerStyle={styles.resultContainer}
      >
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {puntuacion >= 90 ? '🏆' : puntuacion >= 70 ? '👨‍🍳' : puntuacion >= 45 ? '🍲' : '🌱'}
          </Text>
          <Text style={styles.resultTitle} accessibilityRole="header">
            ¡Receta terminada!
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
            <Text style={styles.resultLabel}>Pasos correctos</Text>
            <Text style={styles.resultValue}>{aciertos}/{totalPasos}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tiempo</Text>
            <Text style={styles.resultValue}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Receta</Text>
            <Text style={styles.resultValue}>{receta.emoji} {receta.nombre}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nivel</Text>
            <Text style={styles.resultValue}>{nivelLabel} ({nivel})</Text>
          </View>

          {/* Resumen: orden correcto vs seleccionado */}
          <View style={styles.resumenContainer}>
            <Text style={styles.resumenTitle}>Resumen de la receta</Text>
            {pasosOrdenados.map((paso, idx) => {
              const correcto = selecciones[idx] === paso.ordenCorrecto;
              return (
                <View key={paso.id} style={styles.resumenRow}>
                  <Text style={styles.resumenNumero}>{idx + 1}.</Text>
                  <Text style={styles.resumenEmoji}>{paso.emoji}</Text>
                  <Text style={[
                    styles.resumenTexto,
                    !correcto && styles.resumenTextoError,
                  ]}>
                    {paso.texto}
                  </Text>
                  <Text style={styles.resumenIcon}>{correcto ? '✅' : '❌'}</Text>
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
              <Text style={styles.btnPrimaryText}>🍲 Jugar de nuevo</Text>
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
  // RENDER: Memorizar / Ordenar
  // ==============================
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
              <Text style={styles.pauseInfoText}>Receta: {receta.emoji} {receta.nombre}</Text>
              <Text style={styles.pauseInfoText}>Pasos: {selecciones.length}/{pasosOrdenados.length}</Text>
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
        <Text style={styles.topBarTitle}>🍲 La Receta de la Abuela</Text>
        <TouchableOpacity
          onPress={handlePause}
          accessibilityRole="button"
          accessibilityLabel="Pausar juego"
          style={styles.pauseTopBtn}
          disabled={gameState !== 'ordering'}
        >
          <Text style={styles.pauseTopBtnIcon}>⏸️</Text>
          <Text style={styles.pauseTopBtnLabel}>Pausa</Text>
        </TouchableOpacity>
      </View>

      {/* Info de partida */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Receta</Text>
          <Text style={styles.infoValue}>{receta.emoji}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Pasos</Text>
          <Text style={styles.infoValue}>{selecciones.length}/{pasosOrdenados.length}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tiempo</Text>
          <Text style={styles.infoValue}>{formatTime(timer)}</Text>
        </View>
      </View>

      {/* Fase de memorización — sin límite de tiempo */}
      {gameState === 'memorize' && (
        <ScrollView
          style={styles.memorizeScroll}
          contentContainerStyle={styles.memorizeContainer}
        >
          <View style={styles.memorizeBanner} accessibilityRole="alert">
            <Text style={styles.memorizeIcon}>👀</Text>
            <Text style={styles.memorizeText}>¡Memoriza el orden de los pasos!</Text>
            <Text style={styles.memorizeSubtext}>Tómate tu tiempo, no hay prisa</Text>
          </View>

          <Text style={styles.recetaTitulo}>{receta.emoji} {receta.nombre}</Text>

          <View style={styles.stepsContainer}>
            {pasosOrdenados.map((paso, idx) => (
              <Animated.View key={paso.id} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepEmoji}>{paso.emoji}</Text>
                <Text style={styles.stepTexto}>{paso.texto}</Text>
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartOrdering}
            accessibilityRole="button"
            accessibilityLabel="Ya me la sé, empezar a ordenar"
          >
            <Text style={styles.startBtnText}>👨‍🍳 ¡Ya me la sé!</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Fase de ordenar */}
      {gameState === 'ordering' && (
        <ScrollView
          style={styles.orderScroll}
          contentContainerStyle={styles.orderContainer}
        >
          <View style={styles.orderBanner} accessibilityRole="alert">
            <Text style={styles.orderBannerIcon}>🔢</Text>
            <Text style={styles.orderBannerText}>
              Toca los pasos en el orden correcto
            </Text>
          </View>

          <Text style={styles.recetaTitulo}>{receta.emoji} {receta.nombre}</Text>

          {/* Pasos ya seleccionados (en orden elegido) */}
          {selecciones.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedTitle}>Tu orden:</Text>
              {selecciones.map((ordenCorrecto, idx) => {
                const paso = pasosOrdenados.find((p) => p.ordenCorrecto === ordenCorrecto);
                return (
                  <View
                    key={`sel-${idx}`}
                    style={styles.selectedStep}
                  >
                    <Text style={styles.selectedNumber}>{idx + 1}.</Text>
                    <Text style={styles.selectedEmoji}>{paso?.emoji}</Text>
                    <Text style={styles.selectedTexto}>{paso?.texto}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Botón deshacer */}
          {selecciones.length > 0 && selecciones.length < pasosOrdenados.length && (
            <TouchableOpacity
              style={styles.undoBtn}
              onPress={handleUndo}
              accessibilityRole="button"
              accessibilityLabel="Deshacer último paso"
            >
              <Text style={styles.undoBtnText}>↩️ Deshacer último</Text>
            </TouchableOpacity>
          )}

          {/* Pasos desordenados para elegir */}
          <View style={styles.choicesContainer}>
            <Text style={styles.choicesTitle}>
              {selecciones.length < pasosOrdenados.length
                ? `Paso ${selecciones.length + 1}: ¿Qué va ahora?`
                : '¡Todos los pasos seleccionados!'}
            </Text>
            {pasosDesordenados.map((paso) => {
              const yaSeleccionado = pasosSeleccionadosIds.has(paso.id);
              return (
                <TouchableOpacity
                  key={paso.id}
                  style={[
                    styles.choiceBtn,
                    yaSeleccionado && styles.choiceBtnDisabled,
                  ]}
                  onPress={() => handleSelectPaso(paso)}
                  disabled={yaSeleccionado}
                  accessibilityRole="button"
                  accessibilityLabel={`${paso.texto}${yaSeleccionado ? ', ya seleccionado' : ''}`}
                  accessibilityState={{ disabled: yaSeleccionado }}
                >
                  <Text style={[styles.choiceEmoji, yaSeleccionado && styles.choiceTextDisabled]}>
                    {paso.emoji}
                  </Text>
                  <Text style={[styles.choiceText, yaSeleccionado && styles.choiceTextDisabled]}>
                    {paso.texto}
                  </Text>
                  {yaSeleccionado && <Text style={styles.choiceCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
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
    backgroundColor: '#FFF3E0',
  },
  loadingEmoji: { fontSize: 60, marginBottom: 16 },
  loadingText: { fontSize: fonts.h2, color: '#6D4C41', fontWeight: fonts.semibold },

  // --- Countdown ---
  countdownBorder: {
    borderWidth: 3,
    borderColor: '#BCAAA4',
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
    backgroundColor: '#A1887F',
    marginVertical: 14,
    borderRadius: 1,
  },
  countdownHint: {
    fontSize: fonts.small,
    color: '#D7CCC8',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownNivel: {
    fontSize: 14,
    color: '#BCAAA4',
    fontWeight: fonts.semibold,
    letterSpacing: 1,
  },

  gameContainer: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#6D4C41',
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#D7CCC8',
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 13, color: colors.lightText, marginBottom: 2 },
  infoValue: { fontSize: fonts.body, fontWeight: fonts.bold, color: colors.text },

  // --- Memorización ---
  memorizeScroll: { flex: 1 },
  memorizeContainer: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 32,
  },
  memorizeBanner: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF9C4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
  },
  memorizeIcon: { fontSize: 32, marginBottom: 4 },
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
  recetaTitulo: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: '#6D4C41',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#D7CCC8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6D4C41',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: fonts.small,
    fontWeight: fonts.bold,
  },
  stepEmoji: { fontSize: 28, marginRight: 10 },
  stepTexto: {
    flex: 1,
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: colors.text,
  },

  // --- Botón "¡Ya me la sé!" ---
  startBtn: {
    marginTop: 24,
    backgroundColor: '#6D4C41',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    width: '100%',
  },
  startBtnText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },

  // --- Fase de ordenar ---
  orderScroll: { flex: 1 },
  orderContainer: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 32,
  },
  orderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#FFECB3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
  },
  orderBannerIcon: { fontSize: 24, marginRight: 8 },
  orderBannerText: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#E65100',
  },

  // --- Pasos seleccionados ---
  selectedContainer: {
    width: '100%',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#6D4C41',
    marginBottom: 8,
  },
  selectedStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#D7CCC8',
  },
  selectedNumber: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#6D4C41',
    marginRight: 8,
    minWidth: 24,
  },
  selectedEmoji: { fontSize: 22, marginRight: 8 },
  selectedTexto: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },

  // --- Botón deshacer ---
  undoBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#EFEBE9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  undoBtnText: {
    fontSize: 14,
    fontWeight: fonts.semibold,
    color: '#6D4C41',
  },

  // --- Opciones de pasos ---
  choicesContainer: {
    width: '100%',
  },
  choicesTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#E65100',
    marginBottom: 10,
    textAlign: 'center',
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#D7CCC8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  choiceBtnDisabled: {
    backgroundColor: '#EFEBE9',
    borderColor: '#D7CCC8',
    opacity: 0.5,
  },
  choiceEmoji: { fontSize: 24, marginRight: 10 },
  choiceText: {
    flex: 1,
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: colors.text,
  },
  choiceTextDisabled: {
    color: '#BDBDBD',
  },
  choiceCheck: {
    fontSize: 20,
    color: '#81C784',
    marginLeft: 8,
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
    backgroundColor: '#FFF3E0',
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
    color: '#6D4C41',
    marginBottom: 8,
    textAlign: 'center',
  },
  refuerzoContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  refuerzoText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultDivider: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D7CCC8',
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
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
  },
  resumenTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#6D4C41',
    marginBottom: 10,
    textAlign: 'center',
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#D7CCC8',
  },
  resumenNumero: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#6D4C41',
    marginRight: 6,
    minWidth: 24,
  },
  resumenEmoji: { fontSize: 20, marginRight: 6 },
  resumenTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  resumenTextoError: {
    color: '#C62828',
  },
  resumenIcon: { fontSize: 18, marginLeft: 4 },
  resultBadge: {
    marginTop: 16,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
    color: '#6D4C41',
    textAlign: 'center',
  },
  resultButtons: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#6D4C41',
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
    borderColor: '#6D4C41',
  },
  btnSecondaryText: {
    color: '#6D4C41',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
