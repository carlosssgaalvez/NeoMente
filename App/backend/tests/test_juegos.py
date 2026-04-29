"""Tests para endpoints de juegos."""


class TestJuegos:
    def test_listar_juegos_vacio(self, client):
        resp = client.get("/juegos/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_listar_juegos_con_seed(self, client, seeded_games):
        resp = client.get("/juegos/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 9
        nombres = [j["nombre"] for j in data]
        assert "El Semáforo" in nombres

    def test_obtener_juego_por_id(self, client, seeded_games):
        resp = client.get("/juegos/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == 1
        assert data["nombre"] == "La Receta de la Abuela"
        assert data["area_cognitiva"] == "Memoria"

    def test_juego_no_encontrado(self, client, seeded_games):
        resp = client.get("/juegos/999")
        assert resp.status_code == 404

    def test_areas_cognitivas_correctas(self, client, seeded_games):
        resp = client.get("/juegos/")
        data = resp.json()
        areas = {j["area_cognitiva"] for j in data}
        assert areas == {"Memoria", "Atención", "Lenguaje"}

    def test_cada_juego_tiene_descripcion(self, client, seeded_games):
        resp = client.get("/juegos/")
        for juego in resp.json():
            assert juego["descripcion"] is not None
            assert len(juego["descripcion"]) > 0
