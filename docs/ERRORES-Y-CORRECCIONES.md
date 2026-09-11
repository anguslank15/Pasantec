# Errores y correcciones — zz-js01 (guía de repaso)

Registro de los dos errores que impedían grabar productos en la base de datos, cómo se corrigieron y por qué funcionaban así. Pensado para releer y afianzar los conceptos de depuración web (navegador → servidor → base de datos).

> **Nota:** desde la etapa 6 el frontend se llama `public/index.html` y se sirve en la raíz (`/`). Este documento conserva los nombres originales porque narra bugs históricos.

## Resumen rápido

| # | Error | Causa raíz | Corrección |
|---|-------|------------|------------|
| 1 | Presionar "Guardar" no grababa nada en la base | `cargaDatos.html` llamaba a `guardarProducto()`, una función que **no existía** → `ReferenceError` cortaba el script y el pedido HTTP nunca salía | Definir la función: `fetch` con `POST /api/productos` |
| 2 | `Cannot GET /cargaDatos.html` al entrar por `http://localhost:3000` | Express **no sirve archivos estáticos por defecto**; solo responde las rutas registradas → 404 | Montar `express.static` sobre la carpeta `public/` |

Ambos errores tenían el mismo síntoma visible ("no graba") pero vivían en eslabones distintos de la cadena. El backend (`server.js`) y la base de datos estuvieron bien desde el inicio.

---

## Error 1 — El botón "Guardar" no grababa

**Síntoma:** se completa el formulario, se presiona Guardar, y no aparece nada en la base de datos. La página no muestra ningún error.

**Dónde estaba:** `cargaDatos.html` (frontend, en el navegador).

**Causa raíz:**

```js
guardarProducto(nombre, precio);  // ← la función nunca fue definida
```

Al ejecutarse esta línea, JavaScript lanza `ReferenceError: guardarProducto is not defined` y **corta el script en ese punto**. Como el error ocurría *antes* de armar el `fetch`, ningún pedido HTTP salía del navegador. Para el servidor, literalmente no había pasado nada.

**Corrección:** definir la función que envía el producto al backend:

```js
async function guardarProducto(nombre, precio) {
  const respuesta = await fetch('/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, precio })
  });
  const datos = await respuesta.json();
  console.log('Guardado con id:', datos.id);
}
```

**Por qué era invisible:** el error solo aparecía en la **consola del navegador** (F12 → Console, en rojo). Y en la pestaña **Network** se veía que no salía ningún pedido a `/api/productos`. La página cargaba perfecto: "parece que funciona" ≠ "funciona".

---

## Error 2 — `Cannot GET /cargaDatos.html`

**Síntoma:** al navegar a `http://localhost:3000/cargaDatos.html`, Express responde `Cannot GET /cargaDatos.html`.

**Dónde estaba:** `server.js` (falta de configuración, no un bug de lógica).

**Causa raíz:** Express solo responde a lo que se le programa. Las únicas rutas registradas eran:

```js
app.get('/api/productos', ...);   // leer
app.post('/api/productos', ...);  // guardar
```

Pedir `/cargaDatos.html` no matchea ninguna → Express devuelve su **404 por defecto**. Express **no** sirve archivos del disco solo: hay que activarlo con el middleware `express.static`.

**Corrección:**

```js
app.use(express.static(path.join(__dirname, 'public')));
```

`express.static` traduce URLs a archivos: `GET /cargaDatos.html` → busca `public/cargaDatos.html` en disco y lo envía.

**Por qué `public/` y no la raíz del proyecto:** servir la raíz dejaría la base de datos **descargable por URL** (`http://localhost:3000/mi_base_de_datos.db`), junto con `server.js` y `package.json`. Regla: por HTTP solo se expone lo que el navegador necesita.

---

## Concepto clave: la cadena

```
[ Navegador ]  --HTTP-->  [ Express (server.js) ]  --SQL-->  [ SQLite (.db) ]
     (1)                    (2)                              (3)
```

