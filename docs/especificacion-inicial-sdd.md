# Especificación inicial — Sistema CRUD de productos (zz-js01)

> **Nota de contexto.** Este documento es un ejercicio retrospectivo: simula la
> especificación inicial que se entregaría al inicio del proyecto para llegar,
> mediante Spec-Driven Development (SDD), al estado final que el repositorio
> tiene hoy. Está escrita como si el proyecto no existiera todavía. Al final
> se incluye una sección que explica cómo cada parte alimenta las fases de SDD.

---

## 1. Contexto y objetivo

Se desea construir un **sistema CRUD de productos** con propósito
**pedagógico**: además de funcionar, el código debe servir como material de
enseñanza para personas que se inician en el desarrollo backend con JavaScript.

El producto es un panel de administración de productos (nombre y precio) con:

- una **API REST** en JSON construida con Express,
- una **base de datos SQLite** local,
- un **frontend vanilla** (HTML/CSS/JS sin frameworks) servido por el propio
  servidor,
- **pruebas automatizadas** y **documentación didáctica completa**.

El proyecto debe quedar en condiciones de ser entregado a otra persona para su
continuidad, sin conocimiento previo del proceso de construcción.

## 2. Usuarios y situaciones de uso

| Usuario | Situación |
|---|---|
| Administrador del catálogo | Crear, listar, editar y borrar productos desde una página web sencilla. |
| Estudiante de programación | Leer el código y la documentación para entender cómo funciona un CRUD full-stack real. |
| Desarrollador que continúa el proyecto | Instalar desde cero, ejecutar las pruebas y seguir el historial por etapas. |

## 3. Alcance funcional

1. Listado, creación, edición y borrado de productos (CRUD completo).
2. Una única página web servida en la raíz `/` por el mismo servidor.
3. API REST bajo `/api/productos` que responde en JSON.
4. Sembrado inicial opcional de 5 productos de ejemplo en una instalación
   limpia (pregunta interactiva al arrancar).
5. Registro de peticiones HTTP en la consola del servidor y de códigos de
   respuesta en la consola del navegador.

## 4. Requisitos funcionales

### 4.1 API

| Método | Ruta | Éxito | Errores | Comportamiento |
|---|---|---|---|---|
| GET | `/api/productos` | 200 | — | Devuelve un array JSON `[{id, nombre, precio}]`. |
| POST | `/api/productos` | 201 | 400 | Valida el cuerpo; si hay errores responde `{"errores": [...]}`. Si es válido, recorta el nombre (`trim`), inserta con parámetros preparados y devuelve `{id, nombre, precio}` con el id generado. |
| PUT | `/api/productos/:id` | 200 | 400, 404 | Misma validación que POST. Si el id no existe responde 404 con `{"error": "Producto no encontrado"}` (detección vía `changes === 0`). |
| DELETE | `/api/productos/:id` | 204 | 404 | Sin cuerpo en éxito. Si el id no existe, 404 con `{"error": "Producto no encontrado"}`. |

### 4.2 Validación (regla de negocio central)

La validación ocurre **en el servidor** y **acumula todos los errores en un
solo intento** (no corta en el primero); la respuesta 400 contiene el array
completo `{"errores": ["...", "..."]}`.

Reglas exactas del producto:

| Campo | Regla | Mensaje de error exacto |
|---|---|---|
| `nombre` | Obligatorio, debe ser texto; espacios en blanco cuentan como vacío (`trim`). | `"El nombre es obligatorio y debe ser texto."` |
| `nombre` | Máximo 100 caracteres (tras el `trim`). | `"El nombre no puede superar los 100 caracteres."` |
| `precio` | Obligatorio, debe ser número finito (`Number.isFinite`; se rechazan strings como `"10"`, `NaN`, `Infinity`). | `"El precio es obligatorio y debe ser un número."` |
| `precio` | Mínimo **0.01** (cero y negativos rechazados). | `"El precio mínimo permitido es 0.01."` |

Detalles defensivos obligatorios: el validador recibe `body || {}` (un cuerpo
ausente debe producir 400, nunca un 500), y nunca debe usarse la condición
falsy `!precio` (trampa clásica que aceptaría `0` y rechazaría precios
válidos).

### 4.3 Frontend (una sola página, sin frameworks)

