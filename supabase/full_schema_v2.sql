-- ====================================================================
-- PROYECTO LAS FLORES RESTAURANTE - ESQUEMA COMPLETO Y SEGURO v2 (SUPABASE)
-- Base de datos unificada con RLS estricto y RPCs SECURITY DEFINER
-- ====================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Funciones Helper de Seguridad y Roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated;

-- 3. TABLA: profiles (Clientes & Personal)
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger Automático de creación de perfiles
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
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLA: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);

-- 6. TABLA: restaurant_zones & zone_blackouts
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

-- Inserción de Zonas Oficiales
INSERT INTO public.restaurant_zones (
  id, name, short_name, description, image_url, color, color_light, max_capacity_persons, max_tables_count, sort_order
) VALUES
('salon-principal', 'Salón Principal', 'S. Principal', 'El corazón de Las Flores. Vista a los retablos andinos en pan de oro.', '/imagenes-reales/Salones/Salonprincipal.webp', '#5F8575', '#B0CBBD', 40, 8, 1),
('salon-entrada', 'Salón Entrada', 'S. Entrada', 'Espacio acogedor a la entrada del local con iluminación cálida y vista al patio principal.', '/imagenes-reales/Salones/entrada.webp', '#C8966A', '#EDD9C0', 34, 7, 2),
('salon-ventana', 'Salón Ventana', 'S. Ventana', 'Área amplia iluminada por grandes ventanales coloniales con vista panorámica exterior.', '/imagenes-reales/Salones/Ventana.webp', '#5A8C8C', '#B8D4D4', 38, 6, 3),
('estrado', 'Estrado Principal', 'Estrado', 'Zona elevada distinguida, ideal para celebraciones especiales y cenas grupales.', '/imagenes-reales/Salones/Estrado.webp', '#B8735A', '#DDBB9E', 32, 6, 4),
('pasillo', 'Pasillo Central', 'Pasillo', 'Paso colonial decorado con arte ayacuchano, retablos y detalles en madera.', '/imagenes-reales/Salones/pasillo.webp', '#8A7355', '#D6C8B4', 18, 4, 5),
('terraza', 'Terraza Colonial', 'Terraza', 'Ambiente al aire libre bajo el cielo ayacuchano con vegetación autóctona y brisa fresca.', '/imagenes-reales/Salones/Terraza.webp', '#6B8E55', '#C5DBB9', 26, 5, 6),
('jardin', 'Jardín Andino', 'Jardín', 'Espacio natural rodeado de flora regional y cantos de aves, perfecto para el almuerzo.', '/imagenes-reales/Salones/jardin.webp', '#4E7C59', '#B5D1BC', 30, 5, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  image_url = EXCLUDED.image_url,
  color = EXCLUDED.color,
  color_light = EXCLUDED.color_light;

-- 7. TABLA: reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_token UUID DEFAULT gen_random_uuid() NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_tracking ON public.reservations(tracking_token);

-- 8. TABLA: coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_total NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_total >= 0),
    max_uses INT DEFAULT NULL,
    current_uses INT DEFAULT 0 CHECK (current_uses >= 0),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: orders, order_items & driver_pins
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    tracking_token UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    address TEXT,
    reference TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    distance_km NUMERIC(5, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    coupon_code TEXT,
    delivery_fee NUMERIC(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('yape', 'card', 'cash')),
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'preparing', 'on_the_way', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_token);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.driver_pins (
    order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    pin_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: contact_messages
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

-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 12. POLÍTICAS DE RLS SEGURAS

-- Profiles:
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

REVOKE UPDATE (role) ON public.profiles FROM authenticated;

-- Categories & Products & Zones:
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (public.is_admin());

CREATE POLICY "zones_select_public" ON public.restaurant_zones FOR SELECT USING (true);
CREATE POLICY "zones_admin_all" ON public.restaurant_zones FOR ALL USING (public.is_admin());

CREATE POLICY "blackouts_select_public" ON public.zone_blackouts FOR SELECT USING (true);
CREATE POLICY "blackouts_admin_all" ON public.zone_blackouts FOR ALL USING (public.is_admin());

-- Reservations:
CREATE POLICY "reservations_select_own_or_staff" ON public.reservations FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "reservations_insert_any" ON public.reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reservations_update_staff" ON public.reservations FOR UPDATE
  USING (public.is_staff());

-- Orders & Order Items:
CREATE POLICY "orders_select_own_or_staff" ON public.orders FOR SELECT
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "orders_insert_authenticated_or_rpc" ON public.orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "orders_update_staff" ON public.orders FOR UPDATE
  USING (public.is_staff());

CREATE POLICY "order_items_select_authorized" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_staff())
    )
  );

