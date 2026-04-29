import os
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"
os.environ["DATABASE_URL"] = "sqlite:///./test_neomente.db"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

import database
from database import Base
from main import app

TEST_DATABASE_URL = "sqlite:///./test_neomente.db"
engine_test = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    """Crea las tablas antes de cada test y las destruye después."""
    Base.metadata.create_all(bind=engine_test)
    app.dependency_overrides[database.get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine_test)
    app.dependency_overrides.clear()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def registered_user(client):
    """Crea un usuario registrado y devuelve sus tokens + datos."""
    client.post("/usuarios/registro", json={
        "nombre": "Test User",
        "usuario": "testuser",
        "password": "TestPass1",
        "es_invitado": False,
    })
    resp = client.post("/usuarios/login", json={
        "usuario": "testuser",
        "password": "TestPass1",
    })
    data = resp.json()
    return {
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "usuario_id": data["usuario_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


@pytest.fixture()
def guest_user(client):
    """Crea un usuario invitado y devuelve sus tokens."""
    resp = client.post("/usuarios/invitado")
    data = resp.json()
    return {
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "usuario_id": data["usuario_id"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


@pytest.fixture()
def seeded_games(db_session):
    """Inserta los 9 juegos iniciales."""
    from models import Juego
    juegos = [
        Juego(id=1, nombre="La Receta de la Abuela", area_cognitiva="Memoria", descripcion="Test"),
        Juego(id=2, nombre="Jardín de la Memoria", area_cognitiva="Memoria", descripcion="Test"),
        Juego(id=3, nombre="El Mercado", area_cognitiva="Memoria", descripcion="Test"),
        Juego(id=4, nombre="El Semáforo", area_cognitiva="Atención", descripcion="Test"),
        Juego(id=5, nombre="Cazamariposas", area_cognitiva="Atención", descripcion="Test"),
        Juego(id=6, nombre="El Vigilante", area_cognitiva="Atención", descripcion="Test"),
        Juego(id=7, nombre="Refranes Perdidos", area_cognitiva="Lenguaje", descripcion="Test"),
        Juego(id=8, nombre="La Oveja Perdida", area_cognitiva="Lenguaje", descripcion="Test"),
        Juego(id=9, nombre="El Reloj de Letras", area_cognitiva="Lenguaje", descripcion="Test"),
    ]
    db_session.add_all(juegos)
    db_session.commit()
