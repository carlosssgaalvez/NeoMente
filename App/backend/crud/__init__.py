from crud.usuarios import (
    crear_usuario,
    obtener_usuario_por_username,
    obtener_usuario_por_id,
    eliminar_usuario,
    actualizar_usuario,
    convertir_invitado_a_usuario,
    hash_password,
    verify_password
)

from crud.juegos import (
    crear_juego,
    obtener_juegos,
    obtener_juego_por_id
)

from crud.resultados import (
    guardar_resultado,
    obtener_ultimo_nivel_usuario,
    obtener_estadisticas_usuario_por_juego
)

from models import ResultadoEjercicio 