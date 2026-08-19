import { createClient } from "@supabase/supabase-js";
import { isValidUuid } from "./pricing";

// Obtención de variables de entorno de Supabase (nunca hardcodear claves)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[Supabase] VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas en .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ====================================================================
// INTERFACES Y TIPOS DE TYPESCRIPT PARA LA BASE DE DATOS
// ====================================================================

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: "client" | "staff" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface ReservationPayload {
  user_id?: string;
  guest_count: number;
  reservation_date: string;
  service_type: "almuerzo" | "cena";
  reservation_time: string;
  zone_id?: string;
  table_number?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  notes?: string;
  status?: string;
}

export interface OrderPayload {
  order_number: string;
  user_id?: string;
  order_type: "delivery" | "pickup";
  status?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  address?: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  notes?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
}

// ====================================================================
// HELPER FUNCTIONS DE AUTENTICACIÓN Y SERVICIOS
// ====================================================================

/**
 * Iniciar sesión con Google OAuth mediante ventana emergente Popup (sin perder el carrito ni la página actual)
 */
export async function signInWithGoogle() {
  const currentOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://www.restaurantelasflores.com";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) {
    // Redirección directa en móviles para garantizar persistencia de sesión sin bloqueo de popups
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${currentOrigin}/`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
    return data;
  }

  // En escritorio intentamos popup con fallback a redirección directa.
  // La ventana se abre ANTES del await: si se abre después, el navegador ya
  // no lo reconoce como parte del gesto directo del clic del usuario y
  // bloquea el popup en silencio (sin error en consola).
  const width = 500, height = 650;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  const popup = window.open(
    "about:blank",
    "google_auth_popup",
    `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      skipBrowserRedirect: true,
      redirectTo: `${currentOrigin}/?auth_popup=1`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    popup?.close();
    throw error;
  }

  if (data?.url) {
    if (popup && !popup.closed) {
      popup.location.href = data.url;
    } else {
      // El popup fue bloqueado o cerrado: recurrimos a redirección directa
      window.location.href = data.url;
    }
  } else {
    popup?.close();
  }
  return data;
}

/**
 * Iniciar sesión con Facebook OAuth
 */
