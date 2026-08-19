-- ============================================================================
-- ENDURECIMIENTO DE SEGURIDAD — Restaurante Las Flores
-- ============================================================================
-- Aplicar DESPUÉS de `migrate_new_db.sql`.
--
-- Este script es idempotente: puede ejecutarse varias veces sin efectos
-- secundarios. Corrige tres problemas concretos detectados en la auditoría:
--
--   1. Los scripts antiguos (`storage_and_rls.sql`, `scratch/rls_policies.sql`)
--      dejaron políticas `USING (true)` sobre `orders`, `order_items` y
--      `reservations`. Eso permite que cualquier visitante anónimo lea el
--      nombre, correo, teléfono, dirección y geolocalización de TODOS los
--      clientes. Aquí se eliminan por nombre.
--
--   2. `orders` y `order_items` aceptaban `INSERT` directo de `anon`
--      (`WITH CHECK (true)`), lo que permite crear pedidos con totales
--      arbitrarios sin pasar por `create_order_secure`. Se cierra el INSERT
--      directo; los pedidos solo pueden crearse mediante el RPC, que recalcula
--      los precios en el servidor.
--
--   3. El costo de delivery llegaba desde el cliente sin validación. Ahora se
--      recalcula en el servidor con la fórmula de Haversine y la tarifa oficial.
--
-- Además se añade `get_orders_by_ids`, necesaria para que los pedidos de
-- invitados (sin cuenta) sigan visibles en "Mis pedidos" una vez cerrado el
-- INSERT/SELECT abierto. El acceso se basa en conocer el UUID del pedido, que
-- es imposible de adivinar y se guarda en el localStorage del navegador.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Eliminar las políticas permisivas heredadas
-- ----------------------------------------------------------------------------
-- Nombres provenientes de storage_and_rls.sql
DROP POLICY IF EXISTS "Pedidos visibles para consulta"          ON public.orders;
DROP POLICY IF EXISTS "Cualquiera puede crear pedidos"          ON public.orders;
DROP POLICY IF EXISTS "Ver ítems de pedidos autorizados"        ON public.order_items;
DROP POLICY IF EXISTS "Cualquiera puede agregar ítems al pedido" ON public.order_items;
DROP POLICY IF EXISTS "Reservas visibles para consulta"         ON public.reservations;
DROP POLICY IF EXISTS "Cualquiera puede crear reservas"         ON public.reservations;
DROP POLICY IF EXISTS "Admins y staff actualizan pedidos"       ON public.orders;
DROP POLICY IF EXISTS "Admins y staff gestionan reservas"       ON public.reservations;

-- Política creada a mano en el dashboard. Tenía `USING (true)` sobre `orders`,
-- lo que exponía los datos personales de todos los pedidos a cualquier visitante
-- anónimo. El rastreo público ahora se sirve por `get_order_tracking`.
DROP POLICY IF EXISTS "Permitir lectura de orden para rastreo"  ON public.orders;

-- Nombres provenientes de scratch/rls_policies.sql
DROP POLICY IF EXISTS "Enable read access for all users"        ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users"             ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users"   ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users"        ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for all users"             ON public.order_items;
DROP POLICY IF EXISTS "Enable update for authenticated users"   ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users"        ON public.reservations;
DROP POLICY IF EXISTS "Enable insert for all users"             ON public.reservations;

-- Nombres de la v3.1 que este script reemplaza
DROP POLICY IF EXISTS "orders_insert_any"      ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_any" ON public.order_items;

-- ----------------------------------------------------------------------------
-- 2. Asegurar que RLS esté activa (por si un script antiguo la desactivó)
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_pins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons      ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Políticas definitivas de pedidos
-- ----------------------------------------------------------------------------
-- Lectura: solo el dueño autenticado o el personal.
DROP POLICY IF EXISTS "orders_select_own_or_staff" ON public.orders;
CREATE POLICY "orders_select_own_or_staff" ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());

-- Escritura: prohibida por RLS. `create_order_secure` es SECURITY DEFINER y
-- por tanto no está sujeta a estas políticas: es la única vía de creación.
DROP POLICY IF EXISTS "orders_insert_via_rpc_only" ON public.orders;
CREATE POLICY "orders_insert_via_rpc_only" ON public.orders FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders FOR UPDATE
  USING (public.is_staff());

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin" ON public.orders FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_select_authorized" ON public.order_items;
CREATE POLICY "order_items_select_authorized" ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_staff())
  ));

DROP POLICY IF EXISTS "order_items_insert_via_rpc_only" ON public.order_items;
CREATE POLICY "order_items_insert_via_rpc_only" ON public.order_items FOR INSERT
  WITH CHECK (false);

-- Revocar el INSERT a nivel de privilegios de tabla, no solo de RLS.
REVOKE INSERT, UPDATE, DELETE ON public.orders      FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon;

