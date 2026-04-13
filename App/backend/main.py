from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
from typing import List

import database, crud, models, schemas
from database import engine, SessionLocal

# Creamos las tablas en la base de datos (si no existen)
models.Base.metadata.create_all(bind=engine)

# 1. Configuración básica de FastAPI
app = FastAPI(title="NeoMente API")


# 2. Middleware para CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se cambia por la IP específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Dependencia para obtener la DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "NeoMente API Online"}

@app.get("/juegos", response_model=List[schemas.JuegoBase])
def leer_juegos(db: Session = Depends(get_db)):
    return crud.obtener_juegos(db)

@app.post("/usuarios/invitado", response_model=schemas.Usuario)
def crear_invitado(db: Session = Depends(get_db)):
    # Creamos un username aleatorio o genérico para el invitado
    import uuid
    username_invitado = f"invitado_{uuid.uuid4().hex[:6]}"
    return crud.crear_usuario(db, username=username_invitado, es_invitado=True)


# Añadimos esto para poder ejecutarlo con "python main.py" si falla uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

