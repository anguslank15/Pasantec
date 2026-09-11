// ============================================================
// db.js — Conexión a la base SQLite (zz-js01)
//
// better-sqlite3: driver de SQLite. Es SINCRÓNICO: cada consulta
// bloquea hasta terminar (no usa callbacks ni promesas).
// La base completa vive en un solo archivo .db en el disco.
// ============================================================

const fs = require("fs"); // builtin de Node: para leer el archivo poblar_base.sql (sin instalar nada)
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

// ============================================================
// poblarDesdeArchivo(rutaSql) — cargar datos de ejemplo (seed)
//
// ¿Por qué existe? Para la instalación limpia: si arrancás el
// servidor y la base no existía, src/server.js te pregunta si
// querés poblarla. Esta función lee un archivo .sql completo
// (utf8) y lo ejecuta de una sola vez con db.exec(), que acepta
// VARIAS sentencias seguidas: el INSERT de los 5 productos de
// su SELECT final de verificación.
//
// ⚠ MISMA ADVERTENCIA que adentro de poblar_base.sql: la tabla
// productos NO tiene restricción UNIQUE, así que ejecutar el
// script DOS VECES inserta los productos duplicados. Esta función
// no verifica nada de eso: confía en que quien la llama la use
// una sola vez (en la práctica, solo cuando la base era nueva).
// ============================================================
function poblarDesdeArchivo(rutaSql) {
  const sql = fs.readFileSync(rutaSql, "utf8"); // se lee TODO el archivo a un string
  db.exec(sql); // y se ejecuta entero de una (exec sí soporta múltiples sentencias)
}

// Se exporta un OBJETO con dos cosas:
//  - db: la conexión ya abierta y con la tabla asegurada; las rutas
//    (routes/productos.js) la destructuran al requerir este módulo.
//  - poblarDesdeArchivo: la función de seed de arriba; la usa
//    src/server.js solo cuando la base se crea por primera vez.
// Ojo al cambio de forma: antes se exportaba `db` directamente, y
// quien requiera ../db ahora recibe { db, poblarDesdeArchivo }.
module.exports = { db, poblarDesdeArchivo };
