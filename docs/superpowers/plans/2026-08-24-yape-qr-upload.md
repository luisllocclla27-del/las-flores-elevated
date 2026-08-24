# Yape QR Image Upload & WebP Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable administrators and cashiers to upload and update Yape QR images for both Business and Personal modes directly within the Yape config modal, with automatic client-side WebP compression and realtime synchronization.

**Architecture:** Create a standalone `YapeConfigModal` component that integrates with `compressImageToWebP` and Supabase Storage (with inline fallback), connects to `yapeService.ts` for persistence and Realtime broadcast, and update `src/routes/caja.tsx` and `src/routes/admin.tsx`.

**Tech Stack:** React, TypeScript, TailwindCSS, Supabase (Storage & Realtime), Canvas WebP API, Vitest.

## Global Constraints
- Target maximum dimensions: 800x800 px with 0.90 quality for high-contrast QR scannability.
- Output format: `image/webp`.
- Zero broken flows: If Supabase Storage upload fails or is not configured, gracefully fallback to high-efficiency WebP Data URL so the QR always updates.
- Realtime sync: Changes must broadcast via `yapeService.ts` so `CartSidebar` reflects new QR immediately.

---

### Task 1: Create `src/components/YapeConfigModal.tsx`

**Files:**
- Create: `src/components/YapeConfigModal.tsx`

**Interfaces:**
- Consumes: `YapeConfig`, `DEFAULT_YAPE_CONFIG`, `saveYapeConfig` from `src/lib/yapeService.ts`; `compressImageToWebP` from `src/lib/webp-compressor.ts`; `supabase` from `src/lib/supabase.ts`.
- Produces: `<YapeConfigModal isOpen={boolean} onClose={() => void} currentConfig={YapeConfig} onSave={(updated: YapeConfig) => void} />`

- [ ] **Step 1: Write `src/components/YapeConfigModal.tsx`**

Implement modal with:
1. Mode selector buttons (Empresa vs Personal).
2. Text input fields (businessName, businessPhone, personalName, personalPhone).
3. QR Image preview card showing current QR thumbnail.
4. File input trigger with "Cambiar Imagen QR" and Drag & Drop support.
5. In-browser compression via `compressImageToWebP(file, 800, 800, 0.90)`.
6. Supabase Storage upload attempt to `products` bucket or fallback to base64 Data URL.
7. Optimization stats badge (e.g. `¡QR optimizado (1,240 KB ➔ 58 KB WebP)!`).
8. "Restaurar QR original" button.
9. "Aplicar y Guardar Configuración" button calling `saveYapeConfig`.

- [ ] **Step 2: Verify component build and TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/YapeConfigModal.tsx
git commit -m "feat: add YapeConfigModal component with image upload and WebP optimization"
```

---

### Task 2: Unit Test for Yape Config Updates

**Files:**
- Create: `src/tests/yapeConfig.test.ts`

**Interfaces:**
- Consumes: `YapeConfig`, `DEFAULT_YAPE_CONFIG`, `saveYapeConfig`, `getYapeConfig` from `src/lib/yapeService.ts`.
- Produces: Test suite validating that updating `businessQrUrl` and `personalQrUrl` maintains structure and persistence.

- [ ] **Step 1: Write `src/tests/yapeConfig.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DEFAULT_YAPE_CONFIG, getYapeConfig, saveYapeConfig, YapeConfig } from "../lib/yapeService";

describe("Yape Config Service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns default config when storage is empty", async () => {
    const config = await getYapeConfig();
    expect(config.mode).toBe("business");
    expect(config.businessQrUrl).toBeDefined();
    expect(config.personalQrUrl).toBeDefined();
  });

  it("persists updated QR URLs and settings", async () => {
    const newConfig: YapeConfig = {
      ...DEFAULT_YAPE_CONFIG,
      mode: "personal",
      personalQrUrl: "https://example.com/new-personal-qr.webp",
      personalName: "Juan Perez",
    };

    const saved = await saveYapeConfig(newConfig);
    expect(saved).toBe(true);

    const loaded = await getYapeConfig();
    expect(loaded.mode).toBe("personal");
    expect(loaded.personalQrUrl).toBe("https://example.com/new-personal-qr.webp");
    expect(loaded.personalName).toBe("Juan Perez");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/tests/yapeConfig.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/tests/yapeConfig.test.ts
git commit -m "test: add unit tests for Yape config persistence and QR URLs"
```

---

### Task 3: Integrate `YapeConfigModal` in `src/routes/caja.tsx` & `src/routes/admin.tsx`

**Files:**
- Modify: `src/routes/caja.tsx`
- Modify: `src/routes/admin.tsx` (optional quick access)

**Interfaces:**
- Consumes: `<YapeConfigModal />`
- Produces: Seamless modal experience when clicking QR Yape button in Cashier header or Admin sidebar.

- [ ] **Step 1: Replace inline modal in `src/routes/caja.tsx` with `<YapeConfigModal />`**

Import `YapeConfigModal` and replace the ~150 lines of inline modal markup with:
```tsx
<YapeConfigModal
  isOpen={isYapeModalOpen}
  onClose={() => setIsYapeModalOpen(false)}
  currentConfig={yapeConfig}
  onSave={(updated) => {
    setYapeConfig(updated);
    saveYapeConfig(updated);
  }}
/>
```

- [ ] **Step 2: Add Yape QR Config button in `src/routes/admin.tsx` header / sidebar for convenience**

Allow administrators to also configure the QR from `/admin` directly without switching to `/caja`.

- [ ] **Step 3: Run TypeScript check and test suite**

Run: `npx tsc --noEmit && npm test`
Expected: All tests pass and typecheck succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/routes/caja.tsx src/routes/admin.tsx
git commit -m "feat: integrate modular YapeConfigModal in caja and admin routes"
```

---

### Task 4: Full System Verification & Push

- [ ] **Step 1: Run complete verification commands**
Run `npm test` and `npx tsc --noEmit`.

- [ ] **Step 2: Push changes to remote repository**
Run `git push glitch main` and `git push origin main`.
