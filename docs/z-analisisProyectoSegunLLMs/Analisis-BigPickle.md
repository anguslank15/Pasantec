# Análisis del proyecto `zz-js01` — CRUD de productos (Big-Pickle)

**CRUD de productos** — Node.js + Express 5 + SQLite (better-sqlite3), sin framework frontend (HTML/CSS/JS puro con `fetch()`). Proyecto educativo construido por etapas (9 tags de git) con documentación pedagógica exhaustiva.

**Estado verificado:** `npm test` → **13/13 pruebas pasan** ✅

---

## Arquitectura (separación por responsabilidad)

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| **Entry point** | `src/server.js` | Único punto de arranque: `app.listen()`, prompt de seed en instalación limpia |
| **App Express** | `src/app.js` | Middlewares (logger, JSON, static) + monta router `/api/productos`; NO escucha |
| **DB** | `src/db.js` | Conexión SQLite sincrónica, `CREATE TABLE IF NOT EXISTS`, `poblarDesdeArchivo()` |
| **Rutas** | `src/routes/productos.js` | CRUD completo: GET/POST/PUT/DELETE con validación |
| **Validación** | `src/validators/productos.js` | Reglas de negocio, devuelve array con TODOS los errores |
| **Frontend** | `public/index.html` | Formulario + tabla, modo edición, confirmación de borrado, `textContent` (anti-XSS) |

**Clave de testabilidad:** `app.js` exporta la app sin `listen()`. Eso permite a los tests inyectarla con supertest sin abrir puerto, y deja `server.js` como única orquesta real.

---

## API (`/api/productos`)

| Método | Ruta | Respuestas | Descripción |
|--------|------|------------|-------------|
| `GET` | `/api/productos` | `200` | Lista todos |
| `POST` | `/api/productos` | `201` / `400` | Crea (valida nombre, precio) |
| `PUT` | `/api/productos/:id` | `200` / `400` / `404` | Reemplaza |
| `DELETE` | `/api/productos/:id` | `204` / `404` | Borra (`changes === 0` → 404 honesto) |

**Validación** (`src/validators/productos.js`): acumula todos los errores (`{ "errores": [...] }`), no corta en el primero. Reglas: nombre obligatorio ≤100 chars; precio `Number.isFinite` (no `!precio`) y mínimo 0.01.

---

## Acciones defensivas del código

| Riesgo | Contramedida |
|--------|--------------|
| Inyección SQL | Prepared statements (`?`) en TODAS las consultas — ver `routes/productos.js:51` |
| XSS en la tabla | `textContent` en vez de `innerHTML` en `public/index.html` |
| Body ausente | `body \|\| {}` en el validador |
| Precio tramposo | `Number.isFinite` rechaza `"10"`, `NaN`, `Infinity`, objetos |
| Seed duplicado | Solo corre cuando la base es nueva y el usuario acepta con `s`; el `[s/N]` y el `DELETE` comentado en `poblar_base.sql` lo protegen |
| Tests tocando la base real | `DB_PATH` a base temporal, seteada ANTES de cualquier `require` (CommonJS cachea; `db.js` abre la conexión al requerirse) |
| Logger ensuciando tests | `LOG_REQUESTS=off` por entorno |
| Prompt que cuelga en CI | Guard `process.stdin.isTTY` en `server.js:87` — sin terminal interactiva, decide solo |

---

## Testing (`npm test` → `node --test`)

- **13 tests**: 12 de API (`test/api.test.js`) + 1 del seed (`test/poblar.test.js`).
- *Sin framework extra*: `node:test` + `supertest`; base temporal por archivo de test con limpieza en `after()`.
- Verifica el ciclo completo (POST→GET→PUT→DELETE), los códigos `400`/`404` y que el seed carga exactamente 5 productos.

---

## Estructura del repo

```
zz-js01/
├── src/
│   ├── server.js           # arranque + prompt de poblar
│   ├── app.js              # Express: middlewares + router
│   ├── db.js               # SQLite + poblarDesdeArchivo()
│   ├── routes/productos.js # CRUD endpoints
│   └── validators/productos.js
├── public/index.html       # Frontend vanilla (servido en /)
├── test/
│   ├── api.test.js         # 12 tests CRUD + validaciones
│   └── poblar.test.js      # 1 test del seed
├── poblar_base.sql         # 5 productos de ejemplo
└── docs/
    ├── ERRORES-Y-CORRECCIONES.md, ETAPAS.md, PRUEBAS.md
    ├── diagramas/          # Arquitectura, secuencia, ciclo de vida (archify)
    └── pedagogia/          # Paquete formal con PDFs
```

---

## Fortalezas

- **Modularidad didáctica**: un archivo por responsabilidad, cada uno comentado línea por línea para leerse de arriba a abajo.
- **Historial por etapas**: tags `etapa-N-*` navegables (`git switch --detach`), cada una un commit limpio. Herramienta docente que NINGÚN tutorial virtual da.
- **Separación app/server**: patrón profesional (app testable, bootstrap aparte) enseñado en un mini-proyecto.
- **Aislamiento de tests impecable** y base 100% reproducible.
- **Config por entorno** (`DB_PATH`, `PORT`, `LOG_REQUESTS`) sin tocar código.

## Aspectos a considerar

- **`better-sqlite3` es síncrono** — bloquea el event loop; correcto para esta escala, no para producción.
- **Sin `UNIQUE` en la tabla** — el seed ejecutado 2 veces duplica filas; el README lo advierte.
- **`req.params.id` sin validar** — SQLite lo compara bien por `id` numérico, pero un `NaN`/string raro pasa directo al SQL.
- **Sin manejo global de errores** — una excepción no capturada de la DB tiraría abajo el proceso.
- **Sin autenticación** — aceptable por ser app de aprendizaje, pero expone la base sin control alguno.

---

## Conclusión

Es un caso de estudio casi perfecto: del formulario al disco y de vuelta a la tabla. El flujo HTTP, el CRUD, la separación de capas, la validación, la programación defensiva y las pruebas no están descritos en abstracto sino **funcionando juntos** en una app real, ejecutable y verificable en cada etapa de su historial. Un curso de backend completo condensado en un solo proyecto bien comentado.