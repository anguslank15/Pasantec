// ============================================================
// test/poblar.test.js — Prueba del seed de datos de ejemplo (zz-js01)
//
// ¿Qué prueba? Que poblarDesdeArchivo() (nueva en la etapa 8,
// vive en src/db.js) lea poblar_base.sql y deje EXACTAMENTE los
// 5 productos de ejemplo en la tabla productos.
//
// Mismo detalle clave que en test/api.test.js: src/db.js abre la
// base apenas se lo requiere, y su ruta sale de process.env.DB_PATH.
// Por eso esta variable se define ANTES de requerir ../src/db:
// este test usa su PROPIO archivo temporal único y nunca toca
// mi_base_de_datos.db (cada archivo de test corre en su propio
// proceso, así que no pisa el DB_PATH de api.test.js).
// ============================================================

const os = require("os"); // os.tmpdir(): carpeta de temporales del sistema
const path = require("path"); // para armar rutas (temporal y poblar_base.sql)
const fs = require("fs"); // para borrar la base temporal al final

// Va PRIMERO, antes de cualquier require de src/: archivo temporal
// con nombre único (el prefijo distinto al de api.test.js evita
// cualquier confusión, aunque corran en procesos separados).
process.env.DB_PATH = path.join(
  os.tmpdir(),
  `zz-js01-poblar-test-${Date.now()}.db`,
);

const { test, after } = require("node:test");
const assert = require("node:assert");
// Destructuramos: db.js exporta { db, poblarDesdeArchivo }.
const { db, poblarDesdeArchivo } = require("../src/db");

// Al terminar TODOS los tests se cierra la conexión y se borra la
// base temporal. En Windows no se puede borrar un archivo abierto:
// por eso db.close() va antes del borrado.
after(() => {
  db.close();
  fs.rmSync(process.env.DB_PATH, { force: true });
});

// Caso único: poblar una base recién creada (vacía) y verificar que
// quedaron exactamente 5 filas, ni una más ni una menos. Si alguien
// ejecutara el seed dos veces (la tabla no tiene UNIQUE) el número
// sería 10 y este test lo delata.
test("poblarDesdeArchivo carga exactamente los 5 productos de poblar_base.sql", () => {
  // La ruta del seed se arma igual que en src/server.js: este test
  // vive en test/, así que ".." sube a la raíz del proyecto.
  poblarDesdeArchivo(path.join(__dirname, "..", "poblar_base.sql"));

  // SELECT COUNT(*) devuelve una fila con una columna; .get() la trae
  // como objeto { c: <número> } gracias al alias AS c.
  const { c } = db.prepare("SELECT COUNT(*) AS c FROM productos").get();
  assert.strictEqual(c, 5, "el seed debe insertar exactamente 5 productos");

  // Verificación de contenido: un producto del seed debe estar, con
  // su precio exacto, para confirmar que vino de poblar_base.sql.
  const teclado = db
    .prepare("SELECT nombre, precio FROM productos WHERE nombre = ?")
    .get("Teclado Mecánico");
  assert.ok(teclado, "el seed debe insertar 'Teclado Mecánico'");
  assert.strictEqual(teclado.precio, 45.99);
});
