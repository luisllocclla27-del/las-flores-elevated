export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const secretKey = process.env.CULQI_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({
        success: false,
        error: "CULQI_SECRET_KEY no está configurada en las variables de entorno de Vercel",
      });
    }

    if (!payload.tokenId || !payload.amount || !payload.email) {
      return res.status(400).json({
        success: false,
        error: "Datos de pago incompletos (tokenId, amount, email son requeridos)",
      });
    }

    // Preparar metadata para Culqi
    const metadata: Record<string, any> = {
      order_number: payload.orderNumber || "LF-ORDEN",
      customer_name: payload.customerName || "Cliente",
    };
    if (payload.customerPhone) metadata.customer_phone = payload.customerPhone;
    if (payload.address) metadata.delivery_address = payload.address;

    const cleanPhone = payload.customerPhone
      ? String(payload.customerPhone).replace(/\D/g, "").slice(-9)
      : "000000000";

    const antifraudDetails = payload.customerName
      ? {
          first_name: String(payload.customerName).split(" ")[0] || "Cliente",
          last_name: String(payload.customerName).split(" ").slice(1).join(" ") || "Las Flores",
          address: payload.address || "Ayacucho",
          address_city: "Ayacucho",
          phone_number: cleanPhone,
          country_code: "PE",
        }
      : undefined;

    const chargeData = {
      amount: payload.amount,
      currency_code: "PEN",
      email: payload.email,
      source_id: payload.tokenId,
      description: payload.description || "Pedido en Restaurante Las Flores",
      metadata,
      antifraud_details: antifraudDetails,
    };

    const culqiRes = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(chargeData),
    });

    const data = await culqiRes.json();

    if (!culqiRes.ok || data.object === "error") {
      const errorMsg = data.user_message || data.merchant_message || data.message || "Error al procesar el cargo en Culqi";
      return res.status(culqiRes.status || 400).json({
        success: false,
        error: errorMsg,
        details: data,
      });
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
      outcome: {
        type: data.outcome?.type,
        code: data.outcome?.code,
        merchantMessage: data.outcome?.merchant_message,
        userMessage: data.outcome?.user_message,
      },
    });
  } catch (error: any) {
    console.error("Error en /api/culqi-charge:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor al procesar el pago",
    });
  }
}
