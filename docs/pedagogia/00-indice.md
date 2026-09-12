# Paquete pedagógico — zz-js01

## Propósito de esta carpeta

Esta carpeta reúne el paquete pedagógico del proyecto **zz-js01**, una aplicación web de aprendizaje que implementa un CRUD completo de productos. La sigla CRUD corresponde a las cuatro operaciones básicas de almacenamiento de datos: **C**reate (crear), **R**ead (leer o listar), **U**pdate (actualizar o editar) y **D**elete (borrar).

El material está pensado para lectores sin conocimientos previos de JavaScript: cada término técnico se define antes de utilizarse, cada fragmento de código proviene de manera literal de los archivos del proyecto y se indica siempre el archivo del que fue extraído.

Los documentos se redactan en registro impersonal y formal, con el formato de capítulos de un manual terminado.

## Orden de lectura recomendado

Se recomienda recorrer el paquete en el orden **1 → 4 → 5**:

1. **Archivo 1 — Análisis del Proyecto** (`01-analisis-del-proyecto.md`): presenta el proyecto, su arquitectura general, el desglose técnico de cada archivo, el flujo de datos de cada operación y los códigos HTTP empleados. Constituye el primer contacto con el código real.
2. **Archivo 4 — Guía de Estudio** (`04-guia-de-estudio.md`): ordena los conceptos técnicos empleados en el proyecto en seis niveles de dificultad creciente, con definiciones breves y referencias al archivo donde cada concepto aparece.
3. **Archivo 5 — Material Didáctico** (`05-material-didactico.md`): desarrolla la teoría de cada concepto de la guía de estudio, con ejemplos genéricos y fragmentos reales del proyecto, siempre orientado a la resolución concreta que el proyecto realiza.

Este orden responde a una progresión deliberada: primero se observa el proyecto completo, después se identifican los conceptos que lo sostienen y, por último, se estudia cada concepto en profundidad.

## Contenido del paquete

| Archivo | Título | Propósito |
| --- | --- | --- |
| `00-indice.md` | Índice | Orientación general: propósito, orden de lectura y alcance del paquete. |
| `01-analisis-del-proyecto.md` | Archivo 1 — Análisis del Proyecto | Descripción integral del proyecto: objetivo, arquitectura, desglose técnico por módulos, flujo de datos, códigos HTTP y evaluación de los objetivos pedagógicos. |
| `04-guia-de-estudio.md` | Archivo 4 — Guía de Estudio | Ruta de aprendizaje estructurada: los conceptos del proyecto ordenados por dificultad creciente, en seis niveles. |
| `05-material-didactico.md` | Archivo 5 — Material Didáctico | Desarrollo teórico de todos los conceptos de la guía de estudio, con ejemplos genéricos, fragmentos reales del proyecto y su conexión con la resolución. |

## Nota sobre la numeración

Los números 2 y 3 de la serie están **reservados por el diseño del curso** y quedan fuera del alcance de este paquete. Su ausencia no responde a un olvido ni a un error de numeración: la secuencia pedagógica completa contempla archivos adicionales que no forman parte de esta entrega. Por esa razón, el orden de lectura indicado es 1 → 4 → 5, sin archivos intermedios entre ellos.

## Relación con la documentación existente

El repositorio ya cuenta con documentación informal — el `README.md` y los archivos `docs/PRUEBAS.md`, `docs/ETAPAS.md` y `docs/ERRORES-Y-CORRECCIONES.md` — redactada en registro coloquial. Este paquete no la reemplaza: la complementa con un tratamiento formal, gradual y orientado a quien se inicia en JavaScript.

## Convenciones del paquete

- Registro impersonal y formal en la totalidad de los textos.
- Todo fragmento de código se cita de manera literal desde el archivo correspondiente, que se identifica junto al fragmento.
- Los fragmentos son breves — como máximo unas veinte líneas — y se presentan junto a la teoría que ilustran, nunca como listados completos.

Con estas convenciones, el paquete queda delimitado: tres documentos de estudio que acompañan el recorrido completo por el proyecto, desde la arquitectura general hasta el detalle de cada línea de código.
