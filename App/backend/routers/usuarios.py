import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database, auth
from auth import obtener_usuario_actual
from crud.usuarios import hash_password, verify_password
from models import Usuario

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"]
)

# Validación de complejidad de contraseña
MIN_PASSWORD_LENGTH = 8

def validar_password(password: str):
    """Valida que la contraseña cumpla requisitos mínimos de seguridad."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="La contraseña debe contener al menos una mayúscula")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="La contraseña debe contener al menos una minúscula")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="La contraseña debe contener al menos un número")

# 1. Crear un perfil invitado (sin credenciales) — devuelve tokens para uso offline
@router.post("/invitado", response_model=schemas.TokenResponse)
def crear_usuario_invitado(db: Session = Depends(database.get_db)):
    """Crea un usuario invitado y devuelve tokens JWT para acceso a endpoints protegidos."""
    try:
        usuario = crud.crear_usuario(db, es_invitado=True)
        token_data = {"sub": str(usuario.id), "username": None}
        access_token = auth.crear_token_acceso(token_data)
        refresh_token = auth.crear_token_refresco(token_data)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "usuario_id": usuario.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 2. Registrar un nuevo usuario (crear cuenta)
@router.post("/registro", response_model=schemas.UsuarioResponse)
def registrar_usuario(usuario_data: schemas.UsuarioCreate, db: Session = Depends(database.get_db)):
    """Crea una nueva cuenta de usuario con credenciales."""
    
    if usuario_data.es_invitado:
        raise HTTPException(status_code=400, detail="No puedes registrarte como invitado")
    
    if not usuario_data.usuario or not usuario_data.password:
        raise HTTPException(status_code=400, detail="Usuario y contraseña son requeridos")
    
    # Validar complejidad de contraseña
    validar_password(usuario_data.password)
    
    if crud.obtener_usuario_por_username(db, usuario_data.usuario):
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    try:
        hashed_password = hash_password(usuario_data.password)
        usuario = crud.crear_usuario(
            db, 
            username=usuario_data.usuario, 
            password_hash=hashed_password,
            es_invitado=False,
            nombre=usuario_data.nombre
        )
        return usuario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 3. Login - Obtener token de acceso y refresh token
@router.post("/login", response_model=schemas.TokenResponse)
def login(credenciales: schemas.UsuarioLoginRequest, db: Session = Depends(database.get_db)):
    """Autentica un usuario y devuelve un token JWT."""
    
    # Mensaje genérico para no revelar si el usuario existe
    error_msg = "Usuario o contraseña incorrectos"
    
    usuario = crud.obtener_usuario_por_username(db, credenciales.usuario)
    if not usuario:
        raise HTTPException(status_code=401, detail=error_msg)
    
    if usuario.es_invitado:
        raise HTTPException(status_code=401, detail=error_msg)
    
    if not verify_password(credenciales.password, usuario.hashed_password):
        raise HTTPException(status_code=401, detail=error_msg)
    
    token_data = {"sub": str(usuario.id), "username": usuario.usuario}
    access_token = auth.crear_token_acceso(token_data)
    refresh_token = auth.crear_token_refresco(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "usuario_id": usuario.id
    }

# 3b. Refresh token - Obtener nuevo access token
@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(body: schemas.RefreshTokenRequest, db: Session = Depends(database.get_db)):
    """Genera un nuevo access token a partir de un refresh token válido."""
    token_data = auth.verificar_token(body.refresh_token, expected_type="refresh")
    if token_data is None:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    
    usuario = crud.obtener_usuario_por_id(db, token_data.usuario_id)
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    new_token_data = {"sub": str(usuario.id), "username": usuario.usuario}
    new_access_token = auth.crear_token_acceso(new_token_data)
    new_refresh_token = auth.crear_token_refresco(new_token_data)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "usuario_id": usuario.id
    }

# 4. Convertir invitado a usuario registrado (protegido)
@router.post("/convertir", response_model=schemas.UsuarioResponse)
def convertir_invitado_a_registrado(
    convertir_data: schemas.UsuarioConvertir,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Convierte el perfil invitado autenticado en usuario registrado."""
    
    if not usuario_actual.es_invitado:
        raise HTTPException(status_code=400, detail="Este usuario ya está registrado")
    
    # Validar complejidad de contraseña
    validar_password(convertir_data.password)
    
    if crud.obtener_usuario_por_username(db, convertir_data.usuario):
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    try:
        usuario_convertido = crud.convertir_invitado_a_usuario(
            db, 
            usuario_actual.id, 
            convertir_data.usuario, 
            convertir_data.password,
            convertir_data.nombre
        )
        return usuario_convertido
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 5. Eliminar un usuario invitado (protegido — llamado al iniciar sesión con otra cuenta)
@router.delete("/invitado/{guest_id}")
def eliminar_invitado(
    guest_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Elimina un usuario invitado y sus resultados. Solo borra si el usuario es invitado."""
    guest = crud.obtener_usuario_por_id(db, guest_id)
    if not guest or not guest.es_invitado:
        raise HTTPException(status_code=404, detail="Usuario invitado no encontrado")
    crud.eliminar_usuario(db, guest_id)
    return {"mensaje": "Usuario invitado eliminado"}

# 6. Obtener datos del usuario actual (protegido con token)
@router.get("/perfil", response_model=schemas.UsuarioResponse)
def obtener_perfil_usuario(usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    """Obtiene los datos del perfil del usuario autenticado."""
    return usuario_actual

# 7. Actualizar perfil (nombre y/o usuario) — solo usuarios registrados
@router.put("/perfil", response_model=schemas.UsuarioResponse)
def actualizar_perfil(
    datos: schemas.UsuarioUpdatePerfil,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Actualiza nombre y/o usuario del usuario autenticado."""
    if usuario_actual.es_invitado:
        raise HTTPException(status_code=400, detail="Los invitados no pueden editar el perfil")

    nuevo_usuario = datos.usuario.strip().lower() if datos.usuario else None

    if nuevo_usuario and nuevo_usuario != usuario_actual.usuario:
        existente = crud.obtener_usuario_por_username(db, nuevo_usuario)
        if existente:
            raise HTTPException(status_code=400, detail="El usuario ya existe")

    try:
        actualizado = crud.actualizar_usuario(
            db,
            usuario_actual.id,
            nombre=datos.nombre.strip() if datos.nombre else None,
            usuario=nuevo_usuario,
        )
        return actualizado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 8. Cambiar contraseña — solo usuarios registrados
@router.put("/cambiar-password")
def cambiar_password(
    datos: schemas.CambiarPassword,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Cambia la contraseña del usuario autenticado previa verificación de la actual."""
    if usuario_actual.es_invitado:
        raise HTTPException(status_code=400, detail="Los invitados no tienen contraseña")

    if not verify_password(datos.password_actual, usuario_actual.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    validar_password(datos.password_nueva)

    nuevo_hash = hash_password(datos.password_nueva)
    crud.actualizar_usuario(db, usuario_actual.id, password_hash=nuevo_hash)
    return {"mensaje": "Contraseña actualizada correctamente"}

# 9. Eliminar cuenta propia (registrados) — borra usuario y todos sus resultados
@router.delete("/cuenta")
def eliminar_cuenta(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Elimina la cuenta del usuario autenticado y todos sus datos asociados."""
    if usuario_actual.es_invitado:
        raise HTTPException(status_code=400, detail="Usa el endpoint de invitados para eliminar cuentas de invitado")
    crud.eliminar_usuario(db, usuario_actual.id)
    return {"mensaje": "Cuenta eliminada correctamente"}