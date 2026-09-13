# Análisis del Proyecto zz-js01 — CRUD de Productos (Express + SQLite)

## 1. Visión general

Es una **aplicación web de aprendizaje** que implementa un CRUD completo de productos con un enfoque pedagógico extremadamente bien documentado. Stack: **Node.js 22+ / Express 5 / better-sqlite3 (SQLite)** para el backend, **HTML + CSS + JS puro** para el frontend, y **`node:test` + `supertest`** para las pruebas.

**13 pruebas automatizadas → todas pasan ✅**

---

## 2. Estructura y arquitectura

```
src/
├── server.js          ← Punto de entrada único (arranque + pregunta de seed)
├── app.js             ← App Express (middlewares + router mount)
├── db.js              ← Conexión SQLite + función poblarDesdeArchivo()
├── routes/
│   └── productos.js   ← 4 rutas CRUD: GET/POST/PUT/DELETE /api/productos
└── validators/
    └── productos.js   ← validarProducto(): regla de negocio, devuelve array de errores
public/
└── index.html         ← Frontend completo (formulario + tabla + fetch())
test/
├── api.test.js        ← 12 pruebas (cadena CRUD + validaciones)
└── poblar.test.js     ← 1 prueba del seed (exactamente 5 productos)
docs/                  ← README, ERRORES-Y-CORRECCIONES, ETAPAS, PRUEBAS + diagramas archify
docs/pedagogia/        ← Paquete pedagógico formal (análisis, guía de estudio, material didáctico)
```

**Arquitectura de 3 capas**: Navegador → Express → SQLite, con separación clara entre presentación (`public/`), lógica de negocio (`validators/`), orquestación (`routes/`), persistencia (`db.js`) y punto de entrada (`server.js`).

---

## 3. Puntos destacados técnicos

| Aspecto | Detalle |
|---------|---------|
| **Isolamiento de tests** | `DB_PATH` se setea *antes* de cualquier `require` de `src/`, porque `db.js` abre la base en el momento del `require`. CommonJS cachea los módulos, así que test y app comparten la misma conexión `db`. |
| **Validación defensiva** | `Number.isFinite` (no `!precio`) para el precio; `body \|\| {}` para evitar `undefined`; `trim()` + `typeof` para el nombre. |
| **Prevención de inyección SQL** | Prepared statements con `?` en todas las consultas. |
| **Prevención de XSS** | `textContent` en vez de `innerHTML` para construir la tabla. |
| **Patrón de ciclo de vida** | El frontend siempre hace **mutar → refrescar** (POST/PUT/DELETE → `await cargarProductos()`). |
| **Logger configurable** | Middleware de logging en `app.js` con `LOG_REQUESTS=off` para tests. |
| **Instalación limpia** | `server.js` pregunta si poblar la base en primer arranque con `[s/N]`, protegido contra contextos sin TTY. |

---

## 4. API REST

| Método | Ruta | Respuesta | Descripción |
|--------|------|-----------|-------------|
| `GET` | `/api/productos` | `200` | Lista todos los productos |
| `POST` | `/api/productos` | `201` / `400` | Crea un producto (valida nombre ≤100 chars, precio ≥0.01) |
| `PUT` | `/api/productos/:id` | `200` / `400` / `404` | Reemplaza un producto existente |
| `DELETE` | `/api/productos/:id` | `204` / `404` | Borra un producto |

---

## 5. Historial de desarrollo (10 etapas)

El proyecto se construyó **por etapas con tags de git**, cada una documentada en `docs/ETAPAS.md`:

1. **Etapa 1** — Código original con 2 bugs didácticos (`ReferenceError` + `Cannot GET`)
2. **Etapa 2** — Fixes: `guardarProducto()` + `express.static` + tabla en vivo
3. **Etapa 3** — `DELETE /:id` + botón Borrar con `confirm()`
4. **Etapa 4** — `PUT /:id` + modo edición del formulario
5. **Etapa 5** — Validación en servidor (`400`) + `201` en POST
6. **Etapa 6** — Frontend renombrado a `public/index.html`, servido en `/`
7. **Etapa 7** — Refactor a `src/` modular + tests automatizados (`npm test`)
8. **Etapa 8** — Pregunta de población en instalación limpia
9. **Etapa 9** — Logger de pedidos en consola (`LOG_REQUESTS=off`)
10. **Presente** — Documentación completa + paquete pedagógico formal

---

## 6. Evaluación formal

### Fortalezas
- **Excelente calidad pedagógica**: cada archivo está comentado línea por línea con explicaciones didácticas, y existe un paquete pedagógico formal completo (3 documentos con progresión 1→4→5).
- **Patrón de aislamiento de tests impecable**: el orden de `process.env.DB_PATH` antes de los `require` es una decisión arquitectónica sólida.
- **Código limpio y modular**: responsabilidad única por archivo, CommonJS bien estructurado.
- **Programación defensiva**: prepared statements, `textContent`, validación de tipos, protección TTY.
- **Documentación exhaustiva**: README, ERRORES-Y-CORRECCIONES, ETAPAS, PRUEBAS, diagramas interactivos (archify), y material didáctico formal.

### Aspectos a considerar
- **`better-sqlite3` es síncrono** — bloqueante; para esta escala (5-10 productos) es aceptable, pero no escalaría bien.
- **La tabla no tiene `UNIQUE`** — el seed puede duplicar si se ejecuta 2x; el test `poblar.test.js` lo detecta, pero es un riesgo latente.
- **Sin autenticación/seguridad** — es una app de aprendizaje, pero expone la base de datos sin ningún control de acceso.
- **`req.params.id` sin validación** — se pasa directamente a SQL sin verificar que sea numérico (funciona con SQLite por flexibilidad tipada, pero no es robusto).
- **No hay manejo de errores global** — si `better-sqlite3` lanza un error no capturado, el servidor se cae.

---

## 7. Conclusión

Es un proyecto de aprendizaje **muy bien construido**, con una arquitectura limpia, documentación excepcional y un enfoque pedagógico reflexivo. Las 13 pruebas pasan sin fallas y el historial de desarrollo por etapas es una herramienta didáctica valiosa para entender la evolución de una aplicación real. zz-js01 se consolida como un caso de estudio completo — del formulario al disco, y del disco de vuelta a la tabla — en el que el ciclo HTTP, el CRUD, la separación de capas, la validación, la programación defensiva, la asincronía, las pruebas y la modularidad no se describen en abstracto, sino que funcionan juntos en una aplicación real que puede ejecutarse, observarse y ponerse a prueba.
