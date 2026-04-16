from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database, auth
from crud.usuarios import hash_password, verify_password

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"]
)

# 1. Crear un perfil invitado (sin credenciales)
@router.post("/invitado", response_model=schemas.UsuarioResponse)
def crear_usuario_invitado(db: Session = Depends(database.get_db)):
    """Crea un usuario invitado que puede jugar sin registrarse."""
    try:
        usuario = crud.crear_usuario(db, es_invitado=True)
        return usuario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 2. Registrar un nuevo usuario (crear cuenta)
@router.post("/registro", response_model=schemas.UsuarioResponse)
def registrar_usuario(usuario_data: schemas.UsuarioCreate, db: Session = Depends(database.get_db)):
    """Crea una nueva cuenta de usuario con credenciales."""
    
    # Validar que no sea invitado
    if usuario_data.es_invitado:
        raise HTTPException(status_code=400, detail="No puedes registrarte como invitado")
    
    # Validar que tenga usuario y contraseña
    if not usuario_data.usuario or not usuario_data.password:
        raise HTTPException(status_code=400, detail="Usuario y contraseña son requeridos")
    
    # Verificar que el usuario no exista
    if crud.obtener_usuario_por_username(db, usuario_data.usuario):
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    try:
        # Hashear la contraseña
        hashed_password = hash_password(usuario_data.password)
        usuario = crud.crear_usuario(
            db, 
            username=usuario_data.usuario, 
            password_hash=hashed_password,
            es_invitado=False
        )
        return usuario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 3. Login - Obtener token de acceso
@router.post("/login", response_model=schemas.TokenResponse)
def login(credenciales: schemas.UsuarioLoginRequest, db: Session = Depends(database.get_db)):
    """Autentica un usuario y devuelve un token JWT."""
    
    # Buscar usuario
    usuario = crud.obtener_usuario_por_username(db, credenciales.usuario)
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    # Verificar que no sea invitado
    if usuario.es_invitado:
        raise HTTPException(status_code=401, detail="Los usuarios invitados no pueden iniciar sesión")
    
    # Verificar contraseña
    if not verify_password(credenciales.password, usuario.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    # Crear token
    token = auth.crear_token_acceso({
        "sub": usuario.id,
        "username": usuario.usuario
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": usuario.id
    }

# 4. Convertir invitado a usuario registrado
@router.post("/convertir/{usuario_id}", response_model=schemas.UsuarioResponse)
def convertir_invitado_a_registrado(usuario_id: int, convertir_data: schemas.UsuarioConvertir, db: Session = Depends(database.get_db)):
    """Convierte un perfil invitado en un usuario registrado."""
    
    # Validar que el usuario exista
    usuario = crud.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Validar que sea invitado
    if not usuario.es_invitado:
        raise HTTPException(status_code=400, detail="Este usuario ya está registrado")
    
    # Validar que el username no exista
    if crud.obtener_usuario_por_username(db, convertir_data.usuario):
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    try:
        usuario_convertido = crud.convertir_invitado_a_usuario(
            db, 
            usuario_id, 
            convertir_data.usuario, 
            convertir_data.password
        )
        return usuario_convertido
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 5. Obtener datos del usuario actual (protegido con token)
@router.get("/perfil/{usuario_id}", response_model=schemas.UsuarioResponse)
def obtener_perfil_usuario(usuario_id: int, db: Session = Depends(database.get_db)):
    """Obtiene los datos del perfil de un usuario."""
    usuario = crud.obtener_usuario_por_id(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario