// ============================================================
// server.js — Backend del CRUD de productos (zz-js01)
//
// Stack: Node.js + Express 5 + better-sqlite3 (SQLite)
//
// Para quien empieza:
//  - require(): importa un módulo (librería) en CommonJS.
//  - Express: framework web; organiza el servidor como una cadena
//    de "middlewares" y "rutas" que responden pedidos HTTP.
//  - better-sqlite3: driver de SQLite. Es SINCRÓNICO: cada consulta
//    bloquea hasta terminar (no usa callbacks ni promesas).
//    La base completa vive en un solo archivo .db en el disco.
// ============================================================

const path = require("path"); // Utilidades para rutas de archivos del sistema operativo
const express = require("express");
const Database = require("better-sqlite3");

// Una "app" de Express procesa cada pedido HTTP pasando por una
// cadena de middlewares: funciones que se ejecutan en orden, de
// arriba hacia abajo, hasta que algo responda.
const app = express();

// Middleware: interpreta el body JSON de los pedidos POST/PUT y lo
// deja disponible en req.body como objeto JavaScript.
// Sin esta línea, req.body llegaría undefined.
app.use(express.json());

// Middleware de archivos estáticos: si un pedido no matchea ninguna
// ruta de la API, Express busca un archivo con ese nombre dentro de
// public/ y lo sirve tal cual (así se entrega /cargaDatos.html).
// Se apunta a public/ —y no a la raíz del proyecto— para no exponer
// por HTTP la base de datos, este server.js ni el package.json.
// __dirname = ruta absoluta de la carpeta donde está este archivo.
app.use(express.static(path.join(__dirname, "public")));

// Abre la base (o crea el archivo si no existe). No hay un servidor
// de base de datos separado: todo queda en mi_base_de_datos.db.
const db = new Database("mi_base_de_datos.db");

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

// GET /api/productos → devuelve todos los productos como JSON.
// prepare() compila la consulta una sola vez (eficiente si se repite).
// El guion bajo en _req indica: "Express me exige este parámetro
// (el pedido), pero no lo uso en esta ruta".
app.get("/api/productos", (_req, res) => {
  const productos = db.prepare("SELECT * FROM productos").all();
  res.json(productos); // res.json(): convierte a JSON y responde
});

// POST /api/productos → inserta un producto.
// El body llega como JSON { "nombre": "...", "precio": 123.45 }
// gracias al middleware express.json() de más arriba.
//
// Los "?" son PARÁMETROS PREPARADOS: los valores se envían por
// separado de la consulta, por lo que es imposible que datos del
// formulario alteren el SQL (inyección SQL). Nunca concatenes
// valores de usuario dentro de un string SQL.
app.post("/api/productos", (req, res) => {
  const { nombre, precio } = req.body; // destructuring: extrae campos
  const insert = db.prepare(
    "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
  );
  // run() ejecuta el INSERT; lastInsertRowid trae el id generado.
  const resultado = insert.run(nombre, precio);
  res.json({ id: resultado.lastInsertRowid, nombre, precio });
});
    
// PUT /api/productos/:id → reemplaza los datos del producto con ese id.
// En REST, PUT significa "actualizar el recurso completo" (PATCH sería
// actualizar una parte). Usa el mismo parámetro de ruta que DELETE.
app.put("/api/productos/:id", (req, res) => {
  const { nombre, precio } = req.body; // los nuevos valores vienen en el body
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
app.delete("/api/productos/:id", (req, res) => {
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

// Levanta el servidor y queda escuchando pedidos.
// process.env.PORT permite cambiar el puerto desde la terminal sin
// tocar el código:  PORT=3100 node server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
