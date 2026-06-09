import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import {

  View, Text, StyleSheet, TouchableOpacity, Animated,

  AppState, ScrollView, Modal, Alert,

} from 'react-native';

import { colors } from '../../constants/colors';

import { fonts } from '../../constants/fonts';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProximoNivel, guardarResultado } from '../../services/dataService';



// --- Banco de refranes ---

// Cada refrán tiene: inicio (se muestra), correcta (final verdadero), distractores (finales falsos)

const REFRANES = [

  { inicio: 'A quien madruga...', correcta: 'Dios le ayuda', distractores: ['le duele la espalda', 'se le enfría el café', 'el sol le quema'] },

  { inicio: 'Más vale pájaro en mano...', correcta: 'que ciento volando', distractores: ['que ninguno en el nido', 'que dos en el tejado', 'que mil cantando'] },

  { inicio: 'No por mucho madrugar...', correcta: 'amanece más temprano', distractores: ['se duerme mejor', 'llueve menos', 'se trabaja más'] },

  { inicio: 'En boca cerrada...', correcta: 'no entran moscas', distractores: ['no salen palabras', 'no hay mentiras', 'no hay suspiros'] },

  { inicio: 'A caballo regalado...', correcta: 'no le mires el diente', distractores: ['no le pongas silla', 'dale de comer', 'no le cambies el nombre'] },

  { inicio: 'Dime con quién andas...', correcta: 'y te diré quién eres', distractores: ['y te diré adónde vas', 'y sabré tu secreto', 'y conoceré tu casa'] },

  { inicio: 'El que mucho abarca...', correcta: 'poco aprieta', distractores: ['mucho trabaja', 'poco descansa', 'nada consigue'] },

  { inicio: 'Más vale tarde...', correcta: 'que nunca', distractores: ['que temprano', 'que corriendo', 'que solo'] },

  { inicio: 'Ojos que no ven...', correcta: 'corazón que no siente', distractores: ['boca que no habla', 'manos que no tocan', 'pies que no caminan'] },

  { inicio: 'Perro ladrador...', correcta: 'poco mordedor', distractores: ['buen guardián', 'mucho corredor', 'mal cazador'] },

  { inicio: 'A mal tiempo...', correcta: 'buena cara', distractores: ['buen paraguas', 'mejor abrigo', 'mucha paciencia'] },

  { inicio: 'Cuando el río suena...', correcta: 'agua lleva', distractores: ['piedras trae', 'peces saltan', 'lluvia viene'] },

  { inicio: 'Cría cuervos...', correcta: 'y te sacarán los ojos', distractores: ['y volarán lejos', 'y crecerán fuertes', 'y cantarán de noche'] },

  { inicio: 'Del dicho al hecho...', correcta: 'hay un gran trecho', distractores: ['hay mucho tiempo', 'no hay camino', 'falta valor'] },

  { inicio: 'Quien tiene boca...', correcta: 'se equivoca', distractores: ['siempre habla', 'nunca calla', 'come de todo'] },

  { inicio: 'Al que buen árbol se arrima...', correcta: 'buena sombra le cobija', distractores: ['buena fruta le cae', 'buen aire respira', 'buen camino encuentra'] },

  { inicio: 'No hay mal...', correcta: 'que por bien no venga', distractores: ['que cien años dure', 'sin remedio', 'que no se cure'] },

  { inicio: 'Agua que no has de beber...', correcta: 'déjala correr', distractores: ['guárdala bien', 'no la mires', 'tápala pronto'] },

  { inicio: 'A palabras necias...', correcta: 'oídos sordos', distractores: ['labios cerrados', 'manos quietas', 'ojos ciegos'] },

  { inicio: 'De tal palo...', correcta: 'tal astilla', distractores: ['tal madera', 'tal leña', 'tal rama'] },

  { inicio: 'Donde fueres...', correcta: 'haz lo que vieres', distractores: ['come lo que dieres', 'vive como pudieres', 'calla lo que oyeres'] },

  { inicio: 'El que la sigue...', correcta: 'la consigue', distractores: ['se cansa', 'la pierde', 'nunca para'] },

  { inicio: 'En casa del herrero...', correcta: 'cuchillo de palo', distractores: ['sobra el hierro', 'no hay fuego', 'falta el martillo'] },

  { inicio: 'Haz el bien...', correcta: 'y no mires a quién', distractores: ['y recibirás el doble', 'y duerme tranquilo', 'y calla después'] },

  { inicio: 'El saber...', correcta: 'no ocupa lugar', distractores: ['da poder', 'cuesta dinero', 'llega tarde'] },

  { inicio: 'Quien mucho duerme...', correcta: 'poco aprende', distractores: ['mucho sueña', 'tarde llega', 'bien descansa'] },

  { inicio: 'Más vale maña...', correcta: 'que fuerza', distractores: ['que prisa', 'que suerte', 'que dinero'] },

  { inicio: 'A Dios rogando...', correcta: 'y con el mazo dando', distractores: ['y el trabajo esperando', 'y con paciencia aguantando', 'y el camino andando'] },

  { inicio: 'El que ríe el último...', correcta: 'ríe mejor', distractores: ['ríe más', 'ríe solo', 'llora después'] },

  { inicio: 'Cada maestrillo...', correcta: 'tiene su librillo', distractores: ['tiene su oficio', 'sabe su camino', 'guarda su secreto'] },

  { inicio: 'A falta de pan...', correcta: 'buenas son tortas', distractores: ['mejor es arroz', 'agua se bebe', 'hambre se pasa'] },

  { inicio: 'Dios los cría...', correcta: 'y ellos se juntan', distractores: ['y ellos se pelean', 'y solos crecen', 'y el viento los lleva'] },

  { inicio: 'En abril...', correcta: 'aguas mil', distractores: ['flores mil', 'días de sol', 'vientos del sur'] },

  { inicio: 'No dejes para mañana...', correcta: 'lo que puedas hacer hoy', distractores: ['lo que ya hiciste ayer', 'lo que otros puedan hacer', 'lo que no te importa'] },

  { inicio: 'A perro flaco...', correcta: 'todo son pulgas', distractores: ['nadie lo quiere', 'poco le dan', 'mucho le ladran'] },

  { inicio: 'Año de nieves...', correcta: 'año de bienes', distractores: ['año de lluvias', 'año de frío', 'año de males'] },

  { inicio: 'A río revuelto...', correcta: 'ganancia de pescadores', distractores: ['peligro de nadadores', 'fiesta de marineros', 'susto de peces'] },

  { inicio: 'Aunque la mona se vista de seda...', correcta: 'mona se queda', distractores: ['seda se rompe', 'todos la miran', 'fea se ve'] },

  { inicio: 'Barriga llena...', correcta: 'corazón contento', distractores: ['sueño seguro', 'boca callada', 'trabajo lento'] },

  { inicio: 'El hábito...', correcta: 'no hace al monje', distractores: ['hace la costumbre', 'cubre al hombre', 'viste al sabio'] },

  { inicio: 'Quien siembra vientos...', correcta: 'recoge tempestades', distractores: ['cosecha lluvias', 'pierde semillas', 'encuentra calma'] },

  { inicio: 'La avaricia...', correcta: 'rompe el saco', distractores: ['ciega los ojos', 'pudre el alma', 'vacía el bolsillo'] },

  { inicio: 'Zapatero...', correcta: 'a tus zapatos', distractores: ['remendón', 'sin zapatos', 'a tu taller'] },

  { inicio: 'El tiempo...', correcta: 'todo lo cura', distractores: ['vuela rápido', 'no perdona', 'pasa lento'] },

  { inicio: 'Quien calla...', correcta: 'otorga', distractores: ['descansa', 'miente', 'sufre'] },

  { inicio: 'Al pan, pan...', correcta: 'y al vino, vino', distractores: ['y al agua, agua', 'y al fuego, fuego', 'y a la sal, sal'] },

  { inicio: 'Más sabe el diablo por viejo...', correcta: 'que por diablo', distractores: ['que por sabio', 'que por astuto', 'que por malo'] },

  { inicio: 'A buen entendedor...', correcta: 'pocas palabras bastan', distractores: ['sobran las explicaciones', 'basta una mirada', 'le sobra paciencia'] },

  { inicio: 'Dime de qué presumes...', correcta: 'y te diré de qué careces', distractores: ['y te diré quién eres', 'y sabré tu verdad', 'y conoceré tu miedo'] },

  { inicio: 'No hay peor ciego...', correcta: 'que el que no quiere ver', distractores: ['que el que cierra los ojos', 'que el que mira sin ver', 'que el que camina solo'] },

  { inicio: 'El que no corre...', correcta: 'vuela', distractores: ['camina', 'se cansa', 'tropieza'] },

  { inicio: 'A quien Dios se la dé...', correcta: 'San Pedro se la bendiga', distractores: ['que la aproveche', 'nadie se la quite', 'que la disfrute'] },

  { inicio: 'Genio y figura...', correcta: 'hasta la sepultura', distractores: ['desde la cuna', 'para toda la vida', 'nunca se cambia'] },

  { inicio: 'Gato escaldado...', correcta: 'del agua fría huye', distractores: ['no vuelve a la cocina', 'no se acerca al fuego', 'maúlla de miedo'] },

  { inicio: 'Donde manda capitán...', correcta: 'no manda marinero', distractores: ['obedece soldado', 'calla el sargento', 'manda el general'] },

  { inicio: 'El que tiene tienda...', correcta: 'que la atienda', distractores: ['que la venda', 'que la cuide', 'que la cierre'] },

  { inicio: 'Querer es...', correcta: 'poder', distractores: ['soñar', 'creer', 'vivir'] },

  { inicio: 'El ojo del amo...', correcta: 'engorda al caballo', distractores: ['cuida la casa', 'vigila al gato', 'protege al ganado'] },

  { inicio: 'De noche todos los gatos...', correcta: 'son pardos', distractores: ['son negros', 'duermen', 'cazan ratones'] },

  { inicio: 'A la tercera...', correcta: 'va la vencida', distractores: ['es la buena', 'no hay excusa', 'se acaba todo'] },

  { inicio: 'Lo cortés...', correcta: 'no quita lo valiente', distractores: ['no quita lo sincero', 'es de buena educación', 'no cuesta nada'] },

  { inicio: 'Hierba mala...', correcta: 'nunca muere', distractores: ['siempre crece', 'no se arranca', 'todo lo invade'] },

  { inicio: 'Tras la tempestad...', correcta: 'viene la calma', distractores: ['llega el sol', 'sale el arcoíris', 'todo mejora'] },

  { inicio: 'El que avisa...', correcta: 'no es traidor', distractores: ['es amigo', 'cumple su deber', 'merece respeto'] },

  { inicio: 'Piensa el ladrón...', correcta: 'que todos son de su condición', distractores: ['que nadie lo ve', 'que todos roban', 'que es muy listo'] },

  { inicio: 'El que a hierro mata...', correcta: 'a hierro muere', distractores: ['a hierro vive', 'tarde lo paga', 'solo queda herido'] },

  { inicio: 'Quien con niños se acuesta...', correcta: 'mojado se levanta', distractores: ['mal descansa', 'tarde se despierta', 'pronto se arrepiente'] },

  { inicio: 'A grandes males...', correcta: 'grandes remedios', distractores: ['mucha paciencia', 'pocas soluciones', 'mejor huir'] },

  { inicio: 'Cree el ladrón...', correcta: 'que todos son de su condición', distractores: ['que nunca lo pillan', 'que robar es fácil', 'que todos mienten'] },

  { inicio: 'Lo que no mata...', correcta: 'engorda', distractores: ['fortalece', 'se olvida', 'da igual'] },

  { inicio: 'Por la boca...', correcta: 'muere el pez', distractores: ['entra el frío', 'sale la verdad', 'se pierde todo'] },

  { inicio: 'Quien mal anda...', correcta: 'mal acaba', distractores: ['mal vive', 'solo camina', 'pronto cae'] },

  { inicio: 'Nadie escarmienta...', correcta: 'en cabeza ajena', distractores: ['sin sufrir', 'a la primera', 'por las buenas'] },

  { inicio: 'Unos nacen con estrella...', correcta: 'y otros nacen estrellados', distractores: ['y otros sin suerte', 'y otros con luna', 'y otros a oscuras'] },

  { inicio: 'En tierra de ciegos...', correcta: 'el tuerto es rey', distractores: ['nadie ve nada', 'todos tropiezan', 'el que ve manda'] },

  { inicio: 'No se ganó Zamora...', correcta: 'en una hora', distractores: ['en un día', 'sin esfuerzo', 'por las buenas'] },

  { inicio: 'Quien tiene un amigo...', correcta: 'tiene un tesoro', distractores: ['tiene compañía', 'no está solo', 'tiene suerte'] },

  { inicio: 'Obras son amores...', correcta: 'y no buenas razones', distractores: ['y no palabras', 'que no engaños', 'y no promesas'] },

  { inicio: 'A pan duro...', correcta: 'diente agudo', distractores: ['mucha hambre', 'buen cuchillo', 'mejor sopa'] },

  { inicio: 'El que nace para martillo...', correcta: 'del cielo le caen los clavos', distractores: ['siempre golpea', 'nunca descansa', 'acaba roto'] },

  { inicio: 'Cuando una puerta se cierra...', correcta: 'otra se abre', distractores: ['busca la ventana', 'espera un poco', 'no insistas'] },

  { inicio: 'Vísteme despacio...', correcta: 'que tengo prisa', distractores: ['que voy tarde', 'que hace frío', 'que hay fiesta'] },

  { inicio: 'Candil de la calle...', correcta: 'oscuridad de su casa', distractores: ['luz para todos', 'sombra en el camino', 'brillo pasajero'] },

  { inicio: 'Santa Rita, Rita...', correcta: 'lo que se da no se quita', distractores: ['lo que se hace no se deshace', 'lo prometido es deuda', 'lo dicho está dicho'] },

  { inicio: 'En martes...', correcta: 'ni te cases ni te embarques', distractores: ['no salgas de casa', 'ten mucho cuidado', 'no firmes nada'] },

  { inicio: 'Loro viejo...', correcta: 'no aprende a hablar', distractores: ['no cambia de jaula', 'repite lo mismo', 'ya no vuela'] },

  { inicio: 'No vendas la piel del oso...', correcta: 'antes de cazarlo', distractores: ['sin haberlo visto', 'antes de atraparlo', 'sin permiso'] },

  { inicio: 'Al que le pique...', correcta: 'que se rasque', distractores: ['que se aguante', 'que se cure', 'que no se queje'] },

  { inicio: 'Casa con dos puertas...', correcta: 'mala es de guardar', distractores: ['difícil de cerrar', 'fácil de entrar', 'siempre está abierta'] },

  { inicio: 'Ande yo caliente...', correcta: 'y ríase la gente', distractores: ['y lo demás no importa', 'aunque llueva fuera', 'y que hablen los demás'] },

  { inicio: 'Arrieros somos...', correcta: 'y en el camino nos encontraremos', distractores: ['y todos caminamos', 'y el mundo es pequeño', 'y nos veremos las caras'] },

  { inicio: 'Mucho ruido...', correcta: 'y pocas nueces', distractores: ['y poco resultado', 'para nada bueno', 'sin razón alguna'] },

  { inicio: 'El que no llora...', correcta: 'no mama', distractores: ['no come', 'no crece', 'no vive'] },

  { inicio: 'Quien fue a Sevilla...', correcta: 'perdió su silla', distractores: ['encontró maravilla', 'halló la orilla', 'cambió de vida'] },

  { inicio: 'Quien no arriesga...', correcta: 'no gana', distractores: ['no pierde', 'no vive', 'no aprende'] },

  { inicio: 'Más vale solo...', correcta: 'que mal acompañado', distractores: ['que con malos amigos', 'que rodeado de gente', 'que entre enemigos'] },

  { inicio: 'Con la iglesia...', correcta: 'hemos topado', distractores: ['no se juega', 'mejor no meterse', 'hay que rezar'] },

];



