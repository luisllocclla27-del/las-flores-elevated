import { supabase } from "./supabase";

/**
 * Servicio Centralizado de Correos Electrónicos — Restaurante Las Flores
 * Remitentes Oficiales:
 * - pedidos@restaurantelasflores.com
 * - reservas@restaurantelasflores.com
 * - no-reply@restaurantelasflores.com
 * - contacto@restaurantelasflores.com
 */

export const OFFICIAL_EMAIL = "contacto@restaurantelasflores.com";

export const SENDERS = {
  GENERAL: `Restaurante Las Flores <${OFFICIAL_EMAIL}>`,
  PEDIDOS: `Pedidos — Las Flores <pedidos@restaurantelasflores.com>`,
  RESERVAS: `Reservas — Las Flores <reservas@restaurantelasflores.com>`,
  NOTIFICACIONES: `Las Flores <no-reply@restaurantelasflores.com>`,
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Función genérica para enviar correos electrónicos usando el endpoint serverless (/api/send-email) o Supabase Edge Functions.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const emailBody = {
    from: payload.from || SENDERS.GENERAL,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    reply_to: payload.replyTo || OFFICIAL_EMAIL,
    subject: payload.subject,
    html: payload.html,
  };

  // 1. Intentar primero con el endpoint serverless directo de Vercel (mismo origen, 0 errores CORS)
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailBody),
    });

    if (res.ok) {
      console.info(
        `[Email Service]: Correo enviado con éxito a ${
          Array.isArray(payload.to) ? payload.to.join(", ") : payload.to
        }`
      );
      return true;
    }
  } catch (apiErr) {
    // Si estamos en un entorno sin /api/send-email (por ejemplo dev local puro sin serverless), continuar con Supabase
  }

  // 2. Fallback a Supabase Functions
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: emailBody,
    });

    if (!error && data) {
      console.info(
        `[Email Service]: Correo enviado con éxito a ${
          Array.isArray(payload.to) ? payload.to.join(", ") : payload.to
        }`
      );
      return true;
    }
  } catch (err) {
    console.warn(`[Email Service]: Error al enviar correo a ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to}:`, err);
  }

  console.info(
    `[Email Service Log]: Notificación registrada para ${
      Array.isArray(payload.to) ? payload.to.join(", ") : payload.to
    }: "${payload.subject}".`
  );
  return false;
}

/**
 * 1. Enviar Resumen de Pedido de Delivery / Recojo (Diseño Retablo Ayacuchano)
 */
