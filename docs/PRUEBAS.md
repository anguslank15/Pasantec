# Guía de la suite de tests

Esta guía explica las **pruebas automatizadas** del proyecto: cómo ejecutarlas, con qué están hechas, cómo están construidas por dentro y cómo agregar una nueva. Es la continuada natural de la sección [Tests del README](../README.md#tests): allá vimos *cómo correrlas*; acá vamos a abrir el capó.

Qué cubre:

| Archivo | Pruebas | Qué verifica |
| --------- | --------- | --------------- |
| [`test/api.test.js`](../test/api.test.js) | 12 | La API completa: CRUD y códigos `201`/`200`/`204`/`400`/`404` |
| [`test/poblar.test.js`](../test/poblar.test.js) | 1 | El seed: `poblar_base.sql` carga exactamente los 5 productos |

En total: **13 pruebas**, todas contra una base de datos **temporal** — la real (`mi_base_de_datos.db`) jamás se toca.

## Ejecutar los tests

```bash
npm test
```

Cuando corrés `npm test`, npm busca el script `test` en `package.json` y ejecuta esto:

```
node --test "test/**/*.test.js"
```

Dos piezas:

- **`node --test`** es el corredor de pruebas que trae Node de fábrica (más sobre esto en la próxima sección).
- **`"test/**/*.test.js"`** es un patrón *glob* que significa: "todos los archivos que terminan en `.test.js`, adentro de `test/` y sus subcarpetas". A eso se debe el nombre de los archivos: si mañana creás `test/otra-cosa.test.js`, `npm test` lo descubre solo, sin configurar nada. Las comillas evitan que la terminal (sobre todo en Windows) intente expandir el patrón ella misma.

El resultado esperado es: **13 pass, 0 fail**. Cada prueba imprime una línea con su nombre y un ✔, y al final aparece el resumen:

```
ℹ tests 13
ℹ suites 0
ℹ pass 13
ℹ fail 0
```

Si algún número de esa tabla no es el esperado, hay un bug: o en el código de la app, o en un test. Cómo atacar eso queda documentado en [`ERRORES-Y-CORRECCIONES.md`](ERRORES-Y-CORRECCIONES.md).

## Con qué están hechos

La suite usa **dos herramientas y nada más**. La idea de fondo de un proyecto de aprendizaje es tener la menor cantidad de piezas móviles posible:

**1. `node:test` (y `node:assert`) — nativos de Node.** Es el corredor de pruebas que viene incluido con el propio Node desde la versión 18: `test()` define una prueba, `after()` define qué hacer al final, y `assert.strictEqual()` / `assert.ok()` / `assert.deepStrictEqual()` son las afirmaciones que verifican el resultado. **Cero frameworks que instalar**: si tenés Node, tenés todo.

**2. `supertest` — la única devDependency de pruebas** (está en `devDependencies` de `package.json`, porque solo la usan los tests, no la app). Su trabajo: probar la aplicación HTTP **sin levantar un servidor ni ocupar un puerto**. La idea es simple: envuelve la app de Express y le hace pedidos directamente, en memoria:

```js
const res = await request(app).get("/api/productos");
```

Eso devuelve un objeto `res` con `res.status` y `res.body`, igual que una respuesta HTTP real, pero sin tocar la red. Es la misma app que corre en producción, evaluada de forma directa.

¿Por qué esta combinación y no Jest, Mocha o Vitest? Porque acá estamos para aprender HTTP, Express y SQLite — no la configuración de un framework de tests. Menos capas, menos magia, todo a la vista.

## Cómo están construidos

### El patrón de aislamiento (el detalle más importante)

El problema a resolver: [`src/db.js`](../src/db.js) **abre la base apenas se lo requiere**. Estas líneas se ejecutan en el momento del `require`, no después:

```js
const DB_PATH = process.env.DB_PATH || "mi_base_de_datos.db";

const db = new Database(DB_PATH);
```

Si un test requiriera la app sin más, esa primera línea elegiría `mi_base_de_datos.db`, y cada prueba crearía, editaría y **borraría** productos de tu base real. Inaceptable.

La solución está al principio de [`test/api.test.js`](../test/api.test.js), y el **orden es la clave**:

```js
// Va PRIMERO, antes de requerir la app:
process.env.DB_PATH = path.join(os.tmpdir(), `zz-js01-test-${Date.now()}.db`);

// ...y recién DESPUÉS:
const app = require("../src/app");
```

¿Por qué ese orden? Porque el `require` **ejecuta** `db.js` en ese momento. La variable de entorno se lee una sola vez — durante ese require — así que:

1. Si definís `DB_PATH` **antes**, cuando `db.js` se ejecute va a abrir (y crear si falta) un archivo **temporal** en `os.tmpdir()` (la carpeta de temporales del sistema), con nombre único gracias a `Date.now()`. Nada apunta a la base real.
2. Si lo definieras **después**, la base ya se abrió apuntando a `mi_base_de_datos.db`: demasiado tarde.

Un detalle que hace posible el cleanup: CommonJS **cachea** los `require`, así que el `{ db }` que el test destructura de `../src/db` es **el mismo objeto** que usan las rutas adentro de la app. Por eso el test puede cerrar esa misma conexión al terminar:

```js
after(() => {
  db.close();
  fs.rmSync(process.env.DB_PATH, { force: true });
});
```

`after()` corre cuando terminan **todos** los tests del archivo: cierra la conexión y borra el archivo temporal. El orden de esas dos líneas también importa: **en Windows no se puede borrar un archivo abierto**, así que primero `db.close()` y después `fs.rmSync()`.

¿Y qué pasa con `test/poblar.test.js`, que define su propio `DB_PATH`? No hay conflicto: `node --test` ejecuta **cada archivo de test en su propio proceso**, así que cada uno setea su variable de entorno en su propio mundo. (El prefijo distinto del archivo temporal — `zz-js01-poblar-test-` — es por prolijidad, no por necesidad.)

Hay una segunda variable en el mismo bloque, con el mismo espíritu: **`LOG_REQUESTS=off`**. Desde la etapa 9 la app trae un logger que narra cada pedido en la consola del servidor (`→ GET /api/productos`, `← 200`); si los tests no lo silenciaran, esos renglones ensuciarían la salida de `npm test`. Por eso ambos archivos de test definen `process.env.LOG_REQUESTS = "off"` antes de requerir la app — mismo patrón de siempre: variable de entorno que se lee al requerir, definida antes del require.

### `test/api.test.js` — los 12 casos de la API

Los 12 casos forman dos grupos: la **cadena feliz del CRUD** (1 a 6) y las **validaciones** (7 a 12).

| # | Verbo + ruta | Código esperado | Qué protege |
| --- | -------------- | --------------- | ------------- |
| 1 | `POST /api/productos` con datos válidos | `201` | Crear: responde el producto nuevo **con su `id`** |
| 2 | `GET /api/productos` | `200` | Listar: el array contiene lo recién creado |
| 3 | `PUT /api/productos/:id` (el id del caso 1) | `200` | Editar: el body refleja los datos nuevos, completos |
| 4 | `PUT /api/productos/999999` (id inexistente, datos válidos) | `404` | No se puede editar lo que no existe |
| 5 | `DELETE /api/productos/:id` (el id del caso 1) | `204` | Borrar: responde sin contenido |
| 6 | `DELETE` repetido sobre ese mismo id | `404` | Ya borrado no existe: no hay "doble borrado" silencioso |
| 7 | `POST` con body vacío `{}` | `400` | Rechaza el alta sin datos, reportando **2 errores juntos** |
| 8 | `POST` con `nombre: "   "` (solo espacios) | `400` | El `trim()` deja el nombre vacío: es obligatorio |
| 9 | `POST` con `precio: "caro"` | `400` | El precio debe ser un número |
| 10 | `POST` con `precio: 0` | `400` | Precio mínimo permitido: `0.01` |
| 11 | `POST` con nombre de 101 caracteres | `400` | Nombre: máximo 100 caracteres |
| 12 | `PUT` con `nombre: ""` y `precio: -1` | `400` | La validación **acumula** todos los errores, no corta en el primero |

**La cadena del CRUD y el id en caliente.** Los casos 1 a 6 no usan ids inventados: comparten **un producto real** creado en el momento. El caso 1 guarda el id que devuelve el POST:

```js
let idCreado;
// ...dentro del test 1:
idCreado = res.body.id; // los siguientes tests de la cadena lo usan
```

y los casos siguientes lo interpolan en sus rutas (`/api/productos/${idCreado}`). Esto funciona porque **`node:test` ejecuta los tests de un archivo de arriba hacia abajo, uno por vez** — el orden del archivo es el orden de ejecución. Si los tests corrieran en paralelo o en orden aleatorio, `idCreado` llegaría sin definir al caso 3 y toda la cadena se derrumbaría. Es una decisión consciente: la cadena imita el ciclo de vida real de un producto (crear → ver → editar → borrar → intentar borrar de nuevo).

Los casos 7 a 12, en cambio, no comparten estado: cada uno manda su pedido y verifica su `400` (con el mensaje exacto del validador, por ejemplo `"El precio mínimo permitido es 0.01."`), así que dependen solo de sí mismos.

### `test/poblar.test.js` — la prueba del seed

Es **una sola prueba** que protege la instalación limpia (etapa 8): que `poblarDesdeArchivo()` — la función del seed en [`src/db.js`](../src/db.js) — deje la base **exactamente** como promete.

Usa el mismo patrón de aislamiento (su propio archivo temporal, definido antes de requerir `../src/db`) y luego:

```js
poblarDesdeArchivo(path.join(__dirname, "..", "poblar_base.sql"));

const { c } = db.prepare("SELECT COUNT(*) AS c FROM productos").get();
assert.strictEqual(c, 5, "el seed debe insertar exactamente 5 productos");
```

Verifica dos cosas:

1. **El conteo exacto**: `SELECT COUNT(*)` debe devolver **5**, ni uno más ni uno menos. No es un capricho: la tabla no tiene restricción `UNIQUE`, así que si alguien ejecutara el seed dos veces el número sería 10 y este test lo delata.
2. **Una verificación de contenido**: que el producto `"Teclado Mecánico"` esté, con su precio exacto (`45.99`), para confirmar que los datos vinieron realmente de `poblar_base.sql`.

## Cómo agregar un test nuevo

Dos lugares posibles:

- **Dentro de `test/api.test.js`**: agregalo al final con `test(...)`. Ideal si comparte el tema con los existentes — el aislamiento ya está resuelto en las primeras líneas del archivo.
- **Un archivo nuevo**, por ejemplo `test/mi-cosa.test.js`: `npm test` lo descubre solo (gracias al glob `test/**/*.test.js`). Pero copiá el **bloque de aislamiento completo** de `api.test.js` (las primeras líneas: `os`, `path`, `fs`, el `process.env.DB_PATH = ...` con `Date.now()` antes de cualquier `require` de `src/`, y el `after()` de cleanup). Es la única regla no negociable: **sin ese bloque, tus tests tocan la base real**.

El patrón mínimo, con un ejemplo realista (un caso que todavía no está en la suite: precio negativo). Fijate en la estructura: nombre descriptivo en español, `await request(app)...` contra **la app** (nunca un servidor levantado: supertest no necesita puerto y así evitamos el `EADDRINUSE`), y asserts sobre el estado y el body:

```js
// Al final de test/api.test.js:
test("POST con precio negativo responde 400", async () => {
  const res = await request(app)
    .post("/api/productos")
    .send({ nombre: "Silla", precio: -5 });
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.errores.includes("El precio mínimo permitido es 0.01."));
});
```

Checklist para el test nuevo:

1. Nombre descriptivo en `test("...")`: tiene que contar qué protege, porque es lo que se lee en la salida de `npm test`.
2. `await request(app)` con el verbo y la ruta a probar (y `.send({...})` si lleva body).
3. Al menos un assert del código de estado y al menos uno del body.
4. Si es un archivo nuevo: el bloque de aislamiento primero, `require` de la app después.

Corré `npm test` y el resumen debería pasar a decir `tests 14`, `pass 14`.

## De las pruebas manuales a las automatizadas

Estas pruebas son la versión automatizada de lo que durante las **etapas 3 a 5** del proyecto (los tags `etapa-3-delete`, `etapa-4-update` y `etapa-5-validacion`) se verificaba a mano: levantar el servidor y dispararle `curl` para comprobar que el `DELETE` respondía `204`, que el `PUT` editaba de verdad, que los datos inválidos recibían `400`. Esos mismos comandos curl siguen disponibles en la sección [Comandos útiles del README](../README.md#comandos-útiles) para probar la API con el servidor andando.

La diferencia: la suite corre los 13 casos en menos de un segundo, **cada vez que quieras**, sin servidor y sin tocar tus datos. Cuando un test falla, el método de depuración — reproducir, aislar, entender — es el mismo que se usó para corregir los bugs del proyecto y está contado en [`ERRORES-Y-CORRECCIONES.md`](ERRORES-Y-CORRECCIONES.md).
