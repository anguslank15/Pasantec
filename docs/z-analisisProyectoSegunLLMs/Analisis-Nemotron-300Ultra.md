# Análisis del proyecto `zz-js01`

**CRUD de productos** — Node.js + Express 5 + SQLite (better-sqlite3), sin framework frontend (HTML/CSS/JS puro con `fetch()`).

---

## Arquitectura (clean separation)

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| **Entry point** | `src/server.js` | Arranque, pregunta de poblar BD en instalación limpia, `app.listen()` |
| **App Express** | `src/app.js` | Middlewares (logger, JSON, static), monta router `/api/productos` |
| **DB** | `src/db.js` | Conexión SQLite sincrónica, `CREATE TABLE`, `poblarDesdeArchivo()` |
| **Rutas** | `src/routes/productos.js` | CRUD completo: GET/POST/PUT/DELETE con validación |
| **Validación** | `src/validators/productos.js` | Reglas de negocio (nombre ≤100, precio ≥0.01), devuelve array de errores |
| **Frontend** | `public/index.html` | Formulario + tabla, ciclo POST→GET, modo edición, confirmación borrado |

---

## API (`/api/productos`)

| Método | Descripción | Códigos |
|--------|-------------|---------|
| `GET` | Lista productos | 200 |
| `POST` | Crea (valida) | 201 / 400 |
| `PUT` | Reemplaza (valida) | 200 / 400 / 404 |
| `DELETE` | Borra | 204 / 404 |

**Validación**: acumula **todos** los errores (`400 { errores: [...] }`), no corta en el primero.

---

## Testing (`npm test` → `node --test`)

- **13 tests** (12 API + 1 seed) con **supertest** + `node:test`
- **BD temporal aislada** por `DB_PATH` (nunca toca `mi_base_de_datos.db`)
- `LOG_REQUESTS=off` silencia logger en tests
- Limpieza automática con `after()` hook

---

## Instalación limpia (etapa 8)

1. `npm install`
2. `node src/server.js` → detecta BD inexistente → pregunta poblar con `poblar_base.sql`
3. Responder `s` carga 5 productos ejemplo

---

## Puntos fuertes del código

- **Prepared statements** en todo SQL (previene inyección)
- **Variables de entorno** para config (`DB_PATH`, `PORT`, `LOG_REQUESTS`)
- **Comentarios pedagógicos** extensos (pensado para aprendizaje)
- **Separación limpia**: app no escucha, server.js es único entry point
- **Tests hermeticos**: BD temporal única por archivo de test

---

## Estructura de archivos clave

```
zz-js01/
├── src/
│   ├── server.js           # arranque + prompt poblar
│   ├── app.js              # Express + middlewares + router
│   ├── db.js               # SQLite + seed
│   ├── routes/productos.js # CRUD endpoints
│   └── validators/productos.js
├── public/index.html       # Frontend vanilla
├── test/
│   ├── api.test.js         # 12 tests CRUD + validaciones
│   └── poblar.test.js      # 1 test seed
├── poblar_base.sql         # 5 productos ejemplo
└── mi_base_de_datos.db     # BD real (gitignored)
```