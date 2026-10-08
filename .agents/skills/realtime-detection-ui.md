---
name: realtime-detection-ui
description: Patrones de UI e interacción para pantallas alimentadas por WebSocket en tiempo real (bounding boxes, stepper de estados, reconexión). Úsalo al implementar cualquier componente del monitor HandWash AI que consuma eventos del WebSocket /ws/{sessionId} o que dependa del estado de conexión.
---

# Patrones de UI en tiempo real — Monitor HandWash AI

## Principio general
El backend Java es la única fuente de verdad del estado (máquina de estados, reglas de
tiempo por protocolo). Este skill cubre **cómo presentar** esos eventos, no cómo decidir
la lógica de negocio — eso nunca se recalcula en el frontend.

## Bounding box sin video real
El iPhone no transmite frames de cámara, solo `{step, confidence, bbox normalizado 0–1}`.
El Canvas dibuja el bbox sobre un lienzo neutro con la proporción de cámara del teléfono
(por defecto 9:16), no sobre una imagen. Reglas:
- El grosor del borde del bbox es fijo (2px); lo que cambia con la confianza es el color
  (interpolar entre el ámbar de advertencia y el color del paso activo por debajo de un
  umbral, ej. 0.6, alineado con el filtro de confianza del backend `Receptor.java`).
- Mostrar el % de confianza como texto pequeño junto al bbox, no como barra de progreso —
  es un dato de apoyo, no el protagonista.
- Si no llega ningún evento de detección en N segundos (definir constante, ej. 3s) con
  sesión activa, mostrar un estado "sin detección" explícito en el canvas — nunca dejar el
  último bbox congelado sin indicarlo, porque parece que el sistema sigue viendo algo que
  ya no ve.

## Clase "Fondo" (8ª clase)
Cuando el evento entrante trae `step: "FONDO"`, el cronómetro del paso activo se pausa
visualmente (dejar de incrementar, sin resetear) y el stepper no marca infracción. Se
sugiere un indicador sutil tipo "sin manos detectadas" en vez de tratarlo como error.

## Stepper de 7 pasos
Cada paso tiene 3 estados visuales posibles: pendiente, activo, completado — y un cuarto
estado transitorio "con infracción" que se superpone al estado activo (no lo reemplaza:
un paso puede estar activo y en infracción de tiempo a la vez). No usar un stepper lineal
tipo checkout de e-commerce con números en círculos — usar el nombre real del paso siempre
visible (el usuario clínico no debe memorizar qué es "paso 4").

## Reconexión WebSocket
- Backoff exponencial: 1s, 2s, 4s, 8s, tope en 16s. Reset del contador tras una conexión
  exitosa (mismo criterio pedido para el cliente iOS en el informe de arquitectura).
- Estado de conexión siempre visible (badge en el header), con 3 estados: conectado,
  reconectando (con el intento actual, ej. "Reconectando (2/∞)"), caído.
- Si la conexión se cae con una sesión activa, la UI no debe asumir que la sesión terminó:
  mostrar "conexión perdida, la sesión puede seguir activa en el servidor" y deshabilitar
  el botón "Iniciar" (no el de "Detener", que debe intentar cerrarla igual vía REST aunque
  el WS esté caído).

## Manejo de eventos malformados
Todo mensaje entrante se valida contra el tipo esperado antes de actualizar el estado. Un
mensaje que no matchea ningún tipo conocido se loguea (consola, no UI) y se descarta — no
debe romper el render ni mostrar un error visible al usuario clínico por un problema de
protocolo que no puede resolver desde ahí.

## Botones de control (Iniciar/Detener)
- "Iniciar" deshabilitado mientras la petición `POST /api/session` está en curso (evitar
  doble sesión por doble click) — mostrar estado de carga en el propio botón, no un spinner
  aparte.
- "Detener" siempre habilitado si hay `sessionId` activo, incluso si el WS está caído —
  debe poder cerrar sesión contra el backend por REST como último recurso.
- Cambiar de protocolo (Clínico/Doméstico) solo es posible sin sesión activa; si el usuario
  intenta cambiarlo con sesión corriendo, el selector se muestra deshabilitado con un
  tooltip explicando por qué, no oculto.

## Resumen final de sesión
Al recibir `SessionSummaryEvent`, la pantalla transiciona del modo "monitoreo en vivo" a un
modo "resultado" claramente distinto (no solo un modal encima): tiempo total, tiempo por
paso, confianza promedio, aprobado/rechazado y el log completo de infracciones. Desde ahí,
un único botón para iniciar una nueva sesión — no se reutiliza el mismo panel de control sin
distinguir que la sesión anterior ya cerró.
