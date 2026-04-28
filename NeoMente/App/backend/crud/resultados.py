from sqlalchemy.orm import Session
from models import ResultadoEjercicio, Juego


# --- Constantes del sistema de dificultad adaptativa ---
MIN_DIFICULTAD = 0
MAX_DIFICULTAD = 100
MAX_SUBIDA = 8       # Máxima subida por partida (evita saltos bruscos)
MAX_BAJADA = 5       # Máxima bajada por partida (más suave al bajar)
UMBRAL_ALTO = 80     # Puntuación a partir de la cual se sube dificultad
UMBRAL_BAJO = 40     # Por debajo se baja dificultad


def guardar_resultado(db: Session, usuario_id: int, juego_id: int, puntuacion: float, segundos: int, nivel: int):
    nivel_clamped = max(MIN_DIFICULTAD, min(MAX_DIFICULTAD, nivel))
    nuevo_resultado = ResultadoEjercicio(
        usuario_id=usuario_id,
        juego_id=juego_id,
        puntuacion=puntuacion,
        duracion_segundos=segundos,
        nivel_dificultad=nivel_clamped
    )
    db.add(nuevo_resultado)
    db.commit()
    db.refresh(nuevo_resultado)
    return nuevo_resultado


def calcular_siguiente_dificultad(puntuacion: float, nivel_actual: int) -> int:
    """
    Sistema adaptativo de dificultad progresiva.
    - puntuacion: 0-100 (rendimiento en la partida).
    - nivel_actual: 0-100 (dificultad de la partida jugada).
    Devuelve el nivel recomendado (0-100) para la siguiente partida.

    Lógica:
    - Si puntuación >= UMBRAL_ALTO: sube proporcionalmente (máx MAX_SUBIDA).
    - Si puntuación <= UMBRAL_BAJO: baja proporcionalmente (máx MAX_BAJADA).
    - Entre ambos umbrales: se mantiene estable (±1).
    """
    if puntuacion >= UMBRAL_ALTO:
        # Cuanto más alta la puntuación, más sube (pero con tope)
        factor = (puntuacion - UMBRAL_ALTO) / (100 - UMBRAL_ALTO)  # 0.0 a 1.0
        delta = round(2 + factor * (MAX_SUBIDA - 2))
    elif puntuacion <= UMBRAL_BAJO:
        # Cuanto peor la puntuación, más baja (pero suave)
        factor = (UMBRAL_BAJO - puntuacion) / UMBRAL_BAJO  # 0.0 a 1.0
        delta = -round(1 + factor * (MAX_BAJADA - 1))
    else:
        # Zona media: mantener estable
        delta = 0

    nuevo = nivel_actual + delta
    return max(MIN_DIFICULTAD, min(MAX_DIFICULTAD, nuevo))


def obtener_ultimo_nivel_usuario(db: Session, usuario_id: int, juego_id: int) -> int:
    """
    Calcula el nivel recomendado para la próxima partida.
    - Si no hay partidas previas, devuelve 0 (nivel inicial).
    - Si hay, aplica el algoritmo adaptativo sobre la última partida.
    """
    ultimo = db.query(ResultadoEjercicio)\
               .filter(ResultadoEjercicio.usuario_id == usuario_id)\
               .filter(ResultadoEjercicio.juego_id == juego_id)\
               .order_by(ResultadoEjercicio.fecha_realizacion.desc())\
               .first()

    if not ultimo:
        return MIN_DIFICULTAD

    return calcular_siguiente_dificultad(ultimo.puntuacion, ultimo.nivel_dificultad)


def obtener_estadisticas_usuario_por_juego(db: Session, usuario_id: int):
    """Devuelve una lista de juegos con todos los resultados del usuario en cada uno."""
    juegos = db.query(Juego).all()
    
    estadisticas = []
    for juego in juegos:
        resultados = db.query(ResultadoEjercicio)\
                       .filter(ResultadoEjercicio.usuario_id == usuario_id)\
                       .filter(ResultadoEjercicio.juego_id == juego.id)\
                       .all()
        
        if resultados:
            estadisticas.append({
                "juego_id": juego.id,
                "nombre_juego": juego.nombre,
                "area_cognitiva": juego.area_cognitiva,
                "resultados": [
                    {
                        "puntuacion": r.puntuacion,
                        "duracion_segundos": r.duracion_segundos,
                        "nivel_dificultad": r.nivel_dificultad,
                        "fecha": r.fecha_realizacion
                    }
                    for r in resultados
                ]
            })
    
    return estadisticas
