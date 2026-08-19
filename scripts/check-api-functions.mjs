/**
 * Comprueba que cada función serverless de `api/` ARRANCA en Node.
 *
 * Por qué existe: el proyecto declara `"type": "module"`, así que en tiempo de
 * ejecución Node exige extensión en los imports relativos. Un import como
 * `../src/lib/pricing` compila sin problemas con `tsc` y con Vitest (ambos
 * resuelven como un bundler), pero hace que la función falle al cargarse en
 * Vercel: FUNCTION_INVOCATION_FAILED en TODAS las peticiones, incluido OPTIONS.
 * Eso ya tumbó el endpoint de pagos una vez.
 *
 * Este script importa cada handler con el cargador nativo de TypeScript de
 * Node, que resuelve los módulos igual que en producción. Si un import no
 * resuelve, falla aquí en lugar de en producción.
 *
 * Requiere Node 22.6+ (soporte para importar TypeScript). Si la versión es
 * anterior, el script avisa y no bloquea.
 *
 * Uso: npm run test:functions
 */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const API_DIR = resolve("api");

const [major, minor] = process.versions.node.split(".").map(Number);
const soportaTypeScript = major > 22 || (major === 22 && minor >= 6);

if (!soportaTypeScript) {
  console.warn(
    `Node ${process.versions.node} no puede importar TypeScript directamente.\n` +
      "Este control necesita Node 22.6 o superior. Se omite sin bloquear.",
  );
  process.exit(0);
}

const handlers = readdirSync(API_DIR).filter(
  (file) => file.endsWith(".ts") && !file.endsWith(".d.ts") && !file.startsWith("."),
);

if (handlers.length === 0) {
  console.error("No se encontró ninguna función en api/. ¿Ruta equivocada?");
  process.exit(1);
}

let failures = 0;

for (const file of handlers) {
  const target = pathToFileURL(join(API_DIR, file)).href;

  try {
    const mod = await import(target);

    if (typeof mod.default !== "function") {
      failures++;
      console.error(`✗ ${file} — no exporta un handler por defecto`);
      continue;
    }

    console.log(`✓ ${file} — el módulo carga y exporta un handler`);
  } catch (err) {
    failures++;
    console.error(`✗ ${file} — el módulo NO arranca en Node`);
    console.error(`  ${String(err.message).split("\n")[0]}`);

    if (err.code === "ERR_MODULE_NOT_FOUND") {
      console.error(
        "  Causa habitual: import relativo sin extensión. En ESM debe llevarla,\n" +
          "  o mejor: mantén las funciones de api/ autocontenidas.",
      );
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} función(es) fallarían en producción.`);
  process.exit(1);
}

console.log("\nTodas las funciones de api/ arrancan correctamente.");
