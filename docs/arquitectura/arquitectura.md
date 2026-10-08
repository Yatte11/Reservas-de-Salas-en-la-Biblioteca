# Diseño de Arquitectura — Sistema de Reservas de Salas de Biblioteca

**Versión:** 1.0  
**Fecha:** Octubre 2026  
**Equipo:** Equipo 5 — Ingeniería de Software Moderna  

---

## 1. Modelo C4 — Nivel 1: Contexto

```
┌─────────────────────────────────────────────────────────┐
│                  Sistema de Biblioteca                   │
│                                                         │
│   ┌──────────┐        ┌─────────────────────────────┐   │
│   │Estudiante│───────▶│   Sistema de Reservas de    │   │
│   │(Usuario) │        │   Salas de Biblioteca       │   │
│   └──────────┘        │   (SRSB)                    │   │
│                       │                             │   │
│   ┌──────────┐        │   API REST Node.js/Express  │   │
│   │  Admin   │───────▶│   Base de datos SQLite      │   │
│   │Biblioteca│        │   Autenticación JWT         │   │
│   └──────────┘        └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Actores externos:**
- **Estudiante / Usuario:** Consulta salas, hace y cancela reservas vía cualquier cliente HTTP (web, móvil, Postman).
- **Administrador:** Gestiona el catálogo de salas y supervisa todas las reservas.

---

## 2. Modelo C4 — Nivel 2: Contenedores

```
                        ┌─────────────────────────────────────────────┐
                        │           Sistema SRSB                      │
                        │                                             │
  [Cliente HTTP]        │  ┌─────────────────────────────────────┐   │
  (Navegador,      ────▶│  │          API REST                   │   │
   App móvil,           │  │  Node.js 18 + Express 4             │   │
   Postman)             │  │                                     │   │
                        │  │  • Rutas (authRoutes, salaRoutes,   │   │
                        │  │    reservaRoutes, usuarioRoutes)    │   │
                        │  │  • Controladores (lógica)           │   │
                        │  │  • Middlewares (JWT, validación,    │   │
                        │  │    rate limiting, helmet)           │   │
                        │  │  • Swagger UI en /api-docs          │   │
                        │  └────────────┬────────────────────────┘   │
                        │               │ SQL (sqlite3)               │
                        │  ┌────────────▼────────────────────────┐   │
                        │  │        Base de Datos               │   │
                        │  │        SQLite 3                    │   │
                        │  │                                    │   │
                        │  │  • Tabla: usuarios                 │   │
                        │  │  • Tabla: salas                    │   │
                        │  │  • Tabla: reservas                 │   │
                        │  └────────────────────────────────────┘   │
                        │                                             │
                        │  ┌─────────────────────────────────────┐   │
                        │  │     Infraestructura Docker          │   │
                        │  │  • Dockerfile multi-stage           │   │
                        │  │  • docker-compose (prod + dev)      │   │
                        │  │  • Volumen persistente para DB      │   │
                        │  └─────────────────────────────────────┘   │
                        └─────────────────────────────────────────────┘
