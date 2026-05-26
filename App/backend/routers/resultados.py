from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud, schemas, database
from auth import obtener_usuario_actual
from models import Usuario

router = APIRouter(
    prefix="/resultados",
    tags=["resultados"]
)

# Endpoint para guardar el resultado de un ejercicio (protegido)
@router.post("/", response_model=schemas.ResultadoResponse)
def guardar_puntuacion(
    resultado: schemas.ResultadoCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Guarda resultado — el usuario_id se extrae del token, no del body."""
    try:
        return crud.guardar_resultado(
            db, 
            usuario_id=usuario_actual.id,
            juego_id=resultado.juego_id,
            puntuacion=resultado.puntuacion,
            segundos=resultado.duracion_segundos,
            nivel=resultado.nivel_dificultad
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Endpoint para obtener el nivel recomendado (protegido)
@router.get("/proximo-nivel/{juego_id}")
def obtener_nivel_adaptativo(
    juego_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Obtiene nivel recomendado para el usuario autenticado."""
    nivel = crud.obtener_ultimo_nivel_usuario(db, usuario_actual.id, juego_id)
    return {"nivel_recomendado": nivel}

# Endpoint para obtener resultados de un juego (protegido)
@router.get("/juego/{juego_id}")
def obtener_resultados_usuario_juego(
    juego_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Obtiene los resultados del usuario autenticado en un juego específico."""
    resultados = db.query(crud.ResultadoEjercicio)\
                   .filter(crud.ResultadoEjercicio.usuario_id == usuario_actual.id)\
                   .filter(crud.ResultadoEjercicio.juego_id == juego_id)\
                   .all()
    
    if not resultados:
        raise HTTPException(status_code=404, detail="No hay resultados para este juego")
    
    return resultados

# Endpoint para obtener estadísticas del usuario (protegido)
@router.get("/estadisticas")
def obtener_estadisticas_usuario(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Obtiene estadísticas del usuario autenticado en todos los juegos."""
    estadisticas = crud.obtener_estadisticas_usuario_por_juego(db, usuario_actual.id)
    return estadisticas

# Endpoint para borrar todas las estadísticas del usuario (protegido)
@router.delete("/estadisticas")
def borrar_estadisticas_usuario(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(database.get_db)
):
    """Elimina todos los resultados del usuario autenticado."""
    eliminados = db.query(crud.ResultadoEjercicio)\
                   .filter(crud.ResultadoEjercicio.usuario_id == usuario_actual.id)\
                   .delete()
    db.commit()
    return {"mensaje": f"{eliminados} resultados eliminados"}