# Gestión de gimnasio / panel de socios

Este repositorio contiene una aplicación full-stack para gestionar un gimnasio o un club de socios. Incluye un backend en Python con FastAPI y un frontend en React con Tailwind, además de funcionalidades para manejar socios, pagos, planes, alertas y exportación de datos.

## Qué hace

- Autenticación de usuarios con JWT
- Registro y administración de socios
- Gestión de pagos y cálculo automático de vencimientos
- Dashboard de estadísticas de ingresos y estado de socios
- Generación y envío de alertas para socios con cuotas vencidas, próximas a vencer o inactivos
- Administración de planes de suscripción
- Exportación de listas de socios y pagos a Excel
- Integración opcional con WhatsApp/Twilio para reenvío de alertas

## Estructura del proyecto

- `backend/`
  - `app/` — estructura modular de la aplicación
    - `main.py` — punto de entrada de la aplicación FastAPI
    - `core/`
      - `config.py` — configuración y variables de entorno
      - `database.py` — conexión a MongoDB
  - `requirements.txt` — dependencias Python
  - `agregar_datos_prueba.py` — script para insertar datos de prueba
  - `seed_historical_data.py` — script para semilla de datos históricos
  - `.env` — variables de entorno necesarias para el backend
  - `venv/` — entorno virtual Python incluido en el repositorio

- `frontend/`
  - `package.json` — dependencias y scripts de React
  - `craco.config.js`, `tailwind.config.js`, `postcss.config.js` — configuración del builder y estilos
  - `public/` — archivos estáticos para la app React
  - `src/`
    - `App.js` — router principal y manejo de sesión
    - `pages/` — vistas principales: `AuthPage`, `Dashboard`, `Socios`, `Pagos`, `HistorialAlertas`, `Planes`, `Ingresos`
    - `components/` — componentes UI reutilizables y layout
    - `components/ui/` — librería de componentes personalizados basados en Radix y Tailwind

- `tests/` — carpeta para pruebas
- `test_reports/` — reportes de pruebas
- `backend_test.py`, `design_guidelines.json`, `test_result.md` — archivos de soporte y documentación adicional

## Tecnologías usadas

### Backend

- Python
- FastAPI
- MongoDB con Motor (`motor`) y PyMongo
- JWT para autenticación (`PyJWT`)
- Bcrypt para hashing de contraseñas
- APScheduler para tareas programadas
- openpyxl para exportar Excel
- Twilio opcional para servicios de WhatsApp

### Frontend

- JavaScript
- React
- React Router
- Tailwind CSS
- CRACO (Create React App configuration override)
- Axios para llamadas HTTP
- React Hook Form
- Recharts para gráficas
- Radix UI
- Sonner para notificaciones

## Requisitos previos

- Python 3.10+ o superior
- Node.js 18+ / npm o Yarn
- MongoDB accesible desde el backend

## Configuración del backend

1. Abrir terminal en `backend/`
2. Crear y activar un entorno virtual (recomendado):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Instalar dependencias:

```powershell
pip install -r requirements.txt
```

4. Crear el archivo `backend/.env` con al menos estas variables:

```env
MONGO_URL=mongodb://usuario:password@localhost:27017
DB_NAME=nombre_basedatos
JWT_SECRET=una_clave_segura
CORS_ORIGINS=http://localhost:3000
```

5. Variables opcionales de Twilio (solo si usa integración de WhatsApp):

```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Ejecutar el backend

Desde `backend/`:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend quedará disponible en `http://localhost:8000` y expone las APIs bajo `/api`.

## Configuración del frontend

1. Abrir terminal en `frontend/`
2. Instalar dependencias:

```powershell
cd frontend
npm install
```

> **Nota**: Si hay problemas con dependencias, usar `npm ci` para una instalación limpia desde `package-lock.json`:
> ```powershell
> npm ci
> ```

3. Crear un archivo `.env` en `frontend/` con la URL del backend:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Ejecutar el frontend

Desde `frontend/`:

```powershell
npm start
```

La aplicación se ejecutará en `http://localhost:3000`.

## Endpoints principales

El backend expone los siguientes bloques principales:

- `/api/auth/` — autenticación y perfil de usuario
- `/api/socios` — CRUD de socios
- `/api/pagos` — registro y consulta de pagos
- `/api/dashboard/stats` — estadísticas para el dashboard
- `/api/alertas` — alertas activas y generación de nuevas alertas
- `/api/alertas/enviadas` — historial de alertas enviadas
- `/api/config/mensajes` — mensajes personalizados para alertas
- `/api/planes` — gestión de planes
- `/api/exportar/socios` — exportar socios a Excel
- `/api/exportar/pagos` — exportar pagos a Excel

## Uso general

1. Iniciar el backend y el frontend.
2. Abrir el navegador en `http://localhost:3000`.
3. Registrarse o iniciar sesión en la página de autenticación.
4. Navegar por el dashboard para ver estadísticas, administrar socios, pagos, planes y alertas.

## Notas adicionales

- El frontend utiliza `localStorage` para guardar el token y la información del usuario.
- El backend programa una tarea que genera alertas diarias con APScheduler.
- Si el archivo `backend/.env` no incluye `JWT_SECRET`, se usa una clave por defecto, pero no es seguro para producción.
- Para producción se recomienda usar HTTPS, un secreto JWT fuerte y una base de datos MongoDB segura.

