/**
 * Endpoint de cobro con Culqi.
 *
 * Regla de oro: el importe NUNCA se toma del cliente. Se recalcula aquí a
 * partir de los precios almacenados en Supabase y solo entonces se cobra.
 * El cliente envía la composición del pedido (ítems, tipo, ubicación, cupón)
 * y el `amount` que cree que debe pagar; si no coincide con el cálculo del
 * servidor, la petición se rechaza.
 *
 * IMPORTANTE — por qué este archivo se repite a sí mismo:
 * Este módulo debe ser AUTOCONTENIDO, sin imports relativos a `src/`. El
 * proyecto declara `"type": "module"`, de modo que en tiempo de ejecución Node
 * exige extensión en los imports relativos y la función falla al cargarse
 * (FUNCTION_INVOCATION_FAILED en toda petición, incluido OPTIONS). Solo se
 * admiten especificadores de paquete como `@supabase/supabase-js`, que se
 * resuelven desde node_modules.
 *
 * La contrapartida es que la lógica de precios está duplicada respecto a
 * `src/lib/pricing.ts` y `src/utils/deliveryUtils.ts`. Para que no se
 * desincronicen, las funciones puras se exportan y `src/tests/pricing.test.ts`
 * comprueba que ambas implementaciones dan el mismo resultado. Si cambias una
 * fórmula aquí, cámbiala allí también: el test fallará si no lo haces.
 */

import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "nodejs",
};

// ─────────────────────────────────────────────────────────────────────────────
// Lógica de precios (duplicada de src/lib/pricing.ts — ver nota de cabecera)
// ─────────────────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tolerancia al comparar importes, para absorber redondeos de punto flotante. */
const AMOUNT_TOLERANCE_CENTS = 1;

/** Coordenadas del restaurante: Jr. José Olaya 106, Conchopata, Ayacucho. */
const RESTAURANT_LOCATION = { lat: -13.1628496, lng: -74.2178801 };

const DELIVERY_CONFIG = {
  baseCost: 5,
  costPerKm: 1.5,
  maxRadiusKm: 8,
};

interface PricedItem {
  productId: string;
  quantity: number;
}

interface CouponRule {
  discount_type: string;
  discount_value: number;
  min_order_total?: number | null;
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function formatAmountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Distancia en kilómetros entre dos puntos (fórmula de Haversine). */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function calculateDeliveryCost(distanceKm: number): number {
  if (distanceKm === 0) return 0;
  const total = DELIVERY_CONFIG.baseCost + distanceKm * DELIVERY_CONFIG.costPerKm;
  return Math.round(total * 10) / 10;
}

export function calculateCouponDiscount(
  coupon: CouponRule | null | undefined,
  subtotal: number,
): number {
  if (!coupon) return 0;
  if (subtotal < Number(coupon.min_order_total || 0)) return 0;

  const type = String(coupon.discount_type || "").toLowerCase();
  const value = Number(coupon.discount_value || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;

  if (type === "percentage" || type === "percent") {
    return Math.round(subtotal * (value / 100) * 100) / 100;
  }
  return Math.min(value, subtotal);
}

export function computeOrderTotal(params: {
  items: PricedItem[];
  unitPrices: Map<string, number>;
  deliveryFee: number;
  coupon?: CouponRule | null;
}): { subtotal: number; discount: number; deliveryFee: number; total: number } {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  let subtotal = 0;
  for (const item of params.items) {
    const price = params.unitPrices.get(item.productId);
    if (price === undefined) {
      throw new Error(`Precio no encontrado para el producto ${item.productId}`);
    }
    subtotal += price * item.quantity;
  }
  subtotal = round2(subtotal);

  const discount = round2(calculateCouponDiscount(params.coupon, subtotal));
  const deliveryFee = round2(Math.max(0, params.deliveryFee));
  const total = round2(Math.max(0, subtotal - discount + deliveryFee));

  return { subtotal, discount, deliveryFee, total };
}

export function parseIncomingItems(raw: unknown): PricedItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("El pedido no contiene ítems.");
  }
  if (raw.length > 100) {
    throw new Error("El pedido contiene demasiados ítems.");
  }