// --- Mensajes de refuerzo positivo ---

const REFUERZOS = {

  excelente: [

    '¡Sabiduría popular en estado puro! Impresionante 🌟',

    '¡Perfecto! Conoces los refranes como nadie 🏆',

    '¡Extraordinario! Tu memoria cultural es asombrosa 📚✨',

  ],

  bueno: [

    '¡Muy bien! Los refranes son tu fuerte 📖',

    '¡Buen trabajo! Tu sabiduría popular brilla 💪',

    '¡Genial! Casi los aciertas todos 🌈',

  ],

  regular: [

    '¡Bien hecho! Los refranes son todo un arte 📖',

    '¡Sigue así! Cada refrán que aprendes enriquece tu mente 🌿',

    '¡Ánimo! Con práctica los recordarás todos 💚',

  ],

  bajo: [

    '¡No te rindas! Los refranes son sabiduría popular 🌱',

    '¡Buen intento! Lee cada opción con calma 💪',

    '¡Cada partida refuerza tu memoria! Tú puedes 📚',

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

 * @returns {{ totalRondas: number, numOpciones: number, tiempoPorRonda: number }}

 */

function nivelAConfig(nivel) {

  // numOpciones: opciones de final para elegir

  // tiempoPorRonda: ms para responder (0 = sin límite)

  if (nivel <= 10) return { totalRondas: 8,  numOpciones: 2, tiempoPorRonda: 0     };

  if (nivel <= 22) return { totalRondas: 10, numOpciones: 3, tiempoPorRonda: 0     };

  if (nivel <= 36) return { totalRondas: 10, numOpciones: 3, tiempoPorRonda: 15000 };

  if (nivel <= 50) return { totalRondas: 12, numOpciones: 3, tiempoPorRonda: 12000 };

  if (nivel <= 64) return { totalRondas: 12, numOpciones: 4, tiempoPorRonda: 12000 };

  if (nivel <= 78) return { totalRondas: 14, numOpciones: 4, tiempoPorRonda: 10000 };

  if (nivel <= 90) return { totalRondas: 14, numOpciones: 4, tiempoPorRonda: 8000  };

  return              { totalRondas: 16, numOpciones: 4, tiempoPorRonda: 7000  };

}



/**

 * Genera una ronda del juego.

 * @param {object} refran - El refrán para esta ronda.

 * @param {number} numOpciones - Cuántas opciones mostrar.

 * @param {Array} todosRefranes - Pool completo para generar distractores extra.

 * @returns {{ inicio: string, opciones: string[], correcta: string }}

 */

function generarRonda(refran, numOpciones, todosRefranes) {

  const opciones = new Set([refran.correcta]);



  // Añadir distractores propios del refrán

  const distPropios = [...refran.distractores];

  for (let i = distPropios.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [distPropios[i], distPropios[j]] = [distPropios[j], distPropios[i]];

  }

  for (const d of distPropios) {

    if (opciones.size >= numOpciones) break;

    opciones.add(d);

  }



  // Si aún faltan opciones, tomar finales correctos de otros refranes

  if (opciones.size < numOpciones) {

    const otros = todosRefranes

      .filter((r) => r.correcta !== refran.correcta)

      .map((r) => r.correcta);

    for (let i = otros.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [otros[i], otros[j]] = [otros[j], otros[i]];

    }

    for (const o of otros) {

      if (opciones.size >= numOpciones) break;

      opciones.add(o);

    }

  }



  // Barajar opciones

  const opcionesArr = [...opciones];

  for (let i = opcionesArr.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [opcionesArr[i], opcionesArr[j]] = [opcionesArr[j], opcionesArr[i]];

  }



  return {

    inicio: refran.inicio,

    opciones: opcionesArr,

    correcta: refran.correcta,

  };

}



/**

 * Genera todas las rondas para una partida.

 * @param {object} config - Configuración del nivel.

 * @returns {Array}

 */

function generarPartida(config) {

  // Barajar refranes y elegir los necesarios

  const pool = [...REFRANES];

  for (let i = pool.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [pool[i], pool[j]] = [pool[j], pool[i]];

  }



  const seleccionados = pool.slice(0, config.totalRondas);

  return seleccionados.map((r) => generarRonda(r, config.numOpciones, REFRANES));

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

  const tiempoIdeal = totalRondas * 5;

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

  if (nivel <= 22) return 'Curioso';

  if (nivel <= 36) return 'Conocedor';

  if (nivel <= 50) return 'Estudioso';

  if (nivel <= 64) return 'Letrado';

  if (nivel <= 78) return 'Erudito';

  if (nivel <= 90) return 'Sabio';

  return 'Maestro del refranero';

}



// --- Pantalla principal del juego ---

export default function ProverbGameScreen({ navigation, route }) {

  const juegoId = route.params?.juegoId;

  const insets = useSafeAreaInsets();



  // Estado del juego

  const [nivel, setNivel] = useState(null);

  const [config, setConfig] = useState(null);

  const [rondas, setRondas] = useState([]);

  const [rondaIdx, setRondaIdx] = useState(0);

  const [respuestas, setRespuestas] = useState([]);

  const [timer, setTimer] = useState(0);

  const [roundTimer, setRoundTimer] = useState(0);

  const [gameState, setGameState] = useState('loading');

  // loading | countdown | playing | feedback | finished

  const [feedbackCorrecto, setFeedbackCorrecto] = useState(null);

  const [seleccionada, setSeleccionada] = useState(null);

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

  const feedbackOpacity = useRef(new Animated.Value(0)).current;



  // Mantener timerValueRef sincronizado

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

    setSeleccionada(null);

    wantsToLeaveRef.current = false;

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

      setSeleccionada(null);

      setGameState('playing');

      roundStartRef.current = Date.now();

    }

  }, [rondaIdx, rondas, finalizarPartida]);



  // --- Handler de timeout ---

  const handleTimeout = useCallback(() => {

    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }



    const nuevaRespuesta = { correcto: false, tiempoMs: config?.tiempoPorRonda ?? 0, seleccion: null };

    const nuevasRespuestas = [...respuestas, nuevaRespuesta];

    setRespuestas(nuevasRespuestas);

    setFeedbackCorrecto(false);

    setSeleccionada(null);

    setGameState('feedback');



    feedbackOpacity.setValue(1);

    Animated.timing(feedbackOpacity, {

      toValue: 0, duration: 800, delay: 600, useNativeDriver: true,

    }).start();



    feedbackTimeoutRef.current = setTimeout(() => {

      avanzarRonda(nuevasRespuestas);

    }, 1800);

  }, [config, respuestas, avanzarRonda, feedbackOpacity]);



  // --- Handler de respuesta ---

  const handleSelectOption = useCallback((opcion) => {

    if (gameState !== 'playing') return;

    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }



    const ronda = rondas[rondaIdx];

    const correcto = opcion === ronda.correcta;

    const tiempoMs = Date.now() - roundStartRef.current;

    const nuevaRespuesta = { correcto, tiempoMs, seleccion: opcion };

    const nuevasRespuestas = [...respuestas, nuevaRespuesta];

    setRespuestas(nuevasRespuestas);

    setFeedbackCorrecto(correcto);

    setSeleccionada(opcion);

    setGameState('feedback');



    feedbackOpacity.setValue(1);

    Animated.timing(feedbackOpacity, {

      toValue: 0,

      duration: correcto ? 600 : 800,

      delay: correcto ? 300 : 800,

      useNativeDriver: true,

    }).start();



    feedbackTimeoutRef.current = setTimeout(() => {

      avanzarRonda(nuevasRespuestas);

    }, correcto ? 800 : 2000);

  }, [gameState, rondas, rondaIdx, respuestas, avanzarRonda, feedbackOpacity]);



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

          <Text style={styles.loadingEmoji}>📜</Text>

          <Text style={styles.loadingTitle}>Refranes Perdidos</Text>

          <Text style={styles.loadingText}>Abriendo el refranero...</Text>

          <Text style={styles.loadingDeco}>~ ✶ ~</Text>

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

          <Text style={styles.countdownEmoji}>📜</Text>

          <Text style={styles.countdownText}>¿Preparado?</Text>

          <Text style={styles.countdownNum}>{countdownNum}</Text>

          <View style={styles.countdownDivider} />

          <Text style={styles.countdownHint}>

            Completa el refrán con el final correcto

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

            {puntuacion >= 80 ? '🏆' : puntuacion >= 50 ? '⭐' : '🌱'}

          </Text>

          <Text style={styles.resultTitle}>¡Partida terminada!</Text>

          <Text style={styles.refuerzoText}>{refuerzoMsg}</Text>



          <View style={styles.resultDecoLine} />



          <View style={styles.resultRow}>

            <Text style={styles.resultLabel}>Puntuación</Text>

            <Text style={[

              styles.resultValue,

              { color: puntuacion >= 70 ? '#2E7D32' : puntuacion >= 45 ? '#F57F17' : '#C62828' },

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

            <Text style={styles.resumenTitle}>Resumen de refranes</Text>

            {rondas.map((ronda, idx) => {

              const resp = respuestas[idx];

              return (

                <View key={idx} style={styles.resumenRow}>

                  <Text style={styles.resumenInicio} numberOfLines={1}>

                    {ronda.inicio}

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

              <Text style={[styles.resultBadgeText, { color: '#0D47A1' }]}>🔄 Nivel estable – sigue practicando</Text>

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

              <Text style={styles.btnPrimaryText}>📜 Jugar de nuevo</Text>

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

              <Text style={styles.pauseInfoText}>Refrán: {rondaIdx + 1}/{rondas.length}</Text>

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

        <Text style={styles.topBarTitle}>{'📜 Refranes Perdidos'}</Text>

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

        <View style={[styles.infoChip, { backgroundColor: '#FFF3E0' }]}>

          <Text style={styles.infoChipEmoji}>📖</Text>

          <Text style={[styles.infoChipValue, { color: '#E65100' }]}>{rondaIdx + 1}/{rondas.length}</Text>

        </View>

        <View style={[styles.infoChip, { backgroundColor: '#E8F5E9' }]}>

          <Text style={styles.infoChipEmoji}>✅</Text>

          <Text style={[styles.infoChipValue, { color: '#2E7D32' }]}>{aciertos}</Text>

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

                backgroundColor: roundProgress > 0.3 ? '#FF8F00' : '#D32F2F',

              },

            ]}

          />

        </View>

      )}



      {/* Tarjeta del refrán */}

      <ScrollView

        style={styles.playArea}

        contentContainerStyle={styles.playContent}

      >

        <Animated.View

          style={[

            styles.proverbCard,

            { transform: [{ scale: cardAnim }] },

          ]}

        >

          <View style={styles.proverbDecoTop}>

            <Text style={styles.proverbDecoText}>✦ Refrán {rondaIdx + 1} de {rondas.length} ✦</Text>

          </View>

          <View style={styles.proverbQuoteLeft}>

            <Text style={styles.proverbQuoteMark}>❝</Text>

          </View>

          <Text style={styles.proverbText}>{ronda.inicio}</Text>

          <View style={styles.proverbQuoteRight}>

            <Text style={styles.proverbQuoteMark}>❞</Text>

          </View>

          <View style={styles.proverbBottomLine} />

        </Animated.View>



        {/* Opciones */}

        <View style={styles.optionsContainer}>

          {ronda.opciones.map((opcion, idx) => {

            const esFeedback = gameState === 'feedback';

            const esCorrecta = opcion === ronda.correcta;

            const esSeleccionada = opcion === seleccionada;

            const letra = String.fromCharCode(65 + idx);



            let optionStyle = styles.optionBtn;

            let textStyle = styles.optionText;

            let badgeStyle = styles.optionBadge;

            let badgeTextStyle = styles.optionBadgeText;



            if (esFeedback) {

              if (esCorrecta) {

                optionStyle = [styles.optionBtn, styles.optionCorrect];

                textStyle = [styles.optionText, styles.optionCorrectText];

                badgeStyle = [styles.optionBadge, { backgroundColor: '#4CAF50' }];

                badgeTextStyle = [styles.optionBadgeText, { color: colors.white }];

              } else if (esSeleccionada && !feedbackCorrecto) {

                optionStyle = [styles.optionBtn, styles.optionWrong];

                textStyle = [styles.optionText, styles.optionWrongText];

                badgeStyle = [styles.optionBadge, { backgroundColor: '#EF5350' }];

                badgeTextStyle = [styles.optionBadgeText, { color: colors.white }];

              } else {

                optionStyle = [styles.optionBtn, styles.optionDisabled];

                textStyle = [styles.optionText, styles.optionDisabledText];

                badgeStyle = [styles.optionBadge, { backgroundColor: '#E0E0E0' }];

                badgeTextStyle = [styles.optionBadgeText, { color: '#9E9E9E' }];

              }

            }



            return (

              <TouchableOpacity

                key={idx}

                style={optionStyle}

                onPress={() => handleSelectOption(opcion)}

                disabled={gameState !== 'playing'}

                accessibilityRole="button"

                accessibilityLabel={`Opción ${letra}: ${opcion}`}

              >

                <View style={badgeStyle}>

                  <Text style={badgeTextStyle}>{letra}</Text>

                </View>

                <Text style={textStyle}>...{opcion}</Text>

              </TouchableOpacity>

            );

          })}

        </View>



        {/* Feedback */}

        {gameState === 'feedback' && (

          <Animated.View style={[

            styles.feedbackBanner,

            { opacity: feedbackOpacity },

            feedbackCorrecto ? styles.feedbackCorrectBg : (seleccionada ? styles.feedbackWrongBg : styles.feedbackTimeoutBg),

          ]}>

            <Text style={[

              styles.feedbackText,

              feedbackCorrecto ? styles.feedbackCorrectText : styles.feedbackWrongTextColor,

            ]}>

              {feedbackCorrecto

                ? '✅ ¡Correcto! ¡Eres un sabio!'

                : seleccionada

                  ? `❌ Era: ...${ronda.correcta}`

                  : `⏰ Se acabó el tiempo — Era: ...${ronda.correcta}`}

            </Text>

          </Animated.View>

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

    borderColor: '#FFAB00',

    borderRadius: 28,

    padding: 36,

    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.06)',

  },

  gameContainer: {

    flex: 1,

    backgroundColor: '#FFF8E1',

  },

  scrollContainer: {

    flex: 1,

    backgroundColor: '#FFF8E1',

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

    color: '#FFAB00',

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

    color: '#FFAB00',

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

    color: '#FFAB00',

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

    borderBottomColor: '#FFAB00',

  },

  topBarBtn: { padding: 4 },

  topBarBack: {

    color: '#FFCC80',

    fontSize: fonts.small,

    fontWeight: fonts.semibold,

  },

  topBarTitle: {

    color: colors.white,

    fontSize: fonts.body,

    fontWeight: fonts.bold,

    textAlign: 'center',

  },

  topBarPause: { fontSize: 22 },



  // --- Info chips ---

  infoBar: {

    flexDirection: 'row',

    justifyContent: 'center',

    gap: 10,

    backgroundColor: '#FFF8E1',

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

    backgroundColor: '#FFE0B2',

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



  // --- Proverb card ---

  proverbCard: {

    backgroundColor: colors.white,

    borderRadius: 24,

    padding: 28,

    marginBottom: 24,

    alignItems: 'center',

    borderWidth: 2,

    borderColor: '#FFE0B2',

    elevation: 4,

    shadowColor: '#BF360C',

    shadowOffset: { width: 0, height: 3 },

    shadowOpacity: 0.12,

    shadowRadius: 8,

  },

  proverbDecoTop: {

    backgroundColor: '#FFF3E0',

    paddingVertical: 5,

    paddingHorizontal: 16,

    borderRadius: 12,

    marginBottom: 16,

  },

  proverbDecoText: {

    fontSize: 12,

    color: '#E65100',

    fontWeight: fonts.bold,

    letterSpacing: 1,

    textTransform: 'uppercase',

  },

  proverbQuoteLeft: {

    alignSelf: 'flex-start',

    marginBottom: -8,

    marginLeft: 4,

  },

  proverbQuoteRight: {

    alignSelf: 'flex-end',

    marginTop: -8,

    marginRight: 4,

  },

  proverbQuoteMark: {

    fontSize: 32,

    color: '#FFAB00',

    lineHeight: 36,

  },

  proverbText: {

    fontSize: 26,

    fontWeight: fonts.bold,

    color: '#3E2723',

    textAlign: 'center',

    lineHeight: 36,

    fontStyle: 'italic',

    paddingHorizontal: 8,

  },

  proverbBottomLine: {

    width: 50,

    height: 3,

    backgroundColor: '#FFAB00',

    borderRadius: 2,

    marginTop: 16,

  },



  // --- Options ---

  optionsContainer: {

    gap: 12,

  },

  optionBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: colors.white,

    borderRadius: 16,

    paddingVertical: 16,

    paddingHorizontal: 16,

    borderWidth: 2,

    borderColor: '#FFE0B2',

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 1 },

    shadowOpacity: 0.06,

    shadowRadius: 3,

  },

  optionBadge: {

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: '#FFF3E0',

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 14,

  },

  optionBadgeText: {

    fontSize: 14,

    fontWeight: fonts.bold,

    color: '#E65100',

  },

  optionText: {

    flex: 1,

    fontSize: fonts.body,

    fontWeight: fonts.semibold,

    color: '#3E2723',

  },

  optionCorrect: {

    backgroundColor: '#E8F5E9',

    borderColor: '#4CAF50',

  },

  optionCorrectText: {

    color: '#2E7D32',

  },

  optionWrong: {

    backgroundColor: '#FFEBEE',

    borderColor: '#EF5350',

  },

  optionWrongText: {

    color: '#C62828',

  },

  optionDisabled: {

    backgroundColor: '#FAFAFA',

    borderColor: '#E0E0E0',

    elevation: 0,

  },

  optionDisabledText: {

    color: '#BDBDBD',

  },



  // --- Feedback ---

  feedbackBanner: {

    marginTop: 20,

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

  feedbackTimeoutBg: {

    backgroundColor: '#FFF3E0',

    borderWidth: 1,

    borderColor: '#FFCC80',

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

    borderColor: '#FFE0B2',

    elevation: 4,

    shadowColor: '#BF360C',

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

    backgroundColor: '#FFAB00',

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



  // --- Resumen ---

  resumenContainer: {

    marginTop: 16,

    width: '100%',

    backgroundColor: '#FFF8E1',

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

    justifyContent: 'space-between',

    paddingVertical: 6,

    borderBottomWidth: 1,

    borderBottomColor: '#FFE0B2',

  },

  resumenInicio: {

    flex: 1,

    fontSize: 14,

    color: '#5D4037',

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

    backgroundColor: '#E65100',

    paddingVertical: 16,

    borderRadius: 14,

    alignItems: 'center',

    width: '100%',

    elevation: 3,

    shadowColor: '#BF360C',

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

    backgroundColor: '#FFF3E0',

    paddingVertical: 14,

    borderRadius: 14,

    alignItems: 'center',

    width: '100%',

  },

  btnSecondaryText: {

    color: '#E65100',

    fontSize: fonts.body,

    fontWeight: fonts.semibold,

  },

});

