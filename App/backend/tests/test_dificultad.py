"""Tests unitarios para el algoritmo de dificultad adaptativa."""
from crud.resultados import calcular_siguiente_dificultad


class TestDificultadAdaptativa:
    def test_puntuacion_perfecta_sube(self):
        nuevo = calcular_siguiente_dificultad(100, 50)
        assert nuevo > 50

    def test_puntuacion_cero_baja(self):
        nuevo = calcular_siguiente_dificultad(0, 50)
        assert nuevo < 50

    def test_zona_media_estable(self):
        nuevo = calcular_siguiente_dificultad(60, 50)
        assert nuevo == 50

    def test_umbral_alto_exacto(self):
        nuevo = calcular_siguiente_dificultad(80, 50)
        assert nuevo >= 52

    def test_umbral_bajo_exacto(self):
        nuevo = calcular_siguiente_dificultad(40, 50)
        assert nuevo <= 49

    def test_no_supera_100(self):
        nuevo = calcular_siguiente_dificultad(100, 100)
        assert nuevo == 100

    def test_no_baja_de_0(self):
        nuevo = calcular_siguiente_dificultad(0, 0)
        assert nuevo == 0

    def test_subida_maxima_es_8(self):
        nuevo = calcular_siguiente_dificultad(100, 50)
        assert nuevo - 50 <= 8

    def test_bajada_maxima_es_5(self):
        nuevo = calcular_siguiente_dificultad(0, 50)
        assert 50 - nuevo <= 5

    def test_subida_progresiva(self):
        delta_80 = calcular_siguiente_dificultad(80, 50) - 50
        delta_100 = calcular_siguiente_dificultad(100, 50) - 50
        assert delta_100 >= delta_80

    def test_bajada_progresiva(self):
        delta_40 = 50 - calcular_siguiente_dificultad(40, 50)
        delta_0 = 50 - calcular_siguiente_dificultad(0, 50)
        assert delta_0 >= delta_40

    def test_nivel_bajo_con_buena_puntuacion(self):
        nuevo = calcular_siguiente_dificultad(90, 5)
        assert nuevo > 5
        assert nuevo <= 13

    def test_nivel_alto_con_mala_puntuacion(self):
        nuevo = calcular_siguiente_dificultad(10, 95)
        assert nuevo < 95
        assert nuevo >= 90
