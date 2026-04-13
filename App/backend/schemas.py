from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Esquema para ver la información de un Juego
class JuegoBase(BaseModel):
    nombre: str
    area_cognitiva: str
    descripcion: str

    class Config:
        from_attributes = True # Esto permite que Pydantic lea modelos de SQLAlchemy

# Esquema para los Resultados
class ResultadoBase(BaseModel):
    puntuacion: float
    duracion_segundos: int
    nivel_dificultad: int
    juego_id: int

# Esquema para el Usuario (cuando se crea)
class UsuarioCreate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    es_invitado: bool = False

class Usuario(BaseModel):
    id: int
    username: Optional[str]
    es_invitado: bool

    class Config:
        from_attributes = True