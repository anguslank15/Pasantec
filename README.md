# zz-js01 — CRUD de productos (Express + SQLite)

Mini aplicación web de aprendizaje: un **CRUD completo** de productos — formulario para **crear y editar**, tabla que **lista** y **borra** — con backend Node.js + Express y base de datos SQLite en un solo archivo.

```
[ Navegador ]  --HTTP-->  [ Express (src/server.js) ]  --SQL-->  [ SQLite (mi_base_de_datos.db) ]
   public/            /api/productos (GET·POST·PUT·DELETE)      archivo en disco
```

- Sin frameworks frontend: HTML + CSS + JavaScript puro, con `fetch()`.
- La base se crea sola en el primer arranque; no hay servidor de base que instalar.

Documentación complementaria: [`docs/ERRORES-Y-CORRECCIONES.md`](docs/ERRORES-Y-CORRECCIONES.md) — retrospectiva de los bugs del proyecto y la técnica de depuración usada.

---

## Camino rápido (si ya tenés Node)

1. `npm install`
2. `node src/server.js`
3. Abrir <http://localhost:3000/>

## Instalación desde cero en un equipo nuevo

### 1. Instalar Node.js (requisito: versión 22 o superior)

La dependencia `better-sqlite3` exige **Node ≥ 22**; recomendado la versión LTS vigente.

