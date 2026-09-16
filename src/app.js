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
//   La consola del servidor narra cada pedido: → método y URL al
//   entrar, ← código de respuesta al terminar (LOG_REQUESTS=off
//   la silencia; ver el middleware de logging más abajo).
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

// ------------------------------------------------------------
// Middleware de logging de pedidos (etapa 9): narra cada pedido
// en la consola del servidor, por ejemplo:
//   → GET /api/productos
//   ← 200
// ------------------------------------------------------------

// Interruptor por variable de entorno: el MISMO patrón de
// configuración que usa DB_PATH en src/db.js (configurar sin
// tocar código). LOG_REQUESTS=off silencia el logger — la suite
// de tests lo usa para que la salida de npm test quede limpia —.
// Se lee UNA sola vez, al requerir este archivo, igual que DB_PATH.
const LOG = process.env.LOG_REQUESTS !== "off";

// ¿Por qué PRIMERO en la cadena? Los middlewares corren en orden
// de declaración: poniéndolo antes de express.json, del static y
// de las rutas, este logger ve TODOS los pedidos que entran (los
// demás no tienen que saber que existe). Más abajo, en cambio,
// solo nararía los pedidos que llegaran hasta él.
app.use((req, res, next) => {
  if (LOG) {
    // Al ENTRAR el pedido se anuncia con su método y su URL.
    console.log(`→ ${req.method} ${req.url}`);
    // El código de respuesta (res.statusCode) todavía NO existe
    // acá: se decide más adelante, cuando una ruta u otro
    // middleware responda. Por eso no se loguea ya, sino cuando
    // la respuesta TERMINA: el evento "finish" de res se dispara
    // recién entonces, y solo ahí statusCode tiene su valor final.
    res.on("finish", () => console.log(`← ${res.statusCode}`));
  }
  // next() pasa el pedido al siguiente middleware de la cadena.
  next();
});

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

// ------------------------------------------------------------
// Middleware de error (SIEMPRE último en la cadena): Express lo
// invoca cuando algo lanzó una excepción en un middleware o en
// una ruta. Se lo reconoce por su firma de CUATRO parámetros:
// esa firma le dice a Express "yo manejo errores", no "yo atiendo
// pedidos", y por eso no interfiere con las rutas normales.
//
// ¿Por qué hace falta? Si express.json() recibe un body que no
// es JSON válido, lanza un error antes de llegar a cualquier
// ruta. Sin este handler, ese error cae en el handler por
// defecto de Express, que responde una página HTML: el contrato
// JSON de la API quedaría roto justo cuando el cliente más
// necesita saber qué salió mal (lo detectó el test 13 de
// test/api.test.js).
// ------------------------------------------------------------
app.use((error, _req, res, _next) => {
  // body-parser (dentro de express.json) "etiqueta" su error de
  // parseo con type = "entity.parse.failed": es la manera fiable
  // de reconocer "el body no era JSON válido" (error del CLIENTE,
  // 400) y no confundirlo con un problema del servidor (500).
  if (error.type === "entity.parse.failed") {
    // Misma forma que los 400 de validación: { errores: [...] }.
    return res
      .status(400)
      .json({ errores: ["El body del pedido no es JSON válido."] });
  }
  // Cualquier otro error SÍ es culpa nuestra: 500. Se registra en
  // la consola (para poder depurar) pero la respuesta NO incluye
  // detalles internos del error: esa información no debe salir
  // por HTTP (podría revelar rutas, SQL o versiones).
  console.error("Error no previsto:", error);
  return res.status(500).json({ error: "Error interno del servidor" });
});

// Se exporta la app SIN escuchar puertos: así los tests pueden
// requerirla (test/api.test.js con supertest) y src/server.js es
// el único archivo que la arranca con app.listen().
module.exports = app;
