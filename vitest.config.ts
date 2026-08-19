import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    // Varios módulos crean el cliente de Supabase al importarse. Sin estas
    // variables el import falla con "supabaseUrl is required" y la suite no
    // llega a ejecutarse. Son valores ficticios: los tests que tocan la red
    // usan mocks.
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