export async function sendOrderEmails(orderData: any, items: any[] = []): Promise<void> {
  const shortId = orderData.id ? orderData.id.slice(0, 8).toUpperCase() : "LF-ORDER";
  const customerEmail = orderData.customer_email || orderData.email;
  const isDelivery = orderData.order_type === "delivery";
  const trackingUrl = `https://www.restaurantelasflores.com/rastreo/${orderData.id || ""}`;

  const itemsHtml = items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #EAE3D2; font-size: 13px; color: #1B2A24;">
        <strong style="color: #2C4A3E;">${item.quantity || 1}x</strong> ${item.name || item.product_name}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #EAE3D2; font-size: 13px; color: #1B2A24; text-align: right; font-weight: 700;">
        S/ ${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Georgia, 'Times New Roman', serif, sans-serif; max-width: 620px; margin: 0 auto; background-color: #F6F1E7; padding: 24px 16px;">
      
      <!-- Copete de Retablo Ayacuchano -->
      <div style="text-align: center; margin-bottom: -15px; position: relative; z-index: 2;">
        <img src="https://www.restaurantelasflores.com/retablo-copete.png" alt="Copete Retablo Ayacuchano" style="max-width: 320px; width: 85%; height: auto; display: block; margin: 0 auto;" />
      </div>

      <!-- Caja Marco Principal del Retablo -->
      <div style="background-color: #FFFFFF; border: 4px solid #2C4A3E; border-radius: 16px; padding: 32px 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); position: relative; z-index: 1; border-top: 6px solid #D4AF37;">
        
        <!-- Logo Horizontal de Las Flores -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #EAE3D2; padding-bottom: 20px;">
          <img src="https://www.restaurantelasflores.com/images.png" alt="Restaurante Las Flores" style="max-width: 220px; width: 75%; height: auto; display: block; margin: 0 auto;" />
          <p style="font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #D4AF37; margin: 12px 0 0 0; font-weight: 700;">
            Comprobante Digital de Pedido
          </p>
        </div>

        <!-- Título y Saludo -->
        <div style="text-align: center; font-family: Arial, sans-serif; margin-bottom: 24px;">
          <span style="background-color: #2C4A3E10; color: #2C4A3E; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
            Pedido N° #${shortId}
          </span>
          <p style="font-size: 14px; color: #444444; line-height: 1.6; margin: 16px 0 0 0;">
            Estimado/a <strong>${orderData.customer_name || orderData.full_name || "Cliente"}</strong>,<br/>
            Hemos recibido su pedido correctamente. Nuestro equipo se encuentra preparando su orden con los mejores insumos de Ayacucho.
          </p>
        </div>

        <!-- Detalle de Productos -->
        <div style="background-color: #FAF6ED; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #D4AF3750; border-left: 5px solid #2C4A3E; font-family: Arial, sans-serif;">
          <h3 style="font-family: Georgia, serif; font-size: 14px; color: #2C4A3E; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #EAE3D2; padding-bottom: 8px;">
            Resumen de la Orden
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
            <thead>
              <tr style="color: #777777; font-size: 11px; text-transform: uppercase; text-align: left; letter-spacing: 1px;">
                <th style="padding: 6px 10px; border-bottom: 2px solid #2C4A3E;">Ítem</th>
                <th style="padding: 6px 10px; border-bottom: 2px solid #2C4A3E; text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="font-size: 13px; text-align: right; border-top: 1px solid #EAE3D2; padding-top: 12px; color: #444444;">
            <p style="margin: 4px 0;">Subtotal: <strong>S/ ${Number(orderData.subtotal || orderData.total_amount || 0).toFixed(2)}</strong></p>
            ${isDelivery ? `<p style="margin: 4px 0;">Servicio de Delivery: <strong>S/ ${Number(orderData.delivery_fee || 0).toFixed(2)}</strong></p>` : ""}
            <p style="margin: 8px 0 0 0; font-size: 16px; color: #2C4A3E;">
              <strong>Total abonado: S/ ${Number(orderData.total_amount || 0).toFixed(2)}</strong>
            </p>
          </div>
        </div>

        <!-- Detalles de Modalidad y Pago -->
        <div style="background-color: #FFFFFF; padding: 16px; border-radius: 10px; margin-bottom: 24px; font-size: 13px; border: 1px solid #EAE3D2; font-family: Arial, sans-serif;">
          <p style="margin: 3px 0; color: #555555;"><strong style="color: #1B2A24;">Modalidad:</strong> ${isDelivery ? "Delivery a Domicilio" : "Recojo en Establecimiento"}</p>
          ${isDelivery && orderData.address ? `<p style="margin: 3px 0; color: #555555;"><strong style="color: #1B2A24;">Dirección:</strong> ${orderData.address}</p>` : ""}
          <p style="margin: 3px 0; color: #555555;"><strong style="color: #1B2A24;">Método de Pago:</strong> ${orderData.payment_method ? orderData.payment_method.toUpperCase() : "Confirmado"}</p>
        </div>

        <!-- Botón de Rastreo -->
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 24px;">
          <a href="${trackingUrl}" target="_blank" style="background-color: #2C4A3E; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
            Seguimiento de Pedido en Vivo
          </a>
        </div>

      </div>

      <!-- Pie del Retablo -->
      <div style="text-align: center; font-family: Arial, sans-serif; font-size: 11px; color: #777777; margin-top: 24px; padding-top: 12px;">
        <p style="margin: 0; font-weight: 700; color: #1B2A24;">Restaurante Las Flores — Ayacucho</p>
        <p style="margin: 4px 0 0 0;">Jr. José Olaya 106, Huamanga — Perú</p>
        <p style="margin: 6px 0 0 0;">Atención al Cliente: <a href="mailto:${OFFICIAL_EMAIL}" style="color: #2C4A3E; text-decoration: none; font-weight: 600;">${OFFICIAL_EMAIL}</a> | Tel: +51 980 723 422</p>
      </div>

    </div>
  `;

  if (customerEmail && customerEmail.includes("@")) {
    await sendEmail({
      from: SENDERS.PEDIDOS,
      to: customerEmail,
      subject: `Comprobante de Pedido #${shortId} — Restaurante Las Flores`,
      html: emailHtml,
    });
  }

  await sendEmail({
    from: SENDERS.NOTIFICACIONES,
    to: OFFICIAL_EMAIL,
    subject: `[Administración] Nuevo Pedido #${shortId} — S/ ${Number(orderData.total_amount || 0).toFixed(2)}`,
    html: emailHtml,
  });
}

