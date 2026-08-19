import { describe, it, expect } from "vitest";
import {
  calculateCouponDiscount,
  computeOrderTotal,
  formatAmountToCents,
  isValidUuid,
  parseIncomingItems,
} from "../lib/pricing";
import { calculateDeliveryCost, calculateDistanceKm } from "../utils/deliveryUtils";
import * as endpoint from "../../api/culqi-charge";

const UUID_A = "11111111-2222-4333-8444-555555555555";
const UUID_B = "66666666-7777-4888-8999-aaaaaaaaaaaa";

describe("isValidUuid", () => {
  it("acepta un UUID de Supabase", () => {
    expect(isValidUuid(UUID_A)).toBe(true);
  });

  it("rechaza ids locales del carrito y valores no string", () => {
    expect(isValidUuid("cuy-chactado-con-papas")).toBe(false);
    expect(isValidUuid(`${UUID_A}-bebidaFria`)).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
    expect(isValidUuid(12345)).toBe(false);
  });
});

describe("calculateCouponDiscount", () => {
  it("aplica un porcentaje redondeado a dos decimales", () => {
    const discount = calculateCouponDiscount(
      { discount_type: "percentage", discount_value: 15 },
      99.9,
    );
    expect(discount).toBe(14.99);
  });

  it("acepta el alias historico 'percent' del panel admin", () => {
    expect(calculateCouponDiscount({ discount_type: "percent", discount_value: 10 }, 50)).toBe(5);
  });

  it("nunca descuenta mas que el subtotal en un cupon fijo", () => {
    expect(calculateCouponDiscount({ discount_type: "fixed", discount_value: 100 }, 40)).toBe(40);
  });

  it("no aplica el cupon si no se alcanza el consumo minimo", () => {
    const discount = calculateCouponDiscount(
      { discount_type: "fixed", discount_value: 10, min_order_total: 50 },
      30,
    );
    expect(discount).toBe(0);
  });

  it("devuelve 0 sin cupon o con valores invalidos", () => {
    expect(calculateCouponDiscount(null, 50)).toBe(0);
    expect(calculateCouponDiscount({ discount_type: "fixed", discount_value: 0 }, 50)).toBe(0);
  });
});

describe("computeOrderTotal", () => {
  const unitPrices = new Map([
    [UUID_A, 25],
    [UUID_B, 45],
  ]);

  it("calcula subtotal, delivery y total con precios de la base de datos", () => {
    const totals = computeOrderTotal({
      items: [
        { productId: UUID_A, quantity: 2 },
        { productId: UUID_B, quantity: 1 },
      ],
      unitPrices,
      deliveryFee: 6.5,
    });

    expect(totals.subtotal).toBe(95);
    expect(totals.deliveryFee).toBe(6.5);
    expect(totals.total).toBe(101.5);
  });

  it("descuenta el cupon antes de sumar el delivery", () => {
    const totals = computeOrderTotal({
      items: [{ productId: UUID_A, quantity: 4 }],
      unitPrices,
      deliveryFee: 5,
      coupon: { discount_type: "percentage", discount_value: 10 },
    });

    expect(totals.subtotal).toBe(100);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(95);
  });

  it("ignora el precio que pudiera enviar el cliente", () => {
    const totals = computeOrderTotal({
      items: [{ productId: UUID_A, quantity: 1, price: 0.01 } as never],
      unitPrices,
      deliveryFee: 0,
    });

    expect(totals.total).toBe(25);
  });

  it("nunca produce un total negativo", () => {
    const totals = computeOrderTotal({
      items: [{ productId: UUID_A, quantity: 1 }],
      unitPrices,
      deliveryFee: 0,
      coupon: { discount_type: "fixed", discount_value: 999 },
    });

    expect(totals.total).toBe(0);
  });

  it("falla si falta el precio de un producto", () => {
    expect(() =>
      computeOrderTotal({
        items: [{ productId: "99999999-8888-4777-8666-555555555555", quantity: 1 }],
        unitPrices,
        deliveryFee: 0,
      }),
    ).toThrow(/Precio no encontrado/);
  });
});

describe("parseIncomingItems", () => {
  it("normaliza product_id e id al campo productId", () => {
    const items = parseIncomingItems([
      { product_id: UUID_A, quantity: 2 },
      { id: UUID_B, quantity: 1 },
    ]);

    expect(items).toEqual([
      { productId: UUID_A, quantity: 2 },
      { productId: UUID_B, quantity: 1 },
    ]);
  });

  it("rechaza un pedido vacio", () => {
    expect(() => parseIncomingItems([])).toThrow(/no contiene items|no contiene ítems/i);
  });

  it("rechaza identificadores que no son UUID", () => {
    expect(() => parseIncomingItems([{ id: "cuy-chactado", quantity: 1 }])).toThrow(
      /identificadores/i,
    );
  });

  it("rechaza cantidades invalidas", () => {
    expect(() => parseIncomingItems([{ id: UUID_A, quantity: 0 }])).toThrow(/Cantidad/i);
    expect(() => parseIncomingItems([{ id: UUID_A, quantity: -3 }])).toThrow(/Cantidad/i);
    expect(() => parseIncomingItems([{ id: UUID_A, quantity: 2.5 }])).toThrow(/Cantidad/i);
    expect(() => parseIncomingItems([{ id: UUID_A, quantity: 500 }])).toThrow(/Cantidad/i);
  });
});