-- ----------------------------------------------------------------------------
-- 4. Políticas definitivas de reservas
-- ----------------------------------------------------------------------------
-- El formulario de reservas sí inserta directamente (no hay RPC equivalente),
-- así que el INSERT sigue abierto, pero la LECTURA queda restringida.
DROP POLICY IF EXISTS "reservations_select_own_or_staff" ON public.reservations;
CREATE POLICY "reservations_select_own_or_staff" ON public.reservations FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "reservations_insert_any" ON public.reservations;
CREATE POLICY "reservations_insert_any" ON public.reservations FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "reservations_update_staff" ON public.reservations;
CREATE POLICY "reservations_update_staff" ON public.reservations FOR UPDATE
  USING (public.is_staff());

REVOKE UPDATE, DELETE ON public.reservations FROM anon;

-- ----------------------------------------------------------------------------
-- 5. Cupones: lectura pública restringida a los campos necesarios
-- ----------------------------------------------------------------------------
-- El carrito valida el cupón en el cliente antes de enviarlo. Se expone una
-- vista sin datos sensibles en lugar de abrir la tabla completa.
DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL
  USING (public.is_admin());

CREATE OR REPLACE VIEW public.active_coupons
WITH (security_invoker = false) AS
  SELECT code, discount_type, discount_value, min_order_total,
         order_type_restriction, max_uses, current_uses
  FROM public.coupons
  WHERE is_active = TRUE
    AND (valid_from  IS NULL OR NOW() >= valid_from)
    AND (valid_until IS NULL OR NOW() <= valid_until);

