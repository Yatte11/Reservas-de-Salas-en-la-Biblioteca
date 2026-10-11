# Implementation Plan — Administración de Salas (`feature/admin-salas`)

> **Generado por el agente de planificación.** El agente de codificación debe ejecutar
> cada ítem en el orden indicado. Cada ítem deja la base de código compilable y sus
> pruebas en verde antes de avanzar al siguiente.

---

## Estado real de los archivos inspeccionados

| Archivo | Estado |
|---|---|
| `src/controllers/salaController.js` | ✅ Existe. Tiene los 6 handlers. **Déficit:** `crearSala` no detecta nombre duplicado antes del INSERT (confía en el UNIQUE de SQLite y el `errorHandler` genérico). `actualizarSala` tampoco valida duplicado antes del UPDATE ni verifica que la sala esté activa al devolverla post-update (usa `buscarPorId` que filtra `activa = 1`, pero no diferencia "no existe" de "inactiva"). |
| `src/models/salaModel.js` | ✅ Existe. Tiene `obtenerTodas`, `buscarPorId`, `crear`, `actualizar`, `eliminar`, `obtenerDisponibles`. **Déficit:** falta `buscarPorNombre(nombre, excluirId)` para validación de duplicados. `eliminar` hace soft-delete con `activa = 0` pero **no tiene guardia de ya-inactivo** (cualquier UPDATE con `WHERE id = ?` pasará sin error, y `changes` sería 1 si la sala existe —activa o no—). |
| `src/routes/salaRoutes.js` | ✅ Existe. El PUT usa `validarCrearSala` (correcto para validar campos). **Déficit:** no tiene un validador de actualización separado para el PUT, por lo que usa exactamente el mismo array que el POST — esto es funcional pero impide ajustes futuros (p. ej. descripción opcional en POST ya es opcional, OK). La ruta está protegida con `verificarToken` + `verificarAdmin` para POST, PUT y DELETE. ✅ |
| `src/middlewares/validators.js` | ✅ Existe. Tiene `validarCrearSala` con todas las reglas (nombre, capacidad 1-200, ubicación, descripción opcional). **Déficit:** no existe `validarActualizarSala`; el PUT reutiliza `validarCrearSala`. Se necesita un array separado por contrato (permite evolución independiente sin romper el contrato actual). |
| `src/middlewares/authMiddleware.js` | ✅ Completo. `verificarToken` rechaza sin header → 401; `verificarAdmin` verifica `req.usuario.rol === 'admin'` → 403. Correcto. |
| `src/middlewares/errorHandler.js` | ✅ Completo. Maneja `JsonWebTokenError` → 401, `TokenExpiredError` → 401, `UNIQUE constraint failed` → 409, otros → status del error o 500. |
| `src/utils/respuesta.js` | ✅ Completo. Exporta `exito(res, datos, mensaje, status=200)` y `error(res, mensaje, status=400, errores=null)`. |
| `src/config/database.js` | ✅ Completo. Exporta `consultar`, `consultarUno`, `ejecutar`, `cerrarDB`, `inicializarDB`. Patrón singleton; acepta `process.env.DB_PATH` (`:memory:` para tests). |
| `src/app.js` | ✅ Completo. Monta `/api/v1/salas` → `salaRoutes`. No requiere cambios. |
| `database/schema.sql` | ✅ Tabla `salas`: `nombre UNIQUE`, `capacidad BETWEEN 1 AND 200`, `ubicacion <= 200`, `descripcion <= 500`, `activa DEFAULT 1`. Confirma restricciones. |
| `package.json` | ✅ Jest 29, Supertest 6, `express-validator` 7. Scripts: `npm test`, `npm run test:unit`, `npm run test:coverage`, `npm run lint`. |
| `README.md` | ⚠️ La tabla de ramas lista al Integrante 5 como `feature/despliegue-ci-cd`. **Debe cambiarse a `feature/admin-salas`**. |
| `tests/unit/` | ✅ 4 archivos existentes (crearReserva, cancelarReserva, listarReservas, reservaModel). **No existe `adminSalas.test.js`**. |
| `CONTRIBUTING.md` | ✅ Define GitHub Flow, Conventional Commits, convenciones de código, umbral de cobertura ≥ 70%. |

