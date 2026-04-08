from sqlalchemy.orm import Session
import models

# --- OPERACIONES PARA USUARIOS ---

def crear_usuario(db: Session, username: str, password_hash: str = None, es_invitado: bool = False):
    """Crea un usuario real o un perfil de invitado."""
    nuevo_usuario = models.Usuario(
        username=username,
        hashed_password=password_hash,
        es_invitado=es_invitado
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

def obtener_usuario_por_username(db: Session, username: str):
    return db.query(models.Usuario).filter(models.Usuario.username == username).first()


# --- OPERACIONES PARA JUEGOS ---

def crear_juego(db: Session, nombre: str, area: str, descripcion: str):
    """Añade un nuevo juego al catálogo del sistema."""
    nuevo_juego = models.Juego(
        nombre=nombre,
        area_cognitiva=area,
        descripcion=descripcion
    )
    db.add(nuevo_juego)
    db.commit()
    db.refresh(nuevo_juego)
    return nuevo_juego

def obtener_juegos(db: Session):
    return db.query(models.Juego).all()


# --- OPERACIONES PARA RESULTADOS (Dificultad Adaptativa) ---

def guardar_resultado(db: Session, usuario_id: int, juego_id: int, puntuacion: float, segundos: int, nivel: int):
    nuevo_resultado = models.ResultadoEjercicio(
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
    ultimo = db.query(models.ResultadoEjercicio)\
               .filter(models.ResultadoEjercicio.usuario_id == usuario_id)\
               .filter(models.ResultadoEjercicio.juego_id == juego_id)\
               .order_by(models.ResultadoEjercicio.fecha_realizacion.desc())\
               .first()
    return ultimo.nivel_dificultad if ultimo else 1