- Formulario con `nombre` (texto) y `precio` (numérico, `step="0.01"`),
  validación nativa `required` como primera barrera (el servidor revalida
  todo).
- Tabla con columnas ID / Nombre / Precio / Acción; el precio se formatea como
  `$ X.XX` (`toFixed(2)`).
- **Modo edición**: al editar, el formulario se precarga, el botón cambia a
  "Guardar cambios" y aparece un botón "Cancelar" que restaura el modo carga.
- Borrado con confirmación nativa (`confirm`) antes de llamar a DELETE.
- Tras cada mutación se recarga el listado, **esperando** la respuesta de la
  mutación antes del GET (orden POST→GET explícito).
- Manejo de errores resiliente: se verifica `respuesta.ok` manualmente (fetch
  no lanza excepción en 4xx/5xx), cada llamada va envuelta en `try/catch`
  (un servidor caído no rompe la página), y ante fallo **el formulario no se
  limpia** (el dato del usuario no se pierde).
- Todo el contenido dinámico se inserta con `textContent` (nunca
  `innerHTML`), para evitar XSS.
- Se registra en consola del navegador el código de respuesta de cada fetch.

### 4.4 Instalación limpia y poblado inicial

Al arrancar, si el archivo de base de datos **no existe**:

1. Preguntar por terminal (readline): `"No encontré la base de datos.
   ¿Poblarla con datos de ejemplo (poblar_base.sql)? [s/N] "` — **el default
   es No** (Enter a secas no puebla).
2. Aceptar con: `s`, `si`, `y`, `yes` (comparación tras `trim` +
   `minúsculas`).
3. Si no hay terminal interactiva (stdin no TTY, típicamente CI o scripts),
   **no bloquear**: crear la base vacía y continuar.
4. Si se acepta, ejecutar `poblar_base.sql` (5 productos de ejemplo). Si la
   ejecución del script falla, **el servidor arranca igual** con la base
   vacía (el fallo del poblado no es fatal).

Orden de arranque deliberado: verificar la existencia del archivo **antes**
de abrir la conexión (abrir la conexión crea el archivo, lo que haría
inalcanzable la pregunta).

### 4.5 Registro de peticiones (logger)

- Middleware que registra en consola del servidor cada entrada
  (`→ MÉTODO /ruta`) y su salida (`← código`) usando el evento `finish` de la
  respuesta.
- Se silencia con la variable de entorno `LOG_REQUESTS=off` (útil para tests).
- Debe ser el **primer** middleware, para ver absolutamente todas las
  peticiones.