CREATE POLICY "order_items_insert_authenticated_or_rpc" ON public.order_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Coupons:
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL
  USING (public.is_admin());

-- Driver Pins:
CREATE POLICY "driver_pins_staff_all" ON public.driver_pins FOR ALL
  USING (public.is_staff());

-- Contact Messages:
CREATE POLICY "contact_messages_insert_public" ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact_messages_select_admin" ON public.contact_messages FOR SELECT
  USING (public.is_admin());

-- 13. RPCs SEGURAS (SECURITY DEFINER)

-- RPC: Verificar PIN de motorizado
CREATE OR REPLACE FUNCTION public.verify_driver_pin(p_order_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_valid BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.driver_pins
        WHERE order_id = p_order_id AND pin_code = TRIM(p_pin)
    ) INTO v_valid;
    
    RETURN v_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.verify_driver_pin(UUID, TEXT) TO anon, authenticated;

-- RPC: Validar y aplicar cupón server-side
CREATE OR REPLACE FUNCTION public.apply_coupon_secure(p_code TEXT, p_subtotal NUMERIC)
RETURNS TABLE (
    valid BOOLEAN,
    discount_amount NUMERIC,
    coupon_code TEXT,
    message TEXT
) AS $$
DECLARE
    v_coupon public.coupons%ROWTYPE;
    v_calc_discount NUMERIC := 0;
BEGIN
    SELECT * INTO v_coupon FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_code)) AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El código de cupón no es válido o ha expirado.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.valid_from IS NOT NULL AND NOW() < v_coupon.valid_from THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El cupón aún no está activo.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND NOW() > v_coupon.valid_until THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El cupón ha vencido.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, 'El cupón ha alcanzado el límite máximo de usos.'::TEXT;
        RETURN;
    END IF;

    IF p_subtotal < v_coupon.min_order_total THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC, p_code, ('El pedido mínimo para este cupón es S/ ' || v_coupon.min_order_total::TEXT)::TEXT;
        RETURN;
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
        v_calc_discount := ROUND((p_subtotal * (v_coupon.discount_value / 100.0)), 2);
    ELSE
        v_calc_discount := LEAST(v_coupon.discount_value, p_subtotal);
    END IF;

    RETURN QUERY SELECT TRUE, v_calc_discount, v_coupon.code, 'Cupón aplicado con éxito.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.apply_coupon_secure(TEXT, NUMERIC) TO anon, authenticated;

