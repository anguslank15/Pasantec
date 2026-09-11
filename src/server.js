// ============================================================
// server.js — Arranque del servidor (zz-js01)
//
// Este archivo es SOLO el punto de entrada: arma la aplicación
// Express (definida en src/app.js) y la deja escuchando en un
// puerto. Toda la lógica vive en src/: app.js, db.js,
// routes/productos.js y validators/productos.js.
// ============================================================

const app = require("./app");

// Levanta el servidor y queda escuchando pedidos.
// process.env.PORT permite cambiar el puerto desde la terminal sin
// tocar el código:  PORT=3100 node src/server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
