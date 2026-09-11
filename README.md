# zz-js01 — CRUD de productos (Express + SQLite)

Mini aplicación web de aprendizaje: un formulario para **crear** productos y una tabla que lista los **guardados**, con backend Node.js + Express y base de datos SQLite en un solo archivo.

```
[ Navegador ]  --HTTP-->  [ Express (server.js) ]  --SQL-->  [ SQLite (mi_base_de_datos.db) ]
   public/                 /api/productos (GET/POST)            archivo en disco
```

- Sin frameworks frontend: HTML + CSS + JavaScript puro, con `fetch()`.
- La base se crea sola en el primer arranque; no hay servidor de base que instalar.

Documentación complementaria: [`docs/ERRORES-Y-CORRECCIONES.md`](docs/ERRORES-Y-CORRECCIONES.md) — retrospectiva de los bugs del proyecto y la técnica de depuración usada.

---

## Camino rápido (si ya tenés Node)

1. `npm install`
2. `node server.js`
3. Abrir <http://localhost:3000/cargaDatos.html>

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
node server.js
```

En el primer arranque se crean automáticamente el archivo `mi_base_de_datos.db` y la tabla `productos`. Verás:

```
Servidor corriendo en http://localhost:3000
```

Dejá esta terminal abierta: mientras corre, el servidor atiende pedidos. Para detenerlo: `Ctrl+C`.

### 5. Abrir la aplicación

Navegador en <http://localhost:3000/cargaDatos.html> — cargá un producto con el formulario y debería aparecer en la tabla.

## Poblar la base con datos de ejemplo

**Precondición:** haber levantado el servidor al menos una vez (paso 4), porque la tabla la crea `server.js` al arrancar.

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
| `server.js` | Backend: Express, rutas de la API y conexión SQLite. Comentario a comentario está pensado para leerse de arriba a abajo. |
| `public/cargaDatos.html` | Frontend: formulario + tabla, con `fetch()` al backend. También comentado para aprender. |
| `poblar_base.sql` | Datos de ejemplo para llenar la base. |
| `package.json` / `package-lock.json` | Dependencias del proyecto (qué instala `npm install`). |
| `mi_base_de_datos.db` | La base SQLite. **No se versiona** (`.gitignore`); se crea al arrancar. |
| `docs/ERRORES-Y-CORRECCIONES.md` | Guía de repaso: errores del proyecto, correcciones y método de depuración. |

## API

| Método y ruta | Qué hace | Body (JSON) |
|---------------|----------|-------------|
| `GET /api/productos` | Lista todos los productos | — |
| `POST /api/productos` | Crea un producto | `{ "nombre": "string", "precio": número }` |

## Comandos útiles

```bash
node server.js                 # servidor en el puerto 3000
PORT=3100 node server.js       # mismo servidor en otro puerto

# Pruebas manuales de la API (Git Bash / PowerShell)
curl http://localhost:3000/api/productos                                   # listar
curl -X POST http://localhost:3000/api/productos -H "Content-Type: application/json" -d "{\"nombre\":\"Prueba\",\"precio\":9.99}"   # crear
```

## Problemas frecuentes

| Síntoma | Causa | Solución |
| --------- | ------- | ---------- |
| `EADDRINUSE` / puerto 3000 ocupado | Ya hay otro proceso en ese puerto (probablemente otra instancia del server) | Detener la otra instancia, o usar otro puerto: `PORT=3100 node server.js` |
| `Cannot GET /cargaDatos.html` | El servidor no tiene montado `express.static` (versión vieja del código) o entraste por un puerto distinto al que escucha | Confirmar el puerto del mensaje de arranque y la versión de `server.js` |
| `npm install` falla compilando better-sqlite3 | Node viejo o faltan herramientas de compilación | Verificar `node -v` ≥ 22; en Windows reinstalar con el instalador oficial LTS |
| Guardo y no aparece nada | El frontend no llega al servidor: revisar consola del navegador (F12) y pestaña Network | Ver [`docs/ERRORES-Y-CORRECCIONES.md`](docs/ERRORES-Y-CORRECCIONES.md) |
| Abrí el HTML como archivo (`file://`) | Las rutas `/api/...` no resuelven sin servidor | Entrar siempre por `http://localhost:3000/cargaDatos.html` |
