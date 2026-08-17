/**
 * Test endpoint para verificar configuración de Culqi
 */
import { createServerFn } from "@tanstack/react-start";

export const testCulqiConfig = createServerFn()
  .handler(async () => {
  const publicKey = process.env.VITE_CULQI_PUBLIC_KEY;
  const secretKey = process.env.CULQI_SECRET_KEY;
  
  console.log("🔍 Testing Culqi Config:");
  console.log("- VITE_CULQI_PUBLIC_KEY:", publicKey ? `${publicKey.substring(0, 10)}...` : "❌ NO DEFINIDA");
  console.log("- CULQI_SECRET_KEY:", secretKey ? `${secretKey.substring(0, 10)}...` : "❌ NO DEFINIDA");
  
  return {
    hasPublicKey: !!publicKey,
    hasSecretKey: !!secretKey,
    publicKeyPrefix: publicKey?.substring(0, 10),
    secretKeyPrefix: secretKey?.substring(0, 10),
  };
});
