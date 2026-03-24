from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# IMPORTANTE: Esto permite que tu App (Frontend) se conecte al Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se cambia por la IP específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "¡Servidor de NeoMente funcionando!", "status": "online"}

@app.get("/test-conexion")
def test_conexion():
    return {"msg": "Conexión exitosa desde el iPhone al Mac M1"}