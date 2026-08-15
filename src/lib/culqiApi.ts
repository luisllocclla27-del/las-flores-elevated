/**
 * Culqi API Server Functions
 * Endpoints seguros para procesar pagos con Culqi desde el backend
 */

import { createServerFn } from "@tanstack/react-start";
import type { CreateChargePayload } from "./culqiServer";

/**
 * Server Function para procesar un cargo con Culqi
 * Este endpoint se ejecuta SOLO en el servidor con la llave privada
 */
export const processCulqiCharge = createServerFn("POST", async (payload: {
  tokenId: string;
  amount: number; // en centavos
  email: string;
  description: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  address?: string;
}) => {
  try {
    // Importación dinámica para evitar que se cargue en el cliente
    const { createCharge } = await import("./culqiServer");
    
    // Validar datos de entrada
    if (!payload.tokenId || !payload.amount || !payload.email) {
      throw new Error("Datos de pago incompletos");
    }

    if (payload.amount <= 0) {
      throw new Error("El monto debe ser mayor a cero");
    }

    // Preparar metadata para Culqi
    const metadata: Record<string, any> = {
      order_number: payload.orderNumber,
      customer_name: payload.customerName,
    };

    if (payload.customerPhone) {
      metadata.customer_phone = payload.customerPhone;
    }

    if (payload.address) {
      metadata.delivery_address = payload.address;
    }

    // Preparar datos antifraud (opcional pero recomendado)
    const antifraudDetails = payload.customerName
      ? {
          first_name: payload.customerName.split(" ")[0] || payload.customerName,
          last_name: payload.customerName.split(" ").slice(1).join(" ") || payload.customerName,
          address: payload.address || "N/A",
          address_city: "Ayacucho",
          phone_number: payload.customerPhone || "000000000",
          country_code: "PE",
        }
      : undefined;

    // Crear cargo en Culqi
    const chargePayload: CreateChargePayload = {
      amount: payload.amount,
      currency_code: "PEN",
      email: payload.email,
      source_id: payload.tokenId,
      description: payload.description,
      metadata,
      antifraud_details: antifraudDetails,
    };

    const charge = await createCharge(chargePayload);

    // Verificar que el cargo fue exitoso
    if (!charge || !charge.id) {
      throw new Error("No se pudo procesar el cargo");
    }

    // Retornar solo los datos necesarios al cliente
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
        merchantMessage: charge.outcome.merchant_message,
        userMessage: charge.outcome.user_message,
      },
    };
  } catch (error: any) {
    console.error("Error procesando cargo Culqi:", error);
    
    // Retornar error estructurado
    return {
      success: false,
      error: error.message || "Error al procesar el pago",
      code: error.code || "UNKNOWN_ERROR",
    };
  }
});

/**
 * Server Function para verificar el estado de un cargo
 */
export const verifyCulqiCharge = createServerFn("POST", async (payload: {
  chargeId: string;
}) => {
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
export const refundCulqiCharge = createServerFn("POST", async (payload: {
  chargeId: string;
  amount: number;
  reason?: string;
}) => {
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
