/**
 * Configuración y conexión a la base de datos SQLite
 * Genera el esquema automáticamente si no existe
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/biblioteca.db');

// Asegurar que el directorio exista
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

/**
 * Obtiene la instancia de la base de datos (singleton)
 * @returns {sqlite3.Database}
 */
const obtenerDB = () => {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
        throw err;
      }
    });
    // Habilitar claves foráneas
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
};

/**
 * Inicializa el esquema de la base de datos
 * @returns {Promise<void>}
 */
const inicializarDB = () => {
  return new Promise((resolve, reject) => {
    const database = obtenerDB();

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    database.exec(schema, (err) => {
      if (err) {
        console.error('Error al inicializar el esquema:', err.message);
        return reject(err);
      }
      resolve();
    });
  });
};

/**
 * Ejecuta una consulta SQL que devuelve múltiples filas
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
const consultar = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    obtenerDB().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

/**
 * Ejecuta una consulta SQL que devuelve una sola fila
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object|null>}
 */
const consultarUno = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    obtenerDB().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

/**
 * Ejecuta una consulta SQL de escritura (INSERT, UPDATE, DELETE)
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<{lastID: number, changes: number}>}
 */
const ejecutar = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    obtenerDB().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

/**
 * Cierra la conexión a la base de datos
 * @returns {Promise<void>}
 */
const cerrarDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) return reject(err);
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = { obtenerDB, inicializarDB, consultar, consultarUno, ejecutar, cerrarDB };
