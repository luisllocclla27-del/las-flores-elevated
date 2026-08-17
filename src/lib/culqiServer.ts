/**
 * Culqi Server-Side Service
 * Maneja el procesamiento de cargos en el backend usando la llave privada
 * Usa la API REST de Culqi directamente para compatibilidad con ESM
 */

// Tipos para las respuestas de Culqi API
export interface CulqiCharge {
  object: string;
  id: string;
  creation_date: number;
  amount: number;
  amount_refunded: number;
  currency_code: string;
  email: string;
  description: string;
  source: {
    object: string;
    id: string;
    type: string;
    email: string;
    card_number: string;
    last_four: string;
    active: boolean;
    iin: {
      object: string;
      bin: string;
      card_brand: string;
      card_type: string;
      card_category: string;
    };
  };
  outcome: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  };
  fraud_score: number | null;
  antifraud_details?: {
    first_name: string;
    last_name: string;
    address: string;
    address_city: string;
    phone_number: string;
    country_code: string;
  };
  dispute: boolean;
  capture: boolean;
  reference_code: string;
  authorization_code: string;
  metadata?: Record<string, any>;
  total_fee: number;
  fee_details: {
    fixed_fee: {
      total: number;
      currency_code: string;
      exchange_rate: {
        value: number;
        currency_code: string;
        date: string;
      };
    };
    variable_fee: {
      total: number;
      currency_code: string;
    };
  };
  net: number;
  paid: boolean;
  installments: number;
  duplicated: boolean;
}

export interface CreateChargePayload {
  amount: number; // en centavos
  currency_code: string; // "PEN" o "USD"
  email: string;
  source_id: string; // Token de Culqi obtenido del frontend
  description?: string;
  metadata?: Record<string, any>;
  antifraud_details?: {
    first_name: string;
    last_name: string;
    address: string;
    address_city: string;
    phone_number: string;
    country_code: string;
  };
}

/**
 * URL base de la API de Culqi
 */
const CULQI_API_URL = "https://api.culqi.com/v2";

/**
 * Obtiene la llave secreta de Culqi
 */
function getSecretKey(): string {
  const secretKey = process.env.CULQI_SECRET_KEY;

  if (!secretKey) {
    throw new Error("CULQI_SECRET_KEY no está definida en las variables de entorno");
  }

  return secretKey;
}

/**
 * Realiza una petición a la API de Culqi
 */
async function culqiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const secretKey = getSecretKey();
  
  const response = await fetch(`${CULQI_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${secretKey}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || data.object === "error") {
    const errorMsg = data.user_message || data.merchant_message || data.message || "Error en petición a Culqi";
    console.error("Detalle error Culqi API:", JSON.stringify(data));
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Crea un cargo en Culqi
 * @param payload Datos del cargo
 * @returns Objeto de cargo de Culqi
 */
export async function createCharge(payload: CreateChargePayload): Promise<CulqiCharge> {
  try {
    const chargeData = {
      amount: payload.amount,
      currency_code: payload.currency_code,
      email: payload.email,
      source_id: payload.source_id,
      description: payload.description || "Pedido en Restaurante Las Flores",
      metadata: payload.metadata,
      antifraud_details: payload.antifraud_details,
    };

    const charge = await culqiRequest("/charges", {
      method: "POST",
      body: JSON.stringify(chargeData),
    });

    return charge as CulqiCharge;
  } catch (error: any) {
    console.error("Error al crear cargo en Culqi:", error.message);
    throw new Error(error.message || "Error al procesar el pago con Culqi");
  }
}

/**
 * Obtiene los detalles de un cargo por su ID
 */
export async function getCharge(chargeId: string): Promise<CulqiCharge> {
  try {
    const charge = await culqiRequest(`/charges/${chargeId}`, {
      method: "GET",
    });

    return charge as CulqiCharge;
  } catch (error: any) {
    console.error("Error al obtener cargo de Culqi:", error);
    throw new Error(error.message || "Error al obtener detalles del pago");
  }
}

/**
 * Crea un reembolso para un cargo
 */
export async function refundCharge(chargeId: string, amount: number, reason?: string): Promise<any> {
  try {
    const refundData: any = {
      amount,
      charge_id: chargeId,
    };

    if (reason) {
      refundData.reason = reason;
    }

    const refund = await culqiRequest("/refunds", {
      method: "POST",
      body: JSON.stringify(refundData),
    });

    return refund;
  } catch (error: any) {
    console.error("Error al crear reembolso en Culqi:", error);
    throw new Error(error.message || "Error al procesar el reembolso");
  }
}

/**
 * Valida que el ambiente sea de producción o test según la llave
 */
export function isProductionMode(): boolean {
  const secretKey = process.env.CULQI_SECRET_KEY || "";
  return secretKey.startsWith("sk_live_");
}

/**
 * Formatea un monto de centavos a soles con símbolo
 */
export function formatAmount(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}
