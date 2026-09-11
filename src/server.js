// ============================================================
// server.js — Arranque del servidor (zz-js01)
//
// Este archivo es SOLO el punto de entrada: arma la aplicación
// Express (definida en src/app.js) y la deja escuchando en un
// puerto. Toda la lógica vive en src/: app.js, db.js,
// routes/productos.js y validators/productos.js.
//
// Novedad de la etapa 8: en una INSTALACIÓN LIMPIA (el archivo de
// la base todavía no existe), pregunta por terminal si poblarla
// con los datos de ejemplo de poblar_base.sql. La pregunta vive
// ACÁ y solo acá: app.js y los tests jamás piden nada por
// terminal.
// ============================================================

const fs = require("fs"); // builtin: para saber si el archivo de la base ya existe
const path = require("path"); // builtin: para armar la ruta de poblar_base.sql
const readline = require("node:readline/promises"); // builtin: pregunta con promesas (sin instalar nada)

// Ruta del archivo de base: mismo criterio que src/db.js (variable
// de entorno DB_PATH o, en su defecto, el archivo de siempre). Se
// repite acá porque la pregunta de instalación limpia necesita
// saber si ese archivo existe ANTES de crear la conexión.
const DB_PATH = process.env.DB_PATH || "mi_base_de_datos.db";

// SQL_SEED: dónde está el script con los datos de ejemplo.
// __dirname es la carpeta de ESTE archivo (src/), y el ".." SUBE un
// nivel hasta la raíz del proyecto: poblar_base.sql vive ahí, no
// dentro de src/.
const SQL_SEED = path.join(__dirname, "..", "poblar_base.sql");

// Todo el arranque va dentro de una función async (main) para poder
// usar await: la pregunta al usuario se hace ANTES de crear la base.
async function main() {
  // ORDEN IMPORTANTE: el require("./db") de abajo abre (y si falta,
  // CREA) el archivo de la base apenas se ejecuta. Si lo requiriéramos
  // arriba del archivo, al llegar acá el archivo ya existiría y la
  // pregunta nunca se haría. Por eso: primero se pregunta SOLO si la
  // base falta, y recién después se cargan la conexión y la app.
  // Una instalación limpia es justo el momento de ofrecer datos de
  // ejemplo: la base está por nacer y está vacía.
  let poblar = false;
  if (!fs.existsSync(DB_PATH)) poblar = await preguntarPoblar();

  // Aquí sí: require("./db") crea el archivo (si faltaba) y asegura
  // la tabla (CREATE TABLE IF NOT EXISTS); require("./app") arma la
  // aplicación Express. CommonJS cachea los require: es la MISMA
  // conexión que usan las rutas.
  const { db } = require("./db");
  const app = require("./app");

  if (poblar) {
    try {
      // Ejecuta los INSERT de poblar_base.sql. Solo corre si la base
      // era nueva y el usuario aceptó: así nunca duplica filas.
      db.poblarDesdeArchivo(SQL_SEED);
      console.log("Base poblada con datos de ejemplo ✓");
    } catch (error) {
      // El seed es OPCIONAL: si poblar_base.sql falta o falla, el
      // servidor NO debe morir por eso. Se informa el error y se
      // sigue: el CRUD funciona igual con la base vacía.
      console.error(
        "No se pudo poblar la base con datos de ejemplo:",
        error.message,
      );
      console.error("El servidor arranca igual, con la base vacía.");
    }
  }

  // Levanta el servidor y queda escuchando pedidos.
  // process.env.PORT permite cambiar el puerto desde la terminal sin
  // tocar el código:  PORT=3100 node src/server.js
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Pregunta por terminal si poblar la base. Devuelve una promesa que
// resuelve true (el usuario acepta) o false (rechaza, o no hay
// terminal interactiva).
function preguntarPoblar() {
  // Sin TTY = stdin no es una terminal interactiva: scripts, CI, o
  // stdin redirigido (por ejemplo `echo | node src/server.js`).
  // Preguntar igual COLGARÍA el proceso para siempre, esperando una
  // respuesta que nunca llega. Por eso se decide solo: no poblar.
  if (!process.stdin.isTTY) {
    console.log(
      "Instalación limpia detectada. Sin terminal interactiva: se crea la base vacía.",
    );
    return Promise.resolve(false);
  }

  // Interfaz de pregunta: lee de stdin y escribe en stdout. Después
  // de responder hay que cerrarla (rl.close), si no, el proceso
  // quedaría escuchando la terminal además de atender HTTP.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // El cartel usa [s/N]: la N en mayúscula avisa que la respuesta
  // por defecto (apretar solo Enter) es NO poblar.
  return rl
    .question(
      "No encontré la base de datos. ¿Poblarla con datos de ejemplo (poblar_base.sql)? [s/N] ",
    )
    .then((respuesta) => {
      const limpio = respuesta.trim().toLowerCase(); // "  S\n" → "s"
      // Aceptación explícita: solo estas cuatro respuestas pueblan.
      // Cualquier otra cosa (Enter vacío, "n", "no", un grito) no.
      return ["s", "si", "y", "yes"].includes(limpio);
    })
    .finally(() => rl.close()); // cierra la interfaz SIEMPRE, acepte o rechace
}

main();
