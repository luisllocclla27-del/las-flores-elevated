export const config = {
  runtime: "nodejs",
};

const ALLOWED_ORIGINS = [
  "https://restaurantelasflores.com",
  "https://www.restaurantelasflores.com",
  "https://las-flores-elevated-main.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
];

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

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same origin or non-browser server call
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function resolveFrom(requested: unknown): string {
  if (typeof requested !== "string" || !requested.trim()) return DEFAULT_FROM;
  const raw = requested.trim();
  const byKey = ALLOWED_FROM[raw.toLowerCase()];
  if (byKey) return byKey;
  const match = Object.values(ALLOWED_FROM).find(
    (allowed) => allowed.toLowerCase() === raw.toLowerCase()
  );
  return match || DEFAULT_FROM;
}

export default async function handler(req: any, res: any) {
  const origin = req.headers?.origin || req.headers?.Origin || null;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "Origen no autorizado" });
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || "";
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY no configurada en las variables de entorno de Vercel.");
      return res.status(500).json({ error: "Servicio de correo no configurado" });
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { to, subject, html, from, replyTo, reply_to } = payload || {};

    const recipients = (Array.isArray(to) ? to : [to])
      .filter((value): value is string => typeof value === "string" && EMAIL_REGEX.test(value.trim()))
      .map((value) => value.trim());

    if (recipients.length === 0) {
      return res.status(400).json({ error: "Destinatario inválido" });
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return res.status(400).json({ error: "Demasiados destinatarios" });
    }
    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Asunto requerido" });
    }
    if (typeof html !== "string" || !html.trim()) {
      return res.status(400).json({ error: "Contenido requerido" });
    }

    const sender = resolveFrom(from);
    const replyAddress =
      typeof replyTo === "string" && EMAIL_REGEX.test(replyTo)
        ? replyTo
        : typeof reply_to === "string" && EMAIL_REGEX.test(reply_to)
        ? reply_to
        : REPLY_TO;

    const sendEmailReq = (fromAddress: string) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          reply_to: replyAddress,
          subject: subject.slice(0, 200),
          html,
        }),
      });

    let response = await sendEmailReq(sender);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en API de Resend:", errorText);

      // Reintento con el remitente de pruebas si el dominio no está verificado en Resend
      if (
        errorText.includes("validation_error") ||
        errorText.includes("not verified") ||
        response.status === 403
      ) {
        response = await sendEmailReq("Restaurante Las Flores <onboarding@resend.dev>");
      }
    }

    if (!response.ok) {
      return res.status(502).json({ error: "No se pudo enviar el correo" });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("Error en endpoint send-email:", err);
    return res.status(500).json({ error: "Error interno del servicio de correo" });
  }
}
