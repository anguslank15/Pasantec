# Análisis del proyecto zz-js01 y propuestas de features

> Generado automáticamente el 2026-09-18

---

## Resumen del estado actual

**zz-js01** es un CRUD completo de productos diseñado como herramienta de aprendizaje:

- **Stack**: Node.js + Express 5 + better-sqlite3 (SQLite embebido)
- **Frontend**: HTML/CSS/JS puro en `public/index.html` servido por `express.static`
- **Tests**: 13 pruebas automatizadas (`node:test` + `supertest`) con base temporal aislada
- **Base de datos**: Archivo único `mi_base_de_datos.db` creado al arrancar
- **Arquitectura modular** en `src/`:
  - `server.js` — Punto de arranque único, pregunta poblar en instalación limpia
  - `app.js` — App Express: middlewares (logger, JSON, static), router, error handler JSON
  - `db.js` — Conexión SQLite sincrónica + `CREATE TABLE IF NOT EXISTS` + seed
  - `routes/productos.js` — 4 endpoints REST con SQL parametrizado
  - `validators/productos.js` — Validación pura, acumula todos los errores

**API** bajo `/api/productos`:
| Método | Acción | Códigos |
|--------|--------|---------|
| GET | Lista todos | 200 |
| POST | Crea (valida) | 201 · 400 |
| PUT /:id | Reemplaza completo (valida) | 200 · 400 · 404 |
| DELETE /:id | Borra | 204 · 404 |

**Documentación existente**: `docs/ERRORES-Y-CORRECCIONES.md`, `docs/ETAPAS.md`, `docs/PRUEBAS.md`, `docs/y-diagramas/` (archify), `docs/pedagogia/`.

---

## Próximas features recomendadas (ordenadas por valor de aprendizaje)

### 1. Paginación y filtrado en `GET /api/productos` 🎯 *Prioridad alta*
**Conceptos**: APIs reales no devuelven todo; `limit`, `offset`, `cursor`, query params, envelope de respuesta.
- `?limit=20&offset=0` + `?search=` + `?sort=precio&order=desc`
- Respuesta: `{ data: [], meta: { total, limit, offset } }`
- Tests edge cases (limit > max, offset fuera de rango)

### 2. Soft delete + auditoría básica 🎯 *Prioridad alta*
**Conceptos**: Borrado real pierde historia; soft delete (`deleted_at`) + tabla `auditoria` (usuario, acción, timestamp, diff).
- `DELETE` pone `deleted_at = NOW()` en lugar de borrar
- `GET` excluye borrados salvo `?includeDeleted=true`
- Endpoint `GET /api/productos/:id/historial`

### 3. Autenticación JWT stateless 🎯 *Prioridad media-alta*
**Conceptos**: Base de todo backend real. Middleware `requireAuth`, roles, refresh tokens, expiración.
- `POST /api/auth/login` → `{ accessToken, refreshToken }`
- `Authorization: Bearer <token>` en rutas protegidas
- `POST /api/auth/refresh` · `POST /api/auth/logout` (blocklist)

### 4. Migraciones de base de datos 🎯 *Prioridad media*
**Conceptos**: `CREATE TABLE IF NOT EXISTS` no escala. Herramienta con versión y rollback.
- `npm run db:migrate` · `npm run db:rollback`
- Migración inicial: `productos` + `auditoria` + `usuarios`
- Seed separado de migraciones

### 5. Validación con esquema declarativo (Zod/Valibot) 🎯 *Prioridad media*
**Conceptos**: Separar reglas de validación de lógica de negocio; type-safety inferido.
- Esquema compartido backend/frontend
- `safeParse` en rutas → errores tipados

### 6. OpenAPI/Swagger generado desde código 🎯 *Prioridad media*
**Conceptos**: Contrato vivo. UI interactiva en `/docs`, generación de cliente TypeScript.

### 7. Rate limiting + security headers 🎯 *Prioridad media-baja*
**Conceptos**: Defensa básica. `express-rate-limit` + `helmet` (CSP, HSTS, no-sniff).

### 8. Docker + CI/CD (GitHub Actions) 🎯 *Prioridad baja (valiosa)*
**Conceptos**: Entorno reproducible + pipeline automatizado.
- `Dockerfile` multi-stage, `docker-compose.yml` con healthcheck
- Workflow: lint → test → build → push en tag

### 9. TypeScript gradual 🎯 *Prioridad baja (opcional)*
**Conceptos**: Migración incremental sin reescribir todo.
- `tsconfig.json` con `allowJs: true`, `checkJs: true`
- JSDoc en `.js` existentes, nuevos en `.ts`

### 10. Frontend: validación cliente + UX loading/error states 🎯 *Prioridad baja*
**Conceptos**: Cerrar el loop UX. Errores inline, botones deshabilitados durante fetch, toasts, confirmaciones accesibles.

---

## Recomendación práctica

**Para seguir aprendiendo backend** → Empezar por **#1 (paginación/filtrado)** + **#2 (soft delete + auditoría)**. Cambios pequeños en `routes/productos.js` + `db.js` que enseñan patrones reales sin cambiar arquitectura.

**Para preparar "producción real"** → **#3 (auth JWT)** + **#4 (migraciones)** + **#6 (OpenAPI)**. Stack mínimo profesional.

---

## Próximos pasos sugeridos

1. Elegir una feature (recomendación: #1 o #2)
2. Ejecutar `/sdd-new <nombre-feature>` para iniciar SDD (exploración → propuesta → spec → design → tasks)
3. O implementar directo (delegated direct) si la feature es pequeña y bien entendida

---

*Archivo generado para trazabilidad y decisión de roadmap.*