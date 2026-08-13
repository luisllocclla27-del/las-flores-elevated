import { describe, it, expect } from "vitest";
import { calculateDistanceKm, calculateDeliveryCost, DELIVERY_CONFIG, RESTAURANT_LOCATION } from "../utils/deliveryUtils";
import { resolveProductCustomOptions } from "../lib/liveProducts";

describe("Pruebas Unitarias de Cálculo de Delivery", () => {
  it("debe verificar la ubicación exacta del restaurante Las Flores en Ayacucho", () => {
    expect(RESTAURANT_LOCATION.lat).toBeCloseTo(-13.1628, 3);
    expect(RESTAURANT_LOCATION.lng).toBeCloseTo(-74.2178, 3);
  });

  it("debe calcular correctamente la distancia en kilómetros entre dos coordenadas GPS (Haversine)", () => {
    // Ayacucho Plaza de Armas vs Restaurante
    const dist = calculateDistanceKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, -13.1606, -74.2257);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(3.0);
  });

  it("debe calcular el costo de envío sumando costo base y km adicionales", () => {
    // Costo para 2km: 5 + (2 * 1.5) = 8.00
    const cost2km = calculateDeliveryCost(2.0);
    expect(cost2km).toBe(8.0);
  });

  it("debe retornar 0 costo si la distancia es 0", () => {
    const costZero = calculateDeliveryCost(0);
    expect(costZero).toBe(0);
  });

  it("debe validar el límite máximo de cobertura de delivery (8 km)", () => {
    expect(DELIVERY_CONFIG.maxRadiusKm).toBe(8);
  });

  it("debe personalizar espagueti al pesto con milanesa, pollo al grill y filet mignon", () => {
    const customOptions = resolveProductCustomOptions("Espagueti al pesto", 0);

    expect(customOptions).toBeDefined();
    expect(customOptions?.[0]?.title).toBe("1. Proteína");
    expect(customOptions?.[0]?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Milanesa", price: 42 }),
        expect.objectContaining({ name: "Pollo al grill", price: 40 }),
        expect.objectContaining({ name: "Filet mignon", price: 46 }),
      ]),
    );
    expect(customOptions?.[1]).toMatchObject({ title: "2. Carbohidrato" });
    expect(customOptions?.[2]).toMatchObject({ title: "3. Ensalada" });
  });

  it("debe personalizar fetuchini a la huancaina con pollo al grill y lomo saltado", () => {
    const customOptions = resolveProductCustomOptions("Fetuchini a la huancaina", 0);

    expect(customOptions).toBeDefined();
    expect(customOptions?.[0]?.title).toBe("1. Proteína");
    expect(customOptions?.[0]?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Pollo al grill", price: 40 }),
        expect.objectContaining({ name: "Lomo saltado", price: 44 }),
      ]),
    );
  });

  it("debe personalizar gran filet mignon con carbohidrato y ensalada", () => {
    const customOptions = resolveProductCustomOptions("Gran Filet Mignon", 80);

    expect(customOptions).toBeDefined();
    expect(customOptions?.[0]?.title).toBe("1. Carbohidrato");
    expect(customOptions?.[1]?.title).toBe("2. Ensalada");
    expect(customOptions?.[0]?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Papas fritas francesas", price: 0 }),
        expect.objectContaining({ name: "Papas salteadas en mantequilla", price: 0 }),
      ]),
    );
    expect(customOptions?.[1]?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Ensalada orgánica", price: 0 }),
        expect.objectContaining({ name: "Ensalada sancochada", price: 0 }),
      ]),
    );
  });
});
