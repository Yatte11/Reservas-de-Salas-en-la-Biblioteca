/**
 * Pruebas unitarias — validarActualizarPerfil
 * Middleware: src/middlewares/validators.js
 * Función:    validarActualizarPerfil
 *
 * Verifica que el array de validadores rechaza correctamente
 * entradas inválidas y permite las válidas al continuar la cadena.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto_test';

const { validarActualizarPerfil } = require('../../src/middlewares/validators');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ejecuta el array de middlewares de validarActualizarPerfil sobre un body
 * simulado y devuelve la respuesta capturada o 'next' si no hay errores.
 *
 * @param {object} body  - Cuerpo de la petición simulada
 * @returns {Promise<{ status: number|null, body: object|null, nextCalled: boolean }>}
 */
const ejecutarValidador = (body) =>
  new Promise((resolve) => {
    const req = { body };
    const captured = { status: null, body: null, nextCalled: false };

    const res = {
      status(code) {
        captured.status = code;
        return this;
      },
      json(data) {
        captured.body = data;
        resolve(captured);
        return this;
      },
    };

    const next = () => {
      captured.nextCalled = true;
    };

    // Ejecuta cada middleware en secuencia
    const middlewares = [...validarActualizarPerfil];

    const runNext = (index) => {
      if (index >= middlewares.length) {
        resolve(captured);
        return;
      }
      middlewares[index](req, res, () => runNext(index + 1));
    };

    runNext(0);
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validarActualizarPerfil — casos válidos', () => {
  test('nombre y email válidos pasan la validación sin error 422', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'Ana García',
      email: 'ana@example.com',
    });

    expect(resultado.status).toBeNull();
    expect(resultado.nextCalled).toBe(true);
  });

  test('nombre de exactamente 2 caracteres es aceptado', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'Li',
      email: 'li@example.com',
    });

    expect(resultado.status).toBeNull();
  });

  test('nombre de exactamente 100 caracteres es aceptado', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'A'.repeat(100),
      email: 'test@example.com',
    });

    expect(resultado.status).toBeNull();
  });
});

describe('validarActualizarPerfil — errores en nombre', () => {
  test('nombre vacío devuelve 422 con campo nombre', async () => {
    const resultado = await ejecutarValidador({
      nombre: '',
      email: 'a@b.com',
    });

    expect(resultado.status).toBe(422);
    expect(resultado.body.success).toBe(false);

    const camposError = resultado.body.errores.map((e) => e.campo);
    expect(camposError).toContain('nombre');
  });

  test('nombre de 1 carácter (muy corto) devuelve 422 con campo nombre', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'A',
      email: 'a@b.com',
    });

    expect(resultado.status).toBe(422);

    const camposError = resultado.body.errores.map((e) => e.campo);
    expect(camposError).toContain('nombre');
  });

  test('nombre de 101 caracteres (muy largo) devuelve 422 con campo nombre', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'A'.repeat(101),
      email: 'a@b.com',
    });

    expect(resultado.status).toBe(422);

    const camposError = resultado.body.errores.map((e) => e.campo);
    expect(camposError).toContain('nombre');
  });
});

describe('validarActualizarPerfil — errores en email', () => {
  test('email con formato inválido devuelve 422 con campo email', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'Ana',
      email: 'no-es-email',
    });

    expect(resultado.status).toBe(422);

    const camposError = resultado.body.errores.map((e) => e.campo);
    expect(camposError).toContain('email');
  });

  test('email vacío devuelve 422 con campo email', async () => {
    const resultado = await ejecutarValidador({
      nombre: 'Ana',
      email: '',
    });

    expect(resultado.status).toBe(422);

    const camposError = resultado.body.errores.map((e) => e.campo);
    expect(camposError).toContain('email');
  });
});
