import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para los scripts de mantenimiento.
 *
 * Las credenciales se leen SIEMPRE del entorno. Antes estaban incrustadas como
 * valor por defecto en cada script, lo que apuntaba automáticamente al proyecto
 * de producción: varios de estos scripts son destructivos (reescriben estados
 * de reservas en masa), así que un `node scripts/...` sin pensar impactaba la
 * base real. Ahora falla de forma explícita si falta la configuración.
 *
 * Uso:
 *   npx dotenv -e .env.local -- node scripts/<script>.js
 */
export function createScriptClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "\n[scripts] Faltan credenciales de Supabase.\n" +
        "Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, por ejemplo:\n" +
        "  npx dotenv -e .env.local -- node scripts/<script>.js\n",
    );
    process.exit(1);
  }

  console.info(`[scripts] Conectando a ${new URL(url).host}`);
  return createClient(url, key, { auth: { persistSession: false } });
}
