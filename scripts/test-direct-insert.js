import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function testInsertions() {
  console.log("🧪 PRUEBA 1: Inserción SIN especificar la propiedad status...");
  const payload1 = {
    guest_count: 2,
    reservation_date: "2026-08-05",
    service_type: "almuerzo",
    reservation_time: "14:00",
    client_name: "Prueba Sin Status",
    client_email: "test.sin.status@gmail.com",
  };

  const { data: res1, error: err1 } = await supabase
    .from("reservations")
    .insert([payload1])
    .select()
    .single();

  if (err1) {
    console.error("❌ Error en Inserción 1:", err1.message);
  } else {
    console.log(`✅ Inserción 1 registrada -> ID: ${res1.id} | Estado devuelto por BD: '${res1.status}'`);
    await supabase.from("reservations").delete().eq("id", res1.id);
  }

  console.log("\n🧪 PRUEBA 2: Inserción especificando explícitamente status = 'pending'...");
  const payload2 = {
    guest_count: 2,
    reservation_date: "2026-08-05",
    service_type: "almuerzo",
    reservation_time: "14:00",
    client_name: "Prueba Con Status Pending",
    client_email: "test.con.status@gmail.com",
    status: "pending",
  };

  const { data: res2, error: err2 } = await supabase
    .from("reservations")
    .insert([payload2])
    .select()
    .single();

  if (err2) {
    console.error("❌ Error en Inserción 2:", err2.message);
  } else {
    console.log(`✅ Inserción 2 registrada -> ID: ${res2.id} | Estado devuelto por BD: '${res2.status}'`);
    await supabase.from("reservations").delete().eq("id", res2.id);
  }
}

testInsertions();