describe("formatAmountToCents", () => {
  it("convierte soles a centimos sin errores de punto flotante", () => {
    expect(formatAmountToCents(101.5)).toBe(10150);
    expect(formatAmountToCents(0.1 + 0.2)).toBe(30);
  });
});

describe("verificacion de importe en el servidor", () => {
  const unitPrices = new Map([[UUID_A, 25]]);

  it("detecta un importe manipulado por el cliente", () => {
    const totals = computeOrderTotal({
      items: [{ productId: UUID_A, quantity: 8 }],
      unitPrices,
      deliveryFee: 5,
    });
    const expectedCents = formatAmountToCents(totals.total);

    // El atacante intenta pagar S/ 1.00 por un pedido de S/ 205.00
    const claimedCents = 100;

    expect(expectedCents).toBe(20500);
    expect(Math.abs(expectedCents - claimedCents) > 1).toBe(true);
  });

  it("acepta el importe legitimo dentro de la tolerancia de redondeo", () => {
    const totals = computeOrderTotal({
      items: [{ productId: UUID_A, quantity: 3 }],
      unitPrices,
      deliveryFee: 6.5,
    });
    const expectedCents = formatAmountToCents(totals.total);

    expect(Math.abs(expectedCents - 8150) <= 1).toBe(true);
  });
});

/**
 * `api/culqi-charge.ts` duplica a proposito la logica de precios, porque debe
 * ser autocontenido: con `"type": "module"`, un import relativo sin extension
 * hace que la funcion serverless no arranque (FUNCTION_INVOCATION_FAILED).
 *
 * Estos tests son la red que evita que las dos copias se desincronicen.
 */
describe("paridad entre el endpoint y la logica compartida", () => {
  const unitPrices = new Map([
    [UUID_A, 25],
    [UUID_B, 45],
  ]);

  it("computeOrderTotal da el mismo resultado en ambas copias", () => {
    const casos = [
      { items: [{ productId: UUID_A, quantity: 2 }], deliveryFee: 6.5, coupon: null },
      {
        items: [
          { productId: UUID_A, quantity: 3 },
          { productId: UUID_B, quantity: 2 },
        ],
        deliveryFee: 0,
        coupon: { discount_type: "percentage", discount_value: 15 },
      },
      {
        items: [{ productId: UUID_B, quantity: 1 }],
        deliveryFee: 11,
        coupon: { discount_type: "fixed", discount_value: 20 },
      },
    ];

    for (const caso of casos) {
      const compartido = computeOrderTotal({ ...caso, unitPrices });
      const delEndpoint = endpoint.computeOrderTotal({ ...caso, unitPrices });
      expect(delEndpoint).toEqual(compartido);
    }
  });

  it("calculateCouponDiscount coincide en ambas copias", () => {
    const cupones = [
      { discount_type: "percentage", discount_value: 15 },
      { discount_type: "percent", discount_value: 10 },
      { discount_type: "fixed", discount_value: 30 },
      { discount_type: "fixed", discount_value: 10, min_order_total: 80 },
    ];

    for (const cupon of cupones) {
      for (const subtotal of [40, 99.9, 250]) {
        expect(endpoint.calculateCouponDiscount(cupon, subtotal)).toBe(
          calculateCouponDiscount(cupon, subtotal),
        );
      }
    }
  });

  it("el calculo de delivery coincide con deliveryUtils", () => {
    // Puntos reales alrededor de Huamanga, dentro del radio de cobertura.
    const puntos = [
      { lat: -13.1628496, lng: -74.2178801 },
      { lat: -13.1585, lng: -74.2234 },
      { lat: -13.1702, lng: -74.2101 },
    ];

    for (const p of puntos) {
      const distanciaCompartida = calculateDistanceKm(-13.1628496, -74.2178801, p.lat, p.lng);
      const distanciaEndpoint = endpoint.calculateDistanceKm(
        -13.1628496,
        -74.2178801,
        p.lat,
        p.lng,
      );
      expect(distanciaEndpoint).toBeCloseTo(distanciaCompartida, 10);
      expect(endpoint.calculateDeliveryCost(distanciaEndpoint)).toBe(
        calculateDeliveryCost(distanciaCompartida),
      );
    }
  });

  it("parseIncomingItems e isValidUuid coinciden en ambas copias", () => {
    expect(endpoint.isValidUuid(UUID_A)).toBe(isValidUuid(UUID_A));
    expect(endpoint.isValidUuid("no-es-uuid")).toBe(isValidUuid("no-es-uuid"));
    expect(endpoint.parseIncomingItems([{ id: UUID_A, quantity: 2 }])).toEqual(
      parseIncomingItems([{ id: UUID_A, quantity: 2 }]),
    );
    expect(endpoint.formatAmountToCents(101.5)).toBe(formatAmountToCents(101.5));
  });
});
