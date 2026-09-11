// ============================================================
// validators/productos.js — Validación de datos (etapa 5)
//
// Valida el body de un producto contra las reglas de negocio.
// Devuelve un array con TODOS los problemas encontrados (array
// vacío = producto válido): así quien consume la API corrige
// todo de una vez, no de a un error por intento.
// ============================================================
function validarProducto(body) {
  // Si el pedido llegó sin body, req.body puede ser undefined:
  // lo reemplazamos por un objeto vacío para no reventar acá
  // (un body vacío simplemente no valida nada).
  const datos = body || {};
  const errores = [];

  // --- nombre ---
  // typeof revisa el TIPO primero: si llega un número o un objeto,
  // no tiene sentido medir el largo. trim() saca espacios de los
  // extremos, así "   " cuenta como vacío.
  if (typeof datos.nombre !== "string" || datos.nombre.trim() === "") {
    errores.push("El nombre es obligatorio y debe ser texto.");
  } else if (datos.nombre.trim().length > 100) {
    errores.push("El nombre no puede superar los 100 caracteres.");
  }

  // --- precio ---
  // Number.isFinite acepta 10 y 10.5; rechaza NaN, "10" (string),
  // Infinity y objetos. TRAMPA CLÁSICA: no usar !precio, porque
  // además de NaN rechazaría cualquier valor falsy sin distinguir.
  if (!Number.isFinite(datos.precio)) {
    errores.push("El precio es obligatorio y debe ser un número.");
  } else if (datos.precio < 0.01) {
    // Regla de negocio: nada gratis, el mínimo es 0.01.
    errores.push("El precio mínimo permitido es 0.01.");
  }

  return errores;
}

module.exports = { validarProducto };
