from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class ResultadoEjercicio(Base):
    __tablename__ = "resultados_ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    puntuacion = Column(Float)
    duracion_segundos = Column(Integer)
    fecha_realizacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    nivel_dificultad = Column(Integer, default=0)
    
    # Claves ajenas
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    juego_id = Column(Integer, ForeignKey("juegos.id"))
    
    # Relaciones inversas
    propietario = relationship("Usuario", back_populates="resultados")
    juego = relationship("Juego", back_populates="resultados")