/**
 * Pruebas unitarias — administración de salas
 * Cubre creación, actualización y desactivación de salas,
 * así como las reglas de autorización para cada endpoint.
 *
 * Generado con apoyo de Kiro (IA), revisado y ajustado manualmente.
 */

'use strict';

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto_test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/database');
const SalaModel = require('../../src/models/salaModel');

// ─── Tokens de prueba ─────────────────────────────────────────────────────────

const tokenAdmin = jwt.sign(
  { id: 1, rol: 'admin', email: 'admin@test.com' },
  'secreto_test',
  { expiresIn: '1h' }
);

const tokenUsuario = jwt.sign(
  { id: 2, rol: 'usuario', email: 'user@test.com' },
  'secreto_test',
  { expiresIn: '1h' }
);

// Datos válidos reutilizables en las pruebas POST
const salaValida = {
  nombre: 'Sala A',
  capacidad: 20,
  ubicacion: 'Piso 1',
  descripcion: 'Sala de estudio',
};

// ─── Setup global ────────────────────────────────────────────────────────────

beforeAll(async () => {
  await db.inicializarDB();
});

afterAll(async () => {
  await db.cerrarDB();
});

// ─── Suite: SalaModel ────────────────────────────────────────────────────────

describe('SalaModel', () => {
  test('crear sala devuelve lastID > 0', async () => {
    const resultado = await SalaModel.crear({
      nombre: 'Sala Modelo Test',
      capacidad: 10,
      ubicacion: 'Piso 2',
      descripcion: 'Descripción test',
    });
    expect(resultado.lastID).toBeGreaterThan(0);
  });

  test('sala creada tiene activa=1 por defecto', async () => {
    const resultado = await SalaModel.crear({
      nombre: 'Sala Activa Test',
      capacidad: 15,
      ubicacion: 'Piso 3',
    });
    const sala = await SalaModel.buscarPorId(resultado.lastID);
    expect(sala.activa).toBe(1);
  });

  test('sala creada guarda los datos correctamente', async () => {
    const resultado = await SalaModel.crear({
      nombre: 'Sala Datos Test',
      capacidad: 30,
      ubicacion: 'Piso 4',
      descripcion: 'Desc completa',
    });
    const sala = await SalaModel.buscarPorId(resultado.lastID);
    expect(sala.nombre).toBe('Sala Datos Test');
    expect(sala.capacidad).toBe(30);
    expect(sala.ubicacion).toBe('Piso 4');
    expect(sala.descripcion).toBe('Desc completa');
  });

  test('buscarPorNombre encuentra sala activa existente', async () => {
    await SalaModel.crear({
      nombre: 'Sala BuscarNombre',
      capacidad: 5,
      ubicacion: 'Piso 5',
    });
    const sala = await SalaModel.buscarPorNombre('Sala BuscarNombre');
    expect(sala).not.toBeNull();
    expect(sala.nombre).toBe('Sala BuscarNombre');
  });

  test('buscarPorNombre con excluirId no devuelve la propia sala', async () => {
    const res = await SalaModel.crear({
      nombre: 'Sala ExcluirId',
      capacidad: 5,
      ubicacion: 'Piso 6',
    });
    const sala = await SalaModel.buscarPorNombre('Sala ExcluirId', res.lastID);
    expect(sala).toBeNull();
  });
});

// ─── Suite: POST /api/v1/salas ───────────────────────────────────────────────

describe('POST /api/v1/salas', () => {
  test('sin token → 401', async () => {
    const res = await request(app).post('/api/v1/salas').send(salaValida);
    expect(res.status).toBe(401);
  });

  test('token de usuario (no admin) → 403', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send(salaValida);
    expect(res.status).toBe(403);
  });

  test('admin, nombre vacío → 422', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...salaValida, nombre: '' });
    expect(res.status).toBe(422);
  });

  test('admin, capacidad = 0 → 422', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...salaValida, capacidad: 0 });
    expect(res.status).toBe(422);
  });

  test('admin, capacidad = 201 → 422', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...salaValida, capacidad: 201 });
    expect(res.status).toBe(422);
  });

  test('admin, capacidad no entera → 422', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...salaValida, capacidad: 'abc' });
    expect(res.status).toBe(422);
  });

  test('admin, ubicacion vacía → 422', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...salaValida, ubicacion: '' });
    expect(res.status).toBe(422);
  });

  test('admin, descripcion > 500 chars → 422', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ...salaValida, descripcion: 'x'.repeat(501) });
    expect(res.status).toBe(422);
  });

  test('admin, datos válidos → 201 con sala creada', async () => {
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Sala Endpoint Test',
        capacidad: 25,
        ubicacion: 'Piso 1',
        descripcion: 'OK',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('datos');
    expect(res.body.datos).toHaveProperty('nombre', 'Sala Endpoint Test');
  });

  test('admin, nombre duplicado → 409', async () => {
    // Crear la sala por primera vez
    await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Sala Duplicada', capacidad: 10, ubicacion: 'Piso 1', descripcion: '' });

    // Intentar crearla de nuevo con el mismo nombre
    const res = await request(app)
      .post('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Sala Duplicada', capacidad: 10, ubicacion: 'Piso 1', descripcion: '' });
    expect(res.status).toBe(409);
  });
});

