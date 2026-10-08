# Reflexión Crítica del Equipo — Uso de IA en el Desarrollo de Software

**Proyecto:** Sistema de Reservas de Salas de Biblioteca  
**Práctica:** N.° 3 — Desarrollo Colaborativo con Herramientas de IA  
**Equipo:** Equipo 5 — Ingeniería de Software Moderna  
**Fecha:** Octubre 2026  

---

## 1. Balance del Uso de IA por Fase del SDLC

### ¿En qué fases aportó mayor valor?

**Análisis de Requisitos — Aporte alto**  
La IA fue especialmente útil en esta fase. Con un prompt bien estructurado, ChatGPT generó en segundos un conjunto inicial de requisitos funcionales y no funcionales que habría tomado al equipo entre 30 y 60 minutos construir desde cero. Las User Stories en formato Gherkin también se generaron con buena estructura. El mayor valor fue la velocidad de arranque y la cobertura de casos que el equipo no había contemplado inicialmente (como la validación de formatos en los campos de fecha y hora).

**Implementación — Aporte alto con supervisión**  
GitHub Copilot fue la herramienta más utilizada durante la codificación. Aceleró significativamente la escritura de código repetitivo: middlewares de validación, queries SQL parametrizadas, controladores CRUD. El equipo estimó que aproximadamente el 60% del código base fue sugerido inicialmente por Copilot, aunque el 100% fue revisado, ajustado y aprobado manualmente.

**Diseño de Sistema — Aporte medio**  
La IA ayudó a generar la estructura de carpetas y el esquema de base de datos inicial, pero sus sugerencias arquitectónicas requirieron correcciones importantes (propuso MongoDB en lugar de SQL, Sequelize ORM en lugar de queries directas, sesiones en lugar de JWT). El equipo terminó rechazando varias sugerencias y tomando decisiones propias basadas en los requisitos concretos del proyecto.

**Pruebas — Aporte bajo**  
En la generación de pruebas, la IA tendió a generar casos "felices" (happy path) y omitir casos borde importantes como tokens expirados, conflictos de horario parciales o intentos de cancelar reservas ajenas. El equipo tuvo que agregar manualmente la mayoría de los casos de prueba de seguridad y validación.

**Despliegue — Aporte medio**  
La IA generó un Dockerfile funcional como punto de partida, pero la imagen inicial no seguía buenas prácticas de seguridad (ejecutaba como root, no usaba multi-stage build). El equipo corrigió esto agregando un usuario sin privilegios y la separación en etapas de build.

---

### Fases donde la IA fue menos útil o generó problemas

- **Decisiones arquitectónicas:** La IA tendió a sugerir las tecnologías más populares (MongoDB, GraphQL, Sequelize) sin considerar el contexto del proyecto. Las decisiones finales fueron tomadas por el equipo.
- **Seguridad:** El código generado por IA raramente incluía protecciones de seguridad espontáneamente (helmet, rate limiting, validación de entradas). El equipo las agregó de forma deliberada.
- **Casos borde en pruebas:** La IA generó pruebas optimistas y el equipo tuvo que agregar los escenarios de falla.

---

## 2. Porcentaje de Código Generado por IA vs. Manual

| Componente | % IA (estimado) | % Manual | Observación |
|------------|-----------------|----------|-------------|
| Estructura de carpetas y config | 40% | 60% | La IA sugirió la estructura base, el equipo la ajustó |
| Modelos (queries SQL) | 65% | 35% | Copilot generó la mayoría de los SQL, equipo revisó joins y lógica de conflictos |
| Controladores | 55% | 45% | IA generó la estructura, equipo agregó validaciones de negocio |
| Middlewares | 50% | 50% | IA generó esqueleto, equipo completó manejo de errores y edge cases |
| Rutas | 70% | 30% | Muy repetitivo, Copilot fue eficiente aquí |
| DDL / Schema SQL | 50% | 50% | IA omitió constraints CHECK e índices |
| Documentación | 60% | 40% | IA generó estructura, equipo enriqueció con contexto real |
| Pruebas unitarias | 30% | 70% | IA generó happy paths, equipo agregó edge cases críticos |
| **Total estimado** | **~55%** | **~45%** | — |

**¿Es representativo de la calidad?** No directamente. El porcentaje de código generado por IA no determina su calidad. El código de IA que pasó revisión humana tiene la misma calidad que el escrito manualmente. El riesgo está en el código de IA que se integra sin revisión.

---

## 3. Riesgos Identificados en el Uso de IA

