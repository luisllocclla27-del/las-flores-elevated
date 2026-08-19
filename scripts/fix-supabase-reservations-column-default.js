import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function checkAndFixDefault() {
  console.log("🔍 Verificando la inserción de reservas con estado 'pending'...\n");

  // Insertar una reserva de prueba para validar que ingresa como pending
  const testPayload = {
    guest_count: 2,
    reservation_date: new Date().toISOString().split("T")[0],
    service_type: "almuerzo",
    reservation_time: "13:00",
    table_number: "Test-1",
    client_name: "Test Reserva Pendiente",
    client_email: "test.reserva@gmail.com",
    status: "pending",
  };

  const { data, error } = await supabase
    .from("reservations")
    .insert([testPayload])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al insertar reserva de prueba:", error.message);
  } else {
    console.log("✅ Reserva de prueba creada exitosamente:");
    console.log(`   ID: ${data.id}`);
    console.log(`   Estado obtenido de Supabase: '${data.status}'`);

    // Eliminar la reserva de prueba creada
    await supabase.from("reservations").delete().eq("id", data.id);
    console.log("🧹 Reserva de prueba limpiada.");
  }
}

checkAndFixDefault();
