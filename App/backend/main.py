from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import database
from database import engine, SessionLocal
from routers import juegos, usuarios, resultados
from crud import crear_juego, obtener_juegos

# Creamos las tablas en la base de datos (si no existen)
database.Base.metadata.create_all(bind=engine)

# 1. Configuración básica de FastAPI
app = FastAPI(title="NeoMente API")

# 2. Middleware para CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Importamos y registramos los routers
app.include_router(juegos.router)
app.include_router(usuarios.router)
app.include_router(resultados.router)

@app.get("/")
def home():
    return {"message": "NeoMente API Online"}

@app.on_event("startup")
def startup_event():
    database.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not obtener_juegos(db):
            crear_juego(db, "Sopa de Letras", "Atención", "Encuentra palabras.")
            crear_juego(db, "Memoria de Caras", "Memoria", "Recuerda rostros.")
            print("Datos iniciales cargados.")
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)