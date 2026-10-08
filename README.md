# HandWash AI — Frontend

Dashboard React/TypeScript para observar en tiempo real una sesión de lavado de manos en la Mac. Muestra el video MJPEG, el estado de conexión, los pasos, las infracciones y el resumen que entrega el backend Java.

## Alcance

- Crea una sesión como propietario o permite unirse con código como dashboard de solo lectura (`VIEWER`).
- Consume la API REST y los mensajes WebSocket del backend.
- Muestra el stream MJPEG del proceso local de cámara/YOLO, vinculado al `sessionId` activo.
- Presenta el modo de despliegue informado por el backend.

El frontend no captura video, no ejecuta YOLO y no calcula reglas ni resultados. El backend Java es la fuente de verdad de los pasos, tiempos e infracciones. La cámara y el productor YOLO corren en la Mac y envían sus detecciones al backend.

## Stack

- React 18.3 y TypeScript.
- Vite 6 para desarrollo y build.
- Zustand para estado de sesión y conexión.
- Tailwind CSS 4 y Lucide React para la interfaz.
- Vitest y Testing Library para pruebas.

## Requisitos y ejecución

Se requiere Node.js y npm. Desde la raíz de este repositorio:

```bash
npm ci
cp .env.example .env.local  # opcional: editar destinos locales
npm run dev
```

Vite sirve el dashboard en `http://127.0.0.1:5173`. Para la operación local también deben estar activos:

- Backend Java en `http://127.0.0.1:8080`.
- Productor YOLO/cámara de la Mac, con stream MJPEG en `http://127.0.0.1:8091/video.mjpg` y estado de cámara en `/health`.

El dashboard solo solicita el stream cuando hay una sesión activa y verifica que su `sessionId` coincida con el del productor.

## Variables de entorno

Los valores de `.env.example` son direcciones públicas que Vite incorpora al frontend; no guardes secretos ni tokens en ellas.

| Variable | Valor local por defecto | Uso |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8080` en desarrollo; mismo origen en build | Base de la API REST. |
| `VITE_WS_URL` | `ws://127.0.0.1:8080` en desarrollo; derivado del origen de API en build | Base WebSocket (`ws`/`wss`). |
| `VITE_CAMERA_STREAM_URL` | `http://127.0.0.1:8091/video.mjpg` | Stream MJPEG del productor local. |

`VITE_API_URL`, `VITE_WS_URL` y `VITE_CAMERA_STREAM_URL` permiten apuntar a otros destinos. Sin configuración, el frontend usa los valores locales anteriores; en un build, API y WebSocket se derivan del origen publicado, mientras que la cámara conserva el destino local salvo que se configure.

## Flujo con el backend

1. El propietario crea una sesión con `POST /api/v1/session`; el dashboard recibe el código de emparejamiento y credencial.
2. Otro dashboard puede unirse con el código mediante `POST /api/v1/auth/dashboard-login` y obtiene acceso de solo lectura.
3. `SessionWebSocketClient` solicita un ticket de un solo uso a `POST /api/v1/session/{sessionId}/websocket-ticket` y conecta a `/ws/{sessionId}`.
4. El productor YOLO envía las detecciones a Java. El frontend recibe por WebSocket el progreso y los resultados; no procesa detecciones.

## Estructura

- `src/App.tsx`: composición del dashboard.
- `src/components/`: controles de sesión, video, pasos, conexión, infracciones, estado de despliegue y resumen.
- `src/hooks/`: ciclo de sesión y conexión WebSocket.
- `src/lib/`: configuración de endpoints, cliente WebSocket y mapeo de mensajes.
- `src/stores/`: estado compartido de sesión y conexión con Zustand.
- `src/types/`: contratos y tipos del dashboard.
- `src/test/`: pruebas de componentes, stores y clientes.

## Comandos

```bash
npm run dev      # servidor Vite
npm run build    # TypeScript y build de producción
npm run lint     # ESLint
npm run test     # Vitest en modo ejecución única
npm run preview  # vista local del build
```