/**
 * 2. Enviar Confirmación de Reserva de Mesa (Formato Retablo Ayacuchano)
 */
export async function sendReservationEmail(reservationData: any): Promise<void> {
  const customerEmail = reservationData.email;
  const fullName = reservationData.name || reservationData.full_name || "Estimado/a cliente";

  let dateFormatted = reservationData.reservation_date || "Fecha por confirmar";
  if (reservationData.reservation_date && reservationData.reservation_date.includes("-")) {
    const parts = reservationData.reservation_date.split("-");
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const emailHtml = `
    <div style="font-family: Georgia, 'Times New Roman', serif, sans-serif; max-width: 620px; margin: 0 auto; background-color: #F6F1E7; padding: 24px 16px;">
      
      <!-- Copete de Retablo Ayacuchano -->
      <div style="text-align: center; margin-bottom: -15px; position: relative; z-index: 2;">
        <img src="https://www.restaurantelasflores.com/retablo-copete.png" alt="Copete Retablo Ayacuchano" style="max-width: 320px; width: 85%; height: auto; display: block; margin: 0 auto;" />
      </div>

      <!-- Caja Marco Principal del Retablo -->
      <div style="background-color: #FFFFFF; border: 4px solid #2C4A3E; border-radius: 16px; padding: 32px 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); position: relative; z-index: 1; border-top: 6px solid #D4AF37;">
        
        <!-- Logo Horizontal Oficial de Las Flores -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #EAE3D2; padding-bottom: 20px;">
          <img src="https://www.restaurantelasflores.com/images.png" alt="Restaurante Las Flores" style="max-width: 220px; width: 75%; height: auto; display: block; margin: 0 auto;" />
          <p style="font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #D4AF37; margin: 12px 0 0 0; font-weight: 700;">
            Tradición & Alta Gastronomía — Ayacucho
          </p>
        </div>

        <!-- Título y Mensaje de Bienvenida -->
        <div style="text-align: center; font-family: Arial, sans-serif; margin-bottom: 28px;">
          <h2 style="font-family: Georgia, serif; font-size: 22px; color: #2C4A3E; margin: 0 0 10px 0; font-weight: 400;">
            Confirmación Oficial de Reserva
          </h2>
          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin: 0;">
            Estimado/a <strong>${fullName}</strong>,<br/>
            Es un honor para nosotros recibirle. Su mesa ha sido reservada con éxito dentro de nuestro espacio gastronómico.
          </p>
        </div>

        <!-- Pase Digital de Reserva dentro del Retablo -->
        <div style="background-color: #FAF6ED; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #D4AF3750; border-left: 5px solid #2C4A3E; font-family: Arial, sans-serif;">
          
          <div style="text-align: center; border-bottom: 1px solid #EAE3D2; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="font-family: Georgia, serif; font-size: 13px; color: #2C4A3E; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
              Pase Digital de Mesa
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 2.1;">
            <tbody>
              <tr>
                <td style="color: #777777; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Titular de Reserva:</td>
                <td style="color: #1B2A24; font-weight: 700; text-align: right;">${fullName}</td>
              </tr>
              <tr>
                <td style="color: #777777; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Fecha Programada:</td>
                <td style="color: #1B2A24; font-weight: 700; text-align: right;">${dateFormatted}</td>
              </tr>
              <tr>
                <td style="color: #777777; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Hora Reservada:</td>
                <td style="color: #1B2A24; font-weight: 700; text-align: right;">${reservationData.reservation_time || "Por confirmar"} hrs</td>
              </tr>
              <tr>
                <td style="color: #777777; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Comensales:</td>
                <td style="color: #1B2A24; font-weight: 700; text-align: right;">${reservationData.guests || reservationData.party_size || reservationData.guest_count || 2} personas</td>
              </tr>
              ${
                reservationData.zone || reservationData.table_number
                  ? `<tr>
                      <td style="color: #777777; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Zona Asignada:</td>
                      <td style="color: #2C4A3E; font-weight: 700; text-align: right;">${reservationData.zone || reservationData.table_number}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="color: #777777; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Teléfono registrado:</td>
                <td style="color: #1B2A24; font-weight: 700; text-align: right;">${reservationData.phone || reservationData.client_phone || "Registrado"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Indicaciones -->
        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #777777; line-height: 1.5; text-align: center; font-style: italic; margin-bottom: 24px;">
          Le sugerimos ingresar 10 minutos antes de su horario reservado.<br/>
          Ubicación: Jr. José Olaya 106, Huamanga — Ayacucho.
        </p>

        <!-- Botones Útiles de Acción -->
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 24px;">
          <a href="https://maps.google.com/?q=Jr.+Jose+Olaya+106,+Huamanga,+Ayacucho" target="_blank" style="background-color: #2C4A3E; color: #FFFFFF; padding: 13px 22px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin: 4px;">
            Ver Ubicación en Google Maps
          </a>
          <a href="https://wa.me/51980723422?text=Hola%20Restaurante%20Las%20Flores,%20tengo%20una%20consulta%20sobre%20mi%20reserva" target="_blank" style="background-color: #25D366; color: #FFFFFF; padding: 13px 22px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin: 4px;">
            Contactar por WhatsApp
          </a>
        </div>

      </div>

      <!-- Pie del Retablo -->
      <div style="text-align: center; font-family: Arial, sans-serif; font-size: 11px; color: #777777; margin-top: 24px; padding-top: 12px;">
        <p style="margin: 0; font-weight: 700; color: #1B2A24;">Restaurante Las Flores — Ayacucho</p>
        <p style="margin: 4px 0 0 0;">Jr. José Olaya 106, Huamanga — Perú</p>
        <p style="margin: 6px 0 0 0;">Atención de Reservas: <a href="mailto:${OFFICIAL_EMAIL}" style="color: #2C4A3E; text-decoration: none; font-weight: 600;">${OFFICIAL_EMAIL}</a> | Tel: +51 980 723 422</p>
      </div>

    </div>
  `;

  if (customerEmail && customerEmail.includes("@")) {
    await sendEmail({
      from: SENDERS.RESERVAS,
      to: customerEmail,
      subject: `Confirmación de Reserva — Restaurante Las Flores Huamanga`,
      html: emailHtml,
    });
  }

  await sendEmail({
    from: SENDERS.NOTIFICACIONES,
    to: OFFICIAL_EMAIL,
    subject: `[Administración] Nueva Reserva — ${dateFormatted} ${reservationData.reservation_time} (${fullName})`,
    html: emailHtml,
  });
}

/**
 * 3. Enviar Mensaje del Formulario de Contacto
 */
export async function sendContactEmail(contactData: any): Promise<void> {
  const emailHtml = `
    <div style="font-family: Georgia, serif, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F6F1E7; padding: 20px;">
      <div style="background-color: #FFFFFF; border: 3px solid #2C4A3E; border-radius: 14px; padding: 24px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <img src="https://www.restaurantelasflores.com/images.png" alt="Restaurante Las Flores" style="max-width: 180px; width: 65%; height: auto;" />
        </div>
        <h2 style="font-family: Georgia, serif; color: #2C4A3E; margin-top: 0; font-size: 18px; text-align: center; border-bottom: 2px solid #2C4A3E; padding-bottom: 8px;">
          Mensaje de Contacto desde la Web
        </h2>
        <div style="font-family: Arial, sans-serif; font-size: 13px; color: #333333; line-height: 1.8;">
          <p style="margin: 4px 0;"><strong>Remitente:</strong> ${contactData.name}</p>
          <p style="margin: 4px 0;"><strong>Correo Electrónico:</strong> ${contactData.email}</p>
          <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${contactData.phone || "No especificado"}</p>
          <div style="background: #FAF6ED; padding: 16px; border-left: 4px solid #2C4A3E; border-radius: 8px; margin-top: 16px;">
            <p style="margin: 0; color: #1B2A24; line-height: 1.6;">${contactData.message}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    from: SENDERS.GENERAL,
    replyTo: contactData.email,
    to: OFFICIAL_EMAIL,
    subject: `Mensaje de Contacto — ${contactData.name}`,
    html: emailHtml,
  });
}

