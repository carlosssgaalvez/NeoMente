from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Juego(Base):
    __tablename__ = "juegos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True)
    area_cognitiva = Column(String)
    descripcion = Column(String)

    # Relación con los resultados
    resultados = relationship("ResultadoEjercicio", back_populates="juego")