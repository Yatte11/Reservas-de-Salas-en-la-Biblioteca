# Reporte de Pruebas y Seguridad
## Sistema de Reservas de Salas de Biblioteca

**Versión:** 1.0  
**Fecha:** Octubre 2026  
**Equipo:** Equipo 5 — Ingeniería de Software Moderna  

---

## 1. Pruebas Unitarias

### Herramienta utilizada
Jest 29.x con `--coverage` para reporte de cobertura.

### Archivos de prueba

| Archivo | Funcionalidad | Pruebas |
|---------|--------------|---------|
| `tests/unit/login.test.js` | Registro e inicio de sesión | 9 |
| `tests/unit/listarSalas.test.js` | Listado y disponibilidad de salas | 10 |
| `tests/unit/crearReserva.test.js` | Crear reserva y choque de horarios | 11 |
| `tests/unit/cancelarReserva.test.js` | Cancelación de reservas | — |
| `tests/unit/adminSalas.test.js` | Administración de salas | — |
| `tests/unit/reservaModel.test.js` | Modelo de reservas | — |

### Resultados

```
Test Suites: 6 passed, 6 total
Tests:       93 passed, 93 total
Snapshots:   0 total
Time:        ~1.0s
```

### Cobertura de código

| Archivo | Statements | Branches | Functions | Lines |
|---------|-----------|----------|-----------|-------|
| `authController.js` | 85% | 80% | 100% | 85% |
| `reservaController.js` | 90% | 85% | 100% | 90% |
| `salaController.js` | 88% | 82% | 100% | 88% |
| `reservaModel.js` | 95% | 90% | 100% | 95% |
| `salaModel.js` | 92% | 88% | 100% | 92% |
| `usuarioModel.js` | 80% | 75% | 100% | 80% |

### Casos borde identificados que la IA no contempló

1. **Tokens expirados:** La IA no generó prueba para tokens JWT ya vencidos — agregado manualmente en `login.test.js`
2. **Reserva cancelada libera el horario:** La IA no verificaba que una sala vuelva a aparecer como disponible tras cancelar su reserva — agregado en `listarSalas.test.js`
3. **Emails duplicados con ejecución rápida:** La IA usaba `Date.now()` para emails únicos, causando colisiones — corregido manualmente con contador + random
4. **Duración mínima de 30 minutos:** La IA no contempló este caso borde — agregado en `crearReserva.test.js`
5. **Cancelar reserva ajena:** La IA generó el happy path pero no el caso de autorización — agregado en `reservas.test.js`

---

## 2. Pruebas de Integración

### Herramienta utilizada
Supertest + Jest con base de datos SQLite en memoria (`:memory:`).

### Escenarios probados

| Archivo | Endpoint | Escenarios |
|---------|---------|-----------|
| `tests/integration/auth.test.js` | `POST /auth/registro` y `POST /auth/login` | 7 |
| `tests/integration/reservas.test.js` | `POST /reservas`, `GET /reservas`, `DELETE /reservas/:id` | 8 |

### Resultados

```
Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
```

### Comparativa IA vs. Revisor humano

| Observación | Detectada por IA | Detectada por humano |
|-------------|-----------------|---------------------|
| Estructura del test (describe/test/expect) | ✅ | ✅ |
| Caso de email duplicado (409) | ✅ | ✅ |
| Token JWT no presente en respuesta de registro | ✅ | ✅ |
| Caso de token expirado | ❌ | ✅ |
| Cancelar reserva ajena (403) | ❌ | ✅ |
| Colisión de emails en tests paralelos | ❌ | ✅ |
| Validación de duración mínima | ❌ | ✅ |

**Conclusión:** La IA detectó el 57% de los casos relevantes. Los casos relacionados con seguridad y autorización fueron detectados principalmente por revisión humana.

---

## 3. Análisis de Seguridad

### Herramienta utilizada
Revisión manual basada en OWASP Top 10 + análisis estático con CodeQL (configurado en `.github/workflows`).

### Vulnerabilidades identificadas y corregidas

| # | Vulnerabilidad | Categoría OWASP | Estado |
|---|---------------|----------------|--------|
| V-01 | Contraseñas almacenadas en texto plano (sugerido inicialmente por IA) | A02: Cryptographic Failures | ✅ Corregido — bcrypt con salt=12 |
| V-02 | Sin rate limiting en endpoints de autenticación | A07: Identification and Authentication Failures | ✅ Corregido — express-rate-limit 100 req/15min |
| V-03 | Headers HTTP sin protección (sin helmet) | A05: Security Misconfiguration | ✅ Corregido — helmet() en app.js |
| V-04 | Sin validación de entradas del usuario | A03: Injection | ✅ Corregido — express-validator en todos los endpoints |
| V-05 | Queries SQL construidas con concatenación (sugerido por IA en primer borrador) | A03: Injection | ✅ Corregido — queries parametrizadas con `?` |
| V-06 | Mensaje de error revela si el email existe o no | A07: Identification and Authentication Failures | ✅ Corregido — mensaje genérico "Credenciales incorrectas" |
| V-07 | JWT sin expiración definida (sugerido por IA sin `expiresIn`) | A07: Identification and Authentication Failures | ✅ Corregido — expiración de 24h configurable |
| V-08 | CORS abierto a todos los orígenes en producción | A05: Security Misconfiguration | ⚠️ Pendiente — configurar CORS_ORIGIN en producción |

### Observaciones de CodeQL

CodeQL detectó en el pipeline CI/CD:
- Sin variables de entorno expuestas en código
- Sin secretos hardcodeados en el repositorio
- Uso correcto de parámetros preparados en SQL

---

## 4. Despliegue

### Plataforma
Railway (https://railway.app) — servicio gratuito con soporte para aplicaciones Node.js y Docker.

### Archivos de configuración generados con IA

| Archivo | Generado por IA | Correcciones aplicadas |
|---------|----------------|----------------------|
| `Dockerfile` | ✅ Estructura base | Usuario sin root, multi-stage build, healthcheck |
| `docker-compose.yml` | ✅ Estructura base | Perfil dev separado, volumen persistente para SQLite |
| `.github/workflows/ci.yml` | ✅ Estructura base | Jobs encadenados (lint → test → docker → deploy) |

### Evaluación del Dockerfile generado por IA

**Problemas encontrados en la propuesta original:**
1. Ejecutaba como usuario `root` — riesgo de seguridad
2. No usaba multi-stage build — imagen final de 800MB+
3. No tenía healthcheck configurado
4. Copiaba `docs/` innecesariamente al contenedor

**Correcciones aplicadas:**
1. Se creó usuario `appuser` sin privilegios
2. Se implementó multi-stage build (deps + production) — imagen final ~180MB
3. Se agregó `HEALTHCHECK` cada 30 segundos
4. Se eliminó la copia de `docs/` del Dockerfile final

### URL de despliegue
**https://reservas-de-salas-en-la-biblioteca-production.up.railway.app**

- API raíz: https://reservas-de-salas-en-la-biblioteca-production.up.railway.app/
- Documentación Swagger: https://reservas-de-salas-en-la-biblioteca-production.up.railway.app/api-docs
- Estado: ✅ Online
