# AGENTS.md — Dashboard local HandWash AI

## Alcance

Este directorio contiene el dashboard React/TypeScript que se ejecuta en esta
Mac. El iPhone se usa únicamente como cámara de Continuidad. No implementar una
app iOS ni una ruta web que capture/suba video desde Safari en el iPhone.

El flujo principal es:

1. `scripts/run_yolo26_continuity_camera.py` captura Continuity Camera y ejecuta
   YOLO en la Mac.
2. Ese proceso publica el video anotado en `http://127.0.0.1:8091/video.mjpg`
   y envía detecciones al backend Java.
3. Java aplica State/Strategy/Observer y publica los resultados por WebSocket.
4. El dashboard muestra el video y refleja estado, pasos, tiempos e infracciones.

## Responsabilidades y límites

- Java es la única fuente de verdad para secuencia, tiempos, infracciones y
  resumen. El frontend no vuelve a calcular reglas.
- El dashboard solo consume el video MJPEG local, API REST y WebSocket; nunca
  ejecuta YOLO ni captura la cámara.
- El stream MJPEG se solicita con el `sessionId` del store; el capturador
  rechaza IDs ausentes o distintos con HTTP 409. Sin sesión activa no montar la
  imagen, para no mostrar un video de otra sesión junto al Stepper.
- Si falta una fuente de video o una conexión, mostrar el estado y cómo
  recuperarlo; no sustituir video real por imágenes simuladas.
- Usar `VITE_API_URL`, `VITE_WS_URL` y `VITE_CAMERA_STREAM_URL` para los destinos.
- Mantener React 18, TypeScript estricto, Vite, Zustand y WebSocket nativo.
- El panel se optimiza para escritorio y debe seguir siendo utilizable en
  pantallas pequeñas.

## Comandos

```bash
npm run build
npm run test
```
