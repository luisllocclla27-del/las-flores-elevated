# Ubicacion y destino en la pagina Restaurante

## Alcance

Actualizar unicamente la seccion de contenido que actualmente se presenta como "Reservas y Delivery" en `src/routes/restaurante.tsx`. La cabecera, sus controles, la ruta `/reservas`, el carrito y el modal de delivery permanecen sin cambios.

## Comportamiento y contenido

- Mantener `id="reservas"` para conservar los enlaces internos existentes.
- Cambiar la etiqueta de la seccion a "Ubicacion y destino".
- Reemplazar el titulo y el texto descriptivo por contenido orientado a la ubicacion del restaurante.
- Eliminar los botones "Reservar mesa" y "Pedir delivery" de esta seccion.
- Mostrar `public/inicio/Ubicacion.webp` mediante `/inicio/Ubicacion.webp`, con texto alternativo descriptivo y carga diferida coherente con la seccion.
- Distribuir la imagen a la izquierda y el texto a la derecha en escritorio; apilar ambos elementos en movil.

## Validacion

- Confirmar que la cabecera conserva exactamente sus controles actuales.
- Ejecutar el chequeo de tipos y la compilacion del proyecto.
- Verificar que la imagen se resuelva desde `/inicio/Ubicacion.webp` y que la seccion no conserve los dos botones retirados.
