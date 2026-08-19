import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function setAllReservationsToPending() {
  console.log("🔍 Cambiando TODAS las reservas en la base de datos a estado 'pending'...\n");

  const { data: reservations, error } = await supabase.from("reservations").select("*");
  if (error) {
    console.error("❌ Error al consultar reservas:", error.message);
    return;
  }

  let count = 0;
  for (const r of reservations || []) {
    if (r.status !== "pending") {
      const { error: updateErr } = await supabase
        .from("reservations")
        .update({ status: "pending" })
        .eq("id", r.id);

      if (!updateErr) {
        count++;
        console.log(`✅ [${count}] Reserva de '${r.client_name}' (${r.reservation_date}) actualizada a 'pending'.`);
      }
    }
  }

  console.log(`\n🎉 Operación completa: ${count} reservas ahora están en estado 'pending'.`);
}

setAllReservationsToPending();
