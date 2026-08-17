-- ============================================================
-- LAS FLORES RESTAURANTE — MIGRACIÓN COMPLETA v3
-- Nueva base de datos Supabase — Agosto 2026
-- Ejecutar COMPLETO en el SQL Editor como una sola transacción
-- ============================================================
-- ORDEN: extensiones → funciones → tablas → datos → RLS → RPCs → storage

BEGIN;

-- ============================================================
-- 0. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. FUNCIONES HELPER (antes de RLS porque las usan)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated;

-- ============================================================
-- 2. TABLA: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'staff', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger: auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        'client'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name  = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. CARTA: categories & products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug   ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);

-- ============================================================
-- 4. ZONAS Y BLACKOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurant_zones (
    id VARCHAR PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    color TEXT DEFAULT '#C8966A',
    color_light TEXT DEFAULT '#EDD9C0',
    max_capacity_persons INT DEFAULT 30,
    max_tables_count INT DEFAULT 6,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zone_blackouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR REFERENCES public.restaurant_zones(id) ON DELETE CASCADE,
    blackout_type VARCHAR(20) NOT NULL CHECK (blackout_type IN ('full_day', 'time_slot', 'indefinite')),
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos oficiales de zonas
INSERT INTO public.restaurant_zones
  (id, name, short_name, description, image_url, color, color_light, max_capacity_persons, max_tables_count, sort_order)
VALUES
  ('salon-principal','Salón Principal','S. Principal','El corazón de Las Flores. Vista a los retablos andinos en pan de oro.','/imagenes-reales/Salones/Salonprincipal.webp','#5F8575','#B0CBBD',40,8,1),
  ('salon-entrada','Salón Entrada','S. Entrada','Espacio acogedor a la entrada del local con iluminación cálida.','/imagenes-reales/Salones/entrada.webp','#C8966A','#EDD9C0',34,7,2),
  ('salon-ventana','Salón Ventana','S. Ventana','Área amplia iluminada por grandes ventanales coloniales.','/imagenes-reales/Salones/Ventana.webp','#5A8C8C','#B8D4D4',38,6,3),
  ('estrado','Estrado Principal','Estrado','Zona elevada distinguida, ideal para celebraciones especiales.','/imagenes-reales/Salones/Estrado.webp','#B8735A','#DDBB9E',32,6,4),
  ('pasillo','Pasillo Central','Pasillo','Paso colonial decorado con arte ayacuchano, retablos y madera.','/imagenes-reales/Salones/pasillo.webp','#8A7355','#D6C8B4',18,4,5),
  ('terraza','Terraza Colonial','Terraza','Ambiente al aire libre bajo el cielo ayacuchano.','/imagenes-reales/Salones/Terraza.webp','#6B8E55','#C5DBB9',26,5,6),
  ('jardin','Jardín Andino','Jardín','Espacio natural rodeado de flora regional, perfecto para el almuerzo.','/imagenes-reales/Salones/jardin.webp','#4E7C59','#B5D1BC',30,5,7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, short_name = EXCLUDED.short_name,
  image_url = EXCLUDED.image_url, color = EXCLUDED.color, color_light = EXCLUDED.color_light;

-- ============================================================
-- 5. RESERVAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_token UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guest_count INT NOT NULL CHECK (guest_count > 0),
    reservation_date DATE NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('almuerzo', 'cena')),
    reservation_time TIME NOT NULL,
    zone_id TEXT REFERENCES public.restaurant_zones(id) ON DELETE SET NULL,
    table_number TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    notes TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reservations_user     ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date     ON public.reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status   ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_tracking ON public.reservations(tracking_token);

-- ============================================================
-- 6. CUPONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_total NUMERIC(10,2) DEFAULT 0 CHECK (min_order_total >= 0),
    max_uses INT DEFAULT NULL,
    current_uses INT DEFAULT 0 CHECK (current_uses >= 0),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PEDIDOS (orders + order_items + driver_pins)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    tracking_token UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
    -- Datos del cliente
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    -- Dirección (solo delivery)
    address TEXT,
    reference TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    distance_km NUMERIC(5,2) DEFAULT 0,
    -- Totales (siempre calculados en servidor)
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    coupon_code TEXT,
    delivery_fee NUMERIC(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    -- Pago
    payment_method TEXT NOT NULL CHECK (payment_method IN ('yape', 'card', 'cash', 'culqi')),
    -- Estado — valores usados por la app
    status TEXT DEFAULT 'received'
        CONSTRAINT orders_status_check
        CHECK (status IN ('received', 'preparing', 'on_the_way', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user     ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number   ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created  ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_token);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.driver_pins (
    order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    pin_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. MENSAJES DE CONTACTO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. EMPLEOS (job_offers + job_applications) — módulo probado
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    work_mode TEXT NOT NULL CHECK (work_mode IN ('onsite', 'hybrid', 'remote')),
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT[] NOT NULL DEFAULT '{}',
    requirements TEXT[] NOT NULL DEFAULT '{}',
    benefits TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed')),
    application_deadline DATE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_offer_id UUID NOT NULL REFERENCES public.job_offers(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    experience_summary TEXT NOT NULL,
    availability TEXT NOT NULL,
    privacy_consent BOOLEAN NOT NULL DEFAULT false,
    cv_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_offers_status_idx        ON public.job_offers(status);
CREATE INDEX IF NOT EXISTS job_offers_created_at_idx    ON public.job_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS job_applications_status_idx  ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS job_applications_created_at_idx ON public.job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS job_applications_job_offer_id_idx ON public.job_applications(job_offer_id);

-- Trigger updated_at para empleos
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_job_offers_updated_at      ON public.job_offers;
CREATE TRIGGER set_job_offers_updated_at
  BEFORE UPDATE ON public.job_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER set_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. ROW LEVEL SECURITY — activar en todas las tablas
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_zones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_blackouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_pins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. POLÍTICAS RLS — perfiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- CRÍTICO: evita escalada de privilegios a admin
REVOKE UPDATE (role) ON public.profiles FROM authenticated;

-- ============================================================
-- 12. POLÍTICAS RLS — carta
-- ============================================================
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_all"     ON public.categories;
CREATE POLICY "categories_admin_all"     ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "products_admin_all"     ON public.products;
CREATE POLICY "products_admin_all"     ON public.products FOR ALL USING (public.is_admin());

-- ============================================================
-- 13. POLÍTICAS RLS — zonas y blackouts
-- ============================================================
DROP POLICY IF EXISTS "zones_select_public" ON public.restaurant_zones;
CREATE POLICY "zones_select_public" ON public.restaurant_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "zones_admin_all"     ON public.restaurant_zones;
CREATE POLICY "zones_admin_all"     ON public.restaurant_zones FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "blackouts_select_public" ON public.zone_blackouts;
CREATE POLICY "blackouts_select_public" ON public.zone_blackouts FOR SELECT USING (true);
DROP POLICY IF EXISTS "blackouts_admin_all"     ON public.zone_blackouts;
CREATE POLICY "blackouts_admin_all"     ON public.zone_blackouts FOR ALL USING (public.is_admin());

-- ============================================================
-- 14. POLÍTICAS RLS — reservas
-- ============================================================
DROP POLICY IF EXISTS "reservations_select_own_or_staff" ON public.reservations;
CREATE POLICY "reservations_select_own_or_staff" ON public.reservations FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "reservations_insert_any"    ON public.reservations;
CREATE POLICY "reservations_insert_any"    ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reservations_update_staff"  ON public.reservations;
CREATE POLICY "reservations_update_staff"  ON public.reservations FOR UPDATE USING (public.is_staff());

-- ============================================================
-- 15. POLÍTICAS RLS — pedidos
-- ============================================================
DROP POLICY IF EXISTS "orders_select_own_or_staff"        ON public.orders;
CREATE POLICY "orders_select_own_or_staff" ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "orders_insert_any"  ON public.orders;
CREATE POLICY "orders_insert_any"  ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders FOR UPDATE USING (public.is_staff());

DROP POLICY IF EXISTS "order_items_select_authorized" ON public.order_items;
CREATE POLICY "order_items_select_authorized" ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_staff())
  ));

DROP POLICY IF EXISTS "order_items_insert_any" ON public.order_items;
CREATE POLICY "order_items_insert_any" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "driver_pins_staff_all" ON public.driver_pins;
CREATE POLICY "driver_pins_staff_all" ON public.driver_pins FOR ALL USING (public.is_staff());

-- ============================================================
-- 16. POLÍTICAS RLS — cupones
-- ============================================================
DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL USING (public.is_admin());

-- ============================================================
-- 17. POLÍTICAS RLS — contacto
-- ============================================================
DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
CREATE POLICY "contact_messages_insert_public" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "contact_messages_select_admin"  ON public.contact_messages;
CREATE POLICY "contact_messages_select_admin"  ON public.contact_messages FOR SELECT USING (public.is_admin());

-- ============================================================
-- 18. POLÍTICAS RLS — empleos
-- ============================================================
DROP POLICY IF EXISTS "Public can view current job offers"  ON public.job_offers;
CREATE POLICY "Public can view current job offers" ON public.job_offers FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE));