// ─── Suite: PUT /api/v1/salas/:id ────────────────────────────────────────────

describe('PUT /api/v1/salas/:id', () => {
  let salaId;
  let salaId2;

  beforeEach(async () => {
    const r1 = await SalaModel.crear({
      nombre: `Sala PUT Base ${Date.now()}`,
      capacidad: 10,
      ubicacion: 'Piso 1',
      descripcion: 'Base',
    });
    salaId = r1.lastID;

    const r2 = await SalaModel.crear({
      nombre: `Sala PUT Otra ${Date.now() + 1}`,
      capacidad: 15,
      ubicacion: 'Piso 2',
      descripcion: 'Otra',
    });
    salaId2 = r2.lastID;
  });

  test('sin token → 401', async () => {
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .send({ nombre: 'Nueva', capacidad: 20, ubicacion: 'P1', descripcion: '' });
    expect(res.status).toBe(401);
  });

  test('token de usuario (no admin) → 403', async () => {
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .send({ nombre: 'Nueva', capacidad: 20, ubicacion: 'P1', descripcion: '' });
    expect(res.status).toBe(403);
  });

  test('admin, sala inexistente → 404', async () => {
    const res = await request(app)
      .put('/api/v1/salas/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'X', capacidad: 10, ubicacion: 'P1', descripcion: '' });
    expect(res.status).toBe(404);
  });

  test('admin, nombre vacío → 422', async () => {
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: '', capacidad: 10, ubicacion: 'P1', descripcion: '' });
    expect(res.status).toBe(422);
  });

  test('admin, capacidad inválida → 422', async () => {
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Sala X', capacidad: 300, ubicacion: 'P1', descripcion: '' });
    expect(res.status).toBe(422);
  });

  test('admin, datos válidos → 200 con sala actualizada', async () => {
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Sala Actualizada',
        capacidad: 50,
        ubicacion: 'Piso 3',
        descripcion: 'Updated',
      });
    expect(res.status).toBe(200);
    expect(res.body.datos).toHaveProperty('nombre', 'Sala Actualizada');
  });

  test('admin, nombre que pertenece a otra sala → 409', async () => {
    // Obtener el nombre real de salaId2
    const otraSala = await SalaModel.buscarPorId(salaId2);
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: otraSala.nombre, capacidad: 10, ubicacion: 'P1', descripcion: '' });
    expect(res.status).toBe(409);
  });

  test('admin, conservar nombre de la propia sala → 200', async () => {
    const propioNombre = (await SalaModel.buscarPorId(salaId)).nombre;
    const res = await request(app)
      .put(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: propioNombre, capacidad: 12, ubicacion: 'Piso 1 Actualizado', descripcion: 'Desc' });
    expect(res.status).toBe(200);
  });
});

// ─── Suite: DELETE /api/v1/salas/:id ─────────────────────────────────────────

describe('DELETE /api/v1/salas/:id', () => {
  let salaId;

  beforeEach(async () => {
    const r = await SalaModel.crear({
      nombre: `Sala DELETE ${Date.now()}`,
      capacidad: 10,
      ubicacion: 'Piso 1',
      descripcion: 'Para desactivar',
    });
    salaId = r.lastID;
  });

  test('sin token → 401', async () => {
    const res = await request(app).delete(`/api/v1/salas/${salaId}`);
    expect(res.status).toBe(401);
  });

  test('token de usuario (no admin) → 403', async () => {
    const res = await request(app)
      .delete(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenUsuario}`);
    expect(res.status).toBe(403);
  });

  test('admin, sala inexistente → 404', async () => {
    const res = await request(app)
      .delete('/api/v1/salas/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  test('admin, sala activa → 200 y desaparece del listado', async () => {
    const resDel = await request(app)
      .delete(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(resDel.status).toBe(200);

    // Verificar que no aparece en el listado de salas activas
    const resLista = await request(app)
      .get('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    const ids = (resLista.body.datos || []).map((s) => s.id);
    expect(ids).not.toContain(salaId);
  });

  test('admin, sala ya inactiva → 404', async () => {
    // Desactivar la sala
    await request(app)
      .delete(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    // Intentar desactivarla de nuevo: el controlador busca por buscarPorId que solo devuelve activas
    const res = await request(app)
      .delete(`/api/v1/salas/${salaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });
});

// ─── Suite: GET /api/v1/salas – autorización ─────────────────────────────────

describe('GET /api/v1/salas - autorización', () => {
  test('sin token → 401', async () => {
    const res = await request(app).get('/api/v1/salas');
    expect(res.status).toBe(401);
  });

  test('con token de usuario → 200', async () => {
    const res = await request(app)
      .get('/api/v1/salas')
      .set('Authorization', `Bearer ${tokenUsuario}`);
    expect(res.status).toBe(200);
  });
});
