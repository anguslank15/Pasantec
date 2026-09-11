const path = require("path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());

// Sirve los archivos del frontend desde /public
app.use(express.static(path.join(__dirname, "public")));

// Se conecta o crea automáticamente el archivo de la base de datos
const db = new Database("mi_base_de_datos.db");

// Creación de una tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL
  )
`);

// Ruta para obtener datos (Leída por el fetch del frontend)
app.get("/api/productos", (_req, res) => {
  const productos = db.prepare("SELECT * FROM productos").all();
  res.json(productos);
});

// Ruta para guardar datos
app.post("/api/productos", (req, res) => {
  const { nombre, precio } = req.body;
  const insert = db.prepare(
    "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
  );
  const resultado = insert.run(nombre, precio);
  res.json({ id: resultado.lastInsertRowid, nombre, precio });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
