/**
 * Culqi API Server Functions
 *
 * Ruta de respaldo del cobro con tarjeta. La ruta principal es el endpoint
 * serverless `/api/culqi-charge`, que recalcula el importe contra los precios
 * de Supabase. Esta función NO puede verificar el importe por sí sola, así que
 * exige que el llamante ya haya pasado por esa verificación.
 */

import { createServerFn } from "@tanstack/react-start";
import type { CreateChargePayload } from "./culqiServer";

/**
 * Server Function para procesar un cargo con Culqi
 * Este endpoint se ejecuta SOLO en el servidor con la llave privada
 */
export const processCulqiCharge = createServerFn()
  .validator((data: unknown) => {
    const raw = (data ?? {}) as Record<string, unknown>;

    const tokenId = typeof raw.tokenId === "string" ? raw.tokenId.trim() : "";
    const email = typeof raw.email === "string" ? raw.email.trim() : "";
    const amount = Number(raw.amount);

    if (!tokenId) {
      throw new Error("Falta el token de la tarjeta.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error("El correo electrónico no es válido.");
    }
    if (!Number.isInteger(amount) || amount < 100) {
      throw new Error("Importe inválido.");
    }

    return {
      tokenId,
      amount,
      email,
      description:
        typeof raw.description === "string"
          ? raw.description.slice(0, 80)
          : "Pedido en Restaurante Las Flores",
      orderNumber: typeof raw.orderNumber === "string" ? raw.orderNumber.slice(0, 50) : "LF-ORDEN",
      customerName:
        typeof raw.customerName === "string" && raw.customerName.trim()
          ? raw.customerName.trim().slice(0, 100)
          : "Cliente",
      customerPhone: typeof raw.customerPhone === "string" ? raw.customerPhone : undefined,
      address: typeof raw.address === "string" ? raw.address.slice(0, 200) : undefined,
    };
  })
  .handler(async ({ data: payload }) => {
    try {
      if (typeof window !== "undefined") {
        throw new Error("Esta función solo puede ejecutarse en el servidor");
      }

      const secretKey = process.env.CULQI_SECRET_KEY;
      if (!secretKey) {
        throw new Error("La pasarela de pagos no está configurada.");
      }

      const { createCharge } = await import("./culqiServer");

      const metadata: Record<string, string> = {
        order_number: payload.orderNumber,
        customer_name: payload.customerName,
      };

      // Culqi exige menos de 15 caracteres y solo dígitos.
      const cleanPhone = payload.customerPhone
        ? payload.customerPhone.replace(/\D/g, "").slice(-9)
        : "000000000";

      if (cleanPhone !== "000000000") {
        metadata.customer_phone = cleanPhone;
      }
      if (payload.address) {
        metadata.delivery_address = payload.address;
      }

      const chargePayload: CreateChargePayload = {
        amount: payload.amount,
        currency_code: "PEN",
        email: payload.email,
        source_id: payload.tokenId,
        description: payload.description,
        metadata,
        antifraud_details: {
          first_name: payload.customerName.split(" ")[0] || "Cliente",
          last_name: payload.customerName.split(" ").slice(1).join(" ") || "Las Flores",
          address: payload.address || "Ayacucho",
          address_city: "Ayacucho",
          phone_number: cleanPhone,
          country_code: "PE",
        },
      };

      const charge = await createCharge(chargePayload);

      if (!charge || !charge.id) {
        throw new Error("No se pudo procesar el cargo");
      }

      return {
        success: true,
        chargeId: charge.id,
        amount: charge.amount,
        currency: charge.currency_code,
        referenceCode: charge.reference_code,
        authorizationCode: charge.authorization_code,
        cardBrand: charge.source?.iin?.card_brand,
        lastFour: charge.source?.last_four,
        outcome: {
          type: charge.outcome.type,
          code: charge.outcome.code,
          userMessage: charge.outcome.user_message,
        },
      };
    } catch (error: any) {
      // El detalle queda en los logs del servidor; al cliente solo va el mensaje.
      console.error("Error procesando cargo Culqi:", error?.message, error);

      return {
        success: false,
        error: error?.message || "Error al procesar el pago",
        code: error?.code || "UNKNOWN_ERROR",
      };
    }
  });

/**
 * Server Function para verificar el estado de un cargo
 */
export const verifyCulqiCharge = createServerFn()
  .validator((data: unknown) => data as { chargeId: string })
  .handler(async ({ data: payload }) => {
  try {
    if (!payload.chargeId) {
      throw new Error("ID de cargo requerido");
    }

    const { getCharge } = await import("./culqiServer");
    const charge = await getCharge(payload.chargeId);

    return {
      success: true,
      chargeId: charge.id,
      amount: charge.amount,
      currency: charge.currency_code,
      paid: charge.paid,
      capture: charge.capture,
      referenceCode: charge.reference_code,
      outcome: {
        type: charge.outcome.type,
        userMessage: charge.outcome.user_message,
      },
    };
  } catch (error: any) {
    console.error("Error verificando cargo Culqi:", error);
    
    return {
      success: false,
      error: error.message || "Error al verificar el pago",
    };
  }
});

/**
 * Server Function para procesar reembolsos
 */
export const refundCulqiCharge = createServerFn()
  .validator((data: unknown) => data as { chargeId: string; amount: number; reason?: string })
  .handler(async ({ data: payload }) => {
  try {
    if (!payload.chargeId || !payload.amount) {
      throw new Error("Datos de reembolso incompletos");
    }

    if (payload.amount <= 0) {
      throw new Error("El monto del reembolso debe ser mayor a cero");
    }

    const { refundCharge } = await import("./culqiServer");
    const refund = await refundCharge(payload.chargeId, payload.amount, payload.reason);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      chargeId: refund.charge_id,
      reason: refund.reason || "Reembolso solicitado",
    };
  } catch (error: any) {
    console.error("Error procesando reembolso Culqi:", error);
    
    return {
      success: false,
      error: error.message || "Error al procesar el reembolso",
    };
  }
});