GRANT SELECT ON public.active_coupons TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. `create_order_secure`: el costo de delivery se calcula en el servidor
-- ----------------------------------------------------------------------------
-- Tarifa oficial: S/ 5.00 base + S/ 1.50 por km, radio máximo 8 km.
-- Debe mantenerse sincronizada con `src/utils/deliveryUtils.ts`.
CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(
    p_latitude NUMERIC, p_longitude NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
    -- Jr. José Olaya 106, Conchopata, Ayacucho
    c_lat      CONSTANT NUMERIC := -13.1628496;
    c_lng      CONSTANT NUMERIC := -74.2178801;
    c_base     CONSTANT NUMERIC := 5.0;
    c_per_km   CONSTANT NUMERIC := 1.5;
    c_max_km   CONSTANT NUMERIC := 8.0;
    v_distance NUMERIC;
BEGIN
    IF p_latitude IS NULL OR p_longitude IS NULL THEN
        RETURN c_base;
    END IF;

    -- Fórmula de Haversine (radio terrestre 6371 km)
    v_distance := 2 * 6371 * ASIN(SQRT(
        POWER(SIN(RADIANS(p_latitude - c_lat) / 2), 2) +
        COS(RADIANS(c_lat)) * COS(RADIANS(p_latitude)) *
        POWER(SIN(RADIANS(p_longitude - c_lng) / 2), 2)
    ));

    IF v_distance > c_max_km THEN
        RAISE EXCEPTION 'La dirección está fuera de la zona de cobertura (%.1f km).', v_distance;
    END IF;

    RETURN ROUND(c_base + (v_distance * c_per_km), 1);
END;
$$;
GRANT EXECUTE ON FUNCTION public.calculate_delivery_fee(NUMERIC, NUMERIC) TO anon, authenticated;

-- Se redefine solo el cálculo de `v_fee`; el resto de la función es idéntico
-- al de migrate_new_db.sql.
CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_client_name TEXT, p_client_email TEXT, p_client_phone TEXT,
    p_order_type TEXT, p_payment_method TEXT,
    p_items JSONB,
    p_address TEXT DEFAULT NULL, p_reference TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL, p_longitude NUMERIC DEFAULT NULL,
    p_distance_km NUMERIC DEFAULT 0, p_delivery_fee NUMERIC DEFAULT 0,
    p_coupon_code TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_order_id       UUID := gen_random_uuid();
    v_tracking       UUID := gen_random_uuid();
    v_order_number   TEXT;
    v_user_id        UUID := auth.uid();
    v_subtotal       NUMERIC(10,2) := 0;
    v_discount       NUMERIC(10,2) := 0;
    v_fee            NUMERIC(10,2) := 0;
    v_total          NUMERIC(10,2) := 0;
    v_item           JSONB;
    v_product_id     UUID;
    v_quantity       INT;
    v_price          NUMERIC(10,2);
    v_prod_name      TEXT;
    v_available      BOOLEAN;
    v_pin            TEXT;
    v_coupon_res     RECORD;
    v_item_count     INT;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El pedido no contiene ítems.';
    END IF;

    v_item_count := jsonb_array_length(p_items);
    IF v_item_count > 100 THEN
        RAISE EXCEPTION 'El pedido contiene demasiados ítems.';
    END IF;

    v_order_number := 'LF-' || LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');

    -- El costo de delivery NO se toma del cliente: se deriva de las coordenadas.
    v_fee := CASE
        WHEN p_order_type = 'delivery'
        THEN public.calculate_delivery_fee(p_latitude, p_longitude)
        ELSE 0
    END;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_quantity   := (v_item->>'quantity')::INT;
        IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 99 THEN
            RAISE EXCEPTION 'Cantidad inválida.';
        END IF;
        SELECT name, price, is_available INTO v_prod_name, v_price, v_available
          FROM public.products WHERE id = v_product_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Producto % no encontrado.', v_product_id; END IF;
        IF NOT v_available THEN RAISE EXCEPTION 'El producto "%" no está disponible.', v_prod_name; END IF;
        v_subtotal := v_subtotal + (v_price * v_quantity);
    END LOOP;

    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon_res FROM public.apply_coupon_secure(p_coupon_code, v_subtotal);
        IF v_coupon_res.valid THEN
            v_discount := v_coupon_res.discount_amount;
            UPDATE public.coupons SET current_uses = current_uses + 1
              WHERE UPPER(code) = UPPER(TRIM(p_coupon_code));
        END IF;
    END IF;

    v_total := GREATEST(0, v_subtotal - v_discount + v_fee);

    INSERT INTO public.orders (
        id, order_number, tracking_token, user_id, order_type,
        client_name, client_email, client_phone, address, reference,
        latitude, longitude, distance_km, subtotal, discount_amount,
        coupon_code, delivery_fee, total, payment_method, status, notes
    ) VALUES (
        v_order_id, v_order_number, v_tracking, v_user_id, p_order_type,
        p_client_name, p_client_email, p_client_phone, p_address, p_reference,
        p_latitude, p_longitude, p_distance_km, v_subtotal, v_discount,
        p_coupon_code, v_fee, v_total, p_payment_method, 'received', p_notes
    );

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_quantity   := (v_item->>'quantity')::INT;
        SELECT name, price INTO v_prod_name, v_price FROM public.products WHERE id = v_product_id;
        INSERT INTO public.order_items
          (order_id, product_id, product_name, unit_price, quantity, subtotal)
          VALUES (v_order_id, v_product_id, v_prod_name, v_price, v_quantity, (v_price * v_quantity));
    END LOOP;

    v_pin := LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
    INSERT INTO public.driver_pins (order_id, pin_code) VALUES (v_order_id, v_pin);

    RETURN jsonb_build_object(
        'id',              v_order_id,
        'order_number',    v_order_number,
        'tracking_token',  v_tracking,
        'subtotal',        v_subtotal,
        'discount_amount', v_discount,
        'delivery_fee',    v_fee,
        'total',           v_total,
        'status',          'received'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_order_secure TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. Rastreo público del pedido
-- ----------------------------------------------------------------------------
-- Los pedidos requieren sesión iniciada, así que el historial se lee
-- directamente de `orders` mediante la política `orders_select_own_or_staff`.
-- No existe RPC de invitados a propósito.
--
-- El enlace de rastreo, en cambio, sí debe funcionar sin sesión: se comparte
-- con el motorizado y con quien recibe el pedido. Se expone solo lo mínimo,
-- sin correo ni teléfono, y el acceso exige conocer el UUID del pedido.
DROP FUNCTION IF EXISTS public.get_orders_by_ids(UUID[]);

-- Rastreo público por enlace: solo los campos necesarios para la página de
-- seguimiento. No expone correo ni teléfono del cliente.
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id UUID)
RETURNS TABLE (
    id UUID, order_number TEXT, address TEXT, reference TEXT,
    status TEXT, total NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.order_number, o.address, o.reference, o.status, o.total
    FROM public.orders o WHERE o.id = p_order_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_order_tracking(UUID) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. PIN del motorizado: nunca debe viajar al cliente
-- ----------------------------------------------------------------------------
-- `verify_driver_pin` ya compara el PIN en el servidor. Se refuerza que la
-- tabla sea inaccesible salvo para el personal.
DROP POLICY IF EXISTS "driver_pins_staff_all" ON public.driver_pins;
CREATE POLICY "driver_pins_staff_all" ON public.driver_pins FOR ALL
  USING (public.is_staff());

REVOKE ALL ON public.driver_pins FROM anon;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN — ejecutar después y revisar que no queden políticas abiertas
-- ============================================================================
-- SELECT tablename, policyname, cmd, qual, with_check
--   FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN ('orders', 'order_items', 'reservations')
--  ORDER BY tablename, cmd;
--
-- No debe aparecer ninguna fila con qual = 'true' en un SELECT, ni
-- with_check = 'true' en un INSERT sobre orders/order_items.
