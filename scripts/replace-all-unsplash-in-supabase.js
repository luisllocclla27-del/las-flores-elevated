import { createScriptClient } from "./_supabaseClient.js";

// Se conserva solo para construir las URLs públicas de Storage más abajo.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

const supabase = createScriptClient();

async function cleanUnsplashUrls() {
  console.log("🔍 Buscando y reemplazando todos los enlaces de Unsplash en Supabase BD...\n");

  const { data: products, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Error al obtener productos:", error.message);
    return;
  }

  let replacedCount = 0;
  for (const p of products || []) {
    if (p.image_url && p.image_url.includes("unsplash.com")) {
      // Reemplazar por la imagen pública oficial de Supabase Storage o WebP local
      const storageBase = `${SUPABASE_URL}/storage/v1/object/public/products`;
      let newUrl = `${storageBase}/platos/qapchi.webp`;

      const nameLower = p.name.toLowerCase();
      if (nameLower.includes("chicharron") || nameLower.includes("chancho")) {
        newUrl = `${storageBase}/platos/chicharron.webp`;
      } else if (nameLower.includes("cuy") || nameLower.includes("caldo")) {
        newUrl = `${storageBase}/platos/cuy-chactado.webp`;
      } else if (nameLower.includes("puca")) {
        newUrl = `${storageBase}/platos/puca-picante.webp`;
      }

      const { error: updateErr } = await supabase
        .from("products")
        .update({ image_url: newUrl })
        .eq("id", p.id);

      if (!updateErr) {
        replacedCount++;
        console.log(`✅ [${replacedCount}] Actualizado '${p.name}': Unsplash ➔ ${newUrl}`);
      }
    }
  }

  console.log(`\n🎉 Finalizado: ${replacedCount} productos limpiados de Unsplash.`);
}

cleanUnsplashUrls();