---

## Rama a usar

**`feature/admin-salas`** — no existe en local ni en remoto (solo existen `main`, `feature/cancelar-reserva`, `feature/crear-reserva`).  
El primer ítem del plan la crea.

---

## Orden de ejecución

Los ítems están ordenados por dependencia estricta:

```
1. Crear rama
2. salaModel.js → agregar buscarPorNombre
3. validators.js → agregar validarActualizarSala
4. salaController.js → añadir guards de duplicado y sala inactiva
5. salaRoutes.js → usar validarActualizarSala en PUT
6. README.md → corregir rama Integrante 5
7. tests/unit/adminSalas.test.js → crear archivo de pruebas
8. Verificar lint y suite completa
```

---

## Plan de implementación

- [ ] 1. **Crear la rama `feature/admin-salas` desde `main` actualizado**

  Hacer checkout de `main`, actualizar con `git pull origin main` y crear la nueva rama.
  No se toca ningún archivo de código todavía.

  Comandos:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/admin-salas
  ```

  Archivos: solo `.git/` (estado del repositorio).

  Verificar: `git branch` muestra `* feature/admin-salas`.

---

- [ ] 2. **Agregar `buscarPorNombre(nombre, excluirId)` a `salaModel.js`**

  Añadir la función al final del módulo, antes del `module.exports`.
  La función hace una consulta `SELECT id FROM salas WHERE nombre = ? AND (? IS NULL OR id != ?)`.
  El parámetro `excluirId` es opcional (`null` por defecto): si se pasa, excluye esa sala
  del resultado, lo que permite que una sala conserve su propio nombre en PUT.
  Usar `consultarUno` (devuelve la primera fila o `null`).
  Exportar la función en `module.exports`.

  Decisión de diseño: query parametrizada con `? IS NULL OR id != ?` en lugar de construir
  SQL dinámico, porque mantiene una sola ruta de código segura y evita inyección.

  Archivo: `src/models/salaModel.js`

  Verificar: `npm run test:unit` — los tests existentes de modelos de reserva siguen en verde
  (este cambio solo agrega, no modifica nada existente).

---

- [ ] 3. **Agregar `validarActualizarSala` a `validators.js`**

  Copiar `validarCrearSala` como base y crear un array separado `validarActualizarSala`
  con exactamente las mismas reglas (nombre, capacidad, ubicacion, descripcion).
  Rationale: el PUT tiene contrato idéntico al POST hoy, pero necesita su propio array
  para poder evolucionar independientemente sin romper el POST. No se cambia
  `validarCrearSala` ni ningún otro validador.
  Agregar `validarActualizarSala` al objeto de `module.exports`.

  Archivo: `src/middlewares/validators.js`

  Verificar: `npm run test:unit` — todos los tests existentes en verde.

---

- [ ] 4. **Corregir `salaController.js`: detección proactiva de duplicados y sala inactiva**

  ### 4a — `crearSala`
  Antes del `await SalaModel.crear(...)`, llamar a `SalaModel.buscarPorNombre(nombre, null)`.
  Si devuelve una fila, responder con `error(res, 'Ya existe una sala con ese nombre', 409)`.
  Esto da un mensaje específico en lugar del genérico del `errorHandler`.

  ### 4b — `actualizarSala`
  Antes de `await SalaModel.actualizar(...)`, llamar a `SalaModel.buscarPorNombre(nombre, id)`.
  Si devuelve una fila, responder con `error(res, 'Ya existe otra sala con ese nombre', 409)`.

  ### 4c — `eliminarSala`
  La lógica actual ya busca `buscarPorId` (que filtra `activa = 1`) y devuelve 404 si no
  existe. Pero si la sala existe pero ya está inactiva (físicamente en BD con `activa = 0`),
  `buscarPorId` devuelve `null` y también responde 404. Esto es correcto para el comportamiento
  de desactivación lógica, pero el mensaje es genérico.  
  Añadir una segunda consulta `buscarPorIdSinFiltro(id)` que busque sin restricción `activa`:
  si existe pero `activa = 0`, responder `error(res, 'La sala ya está desactivada', 409)`;
  si no existe en absoluto, responder 404 como ahora.  
  Esto requiere agregar `buscarPorIdSinFiltro(id)` al modelo (ver ítem 4d).

  ### 4d — Agregar `buscarPorIdSinFiltro(id)` en `salaModel.js`
  SELECT sin `AND activa = 1`. Exportar también.

  Archivos:
  - `src/controllers/salaController.js`
  - `src/models/salaModel.js` (agregar `buscarPorIdSinFiltro`)

  Verificar: `npm run test:unit` — todos los tests existentes en verde.

---

- [ ] 5. **Actualizar `salaRoutes.js`: usar `validarActualizarSala` en el PUT**

  Importar `validarActualizarSala` desde `validators.js`.
  Sustituir `validarCrearSala` por `validarActualizarSala` en la ruta PUT.
  El resto de la ruta (middlewares de auth, `validarIdParam`, controlador) queda igual.

  Archivo: `src/routes/salaRoutes.js`

  Verificar: `npm run test:unit` — todos los tests existentes en verde.

---

- [ ] 6. **Corregir `README.md`: cambiar rama del Integrante 5**

  En la tabla "Ramas del equipo", cambiar la celda de Integrante 5 de
  `feature/despliegue-ci-cd` a `feature/admin-salas`.

  Archivo: `README.md`

  Verificar: revisión visual de la tabla en el archivo.

---

- [ ] 7. **Crear `tests/unit/adminSalas.test.js`**

  Archivo nuevo que cubre todos los casos requeridos.
  Seguir exactamente el patrón de `cancelarReserva.test.js` para tests de controlador
  (mock del modelo con `jest.mock`, helpers `buildReq`/`buildRes`/`buildNext`,
  grupos con `describe`/`it`, `beforeEach(() => jest.clearAllMocks())`).
  Seguir el patrón de `reservaModel.test.js` para el test del modelo
  (`jest.mock('../../src/config/database')`, capturar `consultar`/`consultarUno`/`ejecutar`).

  ### Cabecera del archivo
  ```js
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  process.env.JWT_SECRET = 'secreto_test';
  ```
  Luego dos secciones separadas: una con `jest.mock` para tests de controlador,
  y una suite de integración ligera con DB en memoria para el modelo.

  ### Estructura de grupos (describe/it)

  #### Grupo A — `SalaModel.buscarPorNombre` (mock de database.js)
  - `jest.mock('../../src/config/database')`
  - caso 1: busca por nombre exacto, SQL contiene `WHERE nombre = ?`
  - caso 2: con `excluirId`, SQL contiene `AND ... id != ?`
  - caso 3: sin `excluirId` (`null`), SQL no concatena ningún id literal
  - caso 4: el nombre no aparece concatenado en el SQL

  #### Grupo B — `crearSala` (mock de SalaModel)
  - `jest.mock('../../src/models/salaModel')`
  - `jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }))`
  - caso 1: creación exitosa → SalaModel.crear llamado, responde 201
  - caso 2: nombre duplicado → SalaModel.buscarPorNombre devuelve fila → responde 409 sin llamar SalaModel.crear
  - caso 3: error de BD → next(err) llamado
  - Autorización: sin token → 401 (probar con Supertest sobre app completa o simular req.usuario vacío)

  #### Grupo C — `actualizarSala` (mock de SalaModel)
  - caso 1: actualización exitosa → responde 200 con sala actualizada
  - caso 2: sala no encontrada (buscarPorId devuelve null) → 404
  - caso 3: nombre duplicado en otra sala → buscarPorNombre devuelve fila → 409
  - caso 4: nombre de la propia sala → buscarPorNombre devuelve null (excluirId funciona) → 200
  - caso 5: error de BD → next(err) llamado

  #### Grupo D — `eliminarSala` (mock de SalaModel)
  - caso 1: desactivación exitosa → responde 200
  - caso 2: sala inexistente (buscarPorId y buscarPorIdSinFiltro devuelven null) → 404
  - caso 3: sala ya desactivada (buscarPorId null, buscarPorIdSinFiltro devuelve `{activa: 0}`) → 409 con mensaje 'La sala ya está desactivada'
  - caso 4: error de BD → next(err) llamado

  #### Grupo E — Autorización (mock de SalaModel + Supertest sobre `app`)
  Usar Supertest para probar los endpoints a nivel HTTP, con la BD en memoria.
  Importar `app` desde `../../src/app` y usar `inicializarDB` + `cerrarDB` en
  `beforeAll`/`afterAll` (igual que `crearReserva.test.js`).
  Crear un token JWT de prueba con `jsonwebtoken.sign`.
  - caso 1: POST `/api/v1/salas` sin token → 401
  - caso 2: POST `/api/v1/salas` con token de usuario (rol='usuario') → 403
  - caso 3: POST `/api/v1/salas` con token admin válido y datos correctos → 201
  - caso 4: PUT `/api/v1/salas/:id` sin token → 401
  - caso 5: DELETE `/api/v1/salas/:id` sin token → 401

  #### Grupo F — Integración de validaciones (Supertest + BD en memoria)
  En este grupo usar la BD `:memory:` real (sin mock) vía `inicializarDB`.
  - caso 1: POST con nombre vacío → 422
  - caso 2: POST con capacidad 0 → 422
  - caso 3: POST con capacidad 201 → 422
  - caso 4: POST con capacidad no entera ('abc') → 422
  - caso 5: POST con ubicación vacía → 422
  - caso 6: POST con descripción de 501 caracteres → 422
  - caso 7: POST exitoso → 201 con datos de sala
  - caso 8: POST con nombre duplicado → 409
  - caso 9: PUT con sala inexistente → 404
  - caso 10: DELETE correcto → 200; sala no aparece en GET `/api/v1/salas`
  - caso 11: DELETE de sala ya desactivada → 409
  - caso 12: DELETE de sala inexistente → 404
  - caso 13: GET `/api/v1/salas/disponibles` con sala desactivada → sala no aparece

  Archivos: `tests/unit/adminSalas.test.js` (archivo nuevo)

  Verificar: `npm run test:unit` — todos los tests en verde, incluyendo los nuevos.

---

- [ ] 8. **Verificación final y commit**

  Ejecutar en orden:
  ```bash
  npm run lint
  npm run test:unit
  npm test
  ```
  Los tres deben terminar sin errores.

  Luego hacer commit con mensaje convencional:
  ```
  feat(salas): implementar administración de salas con validaciones y pruebas

  - Agrega buscarPorNombre y buscarPorIdSinFiltro en salaModel.js
  - Detecta duplicados de nombre en crearSala y actualizarSala
  - Diferencia sala inexistente de sala ya inactiva en eliminarSala
  - Agrega validarActualizarSala independiente en validators.js
  - Usa validarActualizarSala en la ruta PUT de salas
  - Corrige rama del Integrante 5 en README.md
  - Agrega suite completa de tests en tests/unit/adminSalas.test.js

  Generado con apoyo de Kiro (IA), revisado manualmente.
  ```

  Comando: `git push -u origin feature/admin-salas`

  **No hacer merge a `main` ni crear el PR automáticamente.**

  Verificar: `git log --oneline -3` muestra el commit; CI (si está disponible) queda en verde.

---

## Patrón de los tests existentes para replicar en `adminSalas.test.js`

El patrón del proyecto tiene **dos estilos** según lo que se testea:

### Estilo 1 — Test de controlador con mock del modelo (`cancelarReserva.test.js`, `listarReservas.test.js`)

```js
// 1. Mockear dependencias ANTES de cualquier require
jest.mock('../../src/models/salaModel');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

