from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database

router = APIRouter(
    prefix="/juegos",
    tags=["juegos"]
)

# Endpoint para obtener la lista de juegos disponibles
@router.get("/", response_model=List[schemas.JuegoResponse])
def leer_juegos(db: Session = Depends(database.get_db)):
    return crud.obtener_juegos(db)

# Endpoint para obtener los detalles de un juego específico
@router.get("/{juego_id}", response_model=schemas.JuegoResponse)
def obtener_detalle_juego(juego_id: int, db: Session = Depends(database.get_db)):
    """Obtiene los detalles completos de un juego (nombre, área cognitiva, descripción)."""
    juego = crud.obtener_juego_por_id(db, juego_id)
    if not juego:
        raise HTTPException(status_code=404, detail="Juego no encontrado")
    return juego