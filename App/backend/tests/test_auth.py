"""Tests para tokens JWT — creación, verificación y expiración."""
import os
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest")

from auth import crear_token_acceso, crear_token_refresco, verificar_token
from datetime import timedelta


class TestTokenAcceso:
    def test_crear_y_verificar(self):
        token = crear_token_acceso({"sub": "1", "username": "test"})
        data = verificar_token(token, expected_type="access")
        assert data is not None
        assert data.usuario_id == 1
        assert data.username == "test"

    def test_token_expirado(self):
        token = crear_token_acceso(
            {"sub": "1", "username": "test"},
            expires_delta=timedelta(seconds=-1),
        )
        data = verificar_token(token, expected_type="access")
        assert data is None

    def test_access_no_vale_como_refresh(self):
        token = crear_token_acceso({"sub": "1", "username": "test"})
        data = verificar_token(token, expected_type="refresh")
        assert data is None

    def test_token_manipulado(self):
        token = crear_token_acceso({"sub": "1", "username": "test"})
        data = verificar_token(token + "tampered", expected_type="access")
        assert data is None


class TestTokenRefresco:
    def test_crear_y_verificar(self):
        token = crear_token_refresco({"sub": "5", "username": "user5"})
        data = verificar_token(token, expected_type="refresh")
        assert data is not None
        assert data.usuario_id == 5

    def test_refresh_no_vale_como_access(self):
        token = crear_token_refresco({"sub": "1", "username": "test"})
        data = verificar_token(token, expected_type="access")
        assert data is None

    def test_token_sin_sub(self):
        token = crear_token_acceso({"username": "test"})
        data = verificar_token(token, expected_type="access")
        assert data is None
