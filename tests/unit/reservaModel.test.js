/**
 * Pruebas unitarias — obtenerPorUsuario
 * Modelo: src/models/reservaModel.js
 *
 * Estrategia: mockear src/config/database.js para capturar el SQL
 * y los parámetros que el modelo construye, sin tocar la BD real.
 */

jest.mock('../../src/config/database');

const { consultar } = require('../../src/config/database');
const { obtenerPorUsuario } = require('../../src/models/reservaModel');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const reservasMock = [
  {
    id: 1, fecha: '2026-11-10', hora_inicio: '10:00', hora_fin: '12:00',
    proposito: 'Estudio', estado: 'activa', fecha_creacion: '2026-10-01T00:00:00',
    sala_id: 2, sala_nombre: 'Sala B', sala_ubicacion: 'Planta Baja',
  },
  {
    id: 2, fecha: '2026-10-05', hora_inicio: '14:00', hora_fin: '15:00',
    proposito: null, estado: 'cancelada', fecha_creacion: '2026-09-20T00:00:00',
    sala_id: 3, sala_nombre: 'Sala C', sala_ubicacion: 'Primer Piso',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Devuelve el SQL y los params con que fue llamado `consultar` en la última invocación.
 */
const capturarLlamada = () => {
  const [sql, params] = consultar.mock.calls[0];
  return { sql, params };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReservaModel.obtenerPorUsuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consultar.mockResolvedValue(reservasMock);
  });

  // -------------------------------------------------------------------------
  // Caso 1 — sin filtros devuelve todas las reservas del usuario
  // -------------------------------------------------------------------------

  it('caso 1 — sin filtros devuelve el resultado de consultar directamente', async () => {
    const resultado = await obtenerPorUsuario(7);

    expect(resultado).toBe(reservasMock);
    expect(consultar).toHaveBeenCalledTimes(1);
  });

  it('caso 1b — sin filtros el SQL no incluye AND r.estado ni AND r.fecha', async () => {
    await obtenerPorUsuario(7);

    const { sql } = capturarLlamada();
    expect(sql).not.toMatch(/AND r\.estado/);
    expect(sql).not.toMatch(/AND r\.fecha/);
  });

  it('caso 1c — sin filtros params contiene únicamente el usuarioId', async () => {
    await obtenerPorUsuario(7);

    const { params } = capturarLlamada();
    expect(params).toEqual([7]);
  });

  // -------------------------------------------------------------------------
  // Caso 2 — filtro por estado
  // -------------------------------------------------------------------------

  it('caso 2 — filtro estado agrega AND r.estado = ? al SQL', async () => {
    await obtenerPorUsuario(3, { estado: 'activa' });

    const { sql } = capturarLlamada();
    expect(sql).toMatch(/AND r\.estado = \?/);
  });

  it('caso 2b — filtro estado incluye el valor como segundo parámetro SQL', async () => {
    await obtenerPorUsuario(3, { estado: 'activa' });

    const { params } = capturarLlamada();
    expect(params).toEqual([3, 'activa']);
  });

  it('caso 2c — el valor del estado NO aparece concatenado en el SQL', async () => {
    await obtenerPorUsuario(3, { estado: 'activa' });

    const { sql } = capturarLlamada();
    // El valor 'activa' no debe aparecer literalmente en el string SQL
    expect(sql).not.toContain('activa');
  });

  // -------------------------------------------------------------------------
  // Caso 3 — filtro por fecha
  // -------------------------------------------------------------------------

  it('caso 3 — filtro fecha agrega AND r.fecha = ? al SQL', async () => {
    await obtenerPorUsuario(5, { fecha: '2026-11-01' });

    const { sql } = capturarLlamada();
    expect(sql).toMatch(/AND r\.fecha = \?/);
  });

  it('caso 3b — filtro fecha incluye el valor como segundo parámetro SQL', async () => {
    await obtenerPorUsuario(5, { fecha: '2026-11-01' });

    const { params } = capturarLlamada();
    expect(params).toEqual([5, '2026-11-01']);
  });

  it('caso 3c — el valor de la fecha NO aparece concatenado en el SQL', async () => {
    await obtenerPorUsuario(5, { fecha: '2026-11-01' });

    const { sql } = capturarLlamada();
    expect(sql).not.toContain('2026-11-01');
  });

  // -------------------------------------------------------------------------
  // Caso 4 — ambos filtros juntos
  // -------------------------------------------------------------------------

  it('caso 4 — ambos filtros agregan ambas cláusulas AND al SQL', async () => {
    await obtenerPorUsuario(2, { estado: 'cancelada', fecha: '2026-10-15' });

    const { sql } = capturarLlamada();
    expect(sql).toMatch(/AND r\.estado = \?/);
    expect(sql).toMatch(/AND r\.fecha = \?/);
  });

  it('caso 4b — con ambos filtros params tiene exactamente [usuarioId, estado, fecha]', async () => {
    await obtenerPorUsuario(2, { estado: 'cancelada', fecha: '2026-10-15' });

    const { params } = capturarLlamada();
    expect(params).toEqual([2, 'cancelada', '2026-10-15']);
  });

  it('caso 4c — con ambos filtros ningún valor aparece concatenado en el SQL', async () => {
    await obtenerPorUsuario(2, { estado: 'cancelada', fecha: '2026-10-15' });

    const { sql } = capturarLlamada();
    expect(sql).not.toContain('cancelada');
    expect(sql).not.toContain('2026-10-15');
  });

  // -------------------------------------------------------------------------
  // Caso 5 — condición r.usuario_id siempre presente
  // -------------------------------------------------------------------------

  it('caso 5a — sin filtros el SQL contiene WHERE r.usuario_id = ?', async () => {
    await obtenerPorUsuario(9);

    const { sql } = capturarLlamada();
    expect(sql).toMatch(/WHERE r\.usuario_id = \?/);
  });

  it('caso 5b — con filtro estado el SQL sigue conteniendo WHERE r.usuario_id = ?', async () => {
    await obtenerPorUsuario(9, { estado: 'activa' });

    const { sql } = capturarLlamada();
    expect(sql).toMatch(/WHERE r\.usuario_id = \?/);
  });

  it('caso 5c — con ambos filtros el SQL sigue conteniendo WHERE r.usuario_id = ?', async () => {
    await obtenerPorUsuario(9, { estado: 'activa', fecha: '2026-11-01' });

    const { sql } = capturarLlamada();
    expect(sql).toMatch(/WHERE r\.usuario_id = \?/);
  });

  // -------------------------------------------------------------------------
  // Caso 6 — el usuarioId nunca aparece concatenado en el SQL
  // -------------------------------------------------------------------------

  it('caso 6 — el usuarioId no aparece como literal en el SQL', async () => {
    await obtenerPorUsuario(42);

    const { sql } = capturarLlamada();
    // El número 42 no debe aparecer literalmente en el string SQL
    expect(sql).not.toContain('42');
  });

  // -------------------------------------------------------------------------
  // Caso 7 — propagación de errores
  // -------------------------------------------------------------------------

  it('caso 7 — error de consultar se propaga como rechazo de la promesa', async () => {
    const dbError = new Error('Fallo de BD simulado');
    consultar.mockRejectedValue(dbError);

    await expect(obtenerPorUsuario(1)).rejects.toThrow('Fallo de BD simulado');
  });

  it('caso 7b — error con filtros también se propaga correctamente', async () => {
    const dbError = new Error('Fallo de BD con filtros');
    consultar.mockRejectedValue(dbError);

    await expect(
      obtenerPorUsuario(1, { estado: 'activa', fecha: '2026-11-01' })
    ).rejects.toThrow('Fallo de BD con filtros');
  });
});
