# Modelo Entidad-Relación — Sistema de Reservas de Salas de Biblioteca

**Versión:** 1.0  
**Fecha:** Octubre 2026  

---

## 1. Diagrama ER (notación textual)

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│         USUARIOS         │         │           RESERVAS            │
├─────────────────────────┤         ├──────────────────────────────┤
│ PK  id          INTEGER │◄────────│ PK  id            INTEGER    │
│     nombre      TEXT    │  1   N  │ FK  usuario_id    INTEGER    │
│     email       TEXT    │         │ FK  sala_id       INTEGER    │
│     password_hash TEXT  │         │     fecha         TEXT       │
│     rol         TEXT    │         │     hora_inicio   TEXT       │
│     activo      INTEGER │         │     hora_fin      TEXT       │
│     fecha_registro TEXT │         │     proposito     TEXT       │
└─────────────────────────┘         │     estado        TEXT       │
                                    │     fecha_creacion TEXT      │
                                    └──────────────┬───────────────┘
                                                   │ N
                                                   │
                                                   │ 1
                                    ┌──────────────▼───────────────┐
                                    │            SALAS              │
                                    ├──────────────────────────────┤
                                    │ PK  id            INTEGER    │
                                    │     nombre        TEXT       │
                                    │     capacidad     INTEGER    │
                                    │     ubicacion     TEXT       │
                                    │     descripcion   TEXT       │
                                    │     activa        INTEGER    │
                                    │     fecha_creacion TEXT      │
                                    └──────────────────────────────┘
```

**Cardinalidades:**
- Un `USUARIO` puede tener **muchas** `RESERVAS` (1:N)
- Una `SALA` puede tener **muchas** `RESERVAS` (1:N)
- Una `RESERVA` pertenece a exactamente **un** `USUARIO` y exactamente **una** `SALA`

---

## 2. Diccionario de Datos

### Tabla: `usuarios`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único del usuario |
| `nombre` | TEXT | NOT NULL, LENGTH 2-100 | Nombre completo del usuario |
| `email` | TEXT | NOT NULL, UNIQUE | Correo electrónico institucional |
| `password_hash` | TEXT | NOT NULL | Hash bcrypt de la contraseña (salt=12) |
| `rol` | TEXT | NOT NULL, DEFAULT 'usuario' | Rol: `usuario` o `admin` |
| `activo` | INTEGER | NOT NULL, DEFAULT 1 | 1=activo, 0=eliminado (soft delete) |
| `fecha_registro` | TEXT | NOT NULL, DEFAULT now() | Fecha y hora de creación del registro |

### Tabla: `salas`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único de la sala |
| `nombre` | TEXT | NOT NULL, UNIQUE, LENGTH 1-100 | Nombre descriptivo de la sala |
| `capacidad` | INTEGER | NOT NULL, 1-200 | Número máximo de personas |
| `ubicacion` | TEXT | NOT NULL, LENGTH ≤ 200 | Descripción de la ubicación física |
| `descripcion` | TEXT | NULLABLE, LENGTH ≤ 500 | Descripción adicional y equipamiento |
| `activa` | INTEGER | NOT NULL, DEFAULT 1 | 1=activa, 0=desactivada (soft delete) |
| `fecha_creacion` | TEXT | NOT NULL, DEFAULT now() | Fecha y hora de creación |

### Tabla: `reservas`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | Identificador único de la reserva |
| `usuario_id` | INTEGER | FK → usuarios.id, NOT NULL | Usuario que realizó la reserva |
| `sala_id` | INTEGER | FK → salas.id, NOT NULL | Sala reservada |
| `fecha` | TEXT | NOT NULL, formato YYYY-MM-DD | Fecha de la reserva |
| `hora_inicio` | TEXT | NOT NULL, formato HH:MM | Hora de inicio |
| `hora_fin` | TEXT | NOT NULL, formato HH:MM | Hora de fin (> hora_inicio) |
| `proposito` | TEXT | NULLABLE, LENGTH ≤ 300 | Motivo de la reserva |
| `estado` | TEXT | NOT NULL, DEFAULT 'activa' | `activa`, `cancelada` o `completada` |
| `fecha_creacion` | TEXT | NOT NULL, DEFAULT now() | Fecha y hora de creación |

---

## 3. Índices

| Tabla | Índice | Columna(s) | Propósito |
|-------|--------|------------|-----------|
| usuarios | `idx_usuarios_email` | `email` | Búsqueda rápida por email en login |
| salas | `idx_salas_activa` | `activa` | Filtrar solo salas activas |
| reservas | `idx_reservas_usuario` | `usuario_id` | Consultar reservas por usuario |
| reservas | `idx_reservas_sala` | `sala_id` | Consultar reservas por sala |
| reservas | `idx_reservas_fecha` | `fecha` | Consultar disponibilidad por fecha |
| reservas | `idx_reservas_estado` | `estado` | Filtrar por estado de la reserva |

---

## 4. Evaluación del Modelo Generado por IA

El modelo ER inicial fue generado por ChatGPT con el siguiente prompt:

> *"Genera un modelo Entidad-Relación para un sistema de reservas de salas de biblioteca con usuarios, salas y reservas. Incluye todos los atributos relevantes con sus tipos de datos y restricciones."*

**Evaluación del modelo generado:**

| Aspecto | Resultado |
|---------|-----------|
| Normalización | ✅ Está en 3FN: sin dependencias transitivas ni redundancias |
| Entidades faltantes | ⚠️ La IA omitió el atributo `estado` en reservas y `activo` en usuarios/salas |
| Restricciones CHECK | ⚠️ No incluyó restricciones CHECK para formatos de fecha/hora ni rangos de capacidad |
| Índices | ❌ No generó índices; el equipo los agregó basándose en los patrones de consulta |
| Soft delete | ❌ Propuso DELETE físico; el equipo cambió a soft delete con campo `activo` |
| Integridad referencial | ✅ Incluyó claves foráneas correctamente |

**Correcciones aplicadas por el equipo:**
1. Se agregó el campo `estado` en `reservas` con constraint `CHECK(estado IN (...))`
2. Se agregó `activo` en `usuarios` y `salas` para implementar soft delete
3. Se agregaron constraints `CHECK` para validar formatos de fecha y rangos numéricos
4. Se definieron todos los índices según patrones de acceso identificados
5. Se cambió el DELETE físico por soft delete en usuarios y salas
