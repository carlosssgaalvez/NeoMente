from sqlalchemy.orm import Session
from models import Juego

def crear_juego(db: Session, nombre: str, area: str, descripcion: str):
    """Añade un nuevo juego al catálogo del sistema."""
    nuevo_juego = Juego(
        nombre=nombre,
        area_cognitiva=area,
        descripcion=descripcion
    )
    db.add(nuevo_juego)
    db.commit()
    db.refresh(nuevo_juego)
    return nuevo_juego

def obtener_juegos(db: Session):
    return db.query(Juego).all()

def obtener_juego_por_id(db: Session, juego_id: int):
    return db.query(Juego).filter(Juego.id == juego_id).first()

