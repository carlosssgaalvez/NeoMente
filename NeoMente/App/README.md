# NeoMente

Aplicación móvil de entrenamiento cognitivo desarrollada como TFG.

- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React Native (Expo)

---

## Requisitos previos

- Python 3.10+
- Node.js 18+ y npm
- Expo Go (Aplicación) instalado en el móvil (misma red WiFi que el PC)

---

## 1. Configurar la IP local

Ejecuta `ipconfig` (Windows) o `ip a` (Linux/Mac) y anota la **IPv4 de tu adaptador WiFi**.

Edita `frontend/app.json` y actualiza la URL del API:

```json
"extra": {
  "apiUrl": "http://<TU_IP_LOCAL>:8000"
}
```

---

## 2. Backend

Las dependencias se instalan en un entorno virtual (`venv`) para no interferir con otros proyectos Python.

```powershell
cd App\backend

# Crear el entorno virtual (solo la primera vez)
python -m venv venv

# Activar el entorno
.\venv\Scripts\Activate        # Windows PowerShell
# source venv/bin/activate     # Linux / macOS

# Instalar dependencias (solo la primera vez o tras cambios en requirements.txt)
pip install -r requirements.txt
```

### Configurar el archivo `.env`

El archivo `backend/.env` ya existe. Cambia `SECRET_KEY` por un valor seguro (solo la primera vez):

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copia el resultado y pégalo en `backend/.env`:

```
SECRET_KEY=<valor_generado>
```

### Arrancar el servidor

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verifica que funciona accediendo desde el navegador: `http://<TU_IP_LOCAL>:8000/docs`

---
cd
## 3. Frontend

npm gestiona las dependencias de forma local en `node_modules/`, por lo que no necesita entorno virtual.

```powershell
cd App\frontend

# Instalar dependencias (solo la primera vez o tras cambios en package.json)
npm install
```

### Arrancar Expo

Expo necesita conocer la IP local del PC para que el móvil pueda conectarse. Sigue estos pasos:

1. Obtén tu IP WiFi:

   ```powershell
   ipconfig
   ```

   Busca la **IPv4** del adaptador **Wi-Fi** (por ejemplo `192.168.68.104`).

2. Arranca Expo forzando esa IP (sustituye por la tuya):

   ```powershell
   $env:REACT_NATIVE_PACKAGER_HOSTNAME="<TU_IP_WIFI>"
   npx expo start --lan
   ```

   > **¿Por qué?** En algunas redes, Expo no detecta la IP y cae a `127.0.0.1`, lo que impide la conexión desde el móvil. La variable `REACT_NATIVE_PACKAGER_HOSTNAME` lo fuerza.
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.68.104"
   npx expo start --lan
3. Comprueba que la URL del QR muestra tu IP (ej. `exp://192.168.68.104:8081`), **no** `127.0.0.1`.

### Escanear el QR

- **iOS**: escanea el QR con la **cámara nativa** del iPhone. Al reconocerlo, aparecerá un banner para abrir **Expo Go** automáticamente.
- **Android**: escanea con Expo Go directamente.
- Si el QR no cabe en la terminal, maximiza la ventana o pulsa `?` en Expo → copia la URL → pégala manualmente en Expo Go.

El móvil debe estar en la **misma red WiFi** que el PC.

### Problemas comunes

firewall: netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081

- **`Error: The required package 'expo-asset' cannot be found`** (u otro paquete de Expo):

  ```powershell
  npx expo install expo-asset
  ```

  Usa siempre `npx expo install <paquete>` (en vez de `npm install`) para dependencias de Expo.

- **Warnings de versiones** (`expected version: ...`): no bloquean el arranque, pero conviene alinearlas:

  ```powershell
  npx expo install --fix
  ```

- **La app tarda mucho o falla al conectar desde el móvil**: asegúrate de que el firewall de Windows permite conexiones en el puerto **8081** (Metro) y **8000** (API). También comprueba que el PC y el móvil están en la misma red WiFi y que la red no está marcada como "Pública" en Windows (cámbiala a "Privada" en *Configuración → Red e Internet → WiFi → Propiedades*).

---

## Estructura del proyecto

```
App/
├── backend/          # API REST (FastAPI)
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── schemas.py
│   ├── .env          # Variables de entorno (NO subir a git)
│   ├── crud/
│   ├── models/
│   └── routers/
└── frontend/         # App móvil (React Native + Expo)
    ├── App.js
    ├── app.json
    ├── api/
    ├── components/
    ├── context/
    ├── navigation/
    ├── screens/
    └── utils/
```

---

## Notas

- El archivo `backend/.env` y `backend/venv/` **no deben subirse a git**. Asegúrate de que están en `.gitignore`.
- La base de datos SQLite (`neomente.db`) se crea automáticamente al arrancar el backend por primera vez.