```

---

## 3. Decisiones Arquitectónicas

### ADR-01: Node.js + Express como stack del servidor

**Contexto:** Necesitamos una API REST ligera que el equipo pueda implementar rápidamente.  
**Decisión:** Node.js 18 con Express 4.  
**Justificación:**
- Ecosistema maduro con amplia documentación
- Mismo lenguaje (JavaScript) en toda la aplicación
- GitHub Copilot tiene excelente soporte para este stack
- Despliegue sencillo en Railway/Render sin configuración adicional

**Alternativas consideradas:** Django (Python), Spring Boot (Java) — descartados por mayor curva de aprendizaje y tiempo de configuración.

**Contribución de IA:** GitHub Copilot Chat sugirió la estructura de carpetas MVC que adoptamos. El equipo ajustó la separación entre `models` (solo queries SQL) y `controllers` (lógica de negocio), que la IA inicialmente mezclaba.

---

### ADR-02: SQLite como base de datos

**Contexto:** El sistema es un prototipo académico con bajo volumen de datos concurrentes.  
**Decisión:** SQLite 3 con el driver `sqlite3`.  
**Justificación:**
- Sin servidor externo: toda la DB en un archivo, ideal para desarrollo y pruebas
- ACID compliant con soporte de claves foráneas
- Fácil portabilidad: el archivo `.db` se puede montar en Docker como volumen

**Limitación conocida:** SQLite no escala bien con escrituras concurrentes altas. Para producción real se recomendaría migrar a PostgreSQL.

**Contribución de IA:** La IA sugirió usar Sequelize ORM, pero el equipo rechazó la sugerencia para mantener el código más transparente y educativo, usando queries SQL directas.

---

### ADR-03: Autenticación con JWT stateless

**Contexto:** Necesitamos autenticación sin sesiones del lado servidor para facilitar el escalado.  
**Decisión:** JSON Web Tokens (JWT) con librería `jsonwebtoken`.  
**Justificación:**
- Stateless: no requiere almacenamiento de sesiones
- El payload incluye `id`, `email`, `nombre` y `rol` para evitar consultas extra a DB
- Expiración de 24 horas configurable vía variable de entorno

**Riesgo:** Los tokens no se pueden invalidar antes de su expiración (sin blacklist). Mitigación: ventana corta de 24h y HTTPS obligatorio en producción.

---

### ADR-04: Arquitectura en capas (Layered Architecture)

**Contexto:** Necesitamos código mantenible y testeable por múltiples integrantes.  
**Decisión:** Arquitectura en capas estricta: Routes → Controllers → Models → DB.  
**Justificación:**
- Bajo acoplamiento: cada capa depende solo de la inmediatamente inferior
- Alta cohesión: cada archivo tiene una responsabilidad clara
- Facilita pruebas unitarias al poder mockear capas individuales
- Los miembros del equipo pueden trabajar en capas distintas sin conflictos

---

## 4. Componentes Principales

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| Punto de entrada | `src/app.js` | Configura Express, middlewares globales, rutas y error handler |
| Config DB | `src/config/database.js` | Conexión SQLite, inicialización del esquema, funciones CRUD base |
| Auth Middleware | `src/middlewares/authMiddleware.js` | Verificación JWT y control de rol admin |
| Validators | `src/middlewares/validators.js` | Validación y sanitización de entradas con express-validator |
| Error Handler | `src/middlewares/errorHandler.js` | Manejo centralizado de errores HTTP |
| Modelos | `src/models/*.js` | Queries SQL parametrizadas por entidad |
| Controladores | `src/controllers/*.js` | Lógica de negocio y orquestación de respuestas |
| Rutas | `src/routes/*.js` | Definición de endpoints y encadenamiento de middlewares |

---

## 5. Flujo de una petición típica

```
Cliente HTTP
    │
    ▼
Express App (app.js)
    │ helmet() → CORS → rate limiter → morgan → json parser
    ▼
Router (ej: reservaRoutes.js)
    │ POST /api/v1/reservas
    ▼
Middleware: verificarToken (authMiddleware.js)
    │ valida JWT, agrega req.usuario
    ▼
Middleware: validarCrearReserva (validators.js)
    │ valida campos, responde 422 si hay errores
    ▼
Controller: crearReserva (reservaController.js)
    │ verifica sala existe
    │ verifica conflicto de horario
    │ crea la reserva
    ▼
Model: ReservaModel.crear() (reservaModel.js)
    │ ejecuta INSERT parametrizado
    ▼
database.ejecutar() (config/database.js)
    │ sqlite3.run()
    ▼
SQLite (biblioteca.db)
    │
    ▼ resultado
Controller → respuesta.exito() → JSON 201
```

---

## 6. Contribución de IA al diseño y correcciones aplicadas

| Aspecto | Sugerencia de IA | Acción del equipo |
|---------|-----------------|-------------------|
| Estructura de carpetas | Sugerió estructura MVC estándar | Adoptada con ajuste: separar `utils/` |
| Autenticación | Sugirió sesiones con express-session | Rechazada, se optó por JWT stateless |
| ORM | Sugirió Sequelize | Rechazada, se prefirieron queries SQL directas |
| Validación | Sugirió validación manual en controladores | Corregida, se centralizó en middlewares con express-validator |
| Base de datos | Sugirió MongoDB para flexibilidad | Rechazada, se prefirió SQL por integridad referencial |
| Manejo de errores | Generó try/catch en cada controlador | Adoptado y complementado con error handler centralizado |