  return raw.map((entry) => {
    const item = entry as Record<string, unknown>;
    const productId = item.productId ?? item.product_id ?? item.id;
    const quantity = Number(item.quantity);

    if (!isValidUuid(productId)) {
      throw new Error("Los productos del pedido no tienen identificadores válidos.");
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
      throw new Error("Cantidad de producto inválida.");
    }

    return { productId, quantity };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Control de acceso
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orígenes autorizados a invocar el cobro. Se evita `*` porque la respuesta
 * viaja con credenciales y el endpoint mueve dinero.
 */
const ALLOWED_ORIGINS = [
  "https://restaurantelasflores.com",
  "https://www.restaurantelasflores.com",
  "https://las-flores-elevated-main.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Previews de Vercel del propio proyecto.
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function applyCors(req: any, res: any): void {
  const origin = req.headers?.origin as string | undefined;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin as string);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const origin = req.headers?.origin as string | undefined;
  // Un navegador siempre envía Origin en peticiones cross-site; si viene y no
  // está autorizado, se corta. Las llamadas server-to-server (sin Origin) se
  // permiten porque no las puede falsificar una página de terceros.
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ success: false, error: "Origen no autorizado" });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const secretKey = process.env.CULQI_SECRET_KEY;
    if (!secretKey) {
      console.error("[culqi-charge] CULQI_SECRET_KEY no configurada");
      return res.status(500).json({
        success: false,
        error: "La pasarela de pagos no está configurada. Contacta al restaurante.",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("[culqi-charge] Credenciales de Supabase no configuradas");
      return res.status(500).json({
        success: false,
        error: "No se pudo validar el importe del pedido. Intenta más tarde.",
      });
    }

    // ---- Validación de entrada ----
    const tokenId = typeof payload.tokenId === "string" ? payload.tokenId.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const orderType = payload.orderType === "delivery" ? "delivery" : "pickup";

    if (!tokenId) {
      return res.status(400).json({ success: false, error: "Falta el token de la tarjeta." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, error: "El correo electrónico no es válido." });
    }

    const claimedAmount = Number(payload.amount);
    if (!Number.isInteger(claimedAmount) || claimedAmount <= 0) {
      return res.status(400).json({ success: false, error: "Importe inválido." });
    }

    let items: PricedItem[];
    try {
      items = parseIncomingItems(payload.items);
    } catch (validationErr: any) {
      return res.status(400).json({ success: false, error: validationErr.message });
    }

    // ---- Recálculo del importe con datos de confianza ----
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const productIds = [...new Set(items.map((i) => i.productId))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, is_available")
      .in("id", productIds);

    if (productsError) {
      console.error("[culqi-charge] Error consultando productos:", productsError.message);
      return res.status(502).json({
        success: false,
        error: "No se pudo validar el pedido. Intenta nuevamente.",
      });
    }

    if (!products || products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: "Algunos productos del pedido ya no existen en la carta.",
      });
    }

    const unavailable = products.filter((p: any) => p.is_available === false);
    if (unavailable.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Estos platos se agotaron: ${unavailable.map((p: any) => p.name).join(", ")}.`,
      });
    }

    const unitPrices = new Map<string, number>(
      products.map((p: any) => [p.id as string, Number(p.price)]),
    );

    // El costo de delivery se deriva de las coordenadas, no de lo que diga el cliente.
    let serverDeliveryFee = 0;
    let distanceKm = 0;
    if (orderType === "delivery") {
      const lat = Number(payload.latitude);
      const lng = Number(payload.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({
          success: false,
          error: "Falta la ubicación de entrega para calcular el delivery.",
        });
      }
      distanceKm = calculateDistanceKm(
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng,
        lat,
        lng,
      );
      if (distanceKm > DELIVERY_CONFIG.maxRadiusKm) {
        return res.status(400).json({
          success: false,
          error: "La dirección está fuera de nuestra zona de cobertura.",
        });
      }
      serverDeliveryFee = calculateDeliveryCost(distanceKm);
    }

    // El cupón se relee de la base de datos; solo se aplica si sigue vigente.
    let coupon: CouponRule | null = null;
    const couponCode =
      typeof payload.couponCode === "string" ? payload.couponCode.trim().toUpperCase() : "";
    if (couponCode) {
      const { data: couponRow } = await supabase
        .from("coupons")
        .select(
          "code, discount_type, discount_value, min_order_total, is_active, valid_from, valid_until, max_uses, current_uses, used_count",
        )
        .ilike("code", couponCode)
        .maybeSingle();

      if (couponRow && couponRow.is_active !== false) {
        const now = Date.now();
        const from = couponRow.valid_from ? Date.parse(couponRow.valid_from) : null;
        const until = couponRow.valid_until ? Date.parse(couponRow.valid_until) : null;
        const uses = Number(couponRow.current_uses ?? couponRow.used_count ?? 0);
        const maxUses = couponRow.max_uses === null ? null : Number(couponRow.max_uses);

        const withinWindow =
          (from === null || Number.isNaN(from) || now >= from) &&
          (until === null || Number.isNaN(until) || now <= until);
        const withinUses = maxUses === null || uses < maxUses;

        if (withinWindow && withinUses) {
          coupon = {
            discount_type: couponRow.discount_type,
            discount_value: Number(couponRow.discount_value),
            min_order_total: Number(couponRow.min_order_total || 0),
          };
        }
      }
    }

    const totals = computeOrderTotal({
      items,
      unitPrices,
      deliveryFee: serverDeliveryFee,
      coupon,
    });
    const expectedCents = formatAmountToCents(totals.total);

    if (Math.abs(expectedCents - claimedAmount) > AMOUNT_TOLERANCE_CENTS) {
      console.warn(
        `[culqi-charge] Importe rechazado. Cliente: ${claimedAmount} · Servidor: ${expectedCents}`,
      );
      return res.status(409).json({
        success: false,
        error: "El total del pedido cambió. Vuelve a revisar tu carrito antes de pagar.",
        expectedAmount: expectedCents,
      });
    }

    if (expectedCents < 100) {
      return res
        .status(400)
        .json({ success: false, error: "El importe mínimo de cobro es S/ 1.00." });
    }

    // ---- Cobro en Culqi ----
    const customerName =
      typeof payload.customerName === "string" && payload.customerName.trim()
        ? payload.customerName.trim().slice(0, 100)
        : "Cliente";
    const address =
      typeof payload.address === "string" ? payload.address.trim().slice(0, 200) : "";
    const cleanPhone = payload.customerPhone
      ? String(payload.customerPhone).replace(/\D/g, "").slice(-9)
      : "000000000";

    const metadata: Record<string, string> = {
      order_number: String(payload.orderNumber || "LF-ORDEN").slice(0, 50),
      customer_name: customerName,
    };
    if (cleanPhone !== "000000000") metadata.customer_phone = cleanPhone;
    if (address) metadata.delivery_address = address;

    const chargeData = {
      amount: expectedCents,
      currency_code: "PEN",
      email,
      source_id: tokenId,
      description: String(payload.description || "Pedido en Restaurante Las Flores").slice(0, 80),
      metadata,
      antifraud_details: {
        first_name: customerName.split(" ")[0] || "Cliente",
        last_name: customerName.split(" ").slice(1).join(" ") || "Las Flores",
        address: address || "Ayacucho",
        address_city: "Ayacucho",
        phone_number: cleanPhone,
        country_code: "PE",
      },
    };

    const culqiRes = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(chargeData),
    });

    const data: any = await culqiRes.json();

    if (!culqiRes.ok || data.object === "error") {
      // Se registra el detalle en el servidor, pero al cliente solo va el mensaje.
      console.error("[culqi-charge] Culqi rechazó el cargo:", JSON.stringify(data));
      const errorMsg =
        data.user_message || data.merchant_message || "Error al procesar el pago con tu tarjeta.";
      return res.status(culqiRes.status || 400).json({ success: false, error: errorMsg });
    }

    return res.status(200).json({
      success: true,
      chargeId: data.id,
      amount: data.amount,
      currency: data.currency_code,
      referenceCode: data.reference_code,
      authorizationCode: data.authorization_code,
      cardBrand: data.source?.iin?.card_brand,
      lastFour: data.source?.last_four,
      verifiedTotals: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        distanceKm: Math.round(distanceKm * 100) / 100,
      },
      outcome: {
        type: data.outcome?.type,
        code: data.outcome?.code,
        userMessage: data.outcome?.user_message,
      },
    });
  } catch (error: any) {
    console.error("[culqi-charge] Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno al procesar el pago. No se realizó ningún cobro.",
    });
  }
}
