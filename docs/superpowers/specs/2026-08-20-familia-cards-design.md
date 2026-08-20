# Diseño: tarjetas de Familia Las Flores

## Objetivo

Simplificar las tarjetas de la página `/familia-las-flores` para que cada una comunique la historia del equipo mediante una imagen y una reseña, sin texto superpuesto ni controles de clasificación.

## Alcance visual

- Retirar la barra de categorías en móvil y escritorio.
- Mostrar únicamente los primeros cuatro colaboradores en el orden actual del arreglo `COLLABORATORS`.
- Organizar las tarjetas en una cuadrícula de dos columnas en pantallas medianas y grandes.
- Mantener una sola columna en pantallas pequeñas para conservar legibilidad.
- Mantener la imagen en la parte superior de la tarjeta.
- Mostrar debajo únicamente la reseña (`quote`), con un tratamiento editorial sobrio.
- Retirar de las tarjetas el nombre, cargo, antigüedad, insignia, plato recomendado y botón de pedido.

## Implementación

El cambio se realizará en `src/routes/familia-las-flores.tsx`:

- Eliminar el estado `activeCategory` y la lógica de filtrado asociada.
- Eliminar el bloque de filtros móvil y de escritorio.
- Renderizar directamente `COLLABORATORS`.
- Ajustar el grid a `grid-cols-1 md:grid-cols-2`.
- Simplificar el markup de cada tarjeta a imagen y bloque de reseña.
- Conservar el modal de carta solo si permanece utilizado por otra parte de la ruta; de lo contrario, retirar su estado, importación y referencias.

## Validación

- Ejecutar ESLint sobre la ruta modificada.
- Ejecutar el build de la aplicación para comprobar TypeScript, JSX y generación de rutas.
- Verificar que no queden referencias a filtros o estados eliminados.
