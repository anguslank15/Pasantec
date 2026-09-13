# Análisis del proyecto zz-js01 — CRUD de productos

**Fecha**: 13 de septiembre de 2026
**Modelo**: Mimo v2.5 Free

---

## Stack

Node.js (≥22) · Express 5 · better-sqlite3 · HTML/CSS/JS puro (sin frameworks frontend)

## Arquitectura

```
src/
  server.js              ← Punto de entrada único (arranque, pregunta de seed)
  app.js                 ← Express app: middlewares + mapa de rutas
  db.js                  ← Conexión SQLite (sincrónica) + CREATE TABLE IF NOT EXISTS
  routes/productos.js    ← CRUD completo: GET/POST/PUT/DELETE
  validators/productos.js ← Validación de negocio (acumula TODOS los errores)
public/
  index.html             ← Frontend: formulario + tabla con fetch()
test/
  api.test.js            ← 12 tests (CRUD + validaciones) con supertest
  poblar.test.js         ← 1 test del seed SQL
docs/
  ERRORES-Y-CORRECCIONES.md ← Retrospectiva de bugs y técnica de depuración
  ETAPAS.md              ← Guía del viaje etapa por etapa
  PRUEBAS.md             ← Documentación de la suite de tests
  diagramas/             ← Diagramas interactivos (archify)
  pedagogia/             ← Material pedagógico complementario
```

## Diagrama de-componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Navegador                            │
│  public/index.html  ← HTML + CSS + JS puro con fetch()     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express (src/app.js)                       │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ Logger middleware │  │ express.json()                   │ │
│  │ (LOG_REQUESTS)   │  │ (parsea body JSON)               │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ express.static(public/)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ /api/productos → routes/productos.js                 │   │
│  │   GET /         → lista todos            (200)       │   │
│  │   POST /        → crea uno; valida       (201/400)   │   │
│  │   PUT /:id      → reemplaza; valida      (200/400/404)│  │
│  │   DELETE /:id   → borra uno              (204/404)   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL (sincrónico)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SQLite (src/db.js → better-sqlite3)            │
│                                                             │
│  DB_PATH = process.env.DB_PATH || "mi_base_de_datos.db"    │
│                                                             │
│  CREATE TABLE IF NOT EXISTS productos (                     │
│    id     INTEGER PRIMARY KEY AUTOINCREMENT,                │
│    nombre TEXT NOT NULL,                                    │
│    precio REAL NOT NULL                                     │
│  )                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Decisiones de arquitectura

| Decisión | Elección | Razón |
|----------|----------|-------|
| Módulos | CommonJS (`require`) | `"type": "commonjs"` en package.json; más simple para aprendizaje |
| Base de datos | SQLite embebido (better-sqlite3) | Sin servidor separado; todo en un archivo `.db` |
| Sincronía | better-sqlite3 (sincrónico) | Consultas bloqueantes pero simples; OK para este volumen |
| Arranque | `server.js` ≠ `app.js` | Permite que supertest importe `app.js` sin levantar servidor |
| Validación | Acumulación de errores | Devuelve TODOS los problemas de una vez, no falla en el primero |
| Tests | `node:test` + supertest | Cero dependencias extra para el runner; supertest prueba HTTP sin puerto |
| DB de tests | Variable `DB_PATH` al temp dir | Nunca toca `mi_base_de_datos.db`; aislamiento total |
| Logger | Middleware + `LOG_REQUESTS=off` | Silenciable para tests/CI; narra cada pedido con su código |
| Seed | Interactivo en `server.js` | Solo pregunta en instalación limpia + TTY; `app.js` y tests nunca piden input |

## API

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `GET` | `/api/productos` | — | `200` [{ id, nombre, precio }] |
| `POST` | `/api/productos` | `{ nombre, precio }` | `201` { id, nombre, precio } · `400` { errores[] } |
| `PUT` | `/api/productos/:id` | `{ nombre, precio }` | `200` { id, nombre, precio } · `400` · `404` |
| `DELETE` | `/api/productos/:id` | — | `204` · `404` { error } |

### Reglas de validación

- **nombre**: string obligatorio, trim, máximo 100 caracteres
- **precio**: number finito, mínimo 0.01 (no acepta 0 ni negativos)

## Tests

13 pruebas automatizadas con `npm test`:

| # | Archivo | Qué verifica |
|---|---------|--------------|
| 1-6 | `api.test.js` | Cadena feliz del CRUD (POST → GET → PUT → PUT inexistente → DELETE → DELETE repetido) |
| 7-12 | `api.test.js` | Validaciones: body vacío, nombre espacios, precio texto, precio 0, nombre >100, PUT con ambos errores |
| 13 | `poblar.test.js` | `poblar_base.sql` carga exactamente 5 productos |

Las pruebas usan una **base temporal** (DB_PATH al OS temp dir) y la borran al finalizar.

## Estado del proyecto

- **9 etapas completadas** (CR → Delete → Update → Validación → Rename → Refactor → Seed → Logger)
- **Último commit**: `a914871` — Agregar versiones PDF del material pedagógico
- **13 tests** pasando
- **Documentación completa**: retrospective de bugs, guía de etapas, docs de tests, diagramas archify, material pedagógico

## Áreas de mejora sugeridas

1. **PATCH** en vez de PUT para actualizaciones parciales
2. **Paginación** en GET (hoy `.all()` trae todo)
3. **Búsqueda/filtrado** por nombre
4. **Rate limiting** para producción
5. **Migraciones** de BD (hoy es un solo `CREATE TABLE` estático)
6. **TypeScript** o JSDoc para tipado
7. **Helmet** para headers de seguridad
8. **Logging estructurado** (pino/winston) en vez de `console.log`

---

*Generado por opencode con Mimo v2.5 Free*
