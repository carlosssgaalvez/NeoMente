"""Tests para endpoints de resultados, estadísticas y dificultad adaptativa."""


class TestGuardarResultado:
    def test_guardar_resultado_exitoso(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 85.0, "duracion_segundos": 120, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 200
        data = resp.json()
        assert data["puntuacion"] == 85.0
        assert data["juego_id"] == 1
        assert data["usuario_id"] == registered_user["usuario_id"]

    def test_guardar_resultado_sin_auth(self, client, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 50.0, "duracion_segundos": 60, "nivel_dificultad": 0,
        })
        assert resp.status_code == 401

    def test_guardar_resultado_invitado(self, client, guest_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 2, "puntuacion": 70.0, "duracion_segundos": 90, "nivel_dificultad": 5,
        }, headers=guest_user["headers"])
        assert resp.status_code == 200

    def test_nivel_dificultad_clamped(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 50.0, "duracion_segundos": 60, "nivel_dificultad": 150,
        }, headers=registered_user["headers"])
        assert resp.status_code == 200
        assert resp.json()["nivel_dificultad"] == 100

    def test_nivel_negativo_clamped_a_cero(self, client, registered_user, seeded_games):
        resp = client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 50.0, "duracion_segundos": 60, "nivel_dificultad": -10,
        }, headers=registered_user["headers"])
        assert resp.status_code == 200
        assert resp.json()["nivel_dificultad"] == 0


class TestProximoNivel:
    def test_nivel_inicial_cero(self, client, registered_user, seeded_games):
        resp = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        assert resp.status_code == 200
        assert resp.json()["nivel_recomendado"] == 0

    def test_nivel_sube_con_puntuacion_alta(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 95.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        assert resp.json()["nivel_recomendado"] > 10

    def test_nivel_baja_con_puntuacion_baja(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 10.0, "duracion_segundos": 60, "nivel_dificultad": 50,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        assert resp.json()["nivel_recomendado"] < 50

    def test_nivel_estable_en_zona_media(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 60.0, "duracion_segundos": 60, "nivel_dificultad": 50,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        assert resp.json()["nivel_recomendado"] == 50

    def test_nivel_no_supera_100(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 100.0, "duracion_segundos": 30, "nivel_dificultad": 98,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        assert resp.json()["nivel_recomendado"] <= 100

    def test_nivel_no_baja_de_0(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 0.0, "duracion_segundos": 60, "nivel_dificultad": 2,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        assert resp.json()["nivel_recomendado"] >= 0

    def test_nivel_independiente_por_juego(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 95.0, "duracion_segundos": 60, "nivel_dificultad": 30,
        }, headers=registered_user["headers"])
        resp_j1 = client.get("/resultados/proximo-nivel/1", headers=registered_user["headers"])
        resp_j2 = client.get("/resultados/proximo-nivel/2", headers=registered_user["headers"])
        assert resp_j1.json()["nivel_recomendado"] > 30
        assert resp_j2.json()["nivel_recomendado"] == 0


class TestResultadosPorJuego:
    def test_sin_resultados_404(self, client, registered_user, seeded_games):
        resp = client.get("/resultados/juego/1", headers=registered_user["headers"])
        assert resp.status_code == 404

    def test_obtener_resultados(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 80.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 90.0, "duracion_segundos": 50, "nivel_dificultad": 15,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/juego/1", headers=registered_user["headers"])
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_resultados_aislados_por_usuario(self, client, registered_user, guest_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 80.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        resp = client.get("/resultados/juego/1", headers=guest_user["headers"])
        assert resp.status_code == 404


class TestEstadisticas:
    def test_sin_resultados_404(self, client, registered_user, seeded_games):
        resp = client.get("/resultados/estadisticas", headers=registered_user["headers"])
        assert resp.status_code == 404

    def test_estadisticas_agrupadas_por_juego(self, client, registered_user, seeded_games):
        for jid in [1, 1, 4]:
            client.post("/resultados/", json={
                "juego_id": jid, "puntuacion": 75.0, "duracion_segundos": 60, "nivel_dificultad": 10,
            }, headers=registered_user["headers"])
        resp = client.get("/resultados/estadisticas", headers=registered_user["headers"])
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        juego1 = next(j for j in data if j["juego_id"] == 1)
        assert len(juego1["resultados"]) == 2


class TestBorrarEstadisticas:
    def test_borrar_estadisticas(self, client, registered_user, seeded_games):
        client.post("/resultados/", json={
            "juego_id": 1, "puntuacion": 80.0, "duracion_segundos": 60, "nivel_dificultad": 10,
        }, headers=registered_user["headers"])
        resp = client.delete("/resultados/estadisticas", headers=registered_user["headers"])
        assert resp.status_code == 200
        assert "1 resultados eliminados" in resp.json()["mensaje"]
        stats = client.get("/resultados/estadisticas", headers=registered_user["headers"])
        assert stats.status_code == 404

    def test_borrar_sin_resultados(self, client, registered_user, seeded_games):
        resp = client.delete("/resultados/estadisticas", headers=registered_user["headers"])
        assert resp.status_code == 200
        assert "0 resultados eliminados" in resp.json()["mensaje"]
