# Diseño: Carga y Optimización de Imágenes QR de Yape (Empresa & Personal)

## 1. Resumen
Permitir a los administradores y personal de caja actualizar las imágenes de los códigos QR de Yape (tanto para la cuenta empresarial como personal) directamente desde el modal de configuración de Yape, aplicando compresión y optimización automática a formato `.webp` en el navegador antes de subirlo o sincronizarlo en tiempo real con los clientes.

---

## 2. Arquitectura y Componentes

### 2.1 Componente `YapeConfigModal` (`src/components/YapeConfigModal.tsx`)
Extraer y encapsular la lógica del modal de Yape en un componente reutilizable y mantenible:
- **Selector de Modo**: Botones interactivos para alternar entre "Yape Empresa" y "Yape Personal".
- **Edición de Datos**: Razón social / Nombre del titular y teléfono de contacto.
- **Zona de Carga y Previsualización de QR**:
  - Miniatura del QR actual correspondiente al modo seleccionado.
  - Botón de carga de archivo (soporta `.png`, `.jpg`, `.jpeg`, `.webp`).
  - Indicador de estado de carga (`Loader2`) y mensaje de optimización indicando el ahorro de peso (ej. `1.5 MB ➔ 65 KB WebP`).
  - Botón para restaurar QR predeterminado en caso de error.

### 2.2 Optimización de Imagen (`src/lib/webp-compressor.ts`)
- Utiliza `compressImageToWebP(file, 800, 800, 0.90)`.
- Dimensiones de 800x800 px con 90% de calidad para garantizar máxima legibilidad y contraste en escaneo de cámaras móviles.
- Intenta subir el archivo al almacenamiento de Supabase (`products` bucket o `qrs`). Si hay alguna restricción de red/RLS, almacena la cadena optimizada en base64 como respaldo garantizado.

### 2.3 Servicio de Sincronización (`src/lib/yapeService.ts`)
- La estructura `YapeConfig` ya soporta `businessQrUrl` y `personalQrUrl`.
- `saveYapeConfig` almacena en `localStorage`, emite evento local y envía `broadcast` por Supabase Realtime a todos los carritos activos (`CartSidebar.tsx`).

---

## 3. Flujo de Datos

```
[Usuario selecciona imagen QR] 
        │
        ▼
[compressImageToWebP en navegador] (convierte a .webp, reduce tamaño)
        │
        ▼
[Subida a Supabase Storage / Fallback WebP]
        │
        ▼
[Actualización en estado local de YapeConfig]
        │
        ▼
[Click en "Aplicar y Guardar Configuración"]
        │
        ▼
[saveYapeConfig()] ➔ [localStorage] + [Supabase Realtime Broadcast]
        │
        ▼
[CartSidebar de clientes actualiza QR en vivo]
```

---

## 4. Plan de Pruebas y Validación
1. **Prueba Unitaria / TypeScript**: Verificar que `tsc --noEmit` y `vitest` pasen sin errores.
2. **Prueba de Optimización**: Comprobar que una imagen PNG/JPG pesada se procese correctamente a WebP y se actualice `businessQrUrl` o `personalQrUrl`.
3. **Prueba de Persistencia y Sincronización**: Verificar que al cambiar la imagen y recargar o abrir el carrito (`CartSidebar`), se muestre el nuevo QR.
