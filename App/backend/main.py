from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session

import database, crud
import models
from database import engine, Base

# 1. Configuración básica de FastAPI
app = FastAPI()


# 2. Middleware para CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se cambia por la IP específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3.ejecución base de datos
@app.on_event("startup")
def startup_event():
    # Crea las tablas si no existen
    models.Base.metadata.create_all(bind=engine)
    
    # Abrimos una sesión para insertar datos iniciales
    db = database.SessionLocal()
    try:
        # Solo lo creamos si la tabla juegos está vacía
        if not crud.obtener_juegos(db):
            crud.crear_juego(db, "Sopa de Letras", "Atención", "Encuentra las palabras ocultas.")
            crud.crear_juego(db, "Memoria de Caras", "Memoria", "Recuerda los rostros mostrados.")
            print("--- Datos de prueba insertados correctamente ---")
        else:
            print("--- La base de datos ya contiene juegos, saltando inserción ---")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "¡Servidor de NeoMente funcionando!", "status": "online"}

@app.get("/test-conexion")
def test_conexion():
    return {"msg": "Conexión exitosa desde el iPhone al Mac M1"}


# Añadimos esto para poder ejecutarlo con "python main.py" si falla uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

