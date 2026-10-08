# Product Backlog — Sistema de Reservas de Salas de Biblioteca

**Versión:** 1.0  
**Fecha:** Octubre 2026  
**Metodología:** Scrum  

---

## User Stories

Las siguientes User Stories fueron generadas con apoyo de ChatGPT a partir de los requisitos funcionales documentados, luego revisadas y refinadas por el equipo aplicando el criterio INVEST.

### Prompt utilizado con IA para User Stories

> *"Transforma los siguientes requisitos funcionales en User Stories en formato 'Como [rol], quiero [funcionalidad] para [beneficio]', con criterios de aceptación en formato Gherkin (Given/When/Then). Incluye al menos 2 criterios de aceptación por historia."*

---

### Epic 1: Autenticación y Gestión de Cuenta

---

**US-01 — Registro de usuario**

> Como **estudiante**, quiero **registrarme con mi correo institucional y una contraseña** para **acceder al sistema de reservas**.

**Criterios de aceptación:**
- **Dado** que soy un usuario nuevo, **cuando** envío nombre, correo y contraseña válidos, **entonces** el sistema crea mi cuenta y responde con código 201.
- **Dado** que intento registrarme con un correo ya existente, **cuando** envío el formulario, **entonces** el sistema responde con código 409 y mensaje explicativo.
- **Dado** que envío una contraseña sin mayúsculas, **cuando** proceso el registro, **entonces** el sistema responde con código 422 indicando el campo inválido.

**Estimación:** 2 puntos | **Prioridad:** Alta

---

**US-02 — Inicio de sesión**

> Como **usuario registrado**, quiero **iniciar sesión con mis credenciales** para **obtener acceso autenticado al sistema**.

**Criterios de aceptación:**
- **Dado** que tengo una cuenta activa, **cuando** ingreso email y contraseña correctos, **entonces** recibo un token JWT válido por 24 horas.
- **Dado** que ingreso una contraseña incorrecta, **cuando** proceso el login, **entonces** el sistema responde 401 sin revelar qué campo es incorrecto (seguridad).

**Estimación:** 2 puntos | **Prioridad:** Alta

---

**US-03 — Actualización de perfil**

> Como **usuario autenticado**, quiero **actualizar mi nombre y correo electrónico** para **mantener mis datos actualizados en el sistema**.

**Criterios de aceptación:**
- **Dado** que estoy autenticado, **cuando** envío un nombre y correo válidos, **entonces** el sistema actualiza mi perfil y devuelve los datos actualizados.
- **Dado** que intento usar un correo que ya pertenece a otro usuario, **entonces** el sistema responde con código 409.

**Estimación:** 1 punto | **Prioridad:** Baja

---

### Epic 2: Gestión de Salas

---

**US-04 — Consultar catálogo de salas**

> Como **estudiante**, quiero **ver la lista de todas las salas disponibles** para **conocer mis opciones antes de reservar**.

**Criterios de aceptación:**
- **Dado** que estoy autenticado, **cuando** consulto `/api/v1/salas`, **entonces** recibo la lista con nombre, capacidad, ubicación y descripción de cada sala.
- **Dado** que una sala está desactivada por el admin, **entonces** no aparece en el listado.

**Estimación:** 1 punto | **Prioridad:** Alta

---

**US-05 — Consultar disponibilidad de salas**

> Como **estudiante**, quiero **filtrar salas por fecha y horario** para **saber cuáles están libres antes de hacer mi reserva**.

**Criterios de aceptación:**
- **Dado** que consulto disponibilidad para el 2026-11-10 de 09:00 a 11:00, **cuando** hay salas sin reservas en ese horario, **entonces** aparecen en el resultado.
- **Dado** que una sala tiene una reserva activa en ese horario, **entonces** no aparece en el resultado.
- **Dado** que envío hora_inicio >= hora_fin, **entonces** el sistema responde 400.

**Estimación:** 3 puntos | **Prioridad:** Alta

---

**US-06 — Crear sala (admin)**

> Como **administrador**, quiero **agregar nuevas salas al catálogo** para **ampliar la oferta de espacios de estudio**.

