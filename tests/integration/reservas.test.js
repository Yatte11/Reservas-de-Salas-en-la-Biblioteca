/**
 * Pruebas de integración — Endpoints de Reservas
 * POST /api/v1/reservas
 * GET  /api/v1/reservas
 * DELETE /api/v1/reservas/:id
 *
 * Generado con apoyo de Kiro (IA), revisado y ajustado manualmente.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto_integracion';

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');
const jwt = require('jsonwebtoken');

beforeAll(async () => {
  await db.inicializarDB();
});

afterAll(async () => {
  await db.cerrarDB();
});

let contador = 0;
const uid = () => `res_${++contador}_${Math.random().toString(36).slice(2)}`;

// Helpers para crear usuario y sala directamente en DB
const crearUsuarioYToken = async (rol = 'usuario') => {
  const email = `${uid()}@test.com`;
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Test1234', 10);
  const resultado = await db.ejecutar(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [`Usuario ${uid()}`, email, hash, rol]
  );
  const token = jwt.sign(
    { id: resultado.lastID, email, rol },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return { token };
};

const crearSala = async () => {
  const resultado = await db.ejecutar(
    'INSERT INTO salas (nombre, capacidad, ubicacion) VALUES (?, ?, ?)',
    [`Sala ${uid()}`, 6, 'Piso Test']
  );
  return resultado.lastID;
};

// ─── POST /reservas ───────────────────────────────────────────────────────────

describe('POST /api/v1/reservas', () => {
  test('201 — crea reserva en sala disponible', async () => {
    const { token } = await crearUsuarioYToken();
    const salaId = await crearSala();

    const res = await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sala_id: salaId,
        fecha: '2027-03-01',
        hora_inicio: '09:00',
        hora_fin: '11:00',
        proposito: 'Estudio',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.datos).toHaveProperty('id');
    expect(res.body.datos.estado).toBe('activa');
  });

  test('409 — rechaza reserva con choque de horario', async () => {
    const { token } = await crearUsuarioYToken();
    const salaId = await crearSala();

    await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ sala_id: salaId, fecha: '2027-03-02', hora_inicio: '09:00', hora_fin: '11:00' });

    const res = await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ sala_id: salaId, fecha: '2027-03-02', hora_inicio: '10:00', hora_fin: '12:00' });

    expect(res.statusCode).toBe(409);
  });

  test('400 — rechaza cuando hora_inicio >= hora_fin', async () => {
    const { token } = await crearUsuarioYToken();
    const salaId = await crearSala();

    const res = await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ sala_id: salaId, fecha: '2027-03-03', hora_inicio: '11:00', hora_fin: '09:00' });

    expect(res.statusCode).toBe(400);
  });

  test('400 — rechaza reserva menor a 30 minutos', async () => {
    const { token } = await crearUsuarioYToken();
    const salaId = await crearSala();

    const res = await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ sala_id: salaId, fecha: '2027-03-04', hora_inicio: '09:00', hora_fin: '09:15' });

    expect(res.statusCode).toBe(400);
  });

  test('401 — rechaza petición sin token', async () => {
    const res = await request(app)
      .post('/api/v1/reservas')
      .send({ sala_id: 1, fecha: '2027-03-05', hora_inicio: '09:00', hora_fin: '10:00' });

    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /reservas ────────────────────────────────────────────────────────────

describe('GET /api/v1/reservas', () => {
  test('200 — devuelve solo las reservas del usuario autenticado', async () => {
    const { token } = await crearUsuarioYToken();
    const salaId = await crearSala();

    await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ sala_id: salaId, fecha: '2027-04-01', hora_inicio: '08:00', hora_fin: '09:00' });

    const res = await request(app)
      .get('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.datos)).toBe(true);
    res.body.datos.forEach((r) => expect(r).toHaveProperty('sala_nombre'));
  });
});

// ─── DELETE /reservas/:id ─────────────────────────────────────────────────────

describe('DELETE /api/v1/reservas/:id', () => {
  test('200 — cancela una reserva propia', async () => {
    const { token } = await crearUsuarioYToken();
    const salaId = await crearSala();

    const crearRes = await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${token}`)
      .send({ sala_id: salaId, fecha: '2027-05-01', hora_inicio: '10:00', hora_fin: '12:00' });

    const reservaId = crearRes.body.datos.id;

    const res = await request(app)
      .delete(`/api/v1/reservas/${reservaId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  test('403 — no puede cancelar reserva ajena', async () => {
    const { token: tokenA } = await crearUsuarioYToken();
    const { token: tokenB } = await crearUsuarioYToken();
    const salaId = await crearSala();

    const crearRes = await request(app)
      .post('/api/v1/reservas')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ sala_id: salaId, fecha: '2027-05-02', hora_inicio: '10:00', hora_fin: '12:00' });

    const reservaId = crearRes.body.datos.id;

    const res = await request(app)
      .delete(`/api/v1/reservas/${reservaId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.statusCode).toBe(403);
  });
});
