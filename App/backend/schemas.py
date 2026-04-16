from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- USUARIO ---
class UsuarioBase(BaseModel):
    nombre: Optional[str] = None
    usuario: Optional[str] = None

class UsuarioCreate(BaseModel):
    nombre: Optional[str] = None
    usuario: Optional[str] = None
    password: Optional[str] = None
    es_invitado: bool = False

class UsuarioLoginRequest(BaseModel):
    usuario: str
    password: str

class UsuarioConvertir(BaseModel):
    usuario: str
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    es_invitado: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    usuario_id: int

# --- JUEGO ---
class JuegoBase(BaseModel):
    nombre: str
    area_cognitiva: str
    descripcion: str

class JuegoCreate(JuegoBase):
    pass

class JuegoResponse(JuegoBase):
    id: int

    class Config:
        from_attributes = True

# --- RESULTADO ---
class ResultadoBase(BaseModel):
    puntuacion: float
    duracion_segundos: int
    nivel_dificultad: int

class ResultadoCreate(ResultadoBase):
    juego_id: int

class ResultadoResponse(ResultadoBase):
    id: int
    usuario_id: int
    juego_id: int
    fecha_realizacion: datetime

    class Config:
        from_attributes = True