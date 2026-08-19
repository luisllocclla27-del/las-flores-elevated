import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function cleanAllReservations() {
  console.log("🧹 Ejecutando limpieza final de todas las reservas en Supabase BD...\n");

  const { data: reservations, error } = await supabase.from("reservations").select("*");
  if (error) {
    console.error("❌ Error al consultar:", error.message);
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
        console.log(`✅ [${count}] Reserva ${r.id} ('${r.client_name}' - ${r.reservation_date}): '${r.status}' ➔ 'pending'`);
      }
    }
  }

  console.log(`\n🎉 Finalizado: Se actualizaron ${count} reservas a estado 'pending'.`);
}

cleanAllReservations();
