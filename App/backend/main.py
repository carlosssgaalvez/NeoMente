from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
#importamos base y models
import models
from database import engine, Base

#ejecución base de datos
print("Verificando y creando tablas en la base de datos...")
models.Base.metadata.create_all(bind=engine)
print("Base de datos lista.")

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


# Añadimos esto para poder ejecutarlo con "python main.py" si falla uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)