El botón vive en el navegador; la base vive en el servidor. Solo se comunican por HTTP. **Si un eslabón se rompe, no graba — y el síntoma es siempre el mismo.** La pregunta correcta no es "qué está mal" sino **¿dónde se cortó la cadena?**

## Método de depuración

| Herramienta | Qué revela | Hubiera mostrado |
| ------------- | ----------- | ------------------ |
| Consola del navegador (F12) | Errores de JavaScript del lado cliente | El `ReferenceError` del Error 1 |
| Pestaña Network (F12) | Si el pedido HTTP salió, y qué respondió el servidor (código, body) | Cero pedidos a `/api/productos` → el problema estaba en el navegador |

Regla de decisión:

- Network **sin pedidos** → el problema está en el JavaScript del navegador
- Pedido salió + respondió **404/500** → el problema está en el servidor
- Pedido salió + respondió **200** pero no se ve en la base → el problema está en la capa SQL

## Flujo completo (cómo funciona ahora)

1. `GET /cargaDatos.html` → `express.static` encuentra `public/cargaDatos.html` → llega el HTML
2. Al abrir la página, `cargarProductos()` hace `GET /api/productos` → llena la tabla
3. Se llena el formulario y se presiona Guardar → `preventDefault()` → se leen los inputs
4. `guardarProducto()` → `POST /api/productos` con `{nombre, precio}` en JSON
5. `express.json()` parsea el body → matchea `app.post` → `better-sqlite3` ejecuta el `INSERT` → responde `{id, ...}`
6. La tabla se refresca (ciclo **POST → GET**) y el formulario se limpia solo si el guardado salió bien

## Detalles menores (también aprendizajes)

| Tema | Qué pasó | Lección |
| ------ | ---------- | --------- |
| `req` sin usar en el GET | Renombrado a `_req` (aviso del linter) | Convención: prefijo `_` para parámetros que la firma exige pero no se usan |
| `node_modules/` y `*.db` en `.gitignore` | Agregados al inicializar el repo | Dependencias y datos binarios runtime no se versionan |
| Warnings "LF will be replaced by CRLF" | Aparecen al commitear en Windows | Inofensivos: normalización de finales de línea de Git |
| `textContent` en vez de concatenar HTML | Usado al armar la tabla | Concatenar en `innerHTML` permite inyección XSS; `textContent` nunca interpreta HTML |
| `await` en cascada (`guardar` → `cargar`) | Orden garantizado POST antes del GET de refresco | Sin `await`, corren en paralelo y la lista puede mostrarse sin el producto nuevo |

## Checklist de repaso

- [ ] Puedo explicar por qué un `ReferenceError` en el navegador impedía grabar en una base que vive en el servidor
- [ ] Sé que Express no sirve archivos estáticos sin `express.static` y por qué devuelve `Cannot GET ...`
- [ ] Sé usar la consola y la pestaña Network para ubicar en qué eslabón se cortó la cadena
- [ ] Entiendo por qué el frontend va en `public/` y no en la raíz del proyecto
- [ ] Puedo reproducir el flujo completo: submit → POST → INSERT → GET → tabla actualizada

## Historia de commits asociada

| Commit | Qué representa |
| -------- | ---------------- |
| `9c128e0` | Código original (con ambos errores latentes, documentados) |
| `e750826` | Fix de grabación: `guardarProducto` + `express.static` + HTML en `public/` |
| `e76d2c3` | Lista de productos en vivo: tabla que se refresca tras cada guardado |

## Comandos de referencia

```bash
node server.js                # levantar el servidor (http://localhost:3000)
PORT=3100 node server.js      # levantarlo en otro puerto (para pruebas)

# Verificación manual por HTTP
curl http://localhost:3000/api/productos                                  # listar
curl -X POST http://localhost:3000/api/productos \
     -H "Content-Type: application/json" \
     -d '{"nombre":"Prueba","precio":9.99}'                               # crear
```
