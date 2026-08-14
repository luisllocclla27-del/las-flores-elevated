-- ====================================================================
-- PROYECTO LAS FLORES RESTAURANTE - SEGURIDAD RLS Y BUCKETS DE STORAGE
-- Tarea: RLF-99 (Bucket Supabase Storage + Políticas RLS)
-- Archivo: 02_storage_and_rls.sql
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. POLÍTICAS RLS PARA PROFILES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles son visibles públicamente" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "perfil_propio_sin_rol"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

REVOKE UPDATE (role) ON public.profiles FROM authenticated;

-- --------------------------------------------------------------------
-- 3. POLÍTICAS RLS PARA CATEGORIES & PRODUCTS (Carta Gastronómica)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Categorías visibles para todos" ON public.categories;
CREATE POLICY "Categorías visibles para todos"
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Productos visibles para todos" ON public.products;
CREATE POLICY "Productos visibles para todos"
    ON public.products FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Solo admins pueden modificar categorías" ON public.categories;
CREATE POLICY "Solo admins pueden modificar categorías"
    ON public.categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Solo admins pueden modificar productos" ON public.products;
CREATE POLICY "Solo admins pueden modificar productos"
    ON public.products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- --------------------------------------------------------------------
-- 4. POLÍTICAS RLS PARA RESERVATIONS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Cualquiera puede crear reservas" ON public.reservations;
CREATE POLICY "Cualquiera puede crear reservas"
    ON public.reservations FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Reservas visibles para consulta" ON public.reservations;
DROP POLICY IF EXISTS "Usuarios ven sus propias reservas" ON public.reservations;
CREATE POLICY "Reservas visibles para consulta"
    ON public.reservations FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins y staff gestionan reservas" ON public.reservations;
CREATE POLICY "Admins y staff gestionan reservas"
    ON public.reservations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
        )
    );

-- --------------------------------------------------------------------
-- 5. POLÍTICAS RLS PARA ORDERS & ORDER_ITEMS
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Cualquiera puede crear pedidos" ON public.orders;
CREATE POLICY "Cualquiera puede crear pedidos"
    ON public.orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Cualquiera puede agregar ítems al pedido" ON public.order_items;
CREATE POLICY "Cualquiera puede agregar ítems al pedido"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Pedidos visibles para consulta" ON public.orders;
DROP POLICY IF EXISTS "Usuarios ven sus propios pedidos" ON public.orders;
CREATE POLICY "Pedidos visibles para consulta"
    ON public.orders FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Ver ítems de pedidos autorizados" ON public.order_items;
CREATE POLICY "Ver ítems de pedidos autorizados"
    ON public.order_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins y staff actualizan pedidos" ON public.orders;
CREATE POLICY "Admins y staff actualizan pedidos"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
        )
    );

-- --------------------------------------------------------------------
-- 6. BUCKETS DE STORAGE & POLÍTICAS RLS DE ALMACENAMIENTO
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para menu-images
DROP POLICY IF EXISTS "Imágenes de menú son de lectura pública" ON storage.objects;
CREATE POLICY "Imágenes de menú son de lectura pública"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Solo admins pueden subir imágenes de menú" ON storage.objects;
CREATE POLICY "Solo admins pueden subir imágenes de menú"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'menu-images' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Políticas de Storage para user-avatars
DROP POLICY IF EXISTS "Avatares de usuario de lectura pública" ON storage.objects;
CREATE POLICY "Avatares de usuario de lectura pública"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Usuarios pueden subir su propio avatar" ON storage.objects;
CREATE POLICY "Usuarios pueden subir su propio avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user-avatars' AND
        auth.role() = 'authenticated'
    );
