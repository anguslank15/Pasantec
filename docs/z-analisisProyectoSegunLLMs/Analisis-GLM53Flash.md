# Análisis del proyecto zz-js01 — CRUD de productos

**Fecha**: 16 de septiembre de 2026  
**Modelo**: GLM-5.3-Flash (z.ai), vía el Gentleman (harness Pi)

---

## Stack

Node.js (≥22) · Express 5 · better-sqlite3 · HTML/CSS/JS puro con `fetch()` (sin frameworks frontend)

**Estado verificado:** `npm test` → **14/14 pruebas pasan** ✅ (árbol de git limpio al momento del análisis)

---

## Arquitectura (separación por responsabilidad)

| Capa | Archivo | Responsabilidad |
| ------ | --------- | ----------------- |
| Arranque | `src/server.js` | Único `listen()`; prompt de seed solo en instalación limpia y con TTY |
| App Express | `src/app.js` | Cadena de middlewares (logger → json → static → router → **handler de errores**) |
| Datos | `src/db.js` | Conexión SQLite sincrónica + `poblarDesdeArchivo()` |
| Rutas | `src/routes/productos.js` | CRUD completo con validación previa a todo acceso a la base |
| Reglas | `src/validators/productos.js` | Acumula TODOS los errores, no corta en el primero |
| Frontend | `public/index.html` | Formulario con modo edición, tabla, confirm de borrado |

**Clave de testabilidad:** `app.js` exporta la app sin `listen()`; supertest la inyecta sin abrir puerto, y `server.js` queda como único punto de arranque real.

## Fortalezas (verificadas sobre el código, no de adorno)

1. **Testabilidad de primera.** Los tests setean `DB_PATH` a un archivo temporal *antes* de requerir `src/` (el require de `db.js` abre la base: el orden es crítico) y hacen `db.close()` antes de borrar el archivo — detalle de Windows bien resuelto. La base real jamás se toca.
2. **Seguridad con los fundamentos bien puestos:**
   - Sentencias preparadas (`?`) en todo el SQL → sin inyección.
   - `textContent` en vez de `innerHTML` → sin XSS.
   - `express.static` apunta a `public/`, no a la raíz → no expone la base ni el código.
   - Validación siempre en el servidor; el `required` del HTML es solo ayuda visual.
3. **Semántica REST correcta:** `201`/`204`/`400`/`404`, `PUT` como reemplazo completo, `changes === 0` → `404` en vez de un 204 silencioso que miente.
4. **Casos borde pensados:** sin TTY no cuelga el proceso; si el seed falla, el servidor arranca igual; `body` `undefined` no revienta el validador.
5. **Documentación excepcional** para un proyecto educativo: README con troubleshooting real, `ETAPAS.md`, `ERRORES-Y-CORRECCIONES.md`, `PRUEBAS.md`, paquete pedagógico, diagramas archify y 9 tags de git (uno por etapa).

## Debilidades detectadas (en orden de importancia)

| # | Hallazgo | Estado |
| --- | ---------- | -------- |
| 1 | **El frontend no muestra los errores de validación.** La API responde `400 { errores: [...] }` y `guardarProducto()` lo manda a `console.error`: el usuario hace clic en Guardar y no pasa nada visible. Falta pintar ese array en el DOM. | Abierto |
| 2 | **Sin middleware de error centralizado:** un body JSON malformado caía en el handler por defecto de Express y respondía HTML, rompiendo el contrato JSON de la API. | **Resuelto en esta misma sesión**: se agregó el test 13 (`POST con body JSON malformado responde 400 con JSON (no HTML)`) y el handler de errores en `src/app.js` (reconoce `entity.parse.failed` → `400 { errores }`; cualquier otro error → `500` JSON sin filtrar detalles internos). Ciclo TDD: ROJO confirmado, luego VERDE 14/14. |
| 3 | **El `:id` de ruta viaja crudo al SQL.** `/api/productos/abc` da `404` por coerción de SQLite, no por diseño. Validar entero positivo y responder `400` sería más honesto. | Abierto |
| 4 | **Precio como `REAL` (float).** El clásico problema del dinero en punto flotante (`0.1 + 0.2 !== 0.3`). Para aprender está bien; en producción: centavos como `INTEGER` o decimal exacto. | Abierto (anotación pedagógica) |
| 5 | Menores: `GET` sin paginación (aceptable en este alcance), sin `UNIQUE` en `nombre` (tradeoff documentado en el seed). | Abiertos |

## Veredicto

Proyecto **sólido y por encima del promedio** para su propósito: higiene de tests genuina, seguridad con buenos hábitos, REST bien usado y documentación que pocos proyectos serios tienen. La ruta feliz está impecable; lo que faltaba vivía en el **camino del error** — y de ahí, el hueco más grave (contrato JSON roto ante bodies malformados) quedó cerrado durante este análisis. El siguiente paso natural es el punto 1: feedback visible de errores en el formulario.

## Próximos pasos sugeridos (priorizados)

1. Mostrar el array `errores` del 400 en el DOM (div de errores bajo el formulario).
2. Validar `:id` como entero positivo → `400` en vez de confiar en la coerción de SQLite.
3. Decidir política de dinero: `INTEGER` de centavos (o documentar el float como límite del proyecto).
4. Si el proyecto crece: `PATCH` para updates parciales, paginación en `GET`, helmet, logging estructurado.

---

*Generado por el Gentleman (harness Pi) con GLM-5.3-Flash (z.ai)*
