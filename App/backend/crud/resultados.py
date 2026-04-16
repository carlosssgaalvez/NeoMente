from sqlalchemy.orm import Session
from models import ResultadoEjercicio, Juego

def guardar_resultado(db: Session, usuario_id: int, juego_id: int, puntuacion: float, segundos: int, nivel: int):
    nuevo_resultado = ResultadoEjercicio(
        usuario_id=usuario_id,
        juego_id=juego_id,
        puntuacion=puntuacion,
        duracion_segundos=segundos,
        nivel_dificultad=nivel
    )
    db.add(nuevo_resultado)
    db.commit()
    db.refresh(nuevo_resultado)
    return nuevo_resultado

def obtener_ultimo_nivel_usuario(db: Session, usuario_id: int, juego_id: int):
    """Busca el último resultado para decidir la dificultad del siguiente."""
    ultimo = db.query(ResultadoEjercicio)\
               .filter(ResultadoEjercicio.usuario_id == usuario_id)\
               .filter(ResultadoEjercicio.juego_id == juego_id)\
               .order_by(ResultadoEjercicio.fecha_realizacion.desc())\
               .first()
    return ultimo.nivel_dificultad if ultimo else 1


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
