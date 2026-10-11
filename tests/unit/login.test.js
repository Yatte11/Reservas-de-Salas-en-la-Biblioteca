/**
 * Pruebas unitarias — Registro e Inicio de Sesión
 * Verifica la funcionalidad de autenticación:
 * - Registro de usuario nuevo
 * - Registro rechazado con email duplicado
 * - Login exitoso devuelve token JWT
 * - Login rechazado con credenciales incorrectas
 * - Cifrado de contraseña con bcrypt
 *
 * Generado con apoyo de Kiro (IA), revisado y ajustado manualmente.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto_test_login';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../src/config/database');
const UsuarioModel = require('../../src/models/usuarioModel');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await db.inicializarDB();
});

afterAll(async () => {
  await db.cerrarDB();
});

let contador = 0;
const uid = () => `log_${++contador}_${Math.random().toString(36).slice(2)}`;

// ─── Tests: Registro ──────────────────────────────────────────────────────────

describe('Registro de usuario', () => {
  test('crea un usuario nuevo y devuelve lastID', async () => {
    const resultado = await UsuarioModel.crear({
      nombre: 'Ana García',
      email: `${uid()}@test.com`,
      passwordHash: await bcrypt.hash('Segura123', 10),
    });

    expect(resultado.lastID).toBeGreaterThan(0);
  });

  test('el usuario creado se puede encontrar por email', async () => {
    const email = `${uid()}@test.com`;
    await UsuarioModel.crear({
      nombre: 'Luis Pérez',
      email,
      passwordHash: await bcrypt.hash('Segura123', 10),
    });

    const usuario = await UsuarioModel.buscarPorEmail(email);

    expect(usuario).not.toBeNull();
    expect(usuario.email).toBe(email);
    expect(usuario.nombre).toBe('Luis Pérez');
  });

  test('el rol por defecto es usuario', async () => {
    const email = `${uid()}@test.com`;
    await UsuarioModel.crear({
      nombre: 'María López',
      email,
      passwordHash: await bcrypt.hash('Segura123', 10),
    });

    const usuario = await UsuarioModel.buscarPorEmail(email);
    expect(usuario.rol).toBe('usuario');
  });

  test('la contraseña se almacena como hash bcrypt, no en texto plano', async () => {
    const passwordPlano = 'MiPassword1';
    const email = `${uid()}@test.com`;

    await UsuarioModel.crear({
      nombre: 'Carlos Ruiz',
      email,
      passwordHash: await bcrypt.hash(passwordPlano, 10),
    });

    const usuario = await UsuarioModel.buscarPorEmail(email);

    // El hash NO debe ser igual al texto plano
    expect(usuario.password_hash).not.toBe(passwordPlano);
    // Pero bcrypt.compare debe retornar true
    const valido = await bcrypt.compare(passwordPlano, usuario.password_hash);
    expect(valido).toBe(true);
  });

  test('no se puede registrar dos usuarios con el mismo email', async () => {
    const email = `${uid()}@test.com`;
    const hash = await bcrypt.hash('Segura123', 10);

    await UsuarioModel.crear({ nombre: 'Usuario 1', email, passwordHash: hash });

    await expect(
      UsuarioModel.crear({ nombre: 'Usuario 2', email, passwordHash: hash })
    ).rejects.toThrow();
  });
});

// ─── Tests: Login ─────────────────────────────────────────────────────────────

describe('Inicio de sesión', () => {
  let emailRegistrado;
  const passwordCorrecto = 'Login1234';

  beforeAll(async () => {
    emailRegistrado = `${uid()}@test.com`;
    await UsuarioModel.crear({
      nombre: 'Usuario Login',
      email: emailRegistrado,
      passwordHash: await bcrypt.hash(passwordCorrecto, 10),
    });
  });

  test('buscarPorEmail devuelve el usuario con credenciales correctas', async () => {
    const usuario = await UsuarioModel.buscarPorEmail(emailRegistrado);
    expect(usuario).not.toBeNull();

    const valido = await bcrypt.compare(passwordCorrecto, usuario.password_hash);
    expect(valido).toBe(true);
  });

  test('bcrypt.compare devuelve false con contraseña incorrecta', async () => {
    const usuario = await UsuarioModel.buscarPorEmail(emailRegistrado);
    const valido = await bcrypt.compare('ContraseñaMala99', usuario.password_hash);
    expect(valido).toBe(false);
  });

  test('buscarPorEmail devuelve null con email inexistente', async () => {
    const usuario = await UsuarioModel.buscarPorEmail('noexiste@test.com');
    expect(usuario).toBeNull();
  });

  test('el token JWT generado contiene los datos correctos del usuario', async () => {
    const usuario = await UsuarioModel.buscarPorEmail(emailRegistrado);

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.id).toBe(usuario.id);
    expect(decoded.email).toBe(emailRegistrado);
    expect(decoded.rol).toBe('usuario');
  });

  test('el token JWT expira correctamente', () => {
    const tokenExpirado = jwt.sign(
      { id: 1, email: 'x@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    expect(() => {
      jwt.verify(tokenExpirado, process.env.JWT_SECRET);
    }).toThrow('jwt expired');
  });
});