DROP POLICY IF EXISTS "Admins can manage job offers" ON public.job_offers;
CREATE POLICY "Admins can manage job offers" ON public.job_offers FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Sin INSERT directo; se usa la RPC submit_job_application
REVOKE INSERT ON TABLE public.job_applications FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins can view job applications"   ON public.job_applications;
CREATE POLICY "Admins can view job applications"   ON public.job_applications FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update job applications" ON public.job_applications;
CREATE POLICY "Admins can update job applications" ON public.job_applications FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete job applications" ON public.job_applications;
CREATE POLICY "Admins can delete job applications" ON public.job_applications FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- 19. RPCs SEGURAS (SECURITY DEFINER)
-- ============================================================

-- RPC: validar cupón server-side
CREATE OR REPLACE FUNCTION public.apply_coupon_secure(p_code TEXT, p_subtotal NUMERIC)
RETURNS TABLE (valid BOOLEAN, discount_amount NUMERIC, coupon_code TEXT, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_coupon public.coupons%ROWTYPE;
    v_discount NUMERIC := 0;
BEGIN
    SELECT * INTO v_coupon FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_code)) AND is_active = TRUE;
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'Cupón no válido o expirado.'::TEXT; RETURN;
    END IF;
    IF v_coupon.valid_from IS NOT NULL AND NOW() < v_coupon.valid_from THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El cupón aún no está activo.'::TEXT; RETURN;
    END IF;
    IF v_coupon.valid_until IS NOT NULL AND NOW() > v_coupon.valid_until THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El cupón ha vencido.'::TEXT; RETURN;
    END IF;
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El cupón ha alcanzado el límite de usos.'::TEXT; RETURN;
    END IF;
    IF p_subtotal < v_coupon.min_order_total THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code,
          ('El pedido mínimo para este cupón es S/ ' || v_coupon.min_order_total::TEXT)::TEXT; RETURN;
    END IF;
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND((p_subtotal * v_coupon.discount_value / 100.0), 2);
    ELSE
        v_discount := LEAST(v_coupon.discount_value, p_subtotal);
    END IF;
    RETURN QUERY SELECT TRUE, v_discount, v_coupon.code, 'Cupón aplicado con éxito.'::TEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION public.apply_coupon_secure(TEXT, NUMERIC) TO anon, authenticated;

