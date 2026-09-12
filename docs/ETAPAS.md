# Etapas — guía de viaje por la historia del proyecto

Esta guía te invita a **viajar por la historia de zz-js01**: volver con git a cada etapa del proyecto, levantar la app *tal como era en ese momento* y probar con tus propias manos lo que se acababa de agregar (y comprobar lo que todavía no existía). No es una lectura pasiva: cada sección trae el comando exacto para correr esa época y la URL exacta para abrirla en el navegador.

La tabla resumen de etapas está en el [README](../README.md#etapas-del-proyecto-para-quien-lo-contin%C3%BAe); acá está la experiencia completa: cómo llegar, cómo probar y qué mirar en cada parada.

> **Todo lo documentado acá fue verificado de verdad**: cada tag de esta guía se revisó con `git switch --detach`, se levantó su servidor y se probó su URL. Los comandos y las respuestas que ves son los que respondieron **en esa época**, no los de hoy. Ese es el punto más importante de la guía: **los comandos cambiaron a lo largo de la historia** — y confundir la forma de correr de hoy con la de ayer es el error clásico del viajero del tiempo.

---

## 1. El mapa del viaje

| Etapa | Tag / commit | Qué agregó | Cómo correrla **EN ESA ÉPOCA** |
| ------- | -------------- | ------------ | -------------------------------- |
| 1 | commit `9c128e0` | Código original: backend GET/POST andaba, pero el formulario **no guardaba** y el HTML daba `Cannot GET` (estado roto, a propósito didáctico) | `node server.js` — aunque `/cargaDatos.html` **no se podía abrir** |
| 2 | `e750826` → `927e577` | Fixes de grabación, tabla en vivo (ciclo POST→GET), primeros docs y comentarios | `node server.js` → `http://localhost:3000/cargaDatos.html` |
| — | `805a759`, `6aa0212`, `0251c9a` | Diagramas (archify) y configuración del agente — **sin cambios en la app** | ídem etapa 2 |
| 3 | `etapa-3-delete` (`eb71f50`) | `DELETE /api/productos/:id` + botón Borrar con `confirm()` | `node server.js` → `http://localhost:3000/cargaDatos.html` |
| 4 | `etapa-4-update` (`2714041`) | `PUT /api/productos/:id` + modo edición del formulario | `node server.js` → `http://localhost:3000/cargaDatos.html` |
| 5 | `etapa-5-validacion` (`1af00c3`) | Validación en el servidor (`400` con lista de errores) + POST responde `201` | `node server.js` → `http://localhost:3000/cargaDatos.html` |
| 6 | `etapa-6-rename` (`fd06ad6`) | Frontend renombrado a `public/index.html`, servido en la raíz `/` | `node server.js` → `http://localhost:3000/` ⚠ **URL nueva** |
| 7 | `etapa-7-src-tests` (`4910ea8`) | Refactor a `src/` modular + `npm test` (12 casos) | `node src/server.js` → `http://localhost:3000/` ⚠ **comando nuevo** |
| 8 | `etapa-8-poblar` (`0f993ef`) | Pregunta si poblar la base en instalación limpia (`npm test` pasa a 13) | `node src/server.js` → `http://localhost:3000/` |
| 9 | `etapa-9-logger` | La consola del servidor narra cada pedido con su código de respuesta (`LOG_REQUESTS=off` para silenciar); el navegador también muestra el código por consola | `node src/server.js` → `http://localhost:3000/` (mirar la terminal al interactuar) |
| Presente | `main` | Documentación completa (README, PRUEBAS, ETAPAS, diagramas) | `npm test` (13 pass) + `node src/server.js` |

Dos detalles que van a saltar en `git log` y conviene aclarar de entrada:

- Los commits `805a759`, `6aa0212` y `0251c9a` (diagramas y configuración) **no cambian la app**: si estás parado en cualquiera de ellos, la aplicación es idéntica a la de la etapa anterior. Son paradas para leer documentación, no para probar código.
- Los tags `etapa-6-rename` y `etapa-7-src-tests` apuntan al commit que **actualizó el diagrama** de arquitectura, no al que hizo el cambio de código. El rename vivió en `f8d2164` y el refactor a `src/` en `697b461` — el tag incluye ambos (viajar al tag te lleva al estado completo de la etapa).

---

## 2. Las reglas del viaje

La máquina del tiempo es git. Estas son las reglas para viajar sin romper nada:

```bash
git switch --detach etapa-3-delete   # 1. VIAJAR: te lleva al estado exacto de esa etapa
node server.js                        # 2. PROBAR: la app de esa época (comando de la época)
git switch main                       # 3. VOLVER: de vuelta al presente
```

- **`--detach`** te pone en *detached HEAD*: estás mirando un momento de la historia, no una rama. Es el modo correcto para "visitar y probar".
- **NUNCA commitees estando en detached HEAD.** Un commit ahí queda "colgando" fuera de toda rama: git lo va a descartar eventualmente y su trabajo se pierde. Si durante el viaje se te ocurre una mejora, anótala y hacela **de vuelta en `main`**.
- **El mapa completo del viaje** se ve con `git log --oneline --decorate`: cada línea es un commit, y los tags (las etapas) aparecen decorando la línea donde viven.
- **Para ver qué cambió entre dos etapas**, sin moverte del presente:

  ```bash
  git diff etapa-3-delete etapa-4-update   # todo lo que se agregó al pasar de la 3 a la 4
  git show etapa-5-validacion              # resumen del cambio de esa etapa (y su diff)
  ```

- **No hace falta `npm install` durante el viaje**: las dependencias (`express`, `better-sqlite3`) no cambiaron en todo el proyecto; el `node_modules/` que ya tenés sirve para todas las etapas.
- **Ojo con tus datos:** si guardás o borrás productos mientras viajás, los cambios caen en tu `mi_base_de_datos.db` **real** (la de hoy). No pasa nada — son datos de prueba — pero sabé dónde estás parado. (Los tests de `npm test` son la excepción: usan una base temporal y jamás tocan la real, como explica [`docs/PRUEBAS.md`](PRUEBAS.md).)

---

## 3. Las etapas, una por una

### Etapa 1 — commit `9c128e0`: el código original (y sus dos bugs)

**Qué podía hacer la app en ese punto:** el **backend** andaba perfecto: `GET /api/productos` listaba y `POST /api/productos` guardaba, con la tabla creándose sola en el primer arranque. Pero era inalcanzable desde el navegador por **dos errores en el frontend**, contados en detalle en [`docs/ERRORES-Y-CORRECCIONES.md`](ERRORES-Y-CORRECCIONES.md):

1. El formulario llamaba a `guardarProducto()`, una función **que nunca fue definida** → `ReferenceError` en la consola del navegador y ningún pedido HTTP salía.
2. `cargaDatos.html` ni siquiera se podía abrir: no había `express.static`, así que `http://localhost:3000/cargaDatos.html` respondía **`Cannot GET /cargaDatos.html`**. (El HTML además vivía en la raíz del repo — ni siquiera existía la carpeta `public/`.)

**El viaje:**

```bash
git switch --detach 9c128e0
node server.js                # puerto 3000 fijo
```

**Cómo probar lo que (no) hacía:**

- Abrir <http://localhost:3000/cargaDatos.html> → `Cannot GET /cargaDatos.html`. ¡Ese cartel *es* la lección: Express no sirve archivos del disco sin `express.static`!
- `curl http://localhost:3000/api/productos` → `[]` (o lo que hubiera): **el backend sí responde**. La cadena estaba rota en el primer eslabón, el navegador.

**Qué NO existía todavía:** `express.static`, la carpeta `public/`, la función `guardarProducto`, PUT, DELETE, validación, la raíz `/` servida, `npm test`, `src/`, el prompt de poblado.

**Por qué vale la pena visitarla:** es el estado "antes de entender". Reproducir el `Cannot GET` y leer en la consola del navegador por qué no salía el POST enseña más de depuración web que diez teorías.

### Etapa 2 — commits `e750826` → `927e577`: los arreglos y la tabla en vivo

Cuatro paradas, contadas en orden:

| Commit | Qué trajo |
| -------- | ----------- |
| `e750826` | **Fix de grabación:** `guardarProducto()` definida (hace `fetch` con `POST`), `express.static` montado y el HTML movido a `public/cargaDatos.html`. Por primera vez la app *se abre y guarda*. |
| `e76d2c3` | **Tabla en vivo:** después de guardar, la lista se recarga sola (`await cargarProductos()`): nace el ciclo **POST → GET** que ves en el [diagrama de secuencia](diagramas/secuencia-zz-js01.html). |
| `ad2a68b` | **Documentación y seed:** `README.md`, `docs/ERRORES-Y-CORRECCIONES.md` y `poblar_base.sql`. Sin cambios en la app. |
| `927e577` | **Comentarios didácticos** en `server.js` y `cargaDatos.html`. Sin cambios de comportamiento. |

**El viaje (la app desde `e76d2c3` en adelante es la misma):**

```bash
git switch --detach e76d2c3    # o ad2a68b / 927e577: da igual para probar
node server.js
```

**Cómo probar lo nuevo:** abrir <http://localhost:3000/cargaDatos.html>, completar nombre y precio, **Guardar** → el producto aparece en la tabla (gracias al refresco del ciclo POST→GET). Con `curl http://localhost:3000/api/productos` lo ves en el JSON.

**Qué NO existía todavía:** borrar, editar, validación (¡aceptaba cualquier cosa: precio `-5`, nombre vacío con espacios, lo que fuera!), la raíz `/` servida, `npm test` real, `src/`, el prompt de poblado.

### Etapa 3 — tag `etapa-3-delete`: la D de borrar

**Qué podía hacer la app:** crear, listar y por fin **borrar**. Backend: `DELETE /api/productos/:id` (responde `204`, o `404` si el id no existe). Frontend: cada fila de la tabla tiene su botón **Borrar**, protegido con un `confirm()` nativo del navegador antes de disparar el DELETE.

**El viaje:**

```bash
git switch --detach etapa-3-delete
node server.js
```

Abrir <http://localhost:3000/cargaDatos.html>.

**Cómo probar lo nuevo:**

1. Creá un producto desde el formulario (Guardá).
2. Apretá **Borrar** en su fila → aparece el diálogo `¿Borrar el producto #7?` → Aceptar → la fila desaparece y la tabla se refresca.
3. `curl http://localhost:3000/api/productos` → el producto ya no está.

**Detalle de época que sorprende:** si entrabas a <http://localhost:3000/> (la raíz), respondía **404** — la app vivía *solo* en `/cargaDatos.html`. Que la raíz abra la app es un invento de la etapa 6. Y `npm test` existía como script pero era el placeholder de npm: cortaba con `Error: no test specified`.

**Qué NO existía todavía:** editar (PUT), validación en el servidor, la raíz `/` servida, `npm test` real, `src/`, el prompt de poblado.

### Etapa 4 — tag `etapa-4-update`: la U de update

**Qué podía hacer la app:** CRUD casi completo: **editar**. Backend: `PUT /api/productos/:id` (responde el producto actualizado, o `404` si el id no existe). Frontend: cada fila suma un botón **Editar** que carga nombre y precio en el formulario; el mismo botón Guardar de siempre ahora decide solo: si hay un id en edición manda `PUT`, si no, `POST` (en el código: `method: creando ? 'POST' : 'PUT'`).

**El viaje:**

```bash
git switch --detach etapa-4-update
node server.js
```

Abrir <http://localhost:3000/cargaDatos.html>.

**Cómo probar lo nuevo:**

1. Apretá **Editar** en cualquier fila → el formulario se llena con los valores de ese producto.
2. Cambiale el nombre o el precio → **Guardar** → la fila se actualiza en la tabla.
3. `curl http://localhost:3000/api/productos` → los datos nuevos están en el JSON.

**Qué NO existía todavía:** validación (el PUT de esta época aceptaba un precio negativo sin pestañear), la raíz `/` servida, `npm test` real, `src/`, el prompt de poblado.

### Etapa 5 — tag `etapa-5-validacion`: el servidor deja de confiar

**Qué podía hacer la app:** el CRUD completo de siempre, pero con **validación en el servidor**, compartida por POST y PUT:

- `nombre`: obligatorio (se recortan espacios con `trim()`), máximo 100 caracteres.
- `precio`: número finito, mínimo `0.01`.

Si algo no cumple, la API responde **`400`** con **todos** los errores juntos: `{ "errores": ["...", "..."] }`. Y el POST exitoso pasa a responder **`201`** (creado) en vez de `200`.

**El viaje:**

```bash
git switch --detach etapa-5-validacion
node server.js
```

Abrir <http://localhost:3000/cargaDatos.html>.

**Cómo probar lo nuevo:**

1. En el formulario, poné un precio inválido (por ejemplo `0` o `-5`) y Guardá → **el producto no se guarda** y la tabla no cambia.
2. El porqué está en las herramientas del navegador (F12): en **Console** verás `El servidor rechazó el guardado:` con el código `400`, y en **Network** el pedido a `/api/productos` con su respuesta `400` y la lista de errores en el body. *Detalle de época honesto:* la interfaz de este momento no mostraba el mensaje en pantalla, solo lo dejaba en la consola — el feedback visual amigable vino después.
3. `curl http://localhost:3000/api/productos` → confirma que el producto inválido no entró.

**Qué NO existía todavía:** la raíz `/` servida, `npm test` real, `src/`, el prompt de poblado.

### Etapa 6 — tag `etapa-6-rename`: la app se muda a la raíz

**Qué podía hacer la app:** exactamente la misma de la etapa 5 (CRUD completo + validación), pero con dirección nueva: el frontend pasó a llamarse `public/index.html` y `express.static` lo sirve **automáticamente en la raíz `/`** — convención estándar de la web: `index.html` es "la portada". La URL vieja `/cargaDatos.html` murió (404). (El tag apunta al commit del diagrama; el rename vivió en `f8d2164`.)

**El viaje:**

```bash
git switch --detach etapa-6-rename
node server.js                  # el comando de arrancar NO cambió todavía
```

**Cómo probar lo nuevo:**

- Abrir <http://localhost:3000/> → ¡la app! Sin nombre de archivo en la URL.
- Abrir <http://localhost:3000/cargaDatos.html> → `Cannot GET /cargaDatos.html`: la dirección vieja ya no existe. Es la foto especular de la etapa 3, donde `/` daba 404 y `/cargaDatos.html` era la app.

**Qué NO existía todavía:** `npm test` real, la carpeta `src/`, el prompt de poblado.

### Etapa 7 — tag `etapa-7-src-tests`: orden interno y red de seguridad

**Qué podía hacer la app:** para el usuario, **nada cambió**: misma app en `http://localhost:3000/`. Lo que cambió fue adentro y alrededor:

- **Refactor a `src/` modular:** el `server.js` único se partió en `src/app.js` (app Express + mapa de la API), `src/db.js` (conexión SQLite), `src/routes/productos.js` (rutas) y `src/validators/productos.js` (validación). `src/server.js` queda como punto de arranque.
- **Primeros tests automatizados:** `test/api.test.js` con **12 casos** (`node:test` + supertest) cubriendo el CRUD y los `400`/`404`. Nace `npm test`. (El tag apunta al commit del diagrama; el refactor vivió en `697b461`.)

**El viaje:**

```bash
git switch --detach etapa-7-src-tests
npm test                # → 12 pass, 0 fail
node src/server.js      # ⚠ comando nuevo: el entry point se mudó a src/
```

Abrir <http://localhost:3000/>.

**Cómo probar lo nuevo:** `npm test` y mirá el resumen: `tests 12`, `pass 12`. Es la misma verificación que hasta la etapa anterior se hacía a mano con el servidor andando (ver [`docs/PRUEBAS.md`](PRUEBAS.md)), ahora automática y en menos de un segundo — contra una **base temporal**, nunca contra la tuya.

**Qué NO existía todavía:** el prompt de poblado en instalación limpia, el test del seed (la suite tiene 12, no 13).

### Etapa 8 — tag `etapa-8-poblar`: primera bienvenida amable

**Qué podía hacer la app:** el CRUD completo de siempre, más una comodidad para **instalaciones limpias**: si al arrancar el servidor no encuentra `mi_base_de_datos.db` (por ejemplo, en una máquina nueva), pregunta:

```text
No encontré la base de datos. ¿Poblarla con datos de ejemplo (poblar_base.sql)? [s/N]
```

Contestá `s` y carga los 5 productos de ejemplo del seed; cualquier otra cosa (o solo Enter) crea la base vacía. La suite de tests suma su caso 13: `test/poblar.test.js` verifica que el seed deja **exactamente** 5 productos.

**El viaje:**

```bash
git switch --detach etapa-8-poblar
npm test                # → 13 pass, 0 fail
node src/server.js
```

Abrir <http://localhost:3000/>.

**Cómo probar lo nuevo:**

- `npm test` → ahora el resumen dice `tests 13`, `pass 13`: el caso nuevo es el del seed.
- El prompt del arranque solo aparece si la base **no existe**. En tu viaje **no borres tu `mi_base_de_datos.db`** para verlo: es tu dato real. Para verlo en acción, lo correcto es probarlo en una copia fresca del proyecto (o una máquina nueva), tal como cuenta el [README](../README.md#instalaci%C3%B3n-desde-cero-en-un-equipo-nuevo). Leer `src/server.js` de esta etapa también muestra la lógica completa de la pregunta.

**Qué NO existía todavía:** la documentación final del presente (guía de tests, esta guía).

### Etapa 9 — tag `etapa-9-logger`: la consola narra cada pedido

**Qué agrega:** visibilidad. Desde esta etapa, **la consola del servidor narra cada pedido** con su método, su URL y su código de respuesta:

```text
→ GET /api/productos
← 200
→ DELETE /api/productos/999999
← 404
```

Lo hace un middleware de logging puesto **primero en la cadena** de `src/app.js`: ve todos los pedidos que entran, y anota el código recién cuando la respuesta termina (el evento `finish` de `res`). Y el navegador también participa: cada `fetch` de `public/index.html` imprime `← Código de respuesta: ...` en la consola del navegador (F12), así que los códigos esperados de la API se pueden comparar con los reales en los dos extremos. Sin dependencias nuevas: es `console.log` y eventos, nada más.

**Cómo verlo:**

```bash
npm start                # o: node src/server.js
```

Interactuá con la app (guardar, editar, borrar) y mirá **la terminal del servidor**: cada pedido deja su par `→ ...` / `← código`. ¿Mucho ruido? Se apaga sin tocar código: `LOG_REQUESTS=off npm start` (la misma técnica de variable de entorno que el proyecto ya enseña con `DB_PATH`). Y la suite lo apaga sola: los dos archivos de `test/` definen `process.env.LOG_REQUESTS = "off"` antes de requerir la app, para que la salida de `npm test` se mantenga limpia.

**Qué NO cambió:** ni las rutas ni las respuestas de la API: es logging, no lógica.

(Una vez etiquetada, la etapa se visita como las anteriores: `git switch --detach etapa-9-logger`.)

---

## 4. El presente: `main`

```bash
git switch main          # volver del viaje (¡siempre!)
npm test                 # → 13 pass, 0 fail
node src/server.js       # → Servidor corriendo en http://localhost:3000
```

Abrir <http://localhost:3000/>: la app completa — formulario para crear y editar, tabla que lista y borra, validación en el servidor con `400`, `201` en creación, `npm test` con 13 casos — y la documentación al día: [`README.md`](../README.md), [`docs/PRUEBAS.md`](PRUEBAS.md), [`docs/ERRORES-Y-CORRECCIONES.md`](ERRORES-Y-CORRECCIONES.md) y los [diagramas interactivos](diagramas/).

Después de viajar, `git status` debería mostrarte limpio y en `main`. Si aparece algo inesperado, [`docs/ERRORES-Y-CORRECCIONES.md`](ERRORES-Y-CORRECCIONES.md) tiene el método: reproducir, aislar, entender.

---

## 5. Nota final: mirar el viaje desde afuera (los diffs)

Además de *visitar* cada etapa, podés ver **qué cambió exactamente** entre dos momentos sin moverte del presente — útil para estudiar una etapa intermedia:

```bash
git diff etapa-3-delete etapa-4-update          # la etapa 4 completa: PUT + modo edición
git diff etapa-7-src-tests etapa-8-poblar --stat  # solo el resumen de archivos
```

El segundo comando, corrido de verdad en este proyecto, devuelve:

```text
 README.md               | 15 +++++-
 src/db.js               | 33 ++++++++++-
 src/routes/productos.js |  5 ++-
 src/server.js           | 115 ++++++++++++++++++++++++++++++++++++----
 test/api.test.js        |  5 ++-
 test/poblar.test.js     | 62 +++++++++++++++++++
 6 files changed, 220 insertions(+), 15 deletions(-)
```

De un vistazo: la etapa 8 tocó sobre todo `src/server.js` (la pregunta del arranque) y `src/db.js` (la función de seed), y sumó el test nuevo. Para el detalle línea por línea, sacá el `--stat`. Y para el resumen de **una** etapa con su mensaje de commit: `git show etapa-5-validacion`.

Buena viaje — y recordá la regla de oro: **`git switch main` para volver a casa.**
