from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# --- USUARIO ---
class UsuarioBase(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    usuario: Optional[str] = Field(None, max_length=50)

class UsuarioCreate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    usuario: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, max_length=128)
    es_invitado: bool = False

class UsuarioLoginRequest(BaseModel):
    usuario: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., max_length=128)

class UsuarioConvertir(BaseModel):
    nombre: str = Field(..., max_length=100)
    usuario: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., max_length=128)

class UsuarioUpdatePerfil(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    usuario: Optional[str] = Field(None, max_length=50)

class CambiarPassword(BaseModel):
    password_actual: str = Field(..., max_length=128)
    password_nueva: str = Field(..., max_length=128)

class UsuarioResponse(UsuarioBase):
    id: int
    es_invitado: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    usuario_id: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# --- JUEGO ---
class JuegoBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    area_cognitiva: str = Field(..., max_length=50)
    descripcion: str = Field(..., max_length=500)

class JuegoCreate(JuegoBase):
    pass

class JuegoResponse(JuegoBase):
    id: int

    class Config:
        from_attributes = True

# --- RESULTADO ---
class ResultadoBase(BaseModel):
    puntuacion: float = Field(..., ge=0, le=100)
    duracion_segundos: int = Field(..., ge=0)
    nivel_dificultad: int = Field(..., ge=0, le=100)

class ResultadoCreate(ResultadoBase):
    juego_id: int

class ResultadoResponse(ResultadoBase):
    id: int
    usuario_id: int
    juego_id: int
    fecha_realizacion: datetime

    class Config:
        from_attributes = True