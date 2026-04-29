"""Tests unitarios para funciones CRUD de usuarios."""
import pytest
from crud.usuarios import hash_password, verify_password


class TestPasswordHashing:
    def test_hash_y_verificar(self):
        raw = "TestPass1"
        hashed = hash_password(raw)
        assert verify_password(raw, hashed) is True

    def test_password_incorrecto(self):
        hashed = hash_password("CorrectPass1")
        assert verify_password("WrongPass1", hashed) is False

    def test_hash_es_diferente_cada_vez(self):
        h1 = hash_password("Same1234")
        h2 = hash_password("Same1234")
        assert h1 != h2

    def test_hash_no_es_texto_plano(self):
        raw = "MyPass123"
        hashed = hash_password(raw)
        assert raw not in hashed
