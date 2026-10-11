/**
 * Pruebas de integración — Endpoints de Autenticación
 * POST /api/v1/auth/registro
 * POST /api/v1/auth/login
 *
 * Generado con apoyo de Kiro (IA), revisado y ajustado manualmente.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto_integracion';

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

beforeAll(async () => {
  await db.inicializarDB();
});

afterAll(async () => {
  await db.cerrarDB();
});

let contador = 0;
const uid = () => `int_${++contador}_${Math.random().toString(36).slice(2)}`;

// ─── POST /auth/registro ──────────────────────────────────────────────────────

describe('POST /api/v1/auth/registro', () => {
  test('201 — registra usuario con datos válidos', async () => {
    const res = await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Ana Test', email: `${uid()}@test.com`, password: 'Segura123' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.datos).toHaveProperty('id');
    expect(res.body.datos).not.toHaveProperty('password_hash');
  });

  test('409 — rechaza email ya registrado', async () => {
    const email = `${uid()}@test.com`;

    await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Usuario A', email, password: 'Segura123' });

    const res = await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Usuario B', email, password: 'Segura123' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('422 — rechaza contraseña sin mayúscula', async () => {
    const res = await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Test', email: `${uid()}@test.com`, password: 'sinmayus1' });

    expect(res.statusCode).toBe(422);
  });

  test('422 — rechaza email con formato inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Test', email: 'no-es-email', password: 'Segura123' });

    expect(res.statusCode).toBe(422);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  const credenciales = { email: `${uid()}@test.com`, password: 'Login1234' };

  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Login User', ...credenciales });
  });

  test('200 — devuelve token JWT con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(credenciales);

    expect(res.statusCode).toBe(200);
    expect(res.body.datos).toHaveProperty('token');
    expect(res.body.datos.token).toMatch(/^eyJ/);
    expect(res.body.datos.usuario).toHaveProperty('rol');
  });

  test('401 — rechaza contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: credenciales.email, password: 'Incorrecta99' });

    expect(res.statusCode).toBe(401);
  });

  test('401 — rechaza email inexistente', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noexiste@test.com', password: 'Login1234' });

    expect(res.statusCode).toBe(401);
  });
});
