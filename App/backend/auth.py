from datetime import datetime, timedelta
from typing import Optional
import jwt
from pydantic import BaseModel

# Configuración JWT
SECRET_KEY = "tu-clave-secreta-muy-segura-cambiar-en-produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 días

class TokenData(BaseModel):
    usuario_id: int
    username: Optional[str] = None

def crear_token_acceso(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verificar_token(token: str) -> Optional[TokenData]:
    """Verifica un token JWT y devuelve los datos."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: int = payload.get("sub")
        username: str = payload.get("username")
        if usuario_id is None:
            return None
        return TokenData(usuario_id=usuario_id, username=username)
    except jwt.InvalidTokenError:
        return None