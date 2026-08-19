import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createScriptClient } from "./_supabaseClient.js";

const supabase = createScriptClient();

async function runStorageSeeder() {
  console.log("🚀 Iniciando optimización masiva WebP y subida a Supabase Storage (Bucket: 'products')...\n");

  const projectRoot = process.cwd();
  const dirsToScan = [
    path.join(projectRoot, "public", "gastronomia"),
    path.join(projectRoot, "public", "imagenes-reales", "CARTA"),
  ];

  let totalOriginalKb = 0;
  let totalCompressedKb = 0;
  let totalUploadedCount = 0;

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️ Directorio no encontrado: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) continue;

      const ext = path.extname(file).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;

      const origSizeKb = Math.round(stat.size / 1024);
      totalOriginalKb += origSizeKb;

      try {
        // Compresión WebP con Sharp (Max 1200px, 80% calidad)
        const compressedBuffer = await sharp(fullPath)
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const compSizeKb = Math.round(compressedBuffer.length / 1024);
        totalCompressedKb += compSizeKb;

        const cleanBaseName = path.basename(file, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
        const destinationPath = `platos/${cleanBaseName}.webp`;

        // Subir al Bucket 'products' de Supabase
        const { data, error } = await supabase.storage
          .from("products")
          .upload(destinationPath, compressedBuffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (error) {
          console.error(`❌ Error al subir ${file}:`, error.message);
        } else {
          totalUploadedCount++;
          const { data: publicUrlData } = supabase.storage
            .from("products")
            .getPublicUrl(destinationPath);

          console.log(`✅ [${totalUploadedCount}] Subido: ${destinationPath}`);
          console.log(`   📊 Peso: ${origSizeKb} KB ➔ ${compSizeKb} KB WebP (-${Math.round((1 - compSizeKb / (origSizeKb || 1)) * 100)}%)`);
          console.log(`   🌐 URL: ${publicUrlData.publicUrl}\n`);
        }
      } catch (err) {
        console.error(`❌ Excepción procesando ${file}:`, err.message);
      }
    }
  }

  console.log("=================================================");
  console.log(`🎉 ¡PROCESO FINALIZADO EXITOSAMENTE!`);
  console.log(`📦 Imágenes procesadas y subidas: ${totalUploadedCount}`);
  console.log(`📉 Peso Original Total: ${totalOriginalKb} KB (~${(totalOriginalKb / 1024).toFixed(2)} MB)`);
  console.log(`🚀 Peso Comprimido WebP Total: ${totalCompressedKb} KB (~${(totalCompressedKb / 1024).toFixed(2)} MB)`);
  console.log(`⚡ Ahorro de ancho de banda total: -${Math.round((1 - totalCompressedKb / (totalOriginalKb || 1)) * 100)}%`);
  console.log("=================================================");
}

runStorageSeeder();
  