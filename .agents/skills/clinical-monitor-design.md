---
name: clinical-monitor-design
description: Sistema de diseño visual para el monitor de escritorio de HandWash AI. Úsalo al construir o modificar cualquier componente visual del frontend (paneles, tarjetas, tipografía, color, estados). No es una guía genérica de "buen diseño" — fija decisiones concretas para este producto y evita que cada sesión reinvente la paleta o el tono.
---

# Diseño visual — Monitor HandWash AI

## Quién lo mira y para qué
Personal clínico/hospitalario supervisando en tiempo real si el lavado de manos cumple el
protocolo OMS. La pantalla vive en un monitor fijo de escritorio, se mira de reojo mientras
se hace otra cosa, y en el momento crítico (una infracción) debe leerse en menos de 1 segundo.
No es un producto de consumo ni un dashboard de analytics: es instrumentación clínica.
Consecuencia directa: **cero elementos decorativos que no comuniquen estado**.

## Paleta (fija — no improvisar otra)
- Fondo base: `#0F1417` (casi negro, no negro puro — evita el efecto "modo oscuro genérico").
- Superficie de tarjetas/paneles: `#1A2126`.
- Texto primario: `#E8EDF0`. Texto secundario/labels: `#8B98A3`.
- Acento neutro (bordes, dividers): `#2C363D`.
- Estado OK / paso completado: `#3FB68B` (verde clínico, no verde saturado tipo "success toast").
- Estado en progreso / paso activo: `#4A9EFF` (azul, no el azul default de Tailwind).
- Advertencia (confianza baja, reconectando): `#E0A93E`.
- Infracción / error: `#E5484D`.
Estos 7 colores son el sistema completo. No agregar gradientes, sombras de color ni un
segundo acento "para diferenciar". La seriedad viene de la disciplina, no de más color.

## Tipografía
Una sola familia sans-serif de uso técnico/clínico (ej. Inter o IBM Plex Sans — no Roboto ni
la fuente default del sistema, y no una serif). Dos pesos: 400 para texto, 600 para labels y
valores numéricos destacados (cronómetro, % confianza). Nada de mayúsculas trackeadas para
labels — usar sentence case con el color secundario para jerarquía, no mayúsculas.

## Qué evitar explícitamente (defaults genéricos que no aplican aquí)
- Tarjetas con `border-radius` uniforme + sombra gris suave repetida en todo — aquí los
  paneles son casi planos, delimitados por borde de 1px (`#2C363D`), no por sombra.
- Iconos decorativos junto a cada label ("✅ Estado: OK"). Si el color y la tipografía ya
  comunican el estado, el emoji es ruido.
- Animaciones de entrada (fade/slide) en cada tarjeta al cargar. La única animación permitida
  es la que responde a un evento real: un paso que cambia, una infracción que aparece, el
  bounding box que se mueve. Motion sin evento = ruido en un monitor que se mira de reojo.
- Badges pastel o "pill" con fondo suave de color — usar el color solo en el texto/ícono de
  estado y un borde fino, no en fondos grandes saturados.

## Jerarquía de la pantalla (de arriba a abajo, en ese orden de importancia visual)
1. Estado de sesión + cronómetro (lo primero que se lee).
2. Stepper de los 7 pasos OMS — siempre visible, es la referencia constante.
3. Canvas de detección (bounding box + clase + confianza).
4. Panel de control (selector de protocolo, Iniciar/Detener) — visualmente secundario una vez
   la sesión está activa; solo domina la pantalla cuando no hay sesión corriendo.
5. Log de infracciones — visible pero no compite con el stepper.

## Regla de motion
Un solo tipo de transición: cuando el paso activo cambia, la tarjeta del paso anterior se
atenúa (opacity) y la nueva se resalta con el color de "en progreso". Duración 150–200ms,
ease-out. No usar spring/bounce — no es un producto lúdico.

## Estado vacío / sin sesión
Cuando no hay sesión activa, la pantalla no debe quedar en blanco ni mostrar un canvas vacío
confuso: mostrar explícitamente "Sistema en espera" + el botón de iniciar, con el stepper y
el canvas en estado deshabilitado (opacidad reducida, sin datos falsos ni placeholders con
bounding boxes de ejemplo).
