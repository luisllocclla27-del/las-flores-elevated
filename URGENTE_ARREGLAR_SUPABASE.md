# 🚨 URGENTE: Arreglar Base de Datos de Supabase

## 📋 Resumen Rápido

**Estado:** La integración de Culqi funciona ✅ (el pago se procesa correctamente)  
**Problema:** La orden NO se guarda en Supabase ❌  
**Solución:** Ejecutar 1 script SQL en Supabase (toma 30 segundos)

---

## 🎯 Qué Hacer Ahora

### Paso 1: Ir a Supabase
1. Abrir https://supabase.com/dashboard
2. Seleccionar el proyecto **las-flores-web**
3. Click en **SQL Editor** (en el menú lateral izquierdo)

### Paso 2: Copiar Este Script

```sql
-- Arreglar constraint de status en tabla orders
-- Fecha: 2026-08-16

-- Ver constraint actual
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- Eliminar constraint incorrecta
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Crear constraint correcta
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('received', 'preparing', 'on_the_way', 'delivered', 'cancelled'));

-- Verificar que funcionó
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';
```

### Paso 3: Ejecutar
1. Pegar el script en el SQL Editor
2. Click en **"Run"** (o Ctrl+Enter)
3. Verificar que no haya errores

### Paso 4: Probar
1. Recargar la aplicación web (F5)
2. Hacer un pedido de prueba con Culqi
3. **Debería funcionar** ✅

---

## 🔍 ¿Qué Hace Este Script?

El script arregla la validación del campo `status` en la tabla `orders`:

- ❌ **Antes:** La constraint tenía valores incorrectos
- ✅ **Después:** Permite los valores correctos: `'received', 'preparing', 'on_the_way', 'delivered', 'cancelled'`

---

## ✅ Confirmación de Éxito

Si todo funciona correctamente, verás:

1. ✅ Cliente ingresa tarjeta en modal de Culqi
2. ✅ **Mensaje de confirmación "Su compra ha sido exitosa"**
3. ✅ **Pedido aparece en el dashboard de caja**
4. ✅ En las notas del pedido: `Culqi Token: ... | Culqi Charge: ... | Referencia: ...`

---

## 🧹 Después de que Funcione

Una vez confirmado que todo funciona, avisar al equipo de desarrollo para que limpien los logs de debugging.

Ver detalles completos en: `CULQI_IMPLEMENTATION_GUIDE.md` → Sección "Limpieza de Código"

---

## ❓ Si Algo Sale Mal

**Opción A:** Ejecutar el script de nuevo (es idempotente, se puede ejecutar múltiples veces)

**Opción B:** Contactar al equipo de desarrollo con este mensaje:
```
"Ejecuté el script pero sigue dando error al crear la orden. 
Error: [copiar el mensaje de error exacto]"
```

---

**Archivo relacionado:** `CULQI_IMPLEMENTATION_GUIDE.md` (guía completa)  
**Script SQL completo:** `supabase/fix_orders_constraints.sql`  
**Fecha:** 16 de Agosto, 2026