-- RPC: Crear Pedido Seguro (Recalcula precios y delivery en servidor)
CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_client_name TEXT,
    p_client_email TEXT,
    p_client_phone TEXT,
    p_order_type TEXT,
    p_payment_method TEXT,
    p_items JSONB,
    p_address TEXT DEFAULT NULL,
    p_reference TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_distance_km NUMERIC DEFAULT 0,
    p_delivery_fee NUMERIC DEFAULT 0,
    p_coupon_code TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID := gen_random_uuid();
    v_tracking_token UUID := gen_random_uuid();
    v_order_number TEXT;
    v_user_id UUID := auth.uid();
    v_subtotal NUMERIC(10, 2) := 0;
    v_discount NUMERIC(10, 2) := 0;
    v_final_delivery_fee NUMERIC(10, 2) := 0;
    v_total NUMERIC(10, 2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INT;
    v_product_price NUMERIC(10, 2);
    v_product_name TEXT;
    v_product_available BOOLEAN;
    v_item_subtotal NUMERIC(10, 2);
    v_driver_pin TEXT;
    v_coupon_res RECORD;
BEGIN
    -- Generar número de pedido aleatorio LF-XXXX
    v_order_number := 'LF-' || LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');

    -- Validar delivery_fee
    IF p_order_type = 'delivery' THEN
        v_final_delivery_fee := GREATEST(0, COALESCE(p_delivery_fee, 0));
    ELSE
        v_final_delivery_fee := 0;
    END IF;

    -- Iterar items y recalcular subtotal con precios REALES de la base de datos
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'La cantidad del producto debe ser mayor a 0.';
        END IF;

        SELECT name, price, is_available INTO v_product_name, v_product_price, v_product_available
        FROM public.products WHERE id = v_product_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto % no encontrado en la carta.', v_product_id;
        END IF;

        IF NOT v_product_available THEN
            RAISE EXCEPTION 'El producto "%" no se encuentra disponible.', v_product_name;
        END IF;

        v_item_subtotal := v_product_price * v_quantity;
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    -- Validar y aplicar cupón si se proporcionó
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon_res FROM public.apply_coupon_secure(p_coupon_code, v_subtotal);
        IF v_coupon_res.valid THEN
            v_discount := v_coupon_res.discount_amount;
            UPDATE public.coupons
            SET current_uses = current_uses + 1
            WHERE UPPER(code) = UPPER(TRIM(p_coupon_code));
        END IF;
    END IF;

    -- Calcular Total Final en Servidor
    v_total := GREATEST(0, v_subtotal - v_discount + v_final_delivery_fee);

    -- Insertar Orden
    INSERT INTO public.orders (
        id, order_number, tracking_token, user_id, order_type,
        client_name, client_email, client_phone, address, reference,
        latitude, longitude, distance_km, subtotal, discount_amount,
        coupon_code, delivery_fee, total, payment_method, status, notes
    ) VALUES (
        v_order_id, v_order_number, v_tracking_token, v_user_id, p_order_type,
        p_client_name, p_client_email, p_client_phone, p_address, p_reference,
        p_latitude, p_longitude, p_distance_km, v_subtotal, v_discount,
        p_coupon_code, v_final_delivery_fee, v_total, p_payment_method, 'received', p_notes
    );

    -- Insertar Order Items con precios calculados por el servidor
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        SELECT name, price INTO v_product_name, v_product_price
        FROM public.products WHERE id = v_product_id;

        INSERT INTO public.order_items (
            order_id, product_id, product_name, unit_price, quantity, subtotal
        ) VALUES (
            v_order_id, v_product_id, v_product_name, v_product_price, v_quantity, (v_product_price * v_quantity)
        );
    END LOOP;

    -- Generar PIN de motorizado de 4 dígitos
    v_driver_pin := LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
    INSERT INTO public.driver_pins (order_id, pin_code) VALUES (v_order_id, v_driver_pin);

    RETURN jsonb_build_object(
        'id', v_order_id,
        'order_number', v_order_number,
        'tracking_token', v_tracking_token,
        'subtotal', v_subtotal,
        'discount_amount', v_discount,
        'delivery_fee', v_final_delivery_fee,
        'total', v_total,
        'driver_pin', v_driver_pin,
        'status', 'received'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_order_secure TO anon, authenticated;

-- RPC: Obtener pedido por token de rastreo
CREATE OR REPLACE FUNCTION public.get_order_by_tracking_token(p_order_id UUID, p_token UUID)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    order_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.order_number, o.order_type, o.status, o.created_at, o.total
    FROM public.orders o
    WHERE o.id = p_order_id AND o.tracking_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_order_by_tracking_token(UUID, UUID) TO anon, authenticated;

-- 14. BUCKETS DE STORAGE Y LÍMITES
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true),
       ('user-avatars', 'user-avatars', true),
       ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN ('user-avatars', 'menu-images', 'products');

-- Políticas de Storage
DROP POLICY IF EXISTS "Avatares de usuario con restricción de carpeta" ON storage.objects;
CREATE POLICY "Avatares de usuario con restricción de carpeta" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Imágenes públicas select" ON storage.objects FOR SELECT
  USING (bucket_id IN ('menu-images', 'user-avatars', 'products'));
