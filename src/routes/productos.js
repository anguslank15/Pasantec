// ============================================================
// routes/productos.js — Rutas de la API de productos (zz-js01)
//
// express.Router(): mini-aplicación de Express que agrupa rutas
// relacionadas. app.js la monta bajo /api/productos, así que una
// ruta definida acá como "/" responde en /api/productos y una
// definida como "/:id" en /api/productos/:id. El mapa completo de
// la API está comentado al inicio de src/app.js.
// ============================================================

const express = require("express");
const db = require("../db"); // conexión SQLite compartida (misma instancia en toda la app)
const { validarProducto } = require("../validators/productos");

const router = express.Router();

// GET /api/productos → devuelve todos los productos como JSON.
// prepare() compila la consulta una sola vez (eficiente si se repite).
// El guion bajo en _req indica: "Express me exige este parámetro
// (el pedido), pero no lo uso en esta ruta".
router.get("/", (_req, res) => {
  const productos = db.prepare("SELECT * FROM productos").all();
  res.json(productos); // res.json(): convierte a JSON y responde
});

// POST /api/productos → inserta un producto.
// El body llega como JSON { "nombre": "...", "precio": 123.45 }
// gracias al middleware express.json() de app.js.
//
// Los "?" son PARÁMETROS PREPARADOS: los valores se envían por
// separado de la consulta, por lo que es imposible que datos del
// formulario alteren el SQL (inyección SQL). Nunca concatenes
// valores de usuario dentro de un string SQL.
router.post("/", (req, res) => {
  // 1) Validar SIEMPRE antes de tocar la base. El `required` del
  // formulario ayuda al usuario, pero el servidor no confía en
  // nadie: un curl puede saltearse el HTML completo.
  const errores = validarProducto(req.body);
  if (errores.length > 0) {
    // 400 Bad Request: "tu pedido está malformado; corregilo vos".
    // Es un error del CLIENTE, muy distinto de un 500 (culpa del
    // servidor) que era lo que pasaba antes con campos faltantes.
    return res.status(400).json({ errores });
  }
  // Ya validado: trim() normaliza el nombre (sin espacios sobrantes).
  const nombre = req.body.nombre.trim();
  const precio = req.body.precio;
  const insert = db.prepare(
    "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
  );
  // run() ejecuta el INSERT; lastInsertRowid trae el id generado.
  const resultado = insert.run(nombre, precio);
  // 201 Created: convención REST para "se creó un recurso nuevo".
  res.status(201).json({ id: resultado.lastInsertRowid, nombre, precio });
});

// PUT /api/productos/:id → reemplaza los datos del producto con ese id.
// En REST, PUT significa "actualizar el recurso completo" (PATCH sería
// actualizar una parte). Usa el mismo parámetro de ruta que DELETE.
router.put("/:id", (req, res) => {
  // Mismas reglas para crear y editar: una sola función, dos rutas.
  const errores = validarProducto(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }
  const nombre = req.body.nombre.trim(); // ya validado y normalizado
  const precio = req.body.precio;
  // UPDATE ... WHERE id = ?: cambia SOLO las filas que matcheen el id.
  // Sin WHERE se actualizarían TODAS las filas: error clásico y caro.
  const actualizar = db.prepare(
    "UPDATE productos SET nombre = ?, precio = ? WHERE id = ?",
  );
  // Tres valores, tres "?": en el mismo orden que aparecen en el SQL.
  const resultado = actualizar.run(nombre, precio, req.params.id);
  // Mismo patrón changes que en DELETE: 0 significa "ese id no existe".
  if (resultado.changes === 0) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  // Devolvemos cómo quedó el producto. Number(): req.params.id es string,
  // lo convertimos para que el JSON muestre el id como número.
  res.json({ id: Number(req.params.id), nombre, precio });
});

// DELETE /api/productos/:id → borra el producto con ese id.
// ":id" es un PARÁMETRO DE RUTA: viaja en la URL (no en el body) y
// Express lo deja disponible en req.params.id. Ojo: llega como STRING
// ("7"), pero SQLite lo compara bien contra el id numérico.
router.delete("/:id", (req, res) => {
  const borrar = db.prepare("DELETE FROM productos WHERE id = ?");
  // run() devuelve "changes": cuántas filas fueron borradas de verdad.
  const resultado = borrar.run(req.params.id);
  // Si changes es 0, no existía ningún producto con ese id. Responder
  // 404 (Not Found) es más honesto que un 204 silencioso: quien llamó
  // pidió borrar algo que no estaba.
  if (resultado.changes === 0) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  // 204 No Content: "salió bien y no tengo nada que devolver". Es la
  // convención REST para borrados exitosos. .end() cierra la respuesta
  // sin body.
  res.status(204).end();
});

// El router se exporta para que app.js lo monte bajo /api/productos.
module.exports = router;
