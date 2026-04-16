from sqlalchemy.orm import Session
from datetime import datetime
from models import Usuario
from passlib.context import CryptContext

# Configuración de hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashea una contraseña."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def crear_usuario(db: Session, username: str = None, password_hash: str = None, es_invitado: bool = False):
    """Crea un usuario real o un perfil de invitado."""
    
    if es_invitado:
        if username or password_hash:
            raise ValueError("Un usuario invitado no puede tener credenciales")
        username = None
        password_hash = None
    else:
        if not username or not password_hash:
            raise ValueError("Usuario y contraseña son obligatorios para usuarios registrados")
    
    nuevo_usuario = Usuario(
        usuario=username,
        hashed_password=password_hash,
        es_invitado=es_invitado,
        fecha_registro=datetime.utcnow()
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

def obtener_usuario_por_username(db: Session, username: str):
    return db.query(Usuario).filter(Usuario.usuario == username).first()

def obtener_usuario_por_id(db: Session, usuario_id: int):
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()

def eliminar_usuario(db: Session, usuario_id: int):
    """Elimina un usuario por su id."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise ValueError(f"Usuario con id {usuario_id} no encontrado")
    
    db.delete(usuario)
    db.commit()
    return {"mensaje": f"Usuario {usuario_id} eliminado correctamente"}

def actualizar_usuario(db: Session, usuario_id: int, nombre: str = None, usuario: str = None, password_hash: str = None):
    """Actualiza los datos de un usuario existente."""
    usuario_db = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario_db:
        raise ValueError(f"Usuario con id {usuario_id} no encontrado")
    
    if nombre is not None:
        usuario_db.nombre = nombre
    if usuario is not None:
        usuario_db.usuario = usuario
    if password_hash is not None:
        usuario_db.hashed_password = password_hash
    
    db.commit()
    db.refresh(usuario_db)
    return usuario_db

def convertir_invitado_a_usuario(db: Session, usuario_id: int, username: str, password: str):
    """Convierte un usuario invitado en un usuario registrado."""
    usuario_db = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario_db:
        raise ValueError(f"Usuario con id {usuario_id} no encontrado")
    
    if not usuario_db.es_invitado:
        raise ValueError("Este usuario ya está registrado")
    
    # Verificar que el username no exista
    if obtener_usuario_por_username(db, username):
        raise ValueError("El nombre de usuario ya existe")
    
    usuario_db.usuario = username
    usuario_db.hashed_password = hash_password(password)
    usuario_db.es_invitado = False
    
    db.commit()
    db.refresh(usuario_db)
    return usuario_db