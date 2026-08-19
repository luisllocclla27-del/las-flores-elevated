import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Edge Function de envío de correo.
 *
 * Endurecida para no ser un relay abierto:
 *  - Solo acepta peticiones desde orígenes conocidos.
 *  - El remitente (`from`) se elige de una lista blanca; no lo fija el cliente.
 *  - Se limita el número de destinatarios y el tamaño del cuerpo.
 *
 * Nota de despliegue: además de esto, conviene desplegarla con `verify_jwt`
 * activo si en el futuro solo se invoca desde sesiones autenticadas. Hoy se
 * invoca también desde el checkout de invitados, por lo que la barrera es la
 * lista blanca de orígenes y remitentes.
 */

const ALLOWED_ORIGINS = [
  "https://restaurantelasflores.com",
  "https://www.restaurantelasflores.com",
  "https://las-flores-elevated-main.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
];

/** Remitentes autorizados. El cliente solo puede elegir entre estos. */
const ALLOWED_FROM: Record<string, string> = {
  general: "Restaurante Las Flores <contacto@restaurantelasflores.com>",
  pedidos: "Pedidos — Las Flores <pedidos@restaurantelasflores.com>",
  reservas: "Reservas — Las Flores <reservas@restaurantelasflores.com>",
  notificaciones: "Las Flores <no-reply@restaurantelasflores.com>",
};
const DEFAULT_FROM = ALLOWED_FROM.general;
const REPLY_TO = "contacto@restaurantelasflores.com";

const MAX_RECIPIENTS = 5;
const MAX_BODY_BYTES = 200_000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

/**
 * Resuelve el remitente solicitado contra la lista blanca.
 * Acepta tanto una clave (`pedidos`) como la cadena completa ya autorizada.
 */
function resolveFrom(requested: unknown): string {
  if (typeof requested !== "string" || !requested.trim()) return DEFAULT_FROM;
  const raw = requested.trim();

  const byKey = ALLOWED_FROM[raw.toLowerCase()];
  if (byKey) return byKey;

  const match = Object.values(ALLOWED_FROM).find(
    (allowed) => allowed.toLowerCase() === raw.toLowerCase(),
  );
  return match || DEFAULT_FROM;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  // Un navegador siempre envía Origin en peticiones cross-site. Si viene y no
  // está autorizado, se rechaza para que otro sitio no pueda usar el relay.
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origen no autorizado" }), { status: 403, headers });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY no configurada");
      return new Response(JSON.stringify({ error: "Servicio de correo no configurado" }), {
        status: 500,
        headers,
      });
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "El contenido del correo es demasiado grande" }), {
        status: 413,
        headers,
      });
    }

    const { to, subject, html, from, replyTo, reply_to } = JSON.parse(rawBody);

    const recipients = (Array.isArray(to) ? to : [to])
      .filter((value): value is string => typeof value === "string" && EMAIL_REGEX.test(value.trim()))
      .map((value) => value.trim());

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Destinatario inválido" }), {
        status: 400,
        headers,
      });
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return new Response(JSON.stringify({ error: "Demasiados destinatarios" }), {
        status: 400,
        headers,
      });
    }
    if (typeof subject !== "string" || !subject.trim()) {
      return new Response(JSON.stringify({ error: "Asunto requerido" }), { status: 400, headers });
    }
    if (typeof html !== "string" || !html.trim()) {
      return new Response(JSON.stringify({ error: "Contenido requerido" }), { status: 400, headers });
    }

    const sender = resolveFrom(from);
    const replyAddress =
      typeof replyTo === "string" && EMAIL_REGEX.test(replyTo)
        ? replyTo
        : typeof reply_to === "string" && EMAIL_REGEX.test(reply_to)
          ? reply_to
          : REPLY_TO;

    const send = (fromAddress: string) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          reply_to: replyAddress,
          subject: subject.slice(0, 200),
          html,
        }),
      });

    const response = await send(sender);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en API de Resend:", errorText);

      // Reintento con el remitente de pruebas si el dominio aún no está verificado.
      if (
        errorText.includes("validation_error") ||
        errorText.includes("not verified") ||
        response.status === 403
      ) {
        const retryRes = await send("Restaurante Las Flores <onboarding@resend.dev>");
        if (retryRes.ok) {
          return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }
      }

      // El detalle queda en los logs; al cliente solo un mensaje genérico.
      return new Response(JSON.stringify({ error: "No se pudo enviar el correo" }), {
        status: 502,
        headers,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    console.error("Error en funcion send-email:", error);
    return new Response(JSON.stringify({ error: "Error interno del servicio de correo" }), {
      status: 500,
      headers,
    });
  }
});