-- RPC: crear pedido seguro (recalcula precios en servidor)
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
BEGIN
    v_order_number := 'LF-' || LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
    v_fee := CASE WHEN p_order_type = 'delivery' THEN GREATEST(0, COALESCE(p_delivery_fee, 0)) ELSE 0 END;

    -- Recalcular subtotal con precios reales de la BD
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_quantity   := (v_item->>'quantity')::INT;
        IF v_quantity IS NULL OR v_quantity <= 0 THEN RAISE EXCEPTION 'Cantidad inválida.'; END IF;
        SELECT name, price, is_available INTO v_prod_name, v_price, v_available
          FROM public.products WHERE id = v_product_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Producto % no encontrado.', v_product_id; END IF;
        IF NOT v_available THEN RAISE EXCEPTION 'El producto "%" no está disponible.', v_prod_name; END IF;
        v_subtotal := v_subtotal + (v_price * v_quantity);
    END LOOP;

    -- Aplicar cupón si se proporcionó
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

    -- Insertar items con precios del servidor
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_quantity   := (v_item->>'quantity')::INT;
        SELECT name, price INTO v_prod_name, v_price FROM public.products WHERE id = v_product_id;
        INSERT INTO public.order_items
          (order_id, product_id, product_name, unit_price, quantity, subtotal)
          VALUES (v_order_id, v_product_id, v_prod_name, v_price, v_quantity, (v_price * v_quantity));
    END LOOP;

    -- PIN de motorizado
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
        'driver_pin',      v_pin,
        'status',          'received'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_order_secure TO anon, authenticated;

-- RPC: verificar PIN de motorizado
CREATE OR REPLACE FUNCTION public.verify_driver_pin(p_order_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_valid BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.driver_pins
        WHERE order_id = p_order_id AND pin_code = TRIM(p_pin)
    ) INTO v_valid;
    RETURN v_valid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_driver_pin(UUID, TEXT) TO anon, authenticated;

