from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=True) # Puede ser nulo si es invitado
    usuario = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    
    # NUEVO: Atributo para gestionar el modo invitado
    es_invitado = Column(Boolean, default=False)

    # Relaciones
    resultados = relationship("ResultadoEjercicio", back_populates="propietario")

class Juego(Base):
    __tablename__ = "juegos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True) # Ej: "Sopa de letras"
    area_cognitiva = Column(String)     # Ej: "Atención"
    descripcion = Column(String)

    # Relación con los resultados
    resultados = relationship("ResultadoEjercicio", back_populates="juego")

class ResultadoEjercicio(Base):
    __tablename__ = "resultados_ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    puntuacion = Column(Float)
    duracion_segundos = Column(Integer)
    fecha_realizacion = Column(DateTime, default=datetime.utcnow)
    
    # NUEVO: Nivel de dificultad alcanzado (1, 2, 3...)
    nivel_dificultad = Column(Integer, default=1)
    
    # Claves ajenas (Relaciones)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    juego_id = Column(Integer, ForeignKey("juegos.id"))
    
    # Relaciones inversas
    propietario = relationship("Usuario", back_populates="resultados")
    juego = relationship("Juego", back_populates="resultados")