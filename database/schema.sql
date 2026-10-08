-- =============================================================================
-- ESQUEMA DE BASE DE DATOS — Sistema de Reservas de Salas de Biblioteca
-- Motor: SQLite 3
-- Versión: 1.0.0
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- Tabla: usuarios
-- Almacena los datos de los usuarios del sistema (estudiantes y administradores)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT    NOT NULL CHECK(LENGTH(nombre) BETWEEN 2 AND 100),
  email          TEXT    NOT NULL UNIQUE CHECK(email LIKE '%_@_%._%'),
  password_hash  TEXT    NOT NULL,
  rol            TEXT    NOT NULL DEFAULT 'usuario' CHECK(rol IN ('usuario', 'admin')),
  activo         INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
  fecha_registro TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- -----------------------------------------------------------------------------
-- Tabla: salas
-- Almacena las salas de estudio disponibles en la biblioteca
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT    NOT NULL UNIQUE CHECK(LENGTH(nombre) BETWEEN 1 AND 100),
  capacidad       INTEGER NOT NULL CHECK(capacidad BETWEEN 1 AND 200),
  ubicacion       TEXT    NOT NULL CHECK(LENGTH(ubicacion) <= 200),
  descripcion     TEXT    CHECK(LENGTH(descripcion) <= 500),
  activa          INTEGER NOT NULL DEFAULT 1 CHECK(activa IN (0, 1)),
  fecha_creacion  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_salas_activa ON salas(activa);

-- -----------------------------------------------------------------------------
-- Tabla: reservas
-- Almacena las reservas de salas realizadas por los usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id     INTEGER NOT NULL,
  sala_id        INTEGER NOT NULL,
  fecha          TEXT    NOT NULL CHECK(fecha GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  hora_inicio    TEXT    NOT NULL CHECK(hora_inicio GLOB '[0-2][0-9]:[0-5][0-9]'),
  hora_fin       TEXT    NOT NULL CHECK(hora_fin GLOB '[0-2][0-9]:[0-5][0-9]'),
  proposito      TEXT    CHECK(LENGTH(proposito) <= 300),
  estado         TEXT    NOT NULL DEFAULT 'activa' CHECK(estado IN ('activa', 'cancelada', 'completada')),
  fecha_creacion TEXT    NOT NULL DEFAULT (datetime('now')),

  -- Restricción: hora_fin debe ser posterior a hora_inicio
  CHECK(hora_fin > hora_inicio),

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (sala_id)    REFERENCES salas(id)    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reservas_usuario  ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_sala     ON reservas(sala_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha    ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_estado   ON reservas(estado);

-- =============================================================================
-- DATOS INICIALES (seed)
-- =============================================================================

-- Usuario administrador por defecto
-- Contraseña: Admin1234 (hash bcrypt con salt=12)
INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
  'Administrador Sistema',
  'admin@biblioteca.edu',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY1xbGHqzEGCjgW',
  'admin'
);

-- Salas de ejemplo
INSERT OR IGNORE INTO salas (nombre, capacidad, ubicacion, descripcion) VALUES
  ('Sala A - Estudio Individual', 1,  'Planta Baja, Ala Norte',   'Cubículo individual con iluminación privada y toma de corriente'),
  ('Sala B - Grupos Pequeños',   4,  'Planta Baja, Ala Sur',    'Mesa redonda para grupos de 2 a 4 personas con pizarrón'),
  ('Sala C - Grupos Medianos',   8,  'Primer Piso, Sala 101',   'Sala amplia para grupos de hasta 8 personas con proyector'),
  ('Sala D - Conferencias',      20, 'Primer Piso, Auditorio',   'Sala de conferencias con proyector y sistema de audio'),
  ('Sala E - Multimedia',        6,  'Segundo Piso, Lab Digital','Sala equipada con 6 computadoras y acceso a software especializado');