export async function signInWithFacebook() {
  const currentOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://www.restaurantelasflores.com";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${currentOrigin}/?auth_popup=1`,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Nota: el inicio de sesión con correo y contraseña se retiró a propósito.
 * Solo se admite autenticación federada con Google o Facebook, de modo que el
 * correo del cliente llega siempre verificado por el proveedor y no gestionamos
 * contraseñas. Conviene también desactivar el proveedor "Email" en el panel de
 * Supabase (Authentication → Providers) para cerrar la vía por API.
 */

export interface ProfileUpdatePayload {
  full_name?: string;
  phone?: string;
  birth_date?: string;
}

/**
 * Actualizar información de perfil del usuario en Supabase Auth
 */
export async function updateUserProfile(payload: ProfileUpdatePayload) {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Actualizar user_metadata en Supabase Auth
  const { data: authData, error: authErr } = await supabase.auth.updateUser({
    data: {
      full_name: payload.full_name,
      phone: payload.phone,
      birth_date: payload.birth_date,
    },
  });

  if (authErr) console.warn("Auth updateUser warning:", authErr);

  // 2. Persistir en la tabla public.profiles de la base de datos
  if (user) {
    const updateObj: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.full_name) updateObj.full_name = payload.full_name;
    if (payload.phone) updateObj.phone = payload.phone;
    if (payload.birth_date) updateObj.birth_date = payload.birth_date;

    let { error: dbErr } = await supabase
      .from("profiles")
      .update(updateObj)
      .eq("id", user.id);

    if (dbErr && payload.birth_date) {
      delete updateObj.birth_date;
      updateObj.birthdate = payload.birth_date;
      const { error: err2 } = await supabase
        .from("profiles")
        .update(updateObj)
        .eq("id", user.id);

      if (err2 && payload.phone) {
        await supabase
          .from("profiles")
          .update({ phone: payload.phone, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    }
  }

  return authData;
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Guardar una nueva reserva en Supabase
 */
export async function createReservation(payload: any) {
  const { reservation_date, reservation_time, zone_id } = payload;

  if (reservation_date) {
    try {
      const { data: blackouts } = await supabase
        .from("zone_blackouts")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", reservation_date);

      if (blackouts && blackouts.length > 0) {
        const matching = blackouts.find((b) => {
          if (b.zone_id !== null && zone_id && b.zone_id !== zone_id) return false;
          if (b.blackout_type !== "indefinite") {
            const endDate = b.end_date || b.start_date;
            if (reservation_date > endDate) return false;
          }
          if (b.blackout_type === "time_slot" && reservation_time && b.start_time && b.end_time) {
            const slotTime = reservation_time.length === 5 ? `${reservation_time}:00` : reservation_time;
            const startTime = b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time;
            const endTime = b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time;
            if (slotTime < startTime || slotTime > endTime) return false;
          }
          return true;
        });

        if (matching) {
          throw new Error(`La fecha u horario seleccionado no está disponible: ${matching.reason}`);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes("no está disponible")) {
        throw err;
      }
      console.warn("Soft warning checking blackout:", err);
    }
  }

  try {
    const { data: authUser } = await supabase.auth.getUser();
  } catch (e) {
    console.warn("No se pudo obtener id de usuario para reserva:", e);
  }

  // Normalizar service_type para cumplir la restricción CHECK de PostgreSQL (almuerzo o cena)
  let safeServiceType: "almuerzo" | "cena" = "almuerzo";
  if (payload.service_type === "cena") {
    safeServiceType = "cena";
  } else if (payload.service_type === "almuerzo") {
    safeServiceType = "almuerzo";
  } else {
    const hour = parseInt((payload.reservation_time || "12:00").split(":")[0], 10);
    safeServiceType = hour >= 16 ? "cena" : "almuerzo";
  }

  // Solo enviar campos que existen en el schema de Supabase
  const payloadToInsert: Record<string, any> = {
    guest_count: payload.guest_count || payload.guests || 2,
    reservation_date: payload.reservation_date,
    service_type: safeServiceType,
    reservation_time: payload.reservation_time,
    client_name: payload.client_name || payload.name,
    client_email: payload.client_email || payload.email,
    status: payload.status || "pending",
  };

  // Campos opcionales
  if (payload.zone_id) payloadToInsert.zone_id = payload.zone_id;
  if (payload.table_number) payloadToInsert.table_number = payload.table_number;
  if (payload.client_phone || payload.phone) payloadToInsert.client_phone = payload.client_phone || payload.phone;
  if (payload.notes) payloadToInsert.notes = payload.notes;

  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser?.user?.id) {
      payloadToInsert.user_id = authUser.user.id;
    }
  } catch (e) {
    // Continuar sin user_id
  }

  let { data, error } = await supabase
    .from("reservations")
    .insert([payloadToInsert])
    .select()
    .single();

  if (error) {
    console.warn("Intento 1 de inserción de reserva falló:", error.message);

    // Reintento 2: Sin service_type si viola la restricción CHECK
    const fallbackPayload = { ...payloadToInsert };
    delete fallbackPayload.service_type;

    const retryRes = await supabase
      .from("reservations")
      .insert([fallbackPayload])
      .select();

    if (!retryRes.error && retryRes.data && retryRes.data.length > 0) {
      return retryRes.data[0];
    }

    throw new Error(error.message || retryRes.error?.message || "No se pudo guardar la reserva en el servidor.");
  }
  return data;
}

/**
 * Guardar un nuevo pedido en Supabase con sus ítems (Servidor seguro vía RPC)
 */
export async function createOrder(payload: OrderPayload & { discount_amount?: number; coupon_code?: string }) {
  const { items, ...orderData } = payload;

  const hasValidUuids =
    items.length > 0 && items.every((item) => isValidUuid(item.product_id));

  if (hasValidUuids) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_secure", {
        p_client_name: orderData.client_name,
        p_client_email: orderData.client_email,
        p_client_phone: orderData.client_phone,
        p_order_type: orderData.order_type,
        p_payment_method: orderData.payment_method,
        p_items: items.map(item => ({ id: item.product_id, quantity: item.quantity })),
        p_address: orderData.address || null,
        p_reference: orderData.reference || null,
        p_latitude: orderData.latitude || null,
        p_longitude: orderData.longitude || null,
        p_distance_km: orderData.distance_km || 0,
        p_delivery_fee: orderData.delivery_fee || 0,
        p_coupon_code: payload.coupon_code || null,
        p_notes: orderData.notes || null
      });

      if (!rpcError && rpcData) {
        return rpcData;
      }
    } catch (rpcCatchErr) {
      console.error("[createOrder] Error en RPC create_order_secure:", rpcCatchErr);
      throw new Error("No se pudo procesar el pedido de forma segura. Intenta nuevamente.");
    }
  } else {
    throw new Error("Los productos del pedido no tienen identificadores válidos.");
  }
}

/**
 * Obtener el historial de pedidos del usuario autenticado.
 *
 * Los pedidos se crean siempre con sesión iniciada (`create_order_secure` los
 * asocia a `auth.uid()`), y las políticas RLS solo permiten leer los propios o,
 * al personal, todos. No existe vía de invitado.
 */
export async function getUserOrders(userId?: string) {
  if (!isValidUuid(userId)) return [];

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener pedidos del usuario:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Excepción al obtener pedidos:", err);
    return [];
  }
}

/**
 * Obtener el historial de reservas del usuario autenticado
 */
export async function getUserReservations(userId?: string, email?: string) {
  try {
    if (!userId && !email) return [];

    let query = supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (email) {
      query = query.ilike("client_email", email.trim());
    } else if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error al obtener reservas del usuario:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Excepción al obtener reservas:", err);
    return [];
  }
}

// ====================================================================
// FUNCIONES DEL PANEL ADMIN — CRUD DE PRODUCTOS
// ====================================================================

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(payload: Omit<Product, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("products")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  payload: Partial<Omit<Product, "id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Soft delete — marca el plato como inactivo (is_active = false).
 * NUNCA se elimina el registro de la base de datos.
 */
export async function archiveProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Restaura un plato archivado (is_active = true).
 */
export async function restoreProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: true })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleProductAvailability(id: string, is_available: boolean) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_available })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserRole(
  userId: string
): Promise<"client" | "staff" | "admin" | "delivery" | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error) return null;
  return (data?.role as "client" | "staff" | "admin" | "delivery") ?? null;
}
