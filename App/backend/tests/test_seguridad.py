"""Tests de seguridad: inyección SQL, Unicode, validaciones de límites."""


class TestInyeccionSQL:
    """Verifica que las entradas maliciosas no produzcan errores inesperados."""

    def test_registro_username_sql_injection(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "Hacker",
            "usuario": "'; DROP TABLE usuarios; --",
            "password": "HackPass1",
            "es_invitado": False,
        })
        # Debe rechazarse por min_length o simplemente crear un usuario con ese nombre literal
        assert resp.status_code in (200, 400, 422)
        # La tabla sigue existiendo
        resp2 = client.post("/usuarios/invitado")
        assert resp2.status_code == 200

    def test_login_sql_injection(self, client):
        resp = client.post("/usuarios/login", json={
            "usuario": "' OR '1'='1",
            "password": "' OR '1'='1",
        })
        assert resp.status_code in (401, 422)


class TestUnicode:
    """Verifica que caracteres Unicode se manejan correctamente."""

    def test_registro_nombre_unicode(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "José María García-Pérez",
            "usuario": "jose1",
            "password": "JosePass1",
            "es_invitado": False,
        })
        assert resp.status_code == 200
        assert resp.json()["nombre"] == "José María García-Pérez"

    def test_registro_nombre_emojis(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "Ana 🌸",
            "usuario": "ana_emoji",
            "password": "AnaPass11",
            "es_invitado": False,
        })
        assert resp.status_code == 200

    def test_password_caracteres_especiales(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "Test",
            "usuario": "specialchar",
            "password": "Pässwörd1€",
            "es_invitado": False,
        })
        assert resp.status_code == 200
        # Verificar que puede hacer login con esa contraseña
        resp2 = client.post("/usuarios/login", json={
            "usuario": "specialchar",
            "password": "Pässwörd1€",
        })
        assert resp2.status_code == 200


class TestValidacionLimites:
    """Verifica validaciones de rango en resultados."""

    def test_puntuacion_mayor_100_rechazada(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 101.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 422

    def test_puntuacion_negativa_rechazada(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": -5.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 422

    def test_duracion_negativa_rechazada(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 50.0, "duracion_segundos": -1, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 422

    def test_juego_id_inexistente_rechazado(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 999, "puntuacion": 50.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 404

    def test_juego_id_negativo_rechazado(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": -1, "puntuacion": 50.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 404

    def test_duracion_cero_aceptada(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 50.0, "duracion_segundos": 0, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 200

    def test_username_demasiado_corto_rechazado(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "A",
            "usuario": "ab",
            "password": "ValidPass1",
            "es_invitado": False,
        })
        assert resp.status_code == 422
