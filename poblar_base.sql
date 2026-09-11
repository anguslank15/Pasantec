-- ============================================================
-- Script de población (seed) para zz-js01
--
-- PRECONDICIÓN: la tabla `productos` debe existir. La crea
-- src/db.js automáticamente al arrancar el servidor
-- (node src/server.js). En una instalación limpia ni siquiera
-- hace falta ejecutar este script a mano: el servidor pregunta
-- si querés poblar la base y, si aceptás, lo ejecuta por vos.
--
-- Formas de ejecutarlo (ver README.md):
--   con Node:      node -e '...lee poblar_base.sql...'  (comando exacto en README)
--   con sqlite3:   sqlite3 mi_base_de_datos.db ".read poblar_base.sql"
--
-- OJO: la tabla no tiene restricción UNIQUE, así que ejecutar este
-- script dos veces inserta los productos duplicados. Si querés
-- empezar siempre desde este set de datos, descomentá el DELETE.
-- ============================================================

-- (Opcional) Vaciar la tabla antes de poblar:
-- DELETE FROM productos;

INSERT INTO productos (nombre, precio) VALUES
('Teclado Mecánico', 45.99),
('Mouse Inalámbrico', 25.50),
('Monitor 24 Pulgadas', 179.00),
('Auriculares Bluetooth', 59.90),
('Pad Mouse Gamer', 12.00);

-- Verificación: debería listar los 5 productos insertados.
SELECT
    id,
    nombre,
    precio
FROM productos;
