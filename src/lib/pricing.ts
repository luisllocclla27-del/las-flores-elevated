/**
 * Lógica de precios compartida entre el cliente y el servidor.
 *
 * Este módulo es deliberadamente puro (sin dependencias de navegador ni de red)
 * para poder importarse tanto desde componentes React como desde las funciones
 * serverless de `api/`. Cualquier cálculo que determine cuánto paga el cliente
 * debe vivir aquí para que el servidor pueda recalcularlo y verificarlo.
 */

/** UUID v4 tal como los genera Supabase. */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/** Tolerancia al comparar importes, para absorber redondeos de punto flotante. */
export const AMOUNT_TOLERANCE_CENTS = 1;

export interface PricedItem {
  /** UUID del producto en Supabase. */
  productId: string;
  quantity: number;
}

export interface CouponRule {
  discount_type: string;
  discount_value: number;
  min_order_total?: number | null;
}

/** Convierte soles a céntimos, la unidad que espera Culqi. */
export function formatAmountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Descuento en soles que corresponde a un cupón sobre un subtotal dado.
 *
 * Acepta tanto `percentage` (nomenclatura del esquema SQL) como `percent`
 * (usada históricamente por el panel de administración) para no romper los
 * cupones ya creados.
 */
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

/**
 * Calcula el total de un pedido a partir de precios de confianza.
 *
 * `unitPrices` debe provenir de la base de datos, nunca del cliente.
 * Devuelve importes redondeados a 2 decimales.
 */
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

/** Valida y normaliza los ítems que llegan en una petición no confiable. */
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
