import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

import database
from database import engine, SessionLocal
from routers import juegos, usuarios, resultados

load_dotenv()

# Creamos las tablas en la base de datos (si no existen)
database.Base.metadata.create_all(bind=engine)

# 1. Configuración básica de FastAPI
app = FastAPI(title="NeoMente API")

# Middleware de cabeceras de seguridad HTTP (Accenture Standard)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Añade cabeceras de seguridad HTTP a todas las respuestas."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Swagger UI necesita scripts inline y recursos de CDN; se relaja solo en /docs y /redoc
        if request.url.path.startswith("/docs") or request.url.path.startswith("/redoc") or request.url.path == "/openapi.json":
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com;"
            )
        else:
            response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. Middleware para CORS - orígenes restringidos desde .env
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
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
    """Verifica que los juegos iniciales existen en la base de datos."""
    from models import Juego
    db = SessionLocal()
    try:
        juegos_iniciales = {
            1: ("La Receta de la Abuela",  "Memoria",   "Memoriza los pasos de la receta en orden y demuestra que eres un gran cocinero."),
            2: ("Jardín de la Memoria",    "Memoria",   "Descubre las parejas de plantas ocultas en macetas y haz florecer tu jardín mental."),
            3: ("El Mercado",              "Memoria",   "Memoriza los precios de los productos del mercado y recuérdalos para completar tu compra."),
            4: ("El Semáforo",             "Atención",  "Identifica el color de las letras y no te dejes engañar por la palabra. ¡Pon a prueba tu atención!"),
            5: ("Cazamariposas",           "Atención",  "Atrapa las mariposas del color indicado y pon a prueba tu atención selectiva."),
            6: ("El Vigilante",            "Atención",  "Mantén la concentración y pulsa solo cuando aparezca el símbolo objetivo. ¡No dejes pasar ninguno!"),
            7: ("Refranes Perdidos",       "Lenguaje",  "Completa refranes populares y pon a prueba tu sabiduría cultural."),
            8: ("La Oveja Perdida", "Lenguaje",  "Encuentra la oveja descarriada: la palabra que no pertenece al grupo."),
            9: ("El Reloj de Letras", "Lenguaje", "Reordena las letras desordenadas y repara las palabras del relojero."),
        }
        for id_juego, (nombre, area, desc) in juegos_iniciales.items():
            existe = db.query(Juego).filter(Juego.id == id_juego).first()
            if not existe:
                db.add(Juego(id=id_juego, nombre=nombre, area_cognitiva=area, descripcion=desc))
            elif existe.nombre != nombre:
                existe.nombre = nombre
                existe.area_cognitiva = area
                existe.descripcion = desc
        db.commit()
        print("Datos iniciales verificados.")
    finally:
        db.close()

if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
