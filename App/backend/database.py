# configuración de conexión a base de datos
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Archivo local de SQLite que se creará automáticamente
# Crea el archivo neomente.db en esta carpeta a través de los models
SQLALCHEMY_DATABASE_URL = "sqlite:///./neomente.db"

# El argumento check_same_thread es solo necesario para SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# para conectar a la base de datos desde los routers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