**Criterios de aceptación:**
- **Dado** que soy admin, **cuando** envío nombre, capacidad y ubicación válidos, **entonces** la sala queda registrada y accesible para consulta.
- **Dado** que un usuario normal intenta crear una sala, **entonces** el sistema responde 403.

**Estimación:** 2 puntos | **Prioridad:** Media

---

### Epic 3: Gestión de Reservas

---

**US-07 — Crear reserva**

> Como **estudiante**, quiero **reservar una sala para una fecha y horario específico** para **garantizar un espacio de estudio sin conflictos**.

**Criterios de aceptación:**
- **Dado** que la sala está disponible en el horario solicitado, **cuando** envío los datos de la reserva, **entonces** el sistema la registra con estado "activa" y responde 201.
- **Dado** que la sala ya tiene una reserva activa que se solapa con el horario solicitado, **entonces** el sistema responde 409.
- **Dado** que envío una fecha en formato incorrecto, **entonces** el sistema responde 422.

**Estimación:** 5 puntos | **Prioridad:** Alta

---

**US-08 — Consultar mis reservas**

> Como **estudiante**, quiero **ver el historial de todas mis reservas** para **hacer seguimiento de mis espacios reservados**.

**Criterios de aceptación:**
- **Dado** que estoy autenticado, **cuando** consulto `/api/v1/reservas`, **entonces** veo solo mis reservas (activas, canceladas y completadas) con el nombre de la sala.
- **Dado** que soy admin, **cuando** consulto el mismo endpoint, **entonces** veo las reservas de todos los usuarios.

**Estimación:** 2 puntos | **Prioridad:** Alta

---

**US-09 — Cancelar reserva**

> Como **estudiante**, quiero **cancelar una reserva que ya no necesito** para **liberar el espacio para otros usuarios**.

**Criterios de aceptación:**
- **Dado** que tengo una reserva activa, **cuando** solicito su cancelación, **entonces** el estado cambia a "cancelada" y responde 200.
- **Dado** que intento cancelar una reserva que no me pertenece, **entonces** el sistema responde 403.
- **Dado** que intento cancelar una reserva ya cancelada, **entonces** el sistema responde 400.

**Estimación:** 2 puntos | **Prioridad:** Alta

---

## Product Backlog Priorizado

| Orden | ID | User Story | Estimación | Prioridad |
|-------|----|------------|------------|-----------|
| 1 | US-01 | Registro de usuario | 2 pts | Alta |
| 2 | US-02 | Inicio de sesión | 2 pts | Alta |
| 3 | US-04 | Consultar catálogo de salas | 1 pt | Alta |
| 4 | US-05 | Consultar disponibilidad de salas | 3 pts | Alta |
| 5 | US-07 | Crear reserva | 5 pts | Alta |
| 6 | US-08 | Consultar mis reservas | 2 pts | Alta |
| 7 | US-09 | Cancelar reserva | 2 pts | Alta |
| 8 | US-06 | Crear sala (admin) | 2 pts | Media |
| 9 | US-03 | Actualización de perfil | 1 pt | Baja |

**Total estimado:** 20 puntos de historia

---

## Comparativa: User Stories generadas por IA vs. escritas manualmente

| Dimensión | IA (ChatGPT) | Manual (equipo) |
|-----------|-------------|-----------------|
| Velocidad de generación | Muy alta (segundos) | Lenta (minutos por US) |
| Completitud de criterios | Alta, pero genérica | Más precisa al contexto |
| Criterios de seguridad | Frecuentemente omitidos | Contemplados desde el inicio |
| Formato Gherkin | Correcto en estructura | Igual de correcto |
| Casos borde | Parcialmente cubiertos | Más exhaustivos |
| Coherencia entre USs | Buena, pero con solapamientos | Sin solapamientos |

**Conclusión:** La IA es un excelente punto de partida para generar User Stories rápidamente, pero requiere revisión humana para detectar ambigüedades, agregar casos borde de seguridad y ajustar al contexto específico del proyecto.