/**
 * 4. Enviar Solicitud de Reseña de 5 Estrellas en Google Maps (Post-Atención / NPS)
 */
export async function sendReviewRequestEmail(customerData: { name: string; email: string }): Promise<void> {
  const customerEmail = customerData.email;
  const fullName = customerData.name || "Estimado/a cliente";

  const emailHtml = `
    <div style="font-family: Georgia, 'Times New Roman', serif, sans-serif; max-width: 620px; margin: 0 auto; background-color: #F6F1E7; padding: 24px 16px;">
      
      <!-- Copete de Retablo Ayacuchano -->
      <div style="text-align: center; margin-bottom: -15px; position: relative; z-index: 2;">
        <img src="https://www.restaurantelasflores.com/retablo-copete.png" alt="Copete Retablo Ayacuchano" style="max-width: 320px; width: 85%; height: auto; display: block; margin: 0 auto;" />
      </div>

      <!-- Caja Marco Principal del Retablo -->
      <div style="background-color: #FFFFFF; border: 4px solid #2C4A3E; border-radius: 16px; padding: 32px 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); position: relative; z-index: 1; border-top: 6px solid #D4AF37;">
        
        <!-- Logo Horizontal Oficial de Las Flores -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #EAE3D2; padding-bottom: 20px;">
          <img src="https://www.restaurantelasflores.com/images.png" alt="Restaurante Las Flores" style="max-width: 220px; width: 75%; height: auto; display: block; margin: 0 auto;" />
          <p style="font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #D4AF37; margin: 12px 0 0 0; font-weight: 700;">
            Excelencia & Tradición — Ayacucho
          </p>
        </div>

        <!-- Título y Mensaje -->
        <div style="text-align: center; font-family: Arial, sans-serif; margin-bottom: 24px;">
          <h2 style="font-family: Georgia, serif; font-size: 22px; color: #2C4A3E; margin: 0 0 12px 0; font-weight: 400;">
            ¿Cómo fue su experiencia en Las Flores?
          </h2>
          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin: 0;">
            Estimado/a <strong>${fullName}</strong>,<br/>
            Ha sido un absoluto honor recibirle en Restaurante Las Flores. Su opinión es fundamental para seguir preservando la mejor gastronomía tradicional de Huamanga.
          </p>
        </div>

        <!-- Tarjeta Invitación Reseña Google Maps -->
        <div style="background-color: #FAF6ED; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #D4AF3750; border-left: 5px solid #2C4A3E; text-align: center; font-family: Arial, sans-serif;">
          <p style="font-size: 15px; color: #1B2A24; font-weight: 700; margin: 0 0 8px 0;">
            Valore su Experiencia con 5 Estrellas
          </p>
          <p style="font-size: 12px; color: #666666; margin: 0 0 18px 0; line-height: 1.5;">
            Le invitamos cordialmente a compartir su valoración en nuestra ficha oficial de Google Maps.
          </p>

          <a href="https://www.google.com/maps/place/Restaurante+Las+Flores/@-13.1629067,-74.222784,17z/data=!4m8!3m7!1s0x911287600027a52b:0x1c3e775f879b7bbe!8m2!3d-13.1629067!4d-74.2179131!9m1!1b1!16s%2Fg%2F11bw_7shlg" target="_blank" style="background-color: #2C4A3E; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
            Compartir Reseña en Google Maps
          </a>
        </div>

      </div>

      <!-- Pie del Retablo -->
      <div style="text-align: center; font-family: Arial, sans-serif; font-size: 11px; color: #777777; margin-top: 24px; padding-top: 12px;">
        <p style="margin: 0; font-weight: 700; color: #1B2A24;">Restaurante Las Flores — Ayacucho</p>
        <p style="margin: 4px 0 0 0;">Jr. José Olaya 106, Huamanga — Perú</p>
      </div>

    </div>
  `;

  if (customerEmail && customerEmail.includes("@")) {
    await sendEmail({
      from: SENDERS.GENERAL,
      replyTo: OFFICIAL_EMAIL,
      to: customerEmail,
      subject: `¿Cómo fue su experiencia en Las Flores? — Tu Opinión en Google Maps`,
      html: emailHtml,
    });
  }
}

