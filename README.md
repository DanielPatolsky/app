# Gestión de gimnasio / panel de socios

Este repositorio contiene una aplicación full-stack para gestionar un gimnasio o un club de socios. Incluye un backend en Python con FastAPI y un frontend en React con Tailwind, además de funcionalidades para manejar socios, pagos, planes, alertas y exportación de datos.

## Qué hace

- Autenticación de usuarios con JWT
- Registro y administración de socios
- Gestión de pagos y cálculo automático de vencimientos
- Dashboard de estadísticas de ingresos y estado de socios
- Generación de alertas para socios con cuotas vencidas, próximas a vencer o inactivos
- Administración de planes de suscripción
- Exportación de listas de socios y pagos a Excel

## Estructura del proyecto

- `backend/`
  - `server.py` — punto de entrada (importa app/main.py)
  - `app/` — estructura modular de la aplicación
    - `main.py` — aplicación FastAPI con todos los routers incluidos
    - `core/` — configuración y seguridad
      - `security.py` — autenticación JWT, bcrypt, dependencias de FastAPI
    - `models/` — modelos Pydantic de datos
      - `user.py` — modelos de autenticación (UserRegister, UserLogin, User, TokenResponse)
      - `socio.py` — modelos de socios (SocioCreate, Socio)
      - `pago.py` — modelos de pagos (PagoCreate, Pago)
      - `plan.py` — modelos de planes (Plan, PlanCreate, PlanUpdate)
      - `dashboard.py` — modelos de dashboard y alertas (DashboardStats, Alerta, ConfigMensaje, etc.)
    - `services/` — lógica de negocio
      - `auth_service.py` — servicios de autenticación (register_user, login_user)
    - `routers/` — endpoints REST
      - `auth.py` — rutas de autenticación (GET /auth/me, POST /auth/register, POST /auth/login)
    - `utils/` — funciones auxiliares y utilidades
      - `helpers.py` — funciones reutilizables (calcular_fecha_vencimiento, get_next_sequence, etc.)
      - `notifications.py` — utilidades de notificación
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
- Funciones de notificación internas sin integración externa de WhatsApp

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

5. 
## Ejecutar el backend

Desde `backend/`:

```powershell
# Opción 1: Usar server.py (punto de entrada original)
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Opción 2: Usar app/main.py directamente
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

## Arquitectura modular del backend

A partir de la refactorización, el backend utiliza una arquitectura modular escalable:

### Capa de Modelos (`app/models/`)
Define los esquemas Pydantic para validación de datos:
- `user.py` — esquemas de autenticación
- `socio.py`, `pago.py`, `plan.py` — esquemas de negocio
- `dashboard.py` — esquemas de estadísticas y alertas

### Capa de Seguridad (`app/core/`)
Centraliza la lógica de autenticación y configuración:
- `security.py` — funciones de hashing, JWT, dependencia `get_current_user()`

### Capa de Servicios (`app/services/`)
Contiene la lógica de negocio desacoplada de los endpoints:
- `auth_service.py` — `register_user()`, `login_user()`

### Capa de Routers (`app/routers/`)
Define los endpoints REST:
- `auth.py` — rutas de autenticación

### Capa de Utilidades (`app/utils/`)
Funciones reutilizables:
- `helpers.py` — cálculos, secuencias de BD, actualización de estados
- `notifications.py` — envío de mensajes

### Punto de Entrada (`app/main.py`)
- Incluye todos los routers
- Configura CORS y middleware
- Configura el scheduler de alertas
- Define endpoints de dashboard, alertas, planes, exportación

**Ventajas de esta arquitectura:**
- ✅ Escalabilidad: fácil agregar nuevos módulos sin afectar código existente
- ✅ Reutilización: funciones y servicios se comparten entre endpoints
- ✅ Testabilidad: cada capa se puede testear independientemente
- ✅ Mantenibilidad: código organizado y fácil de entender

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