// 2. Importar el controlador DESPUÉS del mock
const SalaModel = require('../../src/models/salaModel');
const { crearSala } = require('../../src/controllers/salaController');

// 3. Helpers estándar del proyecto
const buildReq = (usuario = { id: 1, rol: 'admin' }, body = {}, params = {}) =>
  ({ usuario, body, params });

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const buildNext = () => jest.fn();

// 4. Grupos describe/it con beforeEach(() => jest.clearAllMocks())
describe('crearSala', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('caso N — descripción → expectativas', async () => {
    SalaModel.buscarPorNombre.mockResolvedValue(null);
    SalaModel.crear.mockResolvedValue({ lastID: 5 });
    SalaModel.buscarPorId.mockResolvedValue({ id: 5, nombre: 'Sala X', ... });

    const req  = buildReq({ id: 1, rol: 'admin' }, { nombre: 'Sala X', capacidad: 10, ubicacion: 'P1' });
    const res  = buildRes();
    const next = buildNext();

    await crearSala(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, mensaje: 'Sala creada correctamente' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Estilo 2 — Test de modelo con mock de `database.js` (`reservaModel.test.js`)

```js
jest.mock('../../src/config/database');

const { consultarUno } = require('../../src/config/database');
const { buscarPorNombre } = require('../../src/models/salaModel');

describe('SalaModel.buscarPorNombre', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('caso 1 — SQL usa parámetro para nombre, no concatenación', async () => {
    consultarUno.mockResolvedValue(null);

    await buscarPorNombre('Sala A', null);

    const [sql, params] = consultarUno.mock.calls[0];
    expect(sql).toMatch(/WHERE nombre = \?/);
    expect(params[0]).toBe('Sala A');
    expect(sql).not.toContain('Sala A'); // no concatenado
  });
});
```

### Estilo 3 — Test de integración HTTP con Supertest + BD en memoria (`crearReserva.test.js`)

```js
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto_test';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../../src/app');
const db      = require('../../src/config/database');

beforeAll(async () => { await db.inicializarDB(); });
afterAll(async ()  => { await db.cerrarDB(); });

const tokenAdmin = jwt.sign(
  { id: 1, rol: 'admin' },
  process.env.JWT_SECRET
);

it('POST /api/v1/salas sin token → 401', async () => {
  const res = await request(app)
    .post('/api/v1/salas')
    .send({ nombre: 'X', capacidad: 5, ubicacion: 'P1' });

  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});

it('POST /api/v1/salas con admin válido → 201', async () => {
  const res = await request(app)
    .post('/api/v1/salas')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'Sala Nueva', capacidad: 10, ubicacion: 'Planta 1' });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.datos).toMatchObject({ nombre: 'Sala Nueva' });
});
```

---

## Resumen de cambios por archivo

| Archivo | Tipo de cambio | Detalle |
|---|---|---|
| `src/models/salaModel.js` | Adición | `buscarPorNombre(nombre, excluirId)`, `buscarPorIdSinFiltro(id)` |
| `src/middlewares/validators.js` | Adición | `validarActualizarSala` (array idéntico a `validarCrearSala` inicialmente) |
| `src/controllers/salaController.js` | Modificación | Guard de duplicado en `crearSala` y `actualizarSala`; guard de ya-inactivo en `eliminarSala` |
| `src/routes/salaRoutes.js` | Modificación | Importar y usar `validarActualizarSala` en el PUT |
| `README.md` | Corrección | Tabla de ramas: Integrante 5 → `feature/admin-salas` |
| `tests/unit/adminSalas.test.js` | Creación | Suite completa (Grupos A–F, 25+ casos) |
