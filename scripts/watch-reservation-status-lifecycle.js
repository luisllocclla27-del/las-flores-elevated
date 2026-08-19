import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function watchLifecycle() {
  console.log("⏱️ monitoreando el ciclo de vida del estado de la reserva...\n");

  const testPayload = {
    guest_count: 2,
    reservation_date: "2026-08-10",
    service_type: "almuerzo",
    reservation_time: "13:00",
    table_number: "Test-Trig",
    client_name: "Diagnostico Trigger",
    client_email: "diag.trigger@gmail.com",
    status: "pending",
  };

  const { data: inserted, error } = await supabase
    .from("reservations")
    .insert([testPayload])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al insertar:", error.message);
    return;
  }

  console.log(`⏱️ t = 0ms  | Estado devuelto tras insert: '${inserted.status}'`);

  for (let delay of [500, 1000, 2000, 4000]) {
    await new Promise((r) => setTimeout(r, delay));
    const { data: current } = await supabase
      .from("reservations")
      .select("status")
      .eq("id", inserted.id)
      .single();

    console.log(`⏱️ t = ${delay}ms | Estado actual en BD: '${current?.status}'`);
  }

  // Limpieza
  await supabase.from("reservations").delete().eq("id", inserted.id);
  console.log("\n🧹 Reserva de diagnóstico eliminada.");
}

watchLifecycle();
