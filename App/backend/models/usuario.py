from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=True)
    usuario = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    es_invitado = Column(Boolean, default=False)

    # Relaciones
    resultados = relationship("ResultadoEjercicio", back_populates="propietario")