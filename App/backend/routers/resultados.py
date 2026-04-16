from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud, schemas, database

router = APIRouter(
    prefix="/resultados",
    tags=["resultados"]
)

# Endpoint para guardar el resultado de un ejercicio
@router.post("/", response_model=schemas.ResultadoBase)
def guardar_puntuacion(resultado: schemas.ResultadoBase, usuario_id: int, db: Session = Depends(database.get_db)):
    return crud.guardar_resultado(
        db, 
        usuario_id=usuario_id,
        juego_id=resultado.juego_id,
        puntuacion=resultado.puntuacion,
        segundos=resultado.duracion_segundos,
        nivel=resultado.nivel_dificultad
    )

# Endpoint para obtener el nivel recomendado para el siguiente ejercicio (hay que calcularlo a partir del último resultado)
@router.get("/proximo-nivel/{usuario_id}/{juego_id}")
def obtener_nivel_adaptativo(usuario_id: int, juego_id: int, db: Session = Depends(database.get_db)):
    nivel = crud.obtener_ultimo_nivel_usuario(db, usuario_id, juego_id)
    return {"nivel_recomendado": nivel}

# 3. Endpoint para obtener todos los resultados de un usuario en un juego específico
@router.get("/usuario/{usuario_id}/juego/{juego_id}")
def obtener_resultados_usuario_juego(usuario_id: int, juego_id: int, db: Session = Depends(database.get_db)):
    """Obtiene todos los resultados (puntuaciones, duraciones, niveles) de un usuario en un juego específico."""
    resultados = db.query(crud.ResultadoEjercicio)\
                   .filter(crud.ResultadoEjercicio.usuario_id == usuario_id)\
                   .filter(crud.ResultadoEjercicio.juego_id == juego_id)\
                   .all()
    
    if not resultados:
        raise HTTPException(status_code=404, detail="No hay resultados para este usuario y juego")
    
    return resultados

# 4. Endpoint para obtener estadísticas de TODOS los juegos de un usuario
@router.get("/estadisticas/{usuario_id}")
def obtener_estadisticas_usuario(usuario_id: int, db: Session = Depends(database.get_db)):
    """Obtiene todas las estadísticas de un usuario en todos los juegos (para gráficas)."""
    estadisticas = crud.obtener_estadisticas_usuario_por_juego(db, usuario_id)
    if not estadisticas:
        raise HTTPException(status_code=404, detail="No hay resultados para este usuario")
    return estadisticas