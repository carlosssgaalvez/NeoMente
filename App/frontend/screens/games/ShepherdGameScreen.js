import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  AppState, ScrollView, Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProximoNivel, guardarResultado } from '../../services/dataService';

// --- Banco de grupos de palabras ---
// Cada grupo: categoria (pista), palabras (pertenecen), intruso (no pertenece)
const GRUPOS = [
  // Frutas
  { categoria: 'Frutas', palabras: ['Manzana', 'Pera', 'Uva', 'Naranja'], intruso: 'Zanahoria' },
  { categoria: 'Frutas', palabras: ['Fresa', 'Sandía', 'Melocotón', 'Cereza'], intruso: 'Lechuga' },
  { categoria: 'Frutas', palabras: ['Plátano', 'Kiwi', 'Mango', 'Piña'], intruso: 'Patata' },
  { categoria: 'Frutas', palabras: ['Ciruela', 'Higo', 'Granada', 'Limón'], intruso: 'Pepino' },
  // Verduras
  { categoria: 'Verduras', palabras: ['Tomate', 'Pimiento', 'Calabacín', 'Berenjena'], intruso: 'Melocotón' },
  { categoria: 'Verduras', palabras: ['Espinaca', 'Acelga', 'Brócoli', 'Coliflor'], intruso: 'Sandía' },
  { categoria: 'Verduras', palabras: ['Cebolla', 'Ajo', 'Puerro', 'Zanahoria'], intruso: 'Manzana' },
  // Animales domésticos
  { categoria: 'Animales domésticos', palabras: ['Perro', 'Gato', 'Canario', 'Hámster'], intruso: 'Tiburón' },
  { categoria: 'Animales domésticos', palabras: ['Tortuga', 'Conejo', 'Pez', 'Loro'], intruso: 'León' },
  // Animales salvajes
  { categoria: 'Animales salvajes', palabras: ['León', 'Tigre', 'Elefante', 'Jirafa'], intruso: 'Gallina' },
  { categoria: 'Animales salvajes', palabras: ['Lobo', 'Oso', 'Águila', 'Ciervo'], intruso: 'Gato' },
  { categoria: 'Animales salvajes', palabras: ['Cocodrilo', 'Hipopótamo', 'Cebra', 'Gorila'], intruso: 'Canario' },
  // Aves
  { categoria: 'Aves', palabras: ['Gorrión', 'Paloma', 'Cigüeña', 'Golondrina'], intruso: 'Ratón' },
  { categoria: 'Aves', palabras: ['Búho', 'Halcón', 'Cuervo', 'Gaviota'], intruso: 'Gato' },
  // Peces / marinos
  { categoria: 'Animales marinos', palabras: ['Delfín', 'Ballena', 'Pulpo', 'Tiburón'], intruso: 'Águila' },
  { categoria: 'Animales marinos', palabras: ['Sardina', 'Atún', 'Merluza', 'Salmón'], intruso: 'Pollo' },
  // Colores
  { categoria: 'Colores', palabras: ['Rojo', 'Azul', 'Verde', 'Amarillo'], intruso: 'Cuadrado' },
  { categoria: 'Colores', palabras: ['Morado', 'Naranja', 'Rosa', 'Turquesa'], intruso: 'Triángulo' },
  // Formas geométricas
  { categoria: 'Figuras geométricas', palabras: ['Cuadrado', 'Triángulo', 'Círculo', 'Rectángulo'], intruso: 'Azul' },
  { categoria: 'Figuras geométricas', palabras: ['Rombo', 'Pentágono', 'Hexágono', 'Óvalo'], intruso: 'Rojo' },
  // Ropa
  { categoria: 'Prendas de ropa', palabras: ['Camisa', 'Pantalón', 'Falda', 'Chaqueta'], intruso: 'Sartén' },
  { categoria: 'Prendas de ropa', palabras: ['Calcetín', 'Bufanda', 'Gorro', 'Guante'], intruso: 'Plato' },
  { categoria: 'Prendas de ropa', palabras: ['Vestido', 'Abrigo', 'Jersey', 'Corbata'], intruso: 'Cuchara' },
  // Calzado
  { categoria: 'Calzado', palabras: ['Zapato', 'Bota', 'Sandalia', 'Zapatilla'], intruso: 'Sombrero' },
  // Utensilios de cocina
  { categoria: 'Utensilios de cocina', palabras: ['Sartén', 'Olla', 'Cuchillo', 'Cazo'], intruso: 'Pantalón' },
  { categoria: 'Utensilios de cocina', palabras: ['Tenedor', 'Cuchara', 'Espátula', 'Batidora'], intruso: 'Abrigo' },
  // Muebles
  { categoria: 'Muebles', palabras: ['Silla', 'Mesa', 'Armario', 'Sofá'], intruso: 'Bicicleta' },
  { categoria: 'Muebles', palabras: ['Cama', 'Estantería', 'Cómoda', 'Mesilla'], intruso: 'Coche' },
  // Transporte
  { categoria: 'Medios de transporte', palabras: ['Coche', 'Autobús', 'Tren', 'Avión'], intruso: 'Mesa' },
  { categoria: 'Medios de transporte', palabras: ['Bicicleta', 'Moto', 'Barco', 'Tranvía'], intruso: 'Silla' },
  { categoria: 'Medios de transporte', palabras: ['Helicóptero', 'Metro', 'Taxi', 'Camión'], intruso: 'Armario' },
  // Instrumentos musicales
  { categoria: 'Instrumentos musicales', palabras: ['Guitarra', 'Piano', 'Violín', 'Flauta'], intruso: 'Martillo' },
  { categoria: 'Instrumentos musicales', palabras: ['Batería', 'Trompeta', 'Saxofón', 'Arpa'], intruso: 'Destornillador' },
  // Herramientas
  { categoria: 'Herramientas', palabras: ['Martillo', 'Destornillador', 'Sierra', 'Alicates'], intruso: 'Guitarra' },
  { categoria: 'Herramientas', palabras: ['Llave inglesa', 'Taladro', 'Nivel', 'Cincel'], intruso: 'Piano' },
  // Deportes
  { categoria: 'Deportes', palabras: ['Fútbol', 'Baloncesto', 'Tenis', 'Natación'], intruso: 'Novela' },
  { categoria: 'Deportes', palabras: ['Ciclismo', 'Atletismo', 'Rugby', 'Voleibol'], intruso: 'Poesía' },
  { categoria: 'Deportes', palabras: ['Golf', 'Boxeo', 'Esgrima', 'Judo'], intruso: 'Pintura' },
  // Géneros literarios
  { categoria: 'Géneros literarios', palabras: ['Novela', 'Poesía', 'Ensayo', 'Teatro'], intruso: 'Fútbol' },
  // Materias escolares
  { categoria: 'Asignaturas', palabras: ['Matemáticas', 'Historia', 'Geografía', 'Biología'], intruso: 'Manzana' },
  { categoria: 'Asignaturas', palabras: ['Física', 'Química', 'Filosofía', 'Lengua'], intruso: 'Zapatilla' },
  // Partes del cuerpo
  { categoria: 'Partes del cuerpo', palabras: ['Brazo', 'Pierna', 'Cabeza', 'Mano'], intruso: 'Ventana' },
  { categoria: 'Partes del cuerpo', palabras: ['Codo', 'Rodilla', 'Tobillo', 'Hombro'], intruso: 'Puerta' },
  { categoria: 'Partes del cuerpo', palabras: ['Corazón', 'Pulmón', 'Hígado', 'Riñón'], intruso: 'Motor' },
  // Parentescos
  { categoria: 'Parentescos', palabras: ['Padre', 'Madre', 'Hermano', 'Abuelo'], intruso: 'Vecino' },
  { categoria: 'Parentescos', palabras: ['Tío', 'Prima', 'Sobrino', 'Nieto'], intruso: 'Maestro' },
  // Profesiones
  { categoria: 'Profesiones', palabras: ['Médico', 'Enfermera', 'Bombero', 'Policía'], intruso: 'Lunes' },
  { categoria: 'Profesiones', palabras: ['Profesor', 'Abogado', 'Arquitecto', 'Ingeniero'], intruso: 'Marzo' },
  { categoria: 'Profesiones', palabras: ['Cocinero', 'Carpintero', 'Electricista', 'Fontanero'], intruso: 'Invierno' },
  // Días de la semana
  { categoria: 'Días de la semana', palabras: ['Lunes', 'Martes', 'Miércoles', 'Jueves'], intruso: 'Enero' },
  // Meses del año
  { categoria: 'Meses del año', palabras: ['Enero', 'Febrero', 'Marzo', 'Abril'], intruso: 'Lunes' },
  { categoria: 'Meses del año', palabras: ['Mayo', 'Junio', 'Julio', 'Agosto'], intruso: 'Viernes' },
  { categoria: 'Meses del año', palabras: ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre'], intruso: 'Sábado' },
  // Estaciones
  { categoria: 'Estaciones del año', palabras: ['Primavera', 'Verano', 'Otoño', 'Invierno'], intruso: 'Febrero' },
  // Flores
  { categoria: 'Flores', palabras: ['Rosa', 'Margarita', 'Tulipán', 'Clavel'], intruso: 'Pino' },
  { categoria: 'Flores', palabras: ['Girasol', 'Orquídea', 'Lirio', 'Amapola'], intruso: 'Roble' },
  // Árboles
  { categoria: 'Árboles', palabras: ['Pino', 'Roble', 'Olivo', 'Encina'], intruso: 'Rosa' },
  { categoria: 'Árboles', palabras: ['Haya', 'Cerezo', 'Almendro', 'Ciprés'], intruso: 'Margarita' },
  // Materiales
  { categoria: 'Materiales', palabras: ['Madera', 'Metal', 'Cristal', 'Plástico'], intruso: 'Perro' },
  { categoria: 'Materiales', palabras: ['Algodón', 'Seda', 'Lana', 'Lino'], intruso: 'Piedra' },
  // Piedras / minerales
  { categoria: 'Piedras preciosas', palabras: ['Diamante', 'Rubí', 'Esmeralda', 'Zafiro'], intruso: 'Oro' },
  // Metales
  { categoria: 'Metales', palabras: ['Oro', 'Plata', 'Cobre', 'Hierro'], intruso: 'Diamante' },
  // Bebidas
  { categoria: 'Bebidas', palabras: ['Agua', 'Zumo', 'Café', 'Leche'], intruso: 'Pan' },
  { categoria: 'Bebidas', palabras: ['Té', 'Limonada', 'Cerveza', 'Vino'], intruso: 'Queso' },
  // Comidas / platos
  { categoria: 'Platos típicos', palabras: ['Paella', 'Tortilla', 'Gazpacho', 'Cocido'], intruso: 'Cerveza' },
  { categoria: 'Platos típicos', palabras: ['Fabada', 'Salmorejo', 'Croquetas', 'Empanada'], intruso: 'Café' },
  // Lácteos
  { categoria: 'Lácteos', palabras: ['Leche', 'Queso', 'Yogur', 'Mantequilla'], intruso: 'Jamón' },
  // Embutidos
  { categoria: 'Embutidos', palabras: ['Jamón', 'Chorizo', 'Salchichón', 'Lomo'], intruso: 'Yogur' },
  // Países de Europa
  { categoria: 'Países europeos', palabras: ['España', 'Francia', 'Italia', 'Alemania'], intruso: 'Brasil' },
  { categoria: 'Países europeos', palabras: ['Portugal', 'Grecia', 'Suecia', 'Noruega'], intruso: 'Japón' },
  // Países de América
  { categoria: 'Países americanos', palabras: ['Brasil', 'México', 'Argentina', 'Colombia'], intruso: 'España' },
  // Países de Asia
  { categoria: 'Países asiáticos', palabras: ['Japón', 'China', 'India', 'Tailandia'], intruso: 'Francia' },
  // Ciudades españolas
  { categoria: 'Ciudades españolas', palabras: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'], intruso: 'París' },
  { categoria: 'Ciudades españolas', palabras: ['Bilbao', 'Málaga', 'Zaragoza', 'Granada'], intruso: 'Roma' },
  // Ríos españoles
  { categoria: 'Ríos de España', palabras: ['Ebro', 'Tajo', 'Guadalquivir', 'Duero'], intruso: 'Danubio' },
  // Planetas
  { categoria: 'Planetas del sistema solar', palabras: ['Marte', 'Júpiter', 'Saturno', 'Venus'], intruso: 'Luna' },
  // Elementos de la naturaleza
  { categoria: 'Fenómenos naturales', palabras: ['Lluvia', 'Nieve', 'Granizo', 'Tormenta'], intruso: 'Silla' },
  { categoria: 'Fenómenos naturales', palabras: ['Terremoto', 'Volcán', 'Tsunami', 'Huracán'], intruso: 'Escalera' },
  // Sentimientos
  { categoria: 'Sentimientos', palabras: ['Alegría', 'Tristeza', 'Miedo', 'Sorpresa'], intruso: 'Rojo' },
  { categoria: 'Sentimientos', palabras: ['Amor', 'Nostalgia', 'Esperanza', 'Gratitud'], intruso: 'Mesa' },
  // Sentidos
  { categoria: 'Los cinco sentidos', palabras: ['Vista', 'Oído', 'Olfato', 'Gusto'], intruso: 'Alegría' },
  // Monedas
  { categoria: 'Monedas', palabras: ['Euro', 'Dólar', 'Libra', 'Yen'], intruso: 'Kilo' },
  // Unidades de medida
  { categoria: 'Unidades de medida', palabras: ['Metro', 'Kilo', 'Litro', 'Grado'], intruso: 'Euro' },
  // Números romanos (concepto)
  { categoria: 'Números pares', palabras: ['Dos', 'Cuatro', 'Seis', 'Ocho'], intruso: 'Tres' },
  { categoria: 'Números impares', palabras: ['Uno', 'Tres', 'Cinco', 'Siete'], intruso: 'Cuatro' },
  // Electrodomésticos
  { categoria: 'Electrodomésticos', palabras: ['Lavadora', 'Frigorífico', 'Microondas', 'Lavavajillas'], intruso: 'Sofá' },
  { categoria: 'Electrodomésticos', palabras: ['Aspiradora', 'Secadora', 'Horno', 'Tostadora'], intruso: 'Cama' },
  // Edificios
  { categoria: 'Edificios / lugares', palabras: ['Hospital', 'Colegio', 'Iglesia', 'Biblioteca'], intruso: 'Coche' },
  { categoria: 'Edificios / lugares', palabras: ['Farmacia', 'Supermercado', 'Banco', 'Museo'], intruso: 'Avión' },
  // Juguetes
  { categoria: 'Juguetes', palabras: ['Muñeca', 'Pelota', 'Puzle', 'Cometa'], intruso: 'Martillo' },
  // Medios de comunicación
  { categoria: 'Medios de comunicación', palabras: ['Radio', 'Televisión', 'Periódico', 'Revista'], intruso: 'Bicicleta' },
  // Redes sociales / tecnología
  { categoria: 'Dispositivos tecnológicos', palabras: ['Teléfono', 'Ordenador', 'Tablet', 'Reloj digital'], intruso: 'Libro' },
  // Material escolar
  { categoria: 'Material escolar', palabras: ['Lápiz', 'Cuaderno', 'Goma', 'Regla'], intruso: 'Taza' },
  { categoria: 'Material escolar', palabras: ['Bolígrafo', 'Tijeras', 'Pegamento', 'Sacapuntas'], intruso: 'Plato' },
  // Especias
  { categoria: 'Especias', palabras: ['Pimienta', 'Canela', 'Orégano', 'Comino'], intruso: 'Azúcar' },
  // Dulces / postres
  { categoria: 'Postres', palabras: ['Flan', 'Natillas', 'Tarta', 'Helado'], intruso: 'Sopa' },
  // Sopas
  { categoria: 'Sopas y cremas', palabras: ['Gazpacho', 'Vichyssoise', 'Consomé', 'Crema de champiñones'], intruso: 'Tarta' },
  // Danzas
  { categoria: 'Bailes', palabras: ['Flamenco', 'Vals', 'Tango', 'Salsa'], intruso: 'Ópera' },
  // Géneros musicales
  { categoria: 'Géneros musicales', palabras: ['Rock', 'Jazz', 'Clásica', 'Pop'], intruso: 'Novela' },
  // Tipos de película
  { categoria: 'Géneros de cine', palabras: ['Comedia', 'Drama', 'Terror', 'Acción'], intruso: 'Vals' },
  // Signos de puntuación
  { categoria: 'Signos de puntuación', palabras: ['Coma', 'Punto', 'Interrogación', 'Exclamación'], intruso: 'Verbo' },
  // Partes de un libro
  { categoria: 'Partes de un libro', palabras: ['Portada', 'Índice', 'Capítulo', 'Prólogo'], intruso: 'Ventana' },
  // Partes de una casa
  { categoria: 'Partes de una casa', palabras: ['Cocina', 'Salón', 'Dormitorio', 'Baño'], intruso: 'Motor' },
  { categoria: 'Partes de una casa', palabras: ['Terraza', 'Garaje', 'Desván', 'Sótano'], intruso: 'Rueda' },
];

// --- Mensajes de refuerzo positivo ---
const REFUERZOS = {
  excelente: [
    '¡Rebaño impecable! Ni una oveja fuera de sitio 🌟',
    '¡Pastor legendario! Tu ojo es infalible 🏆',
    '¡Extraordinario! Ningún intruso se te escapa 🐑✨',
  ],
  bueno: [
    '¡Muy bien! Casi todas las ovejas en su corral 🐑',
    '¡Buen trabajo! Tu rebaño está bien cuidado 💪',
    '¡Genial! Pocas ovejas se te escapan 🌿',
  ],
  regular: [
    '¡Bien hecho! Las ovejas traviesas son difíciles 🐏',
    '¡Sigue así! Cada ronda afinas más el ojo 🌱',
    '¡Ánimo! Con práctica serás un gran pastor 💚',
  ],
  bajo: [
    '¡No te rindas! Las ovejas engañan a cualquiera 🌱',
    '¡Buen intento! Fíjate bien en qué tienen en común 💪',
    '¡Cada partida entrena tu mente! Tú puedes 🐑',
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
 * numPalabras: palabras totales mostradas (incluyendo intruso).
 * tiempoPorRonda: ms para responder (0 = sin límite).
 * mostrarCategoria: si se muestra la pista de categoría.
 * @param {number} nivel - Nivel 0-100.
 * @returns {{ totalRondas: number, numPalabras: number, tiempoPorRonda: number, mostrarCategoria: boolean }}
 */
function nivelAConfig(nivel) {
  if (nivel <= 10) return { totalRondas: 8,  numPalabras: 4, tiempoPorRonda: 0,     mostrarCategoria: true };
  if (nivel <= 22) return { totalRondas: 10, numPalabras: 4, tiempoPorRonda: 0,     mostrarCategoria: true };
  if (nivel <= 36) return { totalRondas: 10, numPalabras: 5, tiempoPorRonda: 15000, mostrarCategoria: true };
  if (nivel <= 50) return { totalRondas: 12, numPalabras: 5, tiempoPorRonda: 12000, mostrarCategoria: true };
  if (nivel <= 64) return { totalRondas: 12, numPalabras: 5, tiempoPorRonda: 10000, mostrarCategoria: false };
  if (nivel <= 78) return { totalRondas: 14, numPalabras: 5, tiempoPorRonda: 9000,  mostrarCategoria: false };
  if (nivel <= 90) return { totalRondas: 14, numPalabras: 5, tiempoPorRonda: 7000,  mostrarCategoria: false };
  return              { totalRondas: 16, numPalabras: 5, tiempoPorRonda: 6000,  mostrarCategoria: false };
}

/**
 * Genera una ronda del juego.
 * @param {object} grupo - El grupo de palabras para esta ronda.
 * @param {number} numPalabras - Cuántas palabras totales mostrar (incluido intruso).
 * @returns {{ categoria: string, palabras: string[], intruso: string }}
 */
function generarRonda(grupo, numPalabras) {
  // numPalabras incluye el intruso → necesitamos (numPalabras - 1) palabras del grupo
  const palabrasGrupo = [...grupo.palabras];
  // Barajar
  for (let i = palabrasGrupo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [palabrasGrupo[i], palabrasGrupo[j]] = [palabrasGrupo[j], palabrasGrupo[i]];
  }
  const seleccionadas = palabrasGrupo.slice(0, numPalabras - 1);

  // Combinar con intruso y barajar
  const todas = [...seleccionadas, grupo.intruso];
  for (let i = todas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [todas[i], todas[j]] = [todas[j], todas[i]];
  }

  return {
    categoria: grupo.categoria,
    palabras: todas,
    intruso: grupo.intruso,
  };
}

/**
 * Genera todas las rondas para una partida.
 * @param {object} config - Configuración del nivel.
 * @returns {Array}
 */
function generarPartida(config) {
  const pool = [...GRUPOS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const seleccionados = pool.slice(0, config.totalRondas);
  return seleccionados.map((g) => generarRonda(g, config.numPalabras));
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
  if (nivel <= 10) return 'Zagal';
  if (nivel <= 22) return 'Aprendiz';
  if (nivel <= 36) return 'Ovejero';
  if (nivel <= 50) return 'Rabadán';
  if (nivel <= 64) return 'Pastor';
  if (nivel <= 78) return 'Mayoral';
  if (nivel <= 90) return 'Trashumante';
  return 'Gran Pastor';
}

// --- Pantalla principal del juego ---
export default function ShepherdGameScreen({ navigation, route }) {
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
  const handleSelectWord = useCallback((palabra) => {
    if (gameState !== 'playing') return;
    if (roundTimerRef.current) { clearInterval(roundTimerRef.current); roundTimerRef.current = null; }

    const ronda = rondas[rondaIdx];
    const correcto = palabra === ronda.intruso;
    const tiempoMs = Date.now() - roundStartRef.current;
    const nuevaRespuesta = { correcto, tiempoMs, seleccion: palabra };
    const nuevasRespuestas = [...respuestas, nuevaRespuesta];
    setRespuestas(nuevasRespuestas);
    setFeedbackCorrecto(correcto);
    setSeleccionada(palabra);
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
          <Text style={styles.loadingEmoji}>🐑</Text>
          <Text style={styles.loadingTitle}>La Oveja Perdida</Text>
          <Text style={styles.loadingText}>Reuniendo el rebaño...</Text>
          <Text style={styles.loadingDeco}>~ 🌿 ~</Text>
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
          <Text style={styles.countdownEmoji}>🐑</Text>
          <Text style={styles.countdownText}>¿Preparado?</Text>
          <Text style={styles.countdownNum}>{countdownNum}</Text>
          <View style={styles.countdownDivider} />
          <Text style={styles.countdownHint}>
            Encuentra la oveja descarriada
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
            {puntuacion >= 80 ? '🏆' : puntuacion >= 50 ? '🐑' : '🌱'}
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
            <Text style={styles.resumenTitle}>Resumen del rebaño</Text>
            {rondas.map((ronda, idx) => {
              const resp = respuestas[idx];
              return (
                <View key={idx} style={styles.resumenRow}>
                  <Text style={styles.resumenCategoria} numberOfLines={1}>
                    {ronda.categoria}
                  </Text>
                  <Text style={styles.resumenIntruso} numberOfLines={1}>
                    → {ronda.intruso}
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
              <Text style={styles.btnPrimaryText}>🐑 Jugar de nuevo</Text>
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
              <Text style={styles.pauseInfoText}>Corral: {rondaIdx + 1}/{rondas.length}</Text>
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
        <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{'🐑 La Oveja Perdida'}</Text>
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
        <View style={[styles.infoChip, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.infoChipEmoji}>🐑</Text>
          <Text style={[styles.infoChipValue, { color: '#2E7D32' }]}>{rondaIdx + 1}/{rondas.length}</Text>
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
                backgroundColor: roundProgress > 0.3 ? '#4CAF50' : '#D32F2F',
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
        {/* Instrucción */}
        <Animated.View
          style={[
            styles.instructionCard,
            { transform: [{ scale: cardAnim }] },
          ]}
        >
          <View style={styles.instructionDecoTop}>
            <Text style={styles.instructionDecoText}>✦ Corral {rondaIdx + 1} de {rondas.length} ✦</Text>
          </View>
          <Text style={styles.instructionEmoji}>🐏</Text>
          <Text style={styles.instructionText}>
            ¡Una oveja se ha colado!{'\n'}Toca la que NO pertenece al grupo
          </Text>
          {config.mostrarCategoria && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>📋 {ronda.categoria}</Text>
            </View>
          )}
          <View style={styles.instructionBottomLine} />
        </Animated.View>

        {/* Palabras (botones) */}
        <View style={styles.wordsContainer}>
          {ronda.palabras.map((palabra, idx) => {
            const esFeedback = gameState === 'feedback';
            const esIntruso = palabra === ronda.intruso;
            const esSeleccionada = palabra === seleccionada;

            let wordStyle = styles.wordBtn;
            let textStyle = styles.wordText;

            if (esFeedback) {
              if (feedbackCorrecto) {
                // Acierto: intruso en verde (encontrado), resto neutro
                if (esIntruso) {
                  wordStyle = [styles.wordBtn, styles.wordFound];
                  textStyle = [styles.wordText, styles.wordFoundText];
                }
              } else {
                // Fallo o timeout: intruso en rojo, selección errónea en naranja
                if (esIntruso) {
                  wordStyle = [styles.wordBtn, styles.wordIntruso];
                  textStyle = [styles.wordText, styles.wordIntrusoText];
                } else if (esSeleccionada) {
                  wordStyle = [styles.wordBtn, styles.wordWrong];
                  textStyle = [styles.wordText, styles.wordWrongText];
                }
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={wordStyle}
                onPress={() => handleSelectWord(palabra)}
                disabled={gameState !== 'playing'}
                accessibilityRole="button"
                accessibilityLabel={`Palabra: ${palabra}`}
              >
                <Text style={textStyle}>{palabra}</Text>
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
                ? `✅ ¡Bien visto! «${ronda.intruso}» no pertenecía al grupo`
                : seleccionada
                  ? `❌ «${seleccionada}» sí pertenece al grupo. La intrusa era: ${ronda.intruso}`
                  : `⏰ Se acabó el tiempo — La intrusa era: ${ronda.intruso}`}
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
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  decorBorder: {
    borderWidth: 3,
    borderColor: '#A5D6A7',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F1F8E9',
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
    color: '#A5D6A7',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#C8E6C9',
    textAlign: 'center',
  },
  loadingDeco: {
    marginTop: 16,
    fontSize: 18,
    color: '#66BB6A',
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

  // --- Top bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 50,
    borderBottomWidth: 3,
    borderBottomColor: '#A5D6A7',
  },
  topBarBtn: { padding: 4 },
  topBarBack: {
    color: '#C8E6C9',
    fontSize: fonts.small,
    fontWeight: fonts.semibold,
  },
  topBarTitle: {
    flex: 1,
    color: colors.white,
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  topBarPause: { fontSize: 22 },

  // --- Info chips ---
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F1F8E9',
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
    backgroundColor: '#C8E6C9',
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
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  instructionDecoTop: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  instructionDecoText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: fonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  instructionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
    color: '#3E2723',
    textAlign: 'center',
    lineHeight: 28,
  },
  categoryBadge: {
    marginTop: 14,
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  categoryBadgeText: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#E65100',
  },
  instructionBottomLine: {
    width: 50,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginTop: 16,
  },

  // --- Words ---
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  wordBtn: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: '#C8E6C9',
    minWidth: '42%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  wordText: {
    fontSize: fonts.body,
    fontWeight: fonts.bold,
    color: '#1B5E20',
    textAlign: 'center',
  },
  wordFound: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  wordFoundText: {
    color: '#2E7D32',
  },
  wordIntruso: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  wordIntrusoText: {
    color: '#C62828',
  },
  wordWrong: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  wordWrongText: {
    color: '#E65100',
  },
  wordCorrectGroup: {
    backgroundColor: '#E8F5E9',
    borderColor: '#66BB6A',
    elevation: 0,
  },
  wordCorrectGroupText: {
    color: '#2E7D32',
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
    borderColor: '#C8E6C9',
    elevation: 4,
    shadowColor: '#1B5E20',
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#F1F8E9',
    borderRadius: 14,
    padding: 16,
  },
  resumenTitle: {
    fontSize: fonts.small,
    fontWeight: fonts.bold,
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  resumenCategoria: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: fonts.semibold,
  },
  resumenIntruso: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
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
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#1B5E20',
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
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  btnSecondaryText: {
    color: '#2E7D32',
    fontSize: fonts.body,
    fontWeight: fonts.semibold,
  },
});