| Sistema | Cómo instalar |
| --------- | --------------- |
| Windows | Descargar el instalador LTS de <https://nodejs.org> y seguir el asistente, o desde una terminal: `winget install OpenJS.NodeJS.LTS` |
| macOS | Instalador de <https://nodejs.org>, o con Homebrew: `brew install node@22` |
| Linux (Debian/Ubuntu) | `sudo apt install nodejs npm` (si el repositorio trae una versión vieja, usar los paquetes de <https://github.com/nodesource/distributions>) |

Verificar la instalación (ambos comandos deben responder con versión ≥ 22):

```bash
node -v
npm -v
```

> `node` ejecuta JavaScript del lado servidor; `npm` es su gestor de paquetes. Se instalan juntos.

### 2. Obtener el código

Clonar el repositorio (cuando esté publicado) o copiar la carpeta del proyecto completa **sin** `node_modules/` y **sin** `mi_base_de_datos.db`: ambos se regeneran en los pasos siguientes (están ignorados por git a propósito).

### 3. Instalar las dependencias

Desde la carpeta del proyecto:

```bash
npm install
```

Esto lee `package.json` y descarga Express y better-sqlite3 en `node_modules/`. Puede tardar unos minutos (better-sqlite3 incluye un binario nativo).

### 4. Levantar el servidor

```bash
node src/server.js
```

En el primer arranque se crean automáticamente el archivo `mi_base_de_datos.db` y la tabla `productos`. Si es una **instalación limpia** (el archivo de la base no existía), antes de ese mensaje el servidor pregunta:

```
No encontré la base de datos. ¿Poblarla con datos de ejemplo (poblar_base.sql)? [s/N]
```

Respondé `s` para cargar los 5 productos de ejemplo; cualquier otra respuesta (o solo Enter) crea la base vacía.

Verás:

```
Servidor corriendo en http://localhost:3000
```

Dejá esta terminal abierta: mientras corre, el servidor atiende pedidos. Para detenerlo: `Ctrl+C`.

### 5. Abrir la aplicación

Navegador en <http://localhost:3000/> — cargá un producto con el formulario y debería aparecer en la tabla.

## Poblar la base con datos de ejemplo

**La forma más fácil:** en el primer arranque con la base sin crear, respondé `s` a la pregunta del servidor (ver paso 4) — es este mismo paso, sin comandos. Las opciones A y B de abajo quedan para cuando la base ya existe y querés poblarla (o repoblarla) a mano.

**Precondición:** haber levantado el servidor al menos una vez (paso 4), porque la tabla la crea `src/server.js` al arrancar.

Opción A — con Node (ya lo tenés por el paso 1; usar **PowerShell o Git Bash** en Windows):

```bash
node -e 'const db=require("better-sqlite3")("mi_base_de_datos.db");db.exec(require("fs").readFileSync("poblar_base.sql","utf8"));console.log("Productos en la base:",db.prepare("SELECT COUNT(*) AS c FROM productos").get().c)'
```

Opción B — con el cliente `sqlite3` (si lo tenés instalado; viene aparte de Node):

```bash
sqlite3 mi_base_de_datos.db ".read poblar_base.sql"
```

> El script `poblar_base.sql` no verifica duplicados: ejecutarlo dos veces inserta los productos otra vez. Dentro del archivo hay un `DELETE` opcional comentado para poblar "desde cero".

**Reset total de la base** (útil para pruebas): detener el servidor, borrar `mi_base_de_datos.db`, levantar el servidor (la crea vacía) y volver a poblar.

## Estructura del proyecto

| Archivo / carpeta | Qué es |
| ------------------- | -------- |
| `src/` | Backend modular: `app.js` (app Express + mapa de la API), `server.js` (arranque), `db.js` (conexión SQLite), `routes/productos.js` (rutas) y `validators/productos.js` (validación). Comentario a comentario, pensado para leerse de arriba a abajo. |
| `test/` | Pruebas automatizadas de la API (`node:test` + supertest): corren con `npm test` y usan una base temporal, nunca la real. |
| `public/index.html` | Frontend: CRUD completo (formulario + tabla) servido automáticamente en la raíz por `express.static`. Comentado para aprender. |
| `poblar_base.sql` | Datos de ejemplo para llenar la base. |
| `package.json` / `package-lock.json` | Dependencias del proyecto (qué instala `npm install`). |
| `mi_base_de_datos.db` | La base SQLite. **No se versiona** (`.gitignore`); se crea al arrancar. |
| `docs/ERRORES-Y-CORRECCIONES.md` | Guía de repaso: errores del proyecto, correcciones y método de depuración. |
| `docs/y-diagramas/` | Diagramas interactivos (archify): arquitectura, secuencia del ciclo POST→GET y ciclo de vida de un producto. Abrir los `.html` en el navegador. |

## API

| Método y ruta | Qué hace | Body (JSON) | Respuestas |
| --------------- | ---------- | ------------- | ------------ |
| `GET /api/productos` | Lista todos los productos | — | `200` |
| `POST /api/productos` | Crea un producto | `{ "nombre": "string", "precio": número }` | `201` · `400` si los datos no cumplen las reglas |
| `PUT /api/productos/:id` | Reemplaza un producto existente | ídem | `200` · `400` datos inválidos · `404` id inexistente |
| `DELETE /api/productos/:id` | Borra un producto | — | `204` · `404` id inexistente |

**Reglas de validación** (las aplica el servidor a POST y PUT — el `required` del formulario es ayuda visual, la última palabra la tiene el backend):

- `nombre`: texto obligatorio, se recortan espacios, máximo **100 caracteres**.
- `precio`: número finito, mínimo **0.01** (no se acepta 0 ni negativos).

Con datos inválidos la API responde `400` con **todos** los errores juntos:

```json
{ "errores": ["El nombre es obligatorio y debe ser texto.", "El precio mínimo permitido es 0.01."] }
```

El ciclo de vida completo de un producto (estados, verbo HTTP y códigos de respuesta) está diagramado en [`docs/y-diagramas/ciclo-vida-producto.html`](docs/y-diagramas/ciclo-vida-producto.html).

## Comandos útiles

```bash
npm test                       # corre las pruebas de la API (node --test)
node src/server.js             # servidor en el puerto 3000
PORT=3100 node src/server.js   # mismo servidor en otro puerto

# Mientras corre, la consola del servidor narra cada pedido con su código de respuesta (→ GET /api/productos · ← 200). LOG_REQUESTS=off lo silencia

# Pruebas manuales de la API (Git Bash / PowerShell)
curl http://localhost:3000/api/productos                                   # listar
curl -X POST http://localhost:3000/api/productos -H "Content-Type: application/json" -d "{\"nombre\":\"Prueba\",\"precio\":9.99}"   # crear
curl -X PUT http://localhost:3000/api/productos/1 -H "Content-Type: application/json" -d "{\"nombre\":\"Editado\",\"precio\":12.5}"   # editar
curl -X DELETE http://localhost:3000/api/productos/1                        # borrar (204; si el id no existe, 404)
```

## Tests

`npm test` corre las **13 pruebas automatizadas** con el corredor nativo de Node (`node --test`): 12 de la API en [`test/api.test.js`](test/api.test.js) — CRUD completo y códigos `400`/`404` — y 1 del seed en [`test/poblar.test.js`](test/poblar.test.js), que verifica que `poblar_base.sql` carga exactamente los 5 productos de ejemplo.

Las pruebas usan una **base temporal** (variable de entorno `DB_PATH` apuntando a un archivo en la carpeta de temporales del sistema): nunca tocan `mi_base_de_datos.db`.

```bash
npm test
```

Guía completa: cómo están construidos y cómo extenderlos en [`docs/PRUEBAS.md`](docs/PRUEBAS.md).

## Etapas del proyecto (para quien lo continúe)

El proyecto se construyó por etapas; cada una es un commit con su tag de git:

| Etapa | Tag | Qué agregó |
| ------- | ----- | ------------ |
| 1-2 | — | Crear y listar (CR), con los bugs iniciales documentados en [`docs/ERRORES-Y-CORRECCIONES.md`](docs/ERRORES-Y-CORRECCIONES.md) |
| 3 | `etapa-3-delete` | Borrar: `DELETE /:id` + botón Borrar con confirmación |
| 4 | `etapa-4-update` | Editar: `PUT /:id` + modo edición del formulario |
| 5 | `etapa-5-validacion` | Validación en el servidor (`400`) + `201` en POST |
| 6 | `etapa-6-rename` | Frontend renombrado a `public/index.html`, servido en la raíz (`/`) |
| 7 | `etapa-7-src-tests` | Refactor a `src/` modular + tests automatizados (`npm test`) |
| 8 | `etapa-8-poblar` | Instalación limpia: pregunta si poblar la base con `poblar_base.sql` |
| 9 | `etapa-9-logger` | La consola del servidor muestra cada pedido y su código de respuesta (`LOG_REQUESTS=off` para silenciar) |

Para ver el proyecto tal como estaba en una etapa (solo lectura y pruebas):

```bash
git switch --detach etapa-3-delete   # viajar a esa etapa
node src/server.js                    # probar la app de ese momento
git switch main                       # volver al presente
```

Guía completa del viaje etapa por etapa (con comandos verificados en cada tag): [`docs/ETAPAS.md`](docs/ETAPAS.md).

## Problemas frecuentes

| Síntoma | Causa | Solución |
| --------- | ------- | ---------- |
| `EADDRINUSE` / puerto 3000 ocupado | Ya hay otro proceso en ese puerto (probablemente otra instancia del server) | Detener la otra instancia, o usar otro puerto: `PORT=3100 node src/server.js` |
| `Cannot GET /` | El servidor no tiene montado `express.static` (versión vieja del código) o entraste por un puerto distinto al que escucha | Confirmar el puerto del mensaje de arranque y la versión de `src/server.js` |
| `npm install` falla compilando better-sqlite3 | Node viejo o faltan herramientas de compilación | Verificar `node -v` ≥ 22; en Windows reinstalar con el instalador oficial LTS |
| Guardo y no aparece nada | El frontend no llega al servidor: revisar consola del navegador (F12) y pestaña Network | Ver [`docs/ERRORES-Y-CORRECCIONES.md`](docs/ERRORES-Y-CORRECCIONES.md) |
| Abrí el HTML como archivo (`file://`) | Las rutas `/api/...` no resuelven sin servidor | Entrar siempre por `http://localhost:3000/` |
