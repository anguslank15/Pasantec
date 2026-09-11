// ============================================================
// db.js — Conexión a la base SQLite (zz-js01)
//
// better-sqlite3: driver de SQLite. Es SINCRÓNICO: cada consulta
// bloquea hasta terminar (no usa callbacks ni promesas).
// La base completa vive en un solo archivo .db en el disco.
// ============================================================

const Database = require("better-sqlite3");

// La ruta del archivo de base se puede cambiar con la variable de
// entorno DB_PATH (los tests la apuntan a un archivo temporal para
// no tocar la base real). Sin esa variable, se usa la de siempre.
const DB_PATH = process.env.DB_PATH || "mi_base_de_datos.db";

// Abre la base (o crea el archivo si no existe). No hay un servidor
// de base de datos separado: todo queda en un único archivo .db en
// el disco (mi_base_de_datos.db, salvo que DB_PATH diga otra cosa).
const db = new Database(DB_PATH);

// Se ejecuta una sola vez al arrancar. IF NOT EXISTS crea la tabla
// solo si falta: permite reiniciar el servidor sin perder datos y
// sin romperse si la tabla ya existe.
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- id autogenerado: 1, 2, 3...
    nombre TEXT NOT NULL,                -- texto obligatorio
    precio REAL NOT NULL                 -- número con decimales
  )
    `);

// Se exporta la conexión ya abierta y con la tabla asegurada: las
// rutas (routes/productos.js) la requieren para leer y escribir.
module.exports = db;
