import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function diagnose() {
  console.log("🔍 Consultando la última reserva registrada en Supabase BD...\n");

  const { data: latest, error } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("❌ Error al consultar:", error.message);
    return;
  }

  console.log("📋 ÚLTIMAS RESERVAS REGISTRADAS:");
  latest?.forEach((r, idx) => {
    console.log(`[${idx + 1}] ID: ${r.id} | Cliente: ${r.client_name} | Fecha: ${r.reservation_date} | Estado: '${r.status}' | Creado: ${r.created_at}`);
  });
}

diagnose();
