"""Tests para endpoints de usuarios: registro, login, invitado, perfil, etc."""


class TestRegistro:
    def test_registro_exitoso(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "Ana", "usuario": "ana1", "password": "AnaPass1", "es_invitado": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["usuario"] == "ana1"
        assert data["nombre"] == "Ana"
        assert data["es_invitado"] is False

    def test_registro_usuario_duplicado(self, client):
        payload = {"nombre": "A", "usuario": "dup", "password": "DupPass1", "es_invitado": False}
        client.post("/usuarios/registro", json=payload)
        resp = client.post("/usuarios/registro", json=payload)
        assert resp.status_code == 400
        assert "ya existe" in resp.json()["detail"]

    def test_registro_sin_password(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "B", "usuario": "buser1", "es_invitado": False,
        })
        assert resp.status_code == 400

    def test_registro_password_debil_sin_mayuscula(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "C", "usuario": "cuser1", "password": "nouppcase1", "es_invitado": False,
        })
        assert resp.status_code == 400
        assert "mayúscula" in resp.json()["detail"]

    def test_registro_password_debil_sin_numero(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "D", "usuario": "duser1", "password": "NoNumber!", "es_invitado": False,
        })
        assert resp.status_code == 400
        assert "número" in resp.json()["detail"]

    def test_registro_password_corta(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "E", "usuario": "euser1", "password": "Sh1", "es_invitado": False,
        })
        assert resp.status_code == 400
        assert "8 caracteres" in resp.json()["detail"]

    def test_registro_como_invitado_rechazado(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "F", "usuario": "fuser1", "password": "FPass123", "es_invitado": True,
        })
        assert resp.status_code == 400

    def test_registro_username_se_guarda_en_minusculas(self, client):
        resp = client.post("/usuarios/registro", json={
            "nombre": "G", "usuario": "MiUser", "password": "GPass123", "es_invitado": False,
        })
        assert resp.status_code == 200
        assert resp.json()["usuario"] == "miuser"


