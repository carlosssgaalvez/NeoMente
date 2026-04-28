import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AppState, ScrollView, Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Banco de palabras ---
// Cada entrada: palabra, pista (definición breve), categoria (temática)
const PALABRAS = [
  // Naturaleza
  { palabra: 'ARBOL', pista: 'Planta grande con tronco de madera', categoria: 'Naturaleza' },
  { palabra: 'FLOR', pista: 'Parte colorida de una planta', categoria: 'Naturaleza' },
  { palabra: 'RIO', pista: 'Corriente de agua que desemboca en el mar', categoria: 'Naturaleza' },
  { palabra: 'LUNA', pista: 'Brilla en el cielo por la noche', categoria: 'Naturaleza' },
  { palabra: 'SOL', pista: 'Estrella que nos da luz y calor', categoria: 'Naturaleza' },
  { palabra: 'NUBE', pista: 'Masa blanca que flota en el cielo', categoria: 'Naturaleza' },
  { palabra: 'LLUVIA', pista: 'Agua que cae del cielo', categoria: 'Naturaleza' },
  { palabra: 'NIEVE', pista: 'Agua helada que cae en copos blancos', categoria: 'Naturaleza' },
  { palabra: 'MONTE', pista: 'Elevación grande del terreno', categoria: 'Naturaleza' },
  { palabra: 'PLAYA', pista: 'Orilla del mar con arena', categoria: 'Naturaleza' },
  { palabra: 'BOSQUE', pista: 'Terreno poblado de muchos árboles', categoria: 'Naturaleza' },
  { palabra: 'SIERRA', pista: 'Cadena de montañas', categoria: 'Naturaleza' },
  { palabra: 'TIERRA', pista: 'Planeta en el que vivimos', categoria: 'Naturaleza' },
  { palabra: 'HIERBA', pista: 'Planta verde y baja que cubre el suelo', categoria: 'Naturaleza' },

  // Animales
  { palabra: 'GATO', pista: 'Animal doméstico que maúlla', categoria: 'Animales' },
  { palabra: 'PERRO', pista: 'Animal doméstico fiel al ser humano', categoria: 'Animales' },
  { palabra: 'PATO', pista: 'Ave que nada y hace "cuac"', categoria: 'Animales' },
  { palabra: 'CABALLO', pista: 'Animal que se monta y galopa', categoria: 'Animales' },
  { palabra: 'OVEJA', pista: 'Animal lanudo del rebaño', categoria: 'Animales' },
  { palabra: 'CONEJO', pista: 'Animal de orejas largas y cola corta', categoria: 'Animales' },
  { palabra: 'TORTUGA', pista: 'Animal lento con caparazón duro', categoria: 'Animales' },
  { palabra: 'PALOMA', pista: 'Ave blanca símbolo de la paz', categoria: 'Animales' },
  { palabra: 'BALLENA', pista: 'El mamífero más grande del océano', categoria: 'Animales' },
  { palabra: 'AGUILA', pista: 'Ave rapaz de gran tamaño', categoria: 'Animales' },
  { palabra: 'DELFIN', pista: 'Mamífero marino muy inteligente', categoria: 'Animales' },
  { palabra: 'ABEJA', pista: 'Insecto que produce miel', categoria: 'Animales' },

  // Hogar
  { palabra: 'MESA', pista: 'Mueble con patas para comer o trabajar', categoria: 'Hogar' },
  { palabra: 'SILLA', pista: 'Mueble para sentarse con respaldo', categoria: 'Hogar' },
  { palabra: 'CAMA', pista: 'Mueble para dormir', categoria: 'Hogar' },
  { palabra: 'ESPEJO', pista: 'Superficie que refleja tu imagen', categoria: 'Hogar' },
  { palabra: 'VENTANA', pista: 'Abertura en la pared que deja pasar la luz', categoria: 'Hogar' },
  { palabra: 'COCINA', pista: 'Habitación donde se preparan los alimentos', categoria: 'Hogar' },
  { palabra: 'PUERTA', pista: 'Sirve para entrar y salir de una habitación', categoria: 'Hogar' },
  { palabra: 'ALFOMBRA', pista: 'Tela gruesa que cubre el suelo', categoria: 'Hogar' },
  { palabra: 'LAMPARA', pista: 'Objeto que da luz artificial', categoria: 'Hogar' },
  { palabra: 'RELOJ', pista: 'Instrumento que marca las horas', categoria: 'Hogar' },
  { palabra: 'CUADRO', pista: 'Pintura enmarcada que decora la pared', categoria: 'Hogar' },

  // Alimentos
  { palabra: 'PAN', pista: 'Alimento básico hecho con harina y agua', categoria: 'Alimentos' },
  { palabra: 'QUESO', pista: 'Alimento lácteo que se hace con leche cuajada', categoria: 'Alimentos' },
  { palabra: 'SOPA', pista: 'Plato líquido y caliente', categoria: 'Alimentos' },
  { palabra: 'ARROZ', pista: 'Cereal blanco muy consumido en España', categoria: 'Alimentos' },
  { palabra: 'ACEITE', pista: 'Líquido dorado que se usa para cocinar', categoria: 'Alimentos' },
  { palabra: 'AZUCAR', pista: 'Sustancia blanca y dulce', categoria: 'Alimentos' },
  { palabra: 'HUEVO', pista: 'Lo pone la gallina', categoria: 'Alimentos' },
  { palabra: 'LECHE', pista: 'Bebida blanca que da la vaca', categoria: 'Alimentos' },
  { palabra: 'NARANJA', pista: 'Fruta cítrica de color anaranjado', categoria: 'Alimentos' },
  { palabra: 'MANZANA', pista: 'Fruta roja o verde muy común', categoria: 'Alimentos' },
  { palabra: 'TOMATE', pista: 'Fruto rojo usado en ensaladas y salsas', categoria: 'Alimentos' },
  { palabra: 'PATATA', pista: 'Tubérculo con el que se hacen tortillas', categoria: 'Alimentos' },
  { palabra: 'CEBOLLA', pista: 'Hortaliza que hace llorar al cortarla', categoria: 'Alimentos' },
  { palabra: 'LIMON', pista: 'Fruta ácida de color amarillo', categoria: 'Alimentos' },

  // Cuerpo humano
  { palabra: 'MANO', pista: 'Parte del cuerpo con cinco dedos', categoria: 'Cuerpo' },
  { palabra: 'CORAZON', pista: 'Órgano que bombea la sangre', categoria: 'Cuerpo' },
  { palabra: 'CABEZA', pista: 'Parte superior del cuerpo donde está el cerebro', categoria: 'Cuerpo' },
  { palabra: 'BRAZO', pista: 'Extremidad entre el hombro y la mano', categoria: 'Cuerpo' },
  { palabra: 'PIERNA', pista: 'Extremidad inferior para caminar', categoria: 'Cuerpo' },
  { palabra: 'RODILLA', pista: 'Articulación de la pierna que se dobla', categoria: 'Cuerpo' },
  { palabra: 'HOMBRO', pista: 'Articulación entre el brazo y el cuello', categoria: 'Cuerpo' },
  { palabra: 'ESPALDA', pista: 'Parte posterior del tronco', categoria: 'Cuerpo' },

  // Profesiones
  { palabra: 'MEDICO', pista: 'Profesional que cura enfermos', categoria: 'Profesiones' },
  { palabra: 'MAESTRO', pista: 'Persona que enseña en la escuela', categoria: 'Profesiones' },
  { palabra: 'BOMBERO', pista: 'Apaga incendios y rescata personas', categoria: 'Profesiones' },
  { palabra: 'POLICIA', pista: 'Mantiene el orden y la seguridad', categoria: 'Profesiones' },
  { palabra: 'COCINERO', pista: 'Profesional que prepara platos en un restaurante', categoria: 'Profesiones' },
  { palabra: 'PINTOR', pista: 'Artista que crea obras con colores', categoria: 'Profesiones' },
  { palabra: 'ABOGADO', pista: 'Profesional que defiende en los juicios', categoria: 'Profesiones' },
  { palabra: 'CARPINTERO', pista: 'Trabaja la madera para hacer muebles', categoria: 'Profesiones' },

  // Objetos cotidianos
  { palabra: 'LIBRO', pista: 'Conjunto de páginas con texto para leer', categoria: 'Objetos' },
  { palabra: 'LLAVE', pista: 'Pieza metálica que abre cerraduras', categoria: 'Objetos' },
  { palabra: 'BOLSO', pista: 'Accesorio para llevar objetos personales', categoria: 'Objetos' },
  { palabra: 'PARAGUAS', pista: 'Protege de la lluvia al abrirlo', categoria: 'Objetos' },
  { palabra: 'TIJERAS', pista: 'Instrumento con dos hojas para cortar', categoria: 'Objetos' },
  { palabra: 'GAFAS', pista: 'Se ponen sobre la nariz para ver mejor', categoria: 'Objetos' },
  { palabra: 'CARTERA', pista: 'Accesorio para guardar dinero y tarjetas', categoria: 'Objetos' },
  { palabra: 'BOTELLA', pista: 'Recipiente para líquidos con cuello estrecho', categoria: 'Objetos' },
  { palabra: 'VELA', pista: 'Cilindro de cera con mecha que da luz', categoria: 'Objetos' },
  { palabra: 'MONEDA', pista: 'Pieza metálica redonda que vale dinero', categoria: 'Objetos' },

  // Lugares
  { palabra: 'IGLESIA', pista: 'Edificio religioso con campanario', categoria: 'Lugares' },
  { palabra: 'MERCADO', pista: 'Lugar donde se compran alimentos frescos', categoria: 'Lugares' },
  { palabra: 'PARQUE', pista: 'Espacio verde en la ciudad para pasear', categoria: 'Lugares' },
  { palabra: 'PLAZA', pista: 'Espacio abierto en el centro del pueblo', categoria: 'Lugares' },
  { palabra: 'FARMACIA', pista: 'Tienda donde se venden medicinas', categoria: 'Lugares' },
  { palabra: 'HOSPITAL', pista: 'Edificio donde curan a los enfermos', categoria: 'Lugares' },
  { palabra: 'ESCUELA', pista: 'Lugar donde los niños van a aprender', categoria: 'Lugares' },
  { palabra: 'ESTACION', pista: 'Lugar donde se coge el tren', categoria: 'Lugares' },

  // Ropa
  { palabra: 'ZAPATO', pista: 'Calzado que protege el pie', categoria: 'Ropa' },
  { palabra: 'CAMISA', pista: 'Prenda con botones para la parte superior', categoria: 'Ropa' },
  { palabra: 'FALDA', pista: 'Prenda femenina que cubre desde la cintura', categoria: 'Ropa' },
  { palabra: 'GORRO', pista: 'Prenda que cubre la cabeza del frío', categoria: 'Ropa' },
  { palabra: 'ABRIGO', pista: 'Prenda de vestir larga para el invierno', categoria: 'Ropa' },
  { palabra: 'BUFANDA', pista: 'Prenda larga que envuelve el cuello', categoria: 'Ropa' },
  { palabra: 'GUANTE', pista: 'Prenda que cubre la mano y los dedos', categoria: 'Ropa' },
  { palabra: 'CINTURON', pista: 'Tira que sujeta el pantalón a la cintura', categoria: 'Ropa' },

  // Transporte
  { palabra: 'COCHE', pista: 'Vehículo con cuatro ruedas y motor', categoria: 'Transporte' },
  { palabra: 'AVION', pista: 'Vehículo que vuela por el cielo', categoria: 'Transporte' },
  { palabra: 'BARCO', pista: 'Vehículo que navega por el mar', categoria: 'Transporte' },
  { palabra: 'TREN', pista: 'Transporte que va sobre raíles', categoria: 'Transporte' },
  { palabra: 'METRO', pista: 'Tren subterráneo de las ciudades', categoria: 'Transporte' },
  { palabra: 'BICICLETA', pista: 'Vehículo de dos ruedas movido con pedales', categoria: 'Transporte' },

  // Música
  { palabra: 'GUITARRA', pista: 'Instrumento de cuerda que se rasguea', categoria: 'Música' },
  { palabra: 'PIANO', pista: 'Instrumento de teclas blancas y negras', categoria: 'Música' },
  { palabra: 'TAMBOR', pista: 'Instrumento de percusión que se golpea', categoria: 'Música' },
  { palabra: 'FLAUTA', pista: 'Instrumento de viento alargado', categoria: 'Música' },
  { palabra: 'VIOLIN', pista: 'Instrumento de cuerda que se toca con arco', categoria: 'Música' },

  // Tiempo / clima
  { palabra: 'VERANO', pista: 'Estación más calurosa del año', categoria: 'Tiempo' },
  { palabra: 'INVIERNO', pista: 'Estación más fría del año', categoria: 'Tiempo' },
  { palabra: 'TORMENTA', pista: 'Fenómeno con rayos, truenos y lluvia fuerte', categoria: 'Tiempo' },
  { palabra: 'HELADA', pista: 'Cuando el frío congela el rocío del suelo', categoria: 'Tiempo' },

  // Sentimientos
  { palabra: 'ALEGRIA', pista: 'Sentimiento de felicidad y gozo', categoria: 'Sentimientos' },
  { palabra: 'TRISTEZA', pista: 'Sentimiento opuesto a la alegría', categoria: 'Sentimientos' },
  { palabra: 'MIEDO', pista: 'Sensación ante un peligro', categoria: 'Sentimientos' },
  { palabra: 'SORPRESA', pista: 'Reacción ante algo inesperado', categoria: 'Sentimientos' },
  { palabra: 'ESPERANZA', pista: 'Confianza en que algo bueno ocurrirá', categoria: 'Sentimientos' },

  // Cultura
  { palabra: 'MUSEO', pista: 'Edificio donde se exponen obras de arte', categoria: 'Cultura' },
  { palabra: 'PINTURA', pista: 'Arte de representar imágenes con colores', categoria: 'Cultura' },
  { palabra: 'ESCULTURA', pista: 'Obra de arte tallada en piedra o metal', categoria: 'Cultura' },
  { palabra: 'TEATRO', pista: 'Lugar donde se representan obras', categoria: 'Cultura' },
  { palabra: 'POESIA', pista: 'Composición literaria escrita en verso', categoria: 'Cultura' },
  { palabra: 'NOVELA', pista: 'Obra literaria larga en prosa', categoria: 'Cultura' },
];

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Relojero maestro! Todas las piezas en su sitio 🌟',
    '¡Extraordinario! Tu precisión es de alta relojería 🏆',
    '¡Impecable! Cada engranaje perfecto 🕰️✨',
  ],
  bueno: [
    '¡Muy bien! El mecanismo casi perfecto 🔧',
    '¡Buen trabajo! Pocas piezas se te resisten 💪',
    '¡Genial! Tu taller produce buenos relojes ⏰',
  ],
  regular: [
    '¡Bien hecho! Cada reloj reparado te hace mejor 🔩',
    '¡Sigue así! La práctica afina el pulso 🌱',
    '¡Ánimo! Las piezas encajarán cada vez más rápido 💚',
  ],
  bajo: [
    '¡No te rindas! Todo relojero empieza con piezas sueltas 🌱',
    '¡Buen intento! La pista te ayudará la próxima vez 💪',
    '¡Cada partida entrena tu mente! Tú puedes 🕰️',
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
 * Baraja un array (Fisher-Yates).
 * @param {Array} arr
 * @returns {Array}
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
 * Desordena las letras de una palabra asegurando que quede diferente.
 * @param {string} word
 * @returns {string[]}
 */
function desordenarLetras(word) {
  const letters = word.split('');
  let shuffled;
  let intentos = 0;
  do {
    shuffled = shuffle(letters);
    intentos++;
  } while (shuffled.join('') === word && intentos < 20);
  return shuffled;
}

/**
 * Convierte nivel de dificultad (0-100) a configuración de partida.
 * @param {number} nivel - Nivel 0-100.
 * @returns {{ totalRondas: number, longitudMin: number, longitudMax: number, tiempoPorRonda: number, mostrarCategoria: boolean }}
 */
function nivelAConfig(nivel) {
  if (nivel <= 10) return { totalRondas: 8,  longitudMin: 3, longitudMax: 5, tiempoPorRonda: 0,     mostrarCategoria: true };
  if (nivel <= 22) return { totalRondas: 10, longitudMin: 4, longitudMax: 5, tiempoPorRonda: 0,     mostrarCategoria: true };
  if (nivel <= 36) return { totalRondas: 10, longitudMin: 4, longitudMax: 6, tiempoPorRonda: 20000, mostrarCategoria: true };
  if (nivel <= 50) return { totalRondas: 12, longitudMin: 5, longitudMax: 7, tiempoPorRonda: 18000, mostrarCategoria: true };
  if (nivel <= 64) return { totalRondas: 12, longitudMin: 5, longitudMax: 7, tiempoPorRonda: 15000, mostrarCategoria: false };
  if (nivel <= 78) return { totalRondas: 14, longitudMin: 6, longitudMax: 8, tiempoPorRonda: 14000, mostrarCategoria: false };
  if (nivel <= 90) return { totalRondas: 14, longitudMin: 6, longitudMax: 9, tiempoPorRonda: 12000, mostrarCategoria: false };
  return              { totalRondas: 16, longitudMin: 7, longitudMax: 10, tiempoPorRonda: 10000, mostrarCategoria: false };
}

/**
 * Genera todas las rondas para una partida.
 * @param {object} config
 * @returns {Array<{ palabra: string, pista: string, categoria: string, letrasDesordenadas: string[] }>}
 */
function generarPartida(config) {
  const validas = PALABRAS.filter(
    (p) => p.palabra.length >= config.longitudMin && p.palabra.length <= config.longitudMax,
  );
  const pool = shuffle(validas);
  const seleccionadas = pool.slice(0, config.totalRondas);
  return seleccionadas.map((p) => ({
    palabra: p.palabra,
    pista: p.pista,
    categoria: p.categoria,
    letrasDesordenadas: desordenarLetras(p.palabra),
  }));
}

/**
 * Calcula la puntuación (0-100).
 * @param {number} aciertos
 * @param {number} total
 * @param {number} segundos
 * @param {number} totalRondas
 * @returns {number}
 */
function calcularPuntuacion(aciertos, total, segundos, totalRondas) {
  const precision = aciertos / total;
  const tiempoIdeal = totalRondas * 6;
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
  if (nivel <= 10) return 'Aprendiz';
  if (nivel <= 22) return 'Engrasador';
  if (nivel <= 36) return 'Ayudante';
  if (nivel <= 50) return 'Artesano';
  if (nivel <= 64) return 'Relojero';
  if (nivel <= 78) return 'Maestro';
  if (nivel <= 90) return 'Cronógrafo';
  return 'Gran Relojero';
}

// --- Pantalla principal del juego ---
export default function WatchmakerGameScreen({ navigation, route }) {
  const juegoId = route.params?.juegoId;

  // Estado del juego
  const [nivel, setNivel] = useState(null);
  const [config, setConfig] = useState(null);
  const [rondas, setRondas] = useState([]);
  const [rondaIdx, setRondaIdx] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [timer, setTimer] = useState(0);
  const [roundTimer, setRoundTimer] = useState(0);
  const [gameState, setGameState] = useState('loading');
  const [seleccionUsuario, setSeleccionUsuario] = useState([]);
  const [letrasDisponibles, setLetrasDisponibles] = useState([]);
  const [feedbackCorrecto, setFeedbackCorrecto] = useState(null);
  const [puntuacion, setPuntuacion] = useState(null);
  const [refuerzoMsg, setRefuerzoMsg] = useState('');
  const [resultSaved, setResultSaved] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);

  // Refs
  const timerRef = useRef(null);
  const timerValueRef = useRef(0);
  const roundTimerRef = useRef(null);
  const roundStartRef = useRef(0);
  const feedbackTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const wantsToLeaveRef = useRef(false);
  const prevGameStateRef = useRef('loading');

  // Animaciones
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { timerValueRef.current = timer; }, [timer]);

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

  // --- Helper para preparar ronda actual ---
  const prepararRonda = useCallback((rds, idx) => {
    if (idx < rds.length) {
      setSeleccionUsuario([]);
      setLetrasDisponibles(rds[idx].letrasDesordenadas.map((l, i) => ({ letra: l, id: i, usada: false })));
      setFeedbackCorrecto(null);
    }
  }, []);

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
    wantsToLeaveRef.current = false;
    clearAllTimers();
    prepararRonda(nuevasRondas, 0);
    setGameState('countdown');
  }, [clearAllTimers, prepararRonda]);

  // --- Countdown 3-2-1 ---
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

  // --- Animación de tarjeta al cambiar ronda ---
  useEffect(() => {
    if (gameState === 'playing') {
      cardAnim.setValue(0.5);
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [gameState, rondaIdx, cardAnim]);

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

  // --- Cronómetro global ---
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

  // --- Timer por ronda ---
  useEffect(() => {
    if (gameState === 'playing' && config?.tiempoPorRonda > 0) {
      setRoundTimer(config.tiempoPorRonda);
      roundStartRef.current = Date.now();

      roundTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - roundStartRef.current;
        const remaining = Math.max(0, config.tiempoPorRonda - elapsed);
        setRoundTimer(remaining);

        if (remaining <= 0) {
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
    const ac = todasRespuestas.filter((r) => r.correcto).length;
    const tiempoActual = timerValueRef.current;
    const score = calcularPuntuacion(ac, todasRespuestas.length, tiempoActual, rondas.length);
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
  }, [rondas, juegoId, nivel, resultSaved, clearAllTimers]);

  // --- Avanzar a siguiente ronda ---
  const avanzarRonda = useCallback((nuevasRespuestas) => {
    const nextIdx = rondaIdx + 1;
    if (nextIdx >= rondas.length) {
      finalizarPartida(nuevasRespuestas);
    } else {
      setRondaIdx(nextIdx);
      prepararRonda(rondas, nextIdx);
      setGameState('playing');
      roundStartRef.current = Date.now();
    }
  }, [rondaIdx, rondas, finalizarPartida, prepararRonda]);

  // --- Handler de timeout ---
  const handleTimeout = useCallback(() => {
    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }

    const nuevaRespuesta = { correcto: false, tiempoMs: config?.tiempoPorRonda ?? 0, palabraUsuario: seleccionUsuario.map((s) => s.letra).join('') };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    setFeedbackCorrecto(false);
    setGameState('feedback');

    feedbackTimeoutRef.current = setTimeout(() => {
      avanzarRonda(nuevasRespuestas);
    }, 2000);
  }, [config, respuestas, avanzarRonda, seleccionUsuario]);

  // --- Comprobar palabra cuando el usuario completa las letras ---
  const comprobarPalabra = useCallback((nuevaSeleccion) => {
    const ronda = rondas[rondaIdx];
    if (nuevaSeleccion.length !== ronda.palabra.length) return;

    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }

    const palabraFormada = nuevaSeleccion.map((s) => s.letra).join('');
    const correcto = palabraFormada === ronda.palabra;
    const tiempoMs = Date.now() - roundStartRef.current;
    const nuevaRespuesta = { correcto, tiempoMs, palabraUsuario: palabraFormada };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    setFeedbackCorrecto(correcto);
    setGameState('feedback');

    feedbackTimeoutRef.current = setTimeout(() => {
      avanzarRonda(nuevasRespuestas);
    }, correcto ? 1000 : 2200);
  }, [rondas, rondaIdx, respuestas, avanzarRonda]);

  // --- Seleccionar una letra disponible ---
  const handleSelectLetra = useCallback((letraObj) => {
    if (gameState !== 'playing') return;

    const nuevaSeleccion = [...seleccionUsuario, letraObj];
    setSeleccionUsuario(nuevaSeleccion);
    setLetrasDisponibles((prev) =>
      prev.map((l) => (l.id === letraObj.id ? { ...l, usada: true } : l)),
    );

    comprobarPalabra(nuevaSeleccion);
  }, [gameState, seleccionUsuario, comprobarPalabra]);

  // --- Devolver última letra seleccionada ---
  const handleRemoveLastLetra = useCallback(() => {
    if (gameState !== 'playing' || seleccionUsuario.length === 0) return;

    const lastLetra = seleccionUsuario[seleccionUsuario.length - 1];
    setSeleccionUsuario((prev) => prev.slice(0, -1));
    setLetrasDisponibles((prev) =>
      prev.map((l) => (l.id === lastLetra.id ? { ...l, usada: false } : l)),
    );
  }, [gameState, seleccionUsuario]);

  // --- Limpiar toda la selección ---
  const handleClearSeleccion = useCallback(() => {
    if (gameState !== 'playing') return;
    setSeleccionUsuario([]);
    setLetrasDisponibles((prev) => prev.map((l) => ({ ...l, usada: false })));
  }, [gameState]);

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

  const nivelLabel = getNivelLabel(nivel ?? 0);

  const roundProgress = config?.tiempoPorRonda > 0
    ? Math.max(0, roundTimer / config.tiempoPorRonda)
    : 1;

  // ==============================
  // RENDER: Loading
  // ==============================
  if (gameState === 'loading' || !config) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.decorBorder}>
          <Text style={styles.loadingEmoji}>🕰️</Text>
          <Text style={styles.loadingTitle}>El Reloj de Letras</Text>
          <Text style={styles.loadingText}>Preparando el taller...</Text>
          <Text style={styles.loadingDeco}>~ 🔧 ~</Text>
        </View>
      </View>
    );
  }

  // ==============================
  // RENDER: Countdown 3-2-1
  // ==============================
  if (gameState === 'countdown') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.decorBorder}>
          <Text style={styles.countdownEmoji}>⏰</Text>
          <Text style={styles.countdownText}>¿Preparado?</Text>
          <Text style={styles.countdownNum}>{countdownNum}</Text>
          <View style={styles.countdownDivider} />
          <Text style={styles.countdownHint}>
            Reordena las letras para formar la palabra
          </Text>
          <Text style={styles.countdownNivel}>
            {nivelLabel} · Nivel {nivel}
          </Text>
        </View>
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
            {puntuacion >= 80 ? '🏆' : puntuacion >= 50 ? '🕰️' : '🌱'}
          </Text>
          <Text style={styles.resultTitle}>¡Taller cerrado!</Text>
          <Text style={styles.refuerzoText}>{refuerzoMsg}</Text>

          <View style={styles.resultDecoLine} />

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Puntuación</Text>
            <Text style={[
              styles.resultValue,
              { color: puntuacion >= 70 ? '#5D4037' : puntuacion >= 45 ? '#F57F17' : '#C62828' },
            ]}>{puntuacion}/100</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Aciertos</Text>
            <Text style={styles.resultValue}>{aciertos}/{rondas.length}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>⏱️ Tiempo</Text>
            <Text style={styles.resultValue}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nivel</Text>
            <Text style={styles.resultValue}>{nivelLabel} ({nivel})</Text>
          </View>

          {/* Resumen ronda a ronda */}
          <View style={styles.resumenContainer}>
            <Text style={styles.resumenTitle}>Resumen del taller</Text>
            {rondas.map((ronda, idx) => {
              const resp = respuestas[idx];
              return (
                <View key={idx} style={styles.resumenRow}>
                  <Text style={styles.resumenPalabra} numberOfLines={1}>
                    {ronda.palabra}
                  </Text>
                  <Text style={styles.resumenPista} numberOfLines={1}>
                    {ronda.pista}
                  </Text>
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
              <Text style={styles.btnPrimaryText}>🕰️ Jugar de nuevo</Text>
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

  const palabraCompleta = seleccionUsuario.length === ronda.palabra.length;

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
              <Text style={styles.pauseInfoText}>Pieza: {rondaIdx + 1}/{rondas.length}</Text>
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
        <Text style={styles.topBarTitle}>🕰️ El Reloj de Letras</Text>
        <TouchableOpacity
          onPress={handlePause}
          accessibilityRole="button"
          accessibilityLabel="Pausar juego"
          style={styles.topBarBtn}
          disabled={gameState !== 'playing'}
        >
          <Text style={styles.topBarPause}>⏸️</Text>
        </TouchableOpacity>
      </View>

      {/* Info chips */}
      <View style={styles.infoBar}>
        <View style={[styles.infoChip, { backgroundColor: '#EFEBE9' }]}>
          <Text style={styles.infoChipEmoji}>🔧</Text>
          <Text style={[styles.infoChipValue, { color: '#4E342E' }]}>{rondaIdx + 1}/{rondas.length}</Text>
        </View>
        <View style={[styles.infoChip, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.infoChipEmoji}>✅</Text>
          <Text style={[styles.infoChipValue, { color: '#E65100' }]}>{aciertos}</Text>
        </View>
        <View style={[styles.infoChip, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.infoChipEmoji}>⏱️</Text>
          <Text style={[styles.infoChipValue, { color: '#0D47A1' }]}>{formatTime(timer)}</Text>
        </View>
      </View>

      {/* Barra de tiempo por ronda */}
      {config.tiempoPorRonda > 0 && (
        <View style={styles.roundTimerBg}>
          <View
            style={[
              styles.roundTimerFill,
              {
                width: `${Math.round(roundProgress * 100)}%`,
                backgroundColor: roundProgress > 0.3 ? '#8D6E63' : '#D32F2F',
              },
            ]}
          />
        </View>
      )}

      {/* Área de juego */}
      <ScrollView
        style={styles.playArea}
        contentContainerStyle={styles.playContent}
      >
        {/* Tarjeta de instrucción */}
        <Animated.View
          style={[
            styles.instructionCard,
            { transform: [{ scale: cardAnim }] },
          ]}
        >
          <View style={styles.instructionDecoTop}>
            <Text style={styles.instructionDecoText}>✦ Pieza {rondaIdx + 1} de {rondas.length} ✦</Text>
          </View>
          <Text style={styles.instructionEmoji}>🔍</Text>

          {/* Pista */}
          <View style={styles.pistaBadge}>
            <Text style={styles.pistaText}>💡 {ronda.pista}</Text>
          </View>

          {/* Categoría (niveles bajos) */}
          {config.mostrarCategoria && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>📋 {ronda.categoria}</Text>
            </View>
          )}
          <View style={styles.instructionBottomLine} />
        </Animated.View>

        {/* Zona de respuesta del usuario */}
        <View style={styles.answerZone}>
          <Text style={styles.answerLabel}>Tu palabra:</Text>
          <View style={styles.answerSlots}>
            {Array.from({ length: ronda.palabra.length }).map((_, idx) => {
              const letraColocada = seleccionUsuario[idx];
              let slotStyle = styles.answerSlot;
              let slotTextStyle = styles.answerSlotText;

              if (gameState === 'feedback' && palabraCompleta) {
                if (feedbackCorrecto) {
                  slotStyle = [styles.answerSlot, styles.slotCorrect];
                  slotTextStyle = [styles.answerSlotText, styles.slotCorrectText];
                } else {
                  const letraCorrecta = ronda.palabra[idx];
                  const letraUsuario = seleccionUsuario[idx]?.letra;
                  if (letraUsuario === letraCorrecta) {
                    slotStyle = [styles.answerSlot, styles.slotCorrect];
                    slotTextStyle = [styles.answerSlotText, styles.slotCorrectText];
                  } else {
                    slotStyle = [styles.answerSlot, styles.slotWrong];
                    slotTextStyle = [styles.answerSlotText, styles.slotWrongText];
                  }
                }
              }

              return (
                <View key={idx} style={slotStyle}>
                  <Text style={slotTextStyle}>
                    {letraColocada ? letraColocada.letra : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Botones de acción rápida */}
          {gameState === 'playing' && seleccionUsuario.length > 0 && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleRemoveLastLetra}
                accessibilityRole="button"
                accessibilityLabel="Borrar última letra"
              >
                <Text style={styles.actionBtnText}>⌫ Borrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnClear]}
                onPress={handleClearSeleccion}
                accessibilityRole="button"
                accessibilityLabel="Borrar todo"
              >
                <Text style={[styles.actionBtnText, styles.actionBtnClearText]}>🗑 Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Letras disponibles */}
        <View style={styles.letrasContainer}>
          <Text style={styles.letrasLabel}>Letras disponibles:</Text>
          <View style={styles.letrasGrid}>
            {letrasDisponibles.map((letraObj) => (
              <TouchableOpacity
                key={letraObj.id}
                style={[
                  styles.letraBtn,
                  letraObj.usada && styles.letraBtnUsada,
                ]}
                onPress={() => handleSelectLetra(letraObj)}
                disabled={gameState !== 'playing' || letraObj.usada}
                accessibilityRole="button"
                accessibilityLabel={`Letra ${letraObj.letra}`}
              >
                <Text style={[
                  styles.letraText,
                  letraObj.usada && styles.letraTextUsada,
                ]}>
                  {letraObj.letra}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback */}
        {gameState === 'feedback' && (
          <View style={[
            styles.feedbackBanner,
            feedbackCorrecto ? styles.feedbackCorrectBg : styles.feedbackWrongBg,
          ]}>
            <Text style={[
              styles.feedbackText,
              feedbackCorrecto ? styles.feedbackCorrectText : styles.feedbackWrongTextColor,
            ]}>
              {feedbackCorrecto
                ? '✅ ¡Pieza reparada! Palabra correcta'
                : `❌ La palabra era: ${ronda.palabra}`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Contenedores principales ---
  centerContainer: {
    flex: 1,
    backgroundColor: '#3E2723',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  decorBorder: {
    borderWidth: 3,
    borderColor: '#BCAAA4',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#EFEBE9',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#EFEBE9',
  },
  resultContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --- Loading ---
  loadingEmoji: { fontSize: 56, marginBottom: 8 },
  loadingTitle: {
    fontSize: fonts.h1,
    fontWeight: fonts.bold,
    color: '#BCAAA4',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#D7CCC8',
    textAlign: 'center',
  },
  loadingDeco: {
    marginTop: 16,
    fontSize: 18,
    color: '#8D6E63',
    letterSpacing: 4,
  },

  // --- Countdown ---
  countdownEmoji: { fontSize: 56, marginBottom: 8 },
  countdownText: {
    fontSize: fonts.h2,
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  countdownNum: {
    fontSize: 80,
    fontWeight: fonts.bold,
    color: '#BCAAA4',
  },
  countdownDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#8D6E63',
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

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4E342E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 50,
    borderBottomWidth: 3,
    borderBottomColor: '#BCAAA4',
  },
  topBarBtn: { padding: 4 },
  topBarBack: {
    color: '#D7CCC8',
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
  },
  topBarTitle: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },
  topBarPause: { fontSize: 22 },

  // --- Info chips ---
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EFEBE9',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  infoChipEmoji: { fontSize: 16 },
  infoChipValue: {
    fontSize: 15,
    fontWeight: fonts.bold,
  },

  // --- Round timer ---
  roundTimerBg: {
    height: 5,
    backgroundColor: '#D7CCC8',
  },
  roundTimerFill: {
    height: 5,
    borderRadius: 3,
  },

  // --- Play area ---
  playArea: {
    flex: 1,
  },
  playContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --- Instruction card ---
  instructionCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D7CCC8',
    elevation: 4,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  instructionDecoTop: {
    backgroundColor: '#EFEBE9',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  instructionDecoText: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: fonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  instructionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  pistaBadge: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 6,
  },
  pistaText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 26,
  },
  categoryBadge: {
    marginTop: 8,
    backgroundColor: '#EFEBE9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: fonts.bold,
    color: '#8D6E63',
  },
  instructionBottomLine: {
    width: 50,
    height: 3,
    backgroundColor: '#8D6E63',
    borderRadius: 2,
    marginTop: 14,
  },

  // --- Answer zone ---
  answerZone: {
    alignItems: 'center',
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#5D4037',
    marginBottom: 10,
  },
  answerSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  answerSlot: {
    width: 42,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#BCAAA4',
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  answerSlotText: {
    fontSize: 22,
    fontWeight: fonts.bold,
    color: '#3E2723',
  },
  slotCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  slotCorrectText: {
    color: '#2E7D32',
  },
  slotWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  slotWrongText: {
    color: '#C62828',
  },

  // --- Action buttons ---
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#EFEBE9',
    borderWidth: 1,
    borderColor: '#BCAAA4',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: fonts.semibold,
    color: '#5D4037',
  },
  actionBtnClear: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFCC80',
  },
  actionBtnClearText: {
    color: '#E65100',
  },

  // --- Letras disponibles ---
  letrasContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  letrasLabel: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#5D4037',
    marginBottom: 10,
  },
  letrasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  letraBtn: {
    width: 52,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8D6E63',
    elevation: 3,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  letraText: {
    fontSize: 24,
    fontWeight: fonts.bold,
    color: '#3E2723',
  },
  letraBtnUsada: {
    backgroundColor: '#EFEBE9',
    borderColor: '#D7CCC8',
    elevation: 0,
  },
  letraTextUsada: {
    color: '#BCAAA4',
  },

  // --- Feedback ---
  feedbackBanner: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  feedbackCorrectBg: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  feedbackWrongBg: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  feedbackText: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    textAlign: 'center',
  },
  feedbackCorrectText: {
    color: '#2E7D32',
  },
  feedbackWrongTextColor: {
    color: '#C62828',
  },

  // --- Pause modal (unified) ---
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
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#D7CCC8',
    elevation: 4,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  resultDecoLine: {
    width: '60%',
    height: 2,
    backgroundColor: '#8D6E63',
    marginVertical: 14,
    borderRadius: 1,
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
    backgroundColor: '#EFEBE9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
  },
  resultBadgeText: {
    fontSize: fonts.small,
    color: '#4E342E',
    textAlign: 'center',
    fontWeight: fonts.semibold,
  },

  // --- Resumen ---
  resumenContainer: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#EFEBE9',
    borderRadius: 14,
    padding: 16,
  },
  resumenTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#5D4037',
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
  resumenPalabra: {
    flex: 0.4,
    fontSize: 14,
    color: '#4E342E',
    fontWeight: fonts.bold,
  },
  resumenPista: {
    flex: 0.5,
    fontSize: 13,
    color: '#8D6E63',
    fontStyle: 'italic',
    marginRight: 8,
  },
  resumenIcon: {
    fontSize: 18,
  },

  // --- Buttons ---
  resultButtons: {
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#5D4037',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
  },
  btnSecondary: {
    backgroundColor: '#EFEBE9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnSecondaryText: {
    color: '#5D4037',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