| Riesgo | Descripción | Mitigación aplicada |
|--------|-------------|---------------------|
| **Alucinaciones** | La IA puede generar código sintácticamente correcto pero semánticamente incorrecto (ej. lógica de conflicto de horarios que falla en casos borde) | Revisión manual obligatoria y pruebas antes del merge |
| **Seguridad** | El código generado por IA raramente incluye protecciones de seguridad proactivamente | Checklist de seguridad en cada PR: helmet, rate limiting, validación, no-secrets |
| **Propiedad intelectual** | Copilot puede sugerir fragmentos que reproducen código con licencias restrictivas | Nunca copiar bloques grandes sin revisar; preferir sugerencias de línea por línea |
| **Dependencia excesiva** | El equipo puede perder comprensión profunda del código si delega demasiado en IA | Cada integrante debe entender y poder explicar todo el código que commitea |
| **Datos sensibles** | Compartir con IA pública: secrets, tokens, contraseñas, datos de usuarios | Directriz clara: nunca compartir archivos `.env` ni credenciales con IA pública |
| **Contexto incompleto** | La IA no conoce el contexto completo del proyecto y puede sugerir soluciones inconsistentes | Prompts detallados con contexto; no aceptar sugerencias fuera del stack definido |

---

## 4. Comparativa: Desarrollo con IA vs. Desarrollo Tradicional

| Dimensión | Desarrollo con IA | Desarrollo Tradicional | Ganador |
|-----------|-------------------|----------------------|---------|
| **Velocidad** | Alta: reduce tiempo de código repetitivo en ~40-60% | Más lento en tareas rutinarias | IA |
| **Calidad del código** | Variable: buena en estructura, requiere revisión en lógica de negocio | Consistente si el desarrollador es experiente | Empate |
| **Costo** | Bajo (herramientas con plan gratuito para estudiantes) | Solo costo de horas del desarrollador | IA |
| **Aprendizaje** | Riesgo de "aprender de memoria sin entender"; también puede acelerar el aprendizaje mostrando patrones | El programador construye comprensión profunda | Tradicional |
| **Creatividad** | IA tiende a soluciones convencionales y populares | El humano puede innovar y adaptar al contexto | Tradicional |
| **Mantenibilidad** | Alta si el código fue revisado; baja si se integró sin entender | Alta cuando hay estándares claros del equipo | Empate |

---

## 5. Directrices del Equipo para el Uso Responsable de IA

### Directriz 1: Revisar siempre antes de integrar

Todo código generado por IA debe ser leído línea por línea por el desarrollador antes de hacer commit. Si no puedes explicar qué hace el código, no lo integres. La IA puede generar código que funciona en apariencia pero con vulnerabilidades o lógica incorrecta.

### Directriz 2: La IA es un punto de partida, no el producto final

Usa la IA para generar borradores rápidos de User Stories, esquemas de base de datos, controladores o tests. Luego el equipo refina, valida y adapta al contexto real. Nunca copies y pegues sin crítica.

### Directriz 3: Define qué información NO compartir con IA pública

Nunca compartas con herramientas de IA públicas (ChatGPT, Copilot Chat online):
- Archivos `.env` con secrets o tokens
- Datos personales de usuarios reales
- Credenciales de bases de datos o APIs de producción
- Información confidencial del cliente o institución
- Código propietario sensible

### Directriz 4: Valida el código con pruebas antes del merge

Todo código generado con IA debe tener al menos una prueba que lo valide antes de hacer merge. Especialmente en lógica de negocio (cálculos, validaciones, control de acceso). El CI pipeline rechazará automáticamente código sin pruebas suficientes.

### Directriz 5: Documenta el uso de IA en cada contribución

En cada Pull Request, el desarrollador debe indicar qué herramienta de IA usó, qué generó y qué corrigió manualmente. Esto permite al equipo aprender de la experiencia colectiva y al docente evaluar el proceso real de trabajo.

### Directriz 6: Usa prompts específicos y contextualizados

Un prompt vago genera código genérico e inapropiado para el proyecto. Siempre incluye en el prompt: el stack tecnológico, el patrón de código del proyecto, el objetivo específico y las restricciones relevantes.

**Ejemplo de prompt malo:**
> *"Genera una función para crear reservas"*

**Ejemplo de prompt bueno:**
> *"En Node.js con Express y SQLite, dentro de un controlador async/await que usa el patrón try/catch y la función `ejecutar()` de config/database.js, genera la función `crearReserva` que valide que hora_inicio < hora_fin, verifique que no haya conflicto de horario llamando a `ReservaModel.existeConflicto()` y responda con `respuesta.exito()` o `respuesta.error()`"*