class TestLogin:
    def test_login_exitoso(self, client, registered_user):
        resp = client.post("/usuarios/login", json={
            "usuario": "testuser", "password": "TestPass1",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["usuario_id"] == registered_user["usuario_id"]

    def test_login_password_incorrecto(self, client, registered_user):
        resp = client.post("/usuarios/login", json={
            "usuario": "testuser", "password": "WrongPass1",
        })
        assert resp.status_code == 401

    def test_login_usuario_inexistente(self, client):
        resp = client.post("/usuarios/login", json={
            "usuario": "noexiste", "password": "AnyPass1",
        })
        assert resp.status_code == 401

    def test_login_mensaje_generico(self, client):
        """No debe revelar si el usuario existe o no."""
        resp = client.post("/usuarios/login", json={
            "usuario": "noexiste", "password": "AnyPass1",
        })
        assert resp.json()["detail"] == "Usuario o contraseña incorrectos"

    def test_login_invitado_rechazado(self, client, guest_user):
        resp = client.post("/usuarios/login", json={
            "usuario": "invitado", "password": "Algo1234",
        })
        assert resp.status_code == 401


class TestInvitado:
    def test_crear_invitado(self, client):
        resp = client.post("/usuarios/invitado")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_invitado_puede_acceder_perfil(self, client, guest_user):
        resp = client.get("/usuarios/perfil", headers=guest_user["headers"])
        assert resp.status_code == 200
        assert resp.json()["es_invitado"] is True

    def test_invitado_puede_eliminarse_a_si_mismo(self, client, guest_user):
        guest_id = guest_user["usuario_id"]
        resp = client.delete(
            f"/usuarios/invitado/{guest_id}",
            headers=guest_user["headers"],
        )
        assert resp.status_code == 200

    def test_registrado_no_puede_eliminar_invitado_ajeno(self, client, guest_user, registered_user):
        # IDOR: un usuario registrado no debe poder borrar a un invitado ajeno
        guest_id = guest_user["usuario_id"]
        resp = client.delete(
            f"/usuarios/invitado/{guest_id}",
            headers=registered_user["headers"],
        )
        assert resp.status_code == 403

    def test_invitado_no_puede_eliminar_otro_invitado(self, client, guest_user):
        # IDOR: un invitado no debe poder borrar a otro invitado pasando su id
        otro = client.post("/usuarios/invitado").json()
        resp = client.delete(
            f"/usuarios/invitado/{otro['usuario_id']}",
            headers=guest_user["headers"],
        )
        assert resp.status_code == 403


class TestRefreshToken:
    def test_refresh_exitoso(self, client, registered_user):
        resp = client.post("/usuarios/refresh", json={
            "refresh_token": registered_user["refresh_token"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["usuario_id"] == registered_user["usuario_id"]

    def test_refresh_con_token_invalido(self, client):
        resp = client.post("/usuarios/refresh", json={
            "refresh_token": "token.invalido.aqui",
        })
        assert resp.status_code == 401

    def test_refresh_con_access_token_rechazado(self, client, registered_user):
        """Un access token no debe servir como refresh token."""
        resp = client.post("/usuarios/refresh", json={
            "refresh_token": registered_user["access_token"],
        })
        assert resp.status_code == 401


class TestPerfil:
    def test_obtener_perfil(self, client, registered_user):
        resp = client.get("/usuarios/perfil", headers=registered_user["headers"])
        assert resp.status_code == 200
        data = resp.json()
        assert data["usuario"] == "testuser"
        assert data["nombre"] == "Test User"

    def test_perfil_sin_token(self, client):
        resp = client.get("/usuarios/perfil")
        assert resp.status_code == 401

    def test_actualizar_nombre(self, client, registered_user):
        resp = client.put("/usuarios/perfil", json={
            "nombre": "Nuevo Nombre",
        }, headers=registered_user["headers"])
        assert resp.status_code == 200
        assert resp.json()["nombre"] == "Nuevo Nombre"

    def test_actualizar_usuario_duplicado(self, client, registered_user):
        client.post("/usuarios/registro", json={
            "nombre": "Otro", "usuario": "otro1", "password": "OtroPass1", "es_invitado": False,
        })
        resp = client.put("/usuarios/perfil", json={
            "usuario": "otro1",
        }, headers=registered_user["headers"])
        assert resp.status_code == 400

    def test_invitado_no_puede_editar_perfil(self, client, guest_user):
        resp = client.put("/usuarios/perfil", json={
            "nombre": "Hack",
        }, headers=guest_user["headers"])
        assert resp.status_code == 400


class TestCambiarPassword:
    def test_cambiar_password_exitoso(self, client, registered_user):
        resp = client.put("/usuarios/cambiar-password", json={
            "password_actual": "TestPass1",
            "password_nueva": "NuevoPass1",
        }, headers=registered_user["headers"])
        assert resp.status_code == 200
        login_resp = client.post("/usuarios/login", json={
            "usuario": "testuser", "password": "NuevoPass1",
        })
        assert login_resp.status_code == 200

    def test_cambiar_password_actual_incorrecta(self, client, registered_user):
        resp = client.put("/usuarios/cambiar-password", json={
            "password_actual": "IncorrectPass1",
            "password_nueva": "NuevoPass1",
        }, headers=registered_user["headers"])
        assert resp.status_code == 400

    def test_cambiar_password_nueva_debil(self, client, registered_user):
        resp = client.put("/usuarios/cambiar-password", json={
            "password_actual": "TestPass1",
            "password_nueva": "weak",
        }, headers=registered_user["headers"])
        assert resp.status_code == 400


class TestEliminarCuenta:
    def test_eliminar_cuenta_registrada(self, client, registered_user):
        resp = client.delete("/usuarios/cuenta", headers=registered_user["headers"])
        assert resp.status_code == 200
        login_resp = client.post("/usuarios/login", json={
            "usuario": "testuser", "password": "TestPass1",
        })
        assert login_resp.status_code == 401

    def test_invitado_no_puede_eliminar_con_endpoint_cuenta(self, client, guest_user):
        resp = client.delete("/usuarios/cuenta", headers=guest_user["headers"])
        assert resp.status_code == 400


class TestConvertirInvitado:
    def test_convertir_exitoso(self, client, guest_user):
        resp = client.post("/usuarios/convertir", json={
            "nombre": "Ex Invitado", "usuario": "exguest", "password": "ExGuest1",
        }, headers=guest_user["headers"])
        assert resp.status_code == 200
        data = resp.json()
        assert data["es_invitado"] is False
        assert data["usuario"] == "exguest"

    def test_convertir_usuario_ya_registrado(self, client, registered_user):
        resp = client.post("/usuarios/convertir", json={
            "nombre": "Hack", "usuario": "hack", "password": "HackPass1",
        }, headers=registered_user["headers"])
        assert resp.status_code == 400

    def test_convertir_username_duplicado(self, client, guest_user, registered_user):
        resp = client.post("/usuarios/convertir", json={
            "nombre": "Dup", "usuario": "testuser", "password": "DupPass1",
        }, headers=guest_user["headers"])
        assert resp.status_code == 400
