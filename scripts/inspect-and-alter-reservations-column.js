import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function inspectLatestReservation() {
  console.log("🔍 Inspeccionando las últimas reservas insertadas en Supabase...\n");

  const { data: latest, error } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Error al consultar últimas reservas:", error.message);
    return;
  }

  console.log("📋 ÚLTIMAS 5 RESERVAS EN SUPABASE BD:");
  latest?.forEach((r, idx) => {
    console.log(`[${idx + 1}] ID: ${r.id} | Cliente: ${r.client_name} | Fecha: ${r.reservation_date} | Estado: '${r.status}' | Creado: ${r.created_at}`);
  });
}

inspectLatestReservation();