## 5. Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL
)
```

- Archivo de base de datos: `mi_base_de_datos.db` en la raíz del proyecto,
  sobreescribible con la variable de entorno `DB_PATH`.
- **Sin restricción UNIQUE** sobre nombre (explícito y documentado: ejecutar
  el poblado dos veces duplica filas).
- Semilla (`poblar_base.sql`), exactamente 5 productos: Teclado Mecánico
  45.99, Mouse Inalámbrico 25.50, Monitor 24 Pulgadas 179.00, Auriculares
  Bluetooth 59.90, Pad Mouse Gamer 12.00.

## 6. Requisitos no funcionales y técnicos

- **Runtime**: Node.js ≥ 22 (exigencia de `better-sqlite3`). Puerto por
  defecto 3000 (sobreescribible con `PORT`).
- **Stack**: Express 5, `better-sqlite3` (driver síncrono), `node:test` +
  `node:assert` + `supertest` para pruebas. Sin más dependencias.
- **Módulos CommonJS** (`require` / `module.exports`), declarado explícito en
  `package.json`.
- **Frontend vanilla**: HTML, CSS y JS del navegador sin frameworks ni
  build step.
- **Seguridad**: consultas siempre con parámetros preparados (inyección SQL),
  contenido dinámico con `textContent` (XSS), y `express.static` apuntando
  **solo** a `public/` — nunca a la raíz del proyecto — para no exponer la
  base de datos, el código fuente ni el `package.json` por HTTP.
- **Estilo didáctico**: cada archivo fuente abre con un comentario de cabecera
  en español (propósito, etapa de origen, conceptos que enseña); los comentarios
  marcan trampas clásicas (`!precio` falsy, `innerHTML` vs `textContent`,
  caché de `require`, orden de middlewares).

## 7. Arquitectura objetivo

Separación modular bajo `src/` desde el diseño (no un monolito):

| Módulo | Responsabilidad |
|---|---|
| `src/app.js` | Construye la app Express: logger → `express.json()` → `express.static(public)` → router. **Exporta la app sin escuchar** (clave para probarla con supertest sin puerto). |
| `src/server.js` | Único punto de arranque: pregunta de poblado, sembrado, `app.listen`. |
| `src/db.js` | Conexión better-sqlite3 (respeta `DB_PATH`), `CREATE TABLE IF NOT EXISTS`, helper `poblarDesdeArchivo()`. Exporta `{ db, poblarDesdeArchivo }`. |
| `src/routes/productos.js` | Router CRUD montado en `/api/productos`. |
| `src/validators/productos.js` | `validarProducto(body)` → array de errores. |

El orden de los middlewares es parte del diseño y debe estar documentado en
el código: logger primero (ve todo), JSON parser, estáticos solo de
`public/`, router al final.

## 8. Pruebas automatizadas

- **13 pruebas** en total, todas verdes:
  - **12 de API** (`test/api.test.js`): cadena feliz CRUD (POST 201 → GET
    contiene lo creado → PUT 200 → PUT inexistente 404 → DELETE 204 → DELETE
    repetido 404) + 6 casos de validación 400 (cuerpo vacío, nombre en
    blanco, precio string, precio 0, nombre de 101 caracteres, y PUT con dos
    errores acumulados juntos).
  - **1 de poblado** (`test/poblar.test.js`): el SQL de semilla inserta
    exactamente 5 filas con los valores esperados.
- **Aislamiento**: cada archivo de test crea su base temporal en `os.tmpdir()`
  vía `process.env.DB_PATH` **antes de requerir cualquier módulo de `src/`**
  (la conexión se abre en el momento del `require`), y silencia el logger con
  `LOG_REQUESTS=off`. En Windows: cerrar la conexión (`db.close()`) antes de
  borrar el archivo temporal.
- **Comando exacto**: `npm test` → `node --test "test/**/*.test.js"`
  (en Node 25 el runner falla si se le pasa un directorio como argumento
  posicional).

## 9. Documentación entregable

| Documento | Propósito |
|---|---|
| `README.md` | Guía completa: instalación, tabla de API, ejecución de tests, historial de etapas, resolución de problemas. |
| `docs/ETAPAS.md` | Guía de viaje por las etapas: cómo visitar cada estado con los tags de git y qué funcionaba en cada una. |
| `docs/PRUEBAS.md` | Guía de la suite de tests: matriz de 13 casos, patrón de aislamiento, cómo agregar un test nuevo. |
| `docs/ERRORES-Y-CORRECCIONES.md` | Retrospectiva de los errores reales del desarrollo, la "cadena" navegador→servidor→base y el método de depuración. |
| `docs/pedagogia/` | Paquete pedagógico formal (índice, análisis del proyecto, guía de estudio en 6 niveles, desarrollo teórico con fragmentos de código), en `.md` y `.pdf`. |
| `docs/y-diagramas/` | Diagramas interactivos: arquitectura, secuencia POST→GET, ciclo de vida de un producto (estados, verbos, códigos). |

Registro de la documentación: el material **pedagógico** se escribe en
español formal impersonal; los documentos **operativos** (README, guías) y la
conversación de trabajo usan voseo rioplatense cercano al estudiante.

## 10. Restricciones de proceso y entrega

1. **Entrega incremental por etapas**, cada una con nombre y commit(s)
   propio, cerrando con un tag `etapa-N-nombre`:
   - Etapas 1–2: Create + Read (API y página básica).
   - Etapa 3: Delete.
   - Etapa 4: Update (PUT + modo edición en el frontend).
   - Etapa 5: Validación en servidor (400/201).
   - Etapa 6: Renombrar el frontend a `public/index.html` servido en `/`.
   - Etapa 7: Modularización en `src/` + suite de tests automatizados.
   - Etapa 8: Pregunta de poblado en instalación limpia.
   - Etapa 9: Logger de peticiones HTTP.
2. Antes de comenzar una etapa nueva, **pushear la etapa anterior** (commit +
   tag). El historial de tags debe permitir "viajar en el tiempo" por el
   proyecto.
3. **Commits en español**, modo imperativo, con cuerpo explicativo orientado
   a programadores noveles.
4. El trabajo de implementación se **delega a subagentes** para resguardar el
   contexto principal; quien orquesta verifica, commitea y pushea.
5. Ante encargos ambiguos o inconsistentes, **preguntar antes de empezar**
   (no suponer).

## 11. Fuera de alcance

Autenticación y usuarios; paginación u ordenamiento; `GET /api/productos/:id`
individual; capa repository o abstracción de persistencia; middleware central
de errores; CI/CD; despliegue; ORM; i18n. (Posibles evoluciones futuras, no
comprometidas para la versión 1.0.0.)

## 12. Criterios de aceptación globales

- [ ] Las 13 pruebas pasan (`npm test`, 13/13).
- [ ] Instalación limpia completa: `npm install` → `npm start` pregunta si
      poblar; aceptar deja 5 productos; rechazar arranca con base vacía.
- [ ] Matriz de casos por curl/HTTP verde: 200/201/204 en éxitos y
      400/404 con los cuerpos de error especificados.
- [ ] El frontend en `/` permite crear, editar, borrar y listar, con los
      comportamientos resilientes de la sección 4.3.
- [ ] `express.static` no expone nada fuera de `public/`.
- [ ] Los 9 tags `etapa-N-nombre` existen y están pusheados.
- [ ] La documentación de la sección 9 existe y está vinculada desde el
      README.

---

## 13. Cómo esta especificación alimenta el flujo SDD

Esta sección es la parte didáctica del ejercicio: muestra qué hace el flujo
SDD con cada sección del brief inicial.

```
brief inicial → explore → proposal → spec → design → tasks → apply → verify → archive
```

| Fase SDD | Qué consume de este brief | Qué produce |
|---|---|---|
| **explore** | Secciones 1–3 (contexto, alcance) y 6 (stack). | Comparativas de opciones técnicas: Express 5 vs 4, `better-sqlite3` vs `sqlite3`, `node:test` vs Jest, frontend vanilla vs framework. Sin crear archivos. |
| **proposal** | Secciones 1–3, 11 y 12. | El "por qué / qué cambia / impacto": por qué un CRUD pedagógico, qué se construye, qué explícitamente no. |
| **spec** | Secciones 4 y 5 (requisitos funcionales, reglas de negocio, modelo). | Especificación formal con **escenarios** por requisito: cada fila de la tabla de la API y cada regla de validación se convierte en escenarios con nombre (happy path + cada error). Ejemplo: `RF-PRECIO-MINIMO — si precio < 0.01 → 400 con "El precio mínimo permitido es 0.01."`. |
| **design** | Secciones 6–8 (no funcionales, arquitectura, pruebas). | Decisiones técnicas concretas: split `app.js`/`server.js` para testabilidad, orden de middlewares, patrón de aislamiento de tests vía `DB_PATH`, guardas (`body \|\| {}`, TTY check). |
| **tasks** | Sección 10 (etapas) + 8 (matriz de tests). | Las 9 etapas se convierten en unidades de trabajo con dependencias explícitas: cada etapa = implementación + sus tests + commit con tag + push de la anterior. |
| **apply** | Las tareas anteriores. | Código, commits y tags por etapa. El brief no se consulta para implementar: se implementan las tareas. |
| **verify** | Sección 12 (criterios de aceptación). | Evidencia: 13/13 tests, flujo de instalación limpia, matriz HTTP, existencia de tags y docs. Reporta CRITICAL / WARNING / SUGGESTION contra la spec. |
| **archive** | Todo lo anterior. | Cierre del cambio: specs definitivas sincronizadas, memoria del proceso, lecciones aprendidas. |

**La idea central del ejercicio**: el brief inicial no es la especificación
formal. El brief declara **intención, alcance y restricciones** (qué y por
qué, con las reglas de negocio que sí o sí deben respetarse); las fases SDD lo
refinan progresivamente hasta llegar al **cómo** (spec → design → tasks). Un
buen brief como este reduce el trabajo de todas las fases siguientes: deja
pocas ambigüedades que resolver y ninguna decisión de producto tomada a
medias.
