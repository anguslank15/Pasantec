// ============================================================
// test/api.test.js — Pruebas automatizadas de la API (zz-js01)
//
// Stack de pruebas:
//  - node:test: el corredor de pruebas que trae Node de fábrica
//    (cero dependencias extra). Se ejecuta con `npm test`, que
//    corre `node --test test/`.
//  - supertest: dispara pedidos HTTP contra la app de Express
//    directamente, sin levantar el servidor en un puerto real.
//
// DETALLE CLAVE: src/db.js abre la base apenas se lo requiere, y
// su ruta sale de process.env.DB_PATH. Por eso esta variable se
// define ANTES de cualquier require de src/: los tests usan un
// archivo temporal único y NUNCA tocan mi_base_de_datos.db.
// ============================================================

const os = require("os"); // os.tmpdir(): carpeta de temporales del sistema
const path = require("path"); // para armar la ruta del archivo temporal
const fs = require("fs"); // para borrar la base temporal al final

// Va PRIMERO, antes de requerir la app: DB_PATH apunta a un archivo
// temporal con nombre único (Date.now() evita colisiones entre
// corridas del mismo test o de dos terminales a la vez).
process.env.DB_PATH = path.join(os.tmpdir(), `zz-js01-test-${Date.now()}.db`);

const { test, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../src/app");
// Misma instancia de la base que usa la app: CommonJS cachea los
// require, así que ../src/db acá y dentro de las rutas es el mismo
// objeto. La necesitamos para cerrar la conexión al final. Se
// DESTRUCTURA porque db.js exporta { db, poblarDesdeArchivo }.
const { db } = require("../src/db");

// Al terminar TODOS los tests se cierra la conexión y se borra la
// base temporal. En Windows no se puede borrar un archivo abierto:
// por eso db.close() va antes del borrado.
after(() => {
  db.close();
  fs.rmSync(process.env.DB_PATH, { force: true });
});

// ------------------------------------------------------------
// Cadena feliz del CRUD (casos 1 a 6): comparten un producto real,
// cuyo id se obtiene en caliente del POST y se va pasando de test
// en test. El orden importa: node:test ejecuta los tests de este
// archivo de arriba hacia abajo, uno por vez.
// ------------------------------------------------------------
let idCreado;

// 1) POST válido → 201 Created con el producto creado (con su id).
test("POST con datos válidos responde 201 y el producto con id", async () => {
  const res = await request(app)
    .post("/api/productos")
    .send({ nombre: "Teclado mecánico", precio: 25.5 });
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id, "el body debe traer un id generado");
  assert.strictEqual(res.body.nombre, "Teclado mecánico");
  assert.strictEqual(res.body.precio, 25.5);
  idCreado = res.body.id; // los siguientes tests de la cadena lo usan
});

// 2) GET → 200 y la lista contiene el producto recién creado.
test("GET lista los productos y contiene el creado", async () => {
  const res = await request(app).get("/api/productos");
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body), "la respuesta debe ser un array");
  const encontrado = res.body.find((p) => p.id === idCreado);
  assert.ok(encontrado, "el producto creado debe estar en la lista");
  assert.strictEqual(encontrado.nombre, "Teclado mecánico");
  assert.strictEqual(encontrado.precio, 25.5);
});

// 3) PUT válido sobre el id creado → 200 y el body refleja los nuevos valores.
test("PUT sobre el id creado reemplaza los datos (200)", async () => {
  const res = await request(app)
    .put(`/api/productos/${idCreado}`)
    .send({ nombre: "Teclado editado", precio: 31.99 });
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, {
    id: idCreado,
    nombre: "Teclado editado",
    precio: 31.99,
  });
});

// 4) PUT sobre un id inexistente → 404 (con datos válidos, para que
// el pedido llegue hasta la búsqueda en la base y falle por ahí).
test("PUT sobre un id inexistente responde 404", async () => {
  const res = await request(app)
    .put("/api/productos/999999")
    .send({ nombre: "Fantasma", precio: 10 });
  assert.strictEqual(res.status, 404);
  assert.deepStrictEqual(res.body, { error: "Producto no encontrado" });
});

// 5) DELETE del id creado → 204 No Content (sin body).
test("DELETE del id creado responde 204 sin contenido", async () => {
  const res = await request(app).delete(`/api/productos/${idCreado}`);
  assert.strictEqual(res.status, 204);
  assert.deepStrictEqual(res.body, {}); // 204: no hay body
});

// 6) DELETE repetido sobre ese mismo id → 404: ya no existe.
test("DELETE repetido sobre el mismo id responde 404", async () => {
  const res = await request(app).delete(`/api/productos/${idCreado}`);
  assert.strictEqual(res.status, 404);
  assert.deepStrictEqual(res.body, { error: "Producto no encontrado" });
});

// ------------------------------------------------------------
// Validaciones (casos 7 a 12): el servidor rechaza con 400 los
// datos que no cumplen las reglas de negocio de validarProducto.
// ------------------------------------------------------------

// 7) POST con {} → 400 y EXACTAMENTE 2 errores (nombre + precio).
test("POST con body vacío ({}) responde 400 con 2 errores", async () => {
  const res = await request(app).post("/api/productos").send({});
  assert.strictEqual(res.status, 400);
  assert.ok(Array.isArray(res.body.errores));
  assert.strictEqual(res.body.errores.length, 2);
});

// 8) POST con nombre de solo espacios → 400: trim() lo deja vacío.
test("POST con nombre de solo espacios responde 400", async () => {
  const res = await request(app)
    .post("/api/productos")
    .send({ nombre: "   ", precio: 10 });
  assert.strictEqual(res.status, 400);
  assert.ok(
    res.body.errores.includes("El nombre es obligatorio y debe ser texto."),
  );
});

// 9) POST con precio texto ("caro") → 400: Number.isFinite lo rechaza.
test("POST con precio texto responde 400", async () => {
  const res = await request(app)
    .post("/api/productos")
    .send({ nombre: "Silla", precio: "caro" });
  assert.strictEqual(res.status, 400);
  assert.ok(
    res.body.errores.includes("El precio es obligatorio y debe ser un número."),
  );
});

// 10) POST con precio 0 → 400: la regla de negocio pide mínimo 0.01.
test("POST con precio 0 responde 400 (mínimo 0.01)", async () => {
  const res = await request(app)
    .post("/api/productos")
    .send({ nombre: "Moneda", precio: 0 });
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.errores.includes("El precio mínimo permitido es 0.01."));
});

// 11) POST con nombre de 101 caracteres → 400: máximo 100.
test("POST con nombre de 101 caracteres responde 400 (máximo 100)", async () => {
  const res = await request(app)
    .post("/api/productos")
    .send({ nombre: "a".repeat(101), precio: 10 });
  assert.strictEqual(res.status, 400);
  assert.ok(
    res.body.errores.includes("El nombre no puede superar los 100 caracteres."),
  );
});

// 12) PUT con nombre vacío y precio -1 → 400 con AMBOS errores juntos
// (validarProducto acumula todos los problemas, no corta en el primero).
test("PUT con nombre vacío y precio -1 responde 400 con ambos errores", async () => {
  const res = await request(app)
    .put("/api/productos/999999")
    .send({ nombre: "", precio: -1 });
  assert.strictEqual(res.status, 400);
  assert.deepStrictEqual(res.body.errores, [
    "El nombre es obligatorio y debe ser texto.",
    "El precio mínimo permitido es 0.01.",
  ]);
});