-- RPC: rastreo público por token
CREATE OR REPLACE FUNCTION public.get_order_by_tracking_token(p_order_id UUID, p_token UUID)
RETURNS TABLE (id UUID, order_number TEXT, order_type TEXT, status TEXT, created_at TIMESTAMPTZ, total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.order_number, o.order_type, o.status, o.created_at, o.total
    FROM public.orders o WHERE o.id = p_order_id AND o.tracking_token = p_token;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_order_by_tracking_token(UUID, UUID) TO anon, authenticated;

-- RPC: postular a empleo (con validaciones y CV privado)
DROP FUNCTION IF EXISTS public.submit_job_application(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION public.submit_job_application(
    p_job_offer_id UUID, p_full_name TEXT, p_phone TEXT, p_email TEXT, p_city TEXT,
    p_experience_summary TEXT, p_availability TEXT, p_privacy_consent BOOLEAN, p_cv_path TEXT
)
RETURNS public.job_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE application public.job_applications%ROWTYPE;
BEGIN
    IF p_privacy_consent IS DISTINCT FROM true
        OR COALESCE(BTRIM(p_full_name), '') = '' OR COALESCE(BTRIM(p_phone), '') = ''
        OR COALESCE(BTRIM(p_email), '') = '' OR COALESCE(BTRIM(p_city), '') = ''
        OR COALESCE(BTRIM(p_experience_summary), '') = '' OR COALESCE(BTRIM(p_availability), '') = ''
        OR COALESCE(BTRIM(p_cv_path), '') = '' THEN
        RAISE EXCEPTION 'Todos los campos son requeridos.' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.job_offers
        WHERE id = p_job_offer_id AND status = 'published'
          AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)
    ) THEN
        RAISE EXCEPTION 'Esta oferta no está aceptando postulaciones.' USING ERRCODE = 'check_violation';
    END IF;
    INSERT INTO public.job_applications
      (id, job_offer_id, full_name, phone, email, city, experience_summary, availability, privacy_consent, cv_path, status)
      VALUES (gen_random_uuid(), p_job_offer_id, BTRIM(p_full_name), BTRIM(p_phone), BTRIM(p_email),
              BTRIM(p_city), BTRIM(p_experience_summary), BTRIM(p_availability), true, BTRIM(p_cv_path), 'new')
      RETURNING * INTO application;
    RETURN application;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_job_application(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_job_application(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN,TEXT) TO anon, authenticated;

-- ============================================================
-- 20. STORAGE — buckets con límites
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('menu-images',  'menu-images',  true,  2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('user-avatars', 'user-avatars', true,  2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('products',     'products',     true,  2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('job-cvs',      'job-cvs',      false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de storage — imágenes públicas
DROP POLICY IF EXISTS "Imágenes públicas select" ON storage.objects;
CREATE POLICY "Imágenes públicas select" ON storage.objects FOR SELECT
  USING (bucket_id IN ('menu-images', 'user-avatars', 'products'));

DROP POLICY IF EXISTS "Admin upload menu images" ON storage.objects;
CREATE POLICY "Admin upload menu images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('menu-images','products') AND public.is_admin());

DROP POLICY IF EXISTS "Avatar upload own" ON storage.objects;
CREATE POLICY "Avatar upload own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- CV de empleos: carga pública solo a folders activos
DROP POLICY IF EXISTS "Public can upload job CVs" ON storage.objects;
CREATE POLICY "Public can upload job CVs" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (
    bucket_id = 'job-cvs'
    AND storage.extension(name) = 'pdf'
    AND metadata->>'mimetype' = 'application/pdf'
    AND EXISTS (
      SELECT 1 FROM public.job_offers
      WHERE id::text = (storage.foldername(name))[1]
        AND status = 'published'
        AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)
    )
  );

DROP POLICY IF EXISTS "Admins can view job CVs" ON storage.objects;
CREATE POLICY "Admins can view job CVs" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'job-cvs' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete job CVs" ON storage.objects;
CREATE POLICY "Admins can delete job CVs" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'job-cvs' AND public.is_admin());

COMMIT;

-- ============================================================
-- FIN — Verificación rápida post-migración
-- ============================================================
SELECT
  t.tablename,
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_name = t.tablename AND constraint_type = 'CHECK') AS check_constraints,
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
