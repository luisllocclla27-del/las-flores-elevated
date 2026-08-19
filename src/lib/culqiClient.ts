/**
 * Culqi Client-Side Service
 * Maneja la tokenización de tarjetas en el frontend
 */

// Tipos para Culqi JS V4
export interface CulqiCardData {
  cardNumber: string;
  cvv: string;
  expirationMonth: string;
  expirationYear: string;
  email: string;
}

export interface CulqiToken {
  object: string;
  id: string;
  type: string;
  creation_date: number;
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
    issuer: {
      name: string;
      country: string;
      country_code: string;
      website: string | null;
      phone_number: string | null;
    };
    installments_allowed: number[];
  };
  client: {
    ip: string;
    ip_country: string;
    ip_country_code: string;
    browser: string;
    device_fingerprint: string | null;
    device_type: string | null;
  };
  metadata?: Record<string, any>;
}

export interface CulqiError {
  object: string;
  type: string;
  charge_id: string | null;
  code: string;
  decline_code: string | null;
  merchant_message: string;
  user_message: string;
}

declare global {
  interface Window {
    Culqi: {
      publicKey: string;
      init: () => void;
      open: () => void;
      close: () => void;
      createToken: () => void;
      settings: (config: CulqiSettings) => void;
      token?: CulqiToken;
      error?: CulqiError;
    };
  }
}

export interface CulqiSettings {
  title: string;
  currency: string;
  amount: number; // en centavos (ejemplo: 5000 = S/ 50.00)
  order?: string; // opcional
  xculqirsaid?: string;
  rsapublickey?: string;
}

/**
 * Inicializa Culqi con la llave pública
 */
export function initializeCulqi(): boolean {
  if (typeof window === "undefined") return false;

  const publicKey = import.meta.env.VITE_CULQI_PUBLIC_KEY;
  
  if (!publicKey) {
    console.error("VITE_CULQI_PUBLIC_KEY no está definida en .env.local");
    return false;
  }

  if (!window.Culqi) {
    console.error("Culqi JS no está cargado. Asegúrate de incluir el script en el HTML.");
    return false;
  }

  window.Culqi.publicKey = publicKey;
  return true;
}

/**
 * Abre el checkout de Culqi con la configuración especificada
 */
export function openCulqiCheckout(config: CulqiSettings): Promise<CulqiToken> {
  return new Promise((resolve, reject) => {
    // Verificar que Culqi esté disponible
    if (typeof window === "undefined") {
      reject(new Error("Esta función solo puede ejecutarse en el navegador"));
      return;
    }

    if (!window.Culqi) {
      reject(new Error("Culqi no está cargado. Por favor, recarga la página."));
      return;
    }

    if (!initializeCulqi()) {
      reject(new Error("No se pudo inicializar Culqi"));
      return;
    }

    // Configurar el checkout
    window.Culqi.settings(config);

    // Definir handlers globales
    (window as any).culqi = function() {
      if (window.Culqi.token) {
        const tkn = window.Culqi.token;
        try {
          if (typeof window.Culqi.close === "function") {
            window.Culqi.close();
          }
        } catch (_) {}
        resolve(tkn);
      } else if (window.Culqi.error) {
        const err = window.Culqi.error;
        try {
          if (typeof window.Culqi.close === "function") {
            window.Culqi.close();
          }
        } catch (_) {}
        reject(err);
      }
    };

    // Abrir el modal de Culqi
    try {
      window.Culqi.open();
    } catch (error) {
      reject(new Error("Error al abrir el modal de Culqi. Por favor, intenta de nuevo."));
    }
  });
}

/**
 * Formatea un monto a centavos para Culqi
 *
 * Reexportado desde `pricing.ts`, que es la fuente única compartida con el
 * servidor para que cliente y backend calculen el mismo importe.
 */
export { formatAmountToCents } from "./pricing";

/**
 * Formatea centavos a soles
 * @param cents Monto en centavos (ejemplo: 5000)
 * @returns Monto en soles (ejemplo: 50.00)
 */
export function formatCentsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getCulqiErrorMessage(error: CulqiError | any): string {
  if (error?.user_message) {
    return error.user_message;
  }
  
  if (error?.merchant_message) {
    return error.merchant_message;
  }

  if (error?.message) {
    return error.message;
  }

  return "Ocurrió un error al procesar el pago. Por favor, intenta nuevamente.";
}
