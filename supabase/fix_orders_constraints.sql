-- Script para verificar y arreglar las constraints de la tabla orders
-- Ejecutar en el SQL Editor de Supabase

-- 1. Ver las constraints actuales de la tabla orders
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND contype = 'c'; -- check constraints

-- 2. Eliminar la constraint antigua de status (si existe y está mal)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 3. Crear la constraint correcta para status
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('received', 'preparing', 'on_the_way', 'delivered', 'cancelled'));

-- 4. Verificar que la nueva constraint fue creada
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';
