// ============================================================
// app.js — Aplicación Express del CRUD de productos (zz-js01)
//
// Stack: Node.js + Express 5 + better-sqlite3 (SQLite)
//
// Mapa de la API (todas las rutas bajo /api/productos):
//   GET    /api/productos      → lista todos                  (200)
//   POST   /api/productos      → crea uno; valida los datos   (201)
//   PUT    /api/productos/:id  → reemplaza uno; valida datos  (200)
//   DELETE /api/productos/:id  → borra uno                    (204)
//   Errores posibles: 400 (datos inválidos) · 404 (id inexistente)
//
// Para quien empieza:
//  - require(): importa un módulo (librería) en CommonJS.
//  - Express: framework web; organiza el servidor como una cadena
//    de "middlewares" y "rutas" que responden pedidos HTTP.
//
// Este archivo arma la app pero NO la pone a escuchar: eso lo hace
// src/server.js, el único punto de arranque (ver abajo).
// ============================================================

const path = require("path"); // Utilidades para rutas de archivos del sistema operativo
const express = require("express");
const productosRouter = require("./routes/productos");

// Una "app" de Express procesa cada pedido HTTP pasando por una
// cadena de middlewares: funciones que se ejecutan en orden, de
// arriba hacia abajo, hasta que algo responda.
const app = express();

// Middleware: interpreta el body JSON de los pedidos POST/PUT y lo
// deja disponible en req.body como objeto JavaScript.
// Sin esta línea, req.body llegaría undefined.
app.use(express.json());

// Middleware de archivos estáticos: Express busca el archivo pedido
// dentro de public/ y lo sirve tal cual; si no existe, sigue hacia
// las rutas de la API (GET / sirve index.html automáticamente).
// Se apunta a public/ —y no a la raíz del proyecto— para no exponer
// por HTTP la base de datos, este código ni el package.json.
// __dirname = ruta absoluta de la carpeta donde está este archivo.
// Como ahora este archivo vive en src/, se sube un nivel con ".."
// para llegar a la carpeta public/ de la raíz del proyecto.
app.use(express.static(path.join(__dirname, "..", "public")));

// Se monta el router de productos bajo el prefijo /api/productos:
// las rutas que dentro de routes/productos.js se definen como "/"
// y "/:id" se sirven en /api/productos y /api/productos/:id.
app.use("/api/productos", productosRouter);

// Se exporta la app SIN escuchar puertos: así los tests pueden
// requerirla (test/api.test.js con supertest) y src/server.js es
// el único archivo que la arranca con app.listen().
module.exports = app;
