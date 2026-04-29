# NeoMente

Aplicación móvil de entrenamiento cognitivo desarrollada como TFG.

- **Backend**: FastAPI + SQLAlchemy (SQLite local / PostgreSQL en la nube)
- **Frontend**: React Native (Expo SDK 54)
- **Arquitectura**: Offline-first con sincronización automática

---

## Requisitos previos

- Python 3.10+
- Node.js 18+ y npm
- Expo Go instalado en el móvil (misma red WiFi que el PC)

---

## Modos de despliegue

El proyecto soporta dos modos de despliegue. La diferencia se controla únicamente con la `apiUrl` en `frontend/app.json`.

| Modo | Backend | Base de datos | `apiUrl` |
|------|---------|---------------|----------|
| **Local** | Servidor en tu PC | SQLite (fichero local) | `http://<TU_IP_LOCAL>:8000` |
| **Nube** | Render (hosting gratuito) | Neon PostgreSQL | `https://neomente-backend.onrender.com` |

> **Nota:** En ambos modos, la app funciona offline para invitados gracias a SQLite local en el dispositivo. Los usuarios registrados sincronizan automáticamente con el servidor cuando recuperan conexión.

---

## Opción A: Despliegue en la nube (recomendado)

Este es el modo más sencillo. El backend ya está desplegado en Render con PostgreSQL en Neon. No necesitas arrancar ningún servidor local.

### 1. Configurar la URL del API

Edita `frontend/app.json` y asegúrate de que apunta a la nube:

```json
"extra": {
  "apiUrl": "https://neomente-backend.onrender.com"
}
```

### 2. Arrancar el frontend

```powershell
cd App\frontend

# Instalar dependencias (solo la primera vez)
npm install

# Obtén tu IP WiFi
ipconfig    # Busca la IPv4 del adaptador Wi-Fi

# Arranca Expo (sustituye por tu IP)
$env:REACT_NATIVE_PACKAGER_HOSTNAME="<TU_IP_WIFI>"
npx expo start --lan
```

Escanea el QR con Expo Go y listo.

> **Importante:** El backend en Render (plan gratuito) hiberna tras 15 minutos de inactividad. La primera petición tras la hibernación puede tardar 30-60 segundos. Las siguientes serán instantáneas.

---

## Opción B: Despliegue 100% local

Útil para desarrollo o si quieres independencia total de internet.

### 1. Configurar la IP local

Ejecuta `ipconfig` (Windows) o `ip a` (Linux/Mac) y anota la **IPv4 de tu adaptador WiFi**.

Edita `frontend/app.json` y apunta a tu máquina:

```json
"extra": {
  "apiUrl": "http://<TU_IP_LOCAL>:8000"
}
```

### 2. Backend

```powershell
cd App\backend

# Crear el entorno virtual (solo la primera vez)
python -m venv venv

# Activar el entorno
.\venv\Scripts\Activate        # Windows PowerShell
# source venv/bin/activate     # Linux / macOS

# Instalar dependencias (solo la primera vez)
pip install -r requirements.txt
```

#### Configurar el archivo `.env`

Crea o edita `backend/.env`:

```
SECRET_KEY=<valor_seguro>
```

Para generar un valor seguro:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

> En modo local no necesitas `DATABASE_URL`. El backend usará SQLite automáticamente (`neomente.db`).

#### Arrancar el servidor

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verifica en el navegador: `http://<TU_IP_LOCAL>:8000/docs`

### 3. Frontend

```powershell
cd App\frontend

# Instalar dependencias (solo la primera vez)
npm install

# Arranca Expo (sustituye por tu IP)
$env:REACT_NATIVE_PACKAGER_HOSTNAME="<TU_IP_WIFI>"
npx expo start --lan
```

---

## Escanear el QR

- **iOS**: escanea con la **cámara nativa** → se abrirá Expo Go automáticamente.
- **Android**: escanea desde Expo Go directamente.
- Comprueba que la URL del QR muestra tu IP (ej. `exp://192.168.68.104:8081`), **no** `127.0.0.1`.

El móvil debe estar en la **misma red WiFi** que el PC.

---

## Problemas comunes

- **Firewall**: si el móvil no conecta, permite los puertos en Windows:

  ```powershell
  netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081
  netsh advfirewall firewall add rule name="NeoMente API" dir=in action=allow protocol=TCP localport=8000
  ```

- **Paquete no encontrado** (`expo-asset`, etc.):

  ```powershell
  npx expo install expo-asset
  ```

- **Warnings de versiones**:

  ```powershell
  npx expo install --fix
  ```

- **Red pública**: si la red WiFi está marcada como "Pública" en Windows, cámbiala a "Privada" en *Configuración → Red e Internet → WiFi → Propiedades*.

---

## Estructura del proyecto

```
App/
├── backend/                # API REST (FastAPI)
│   ├── main.py             # Punto de entrada
│   ├── auth.py             # Autenticación JWT
│   ├── database.py         # Conexión BD (SQLite o PostgreSQL)
│   ├── schemas.py          # Esquemas Pydantic
│   ├── .env                # Variables de entorno (NO subir a git)
│   ├── Procfile            # Configuración Render
│   ├── crud/               # Lógica de negocio
│   ├── models/             # Modelos SQLAlchemy
│   └── routers/            # Endpoints REST
└── frontend/               # App móvil (React Native + Expo)
    ├── App.js              # Punto de entrada
    ├── app.json            # Configuración Expo + apiUrl
    ├── api/                # Cliente HTTP + servicios API
    ├── components/         # Componentes reutilizables
    ├── constants/          # Colores, fuentes
    ├── context/            # AuthContext (gestión de sesión)
    ├── database/           # SQLite local (offline-first)
    ├── hooks/              # Custom hooks
    ├── navigation/         # React Navigation
    ├── screens/            # Pantallas + juegos
    ├── services/           # dataService, syncService
    └── utils/              # Validación, storage
```

---

## Infraestructura en la nube

| Servicio | Proveedor | Plan | Repositorio |
|----------|-----------|------|-------------|
| Backend API | [Render](https://render.com) | Free | `carlosssgaalvez/neomente-backend` |
| Base de datos | [Neon](https://neon.tech) | Free (PostgreSQL) | — |

Variables de entorno configuradas en Render:
- `DATABASE_URL` — Cadena de conexión Neon PostgreSQL
- `SECRET_KEY` — Clave JWT
- `ALLOWED_ORIGINS` — Orígenes CORS permitidos

---

## Notas

- `backend/.env`, `backend/venv/` y `neomente.db` **no deben subirse a git** (están en `.gitignore`).
- La base de datos SQLite local se crea automáticamente al arrancar el backend.
- En modo nube, el backend se redespliega automáticamente al hacer push al repo Git.
- Los invitados funcionan 100% offline. Los usuarios registrados sincronizan automáticamente al recuperar conexión.