/**
 * 4. Enviar Confirmación de Hoja de Reclamación (Libro de Reclamaciones Indecopi)
 */
export async function sendComplaintEmail(complaintData: {
  code: string;
  fullName: string;
  docType: string;
  docNumber: string;
  phone: string;
  email: string;
  address: string;
  isMinor: boolean;
  parentName?: string;
  claimedType: string;
  claimedAmount?: string | number;
  claimedDescription: string;
  claimType: string;
  detail: string;
  consumerRequest: string;
}): Promise<void> {
  const emailHtml = `
    <div style="background-color: #FAF6ED; padding: 28px; max-width: 620px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #D4AF3740; border-radius: 12px; color: #1B2A24;">
      
      <!-- Cabecera -->
      <div style="text-align: center; border-bottom: 2px solid #2C4A3E; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #2C4A3E; font-size: 20px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1px;">
          Restaurante Turístico Las Flores
        </h1>
        <p style="margin: 0; font-size: 11px; color: #666666;">
          Libro de Reclamaciones Virtual — Conforme a la Ley N° 29571 (Indecopi)
        </p>
      </div>

      <!-- Constancia -->
      <div style="background-color: #FFFFFF; padding: 18px; border-radius: 8px; border: 1px solid #E2D9C8; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 14px;">
          <span style="font-size: 11px; font-weight: bold; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Código de Hoja de Reclamación</span>
          <p style="font-size: 22px; font-weight: 900; color: #2C4A3E; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 2px;">
            ${complaintData.code}
          </p>
          <span style="font-size: 11px; color: #555555; display: block; margin-top: 4px;">
            Tipo: <strong>${complaintData.claimType.toUpperCase()}</strong> | Fecha: ${new Date().toLocaleDateString("es-PE")}
          </span>
        </div>

        <div style="font-size: 13px; line-height: 1.6; color: #333333; border-top: 1px dashed #DDD; padding-top: 12px;">
          <p style="margin: 4px 0;"><strong>Consumidor:</strong> ${complaintData.fullName}</p>
          <p style="margin: 4px 0;"><strong>Documento:</strong> ${complaintData.docType} ${complaintData.docNumber}</p>
          <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${complaintData.phone} | <strong>Correo:</strong> ${complaintData.email}</p>
          <p style="margin: 4px 0;"><strong>Bien Contratado:</strong> ${complaintData.claimedType === "producto" ? "Producto" : "Servicio"} — ${complaintData.claimedDescription}</p>
          ${complaintData.claimedAmount ? `<p style="margin: 4px 0;"><strong>Monto Reclamado:</strong> S/ ${complaintData.claimedAmount}</p>` : ""}
          <p style="margin: 8px 0 4px 0;"><strong>Detalle de los Hechos:</strong></p>
          <div style="background-color: #F8F9FA; padding: 10px; border-radius: 6px; font-size: 12px; color: #444; border: 1px solid #EEE;">
            ${complaintData.detail}
          </div>
          <p style="margin: 8px 0 4px 0;"><strong>Pedido del Consumidor:</strong></p>
          <div style="background-color: #F8F9FA; padding: 10px; border-radius: 6px; font-size: 12px; color: #444; border: 1px solid #EEE;">
            ${complaintData.consumerRequest}
          </div>
        </div>
      </div>

      <!-- Plazo Legal -->
      <div style="background-color: #E8F0EC; border-left: 4px solid #2C4A3E; padding: 12px; border-radius: 6px; font-size: 12px; color: #1B2A24; margin-bottom: 20px;">
        Conforme al marco legal vigente de Indecopi, Restaurante Las Flores dará respuesta formal y motivada a esta solicitud en un plazo máximo de <strong>15 días hábiles</strong>.
      </div>

      <div style="text-align: center; font-size: 11px; color: #777777;">
        <p style="margin: 0;">Restaurante Las Flores S.A.C. — RUC 20608514921</p>
        <p style="margin: 2px 0 0 0;">Jr. José Olaya 106, Huamanga, Ayacucho • contacto@restaurantelasflores.com</p>
      </div>

    </div>
  `;

  // 1. Enviar constancia al cliente
  if (complaintData.email && complaintData.email.includes("@")) {
    await sendEmail({
      from: SENDERS.NOTIFICACIONES,
      replyTo: OFFICIAL_EMAIL,
      to: complaintData.email,
      subject: `Constancia de Libro de Reclamaciones — ${complaintData.code}`,
      html: emailHtml,
    });
  }

  // 2. Enviar notificación urgente a la administración
  await sendEmail({
    from: SENDERS.NOTIFICACIONES,
    replyTo: complaintData.email,
    to: OFFICIAL_EMAIL,
    subject: `🚨 [Libro de Reclamaciones] Nuevo ${complaintData.claimType.toUpperCase()} Registrado: ${complaintData.code}`,
    html: emailHtml,
  });
}

