# Ubicacion y destino Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Restaurante page's reservation and delivery CTA content with a responsive location-and-destination section using `Ubicacion.webp`.

**Architecture:** Keep the existing section in `src/routes/restaurante.tsx` and preserve `id="reservas"` for existing anchors. Replace only its centered CTA markup with a responsive two-column layout: image on the left and location copy on the right, stacking on mobile. The header, reservation route, cart, and delivery modal remain unchanged.

**Tech Stack:** React, TypeScript, TanStack Router, Tailwind CSS, Vite.

## Global Constraints

- Modify only the content section currently labeled "Reservas y Delivery".
- Keep the header controls and behavior exactly as they are.
- Keep `id="reservas"`.
- Use `/inicio/Ubicacion.webp` for the image.
- Remove the section buttons "Reservar mesa" and "Pedir delivery".
- Use ASCII in source copy unless existing product copy requires accents.

---

### Task 1: Replace the reservation and delivery CTA

**Files:**
- Modify: `src/routes/restaurante.tsx` in the `CTA Reservas y Delivery` section.
- Use existing asset: `public/inicio/Ubicacion.webp`.

**Interfaces:**
- Consumes: existing `RestaurantePage` JSX and Tailwind utility classes.
- Produces: a section with `id="reservas"`, an image at `/inicio/Ubicacion.webp`, and location copy with no CTA buttons.

- [ ] **Step 1: Replace the section markup**

Keep the section wrapper and id, then replace its inner centered CTA with:

```tsx
<div className="max-w-6xl mx-auto grid items-center gap-10 md:grid-cols-2 md:gap-16">
  <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
    <img
      src="/inicio/Ubicacion.webp"
      alt="Ubicacion y destino del Restaurante Las Flores"
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  </div>
  <div className="text-center md:text-left">
    <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs block mb-6">
      Ubicacion y destino
    </span>
    <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-8 text-balance">
      Encuentrenos en el corazon de Ayacucho
    </h2>
    <p className="text-lg text-nogal/70 leading-[1.7] max-w-[52ch]">
      Visite Restaurante Las Flores y descubra una experiencia gastronomica ayacuchana en un
      espacio familiar y acogedor.
    </p>
  </div>
</div>
```

- [ ] **Step 2: Run the focused validation**

Run: `npm run build`

Expected: the Vite production build completes successfully, the section still has `id="reservas"`, and TypeScript reports no new errors.

- [ ] **Step 3: Inspect the resulting diff**

Run: `git diff -- src/routes/restaurante.tsx`

Expected: only the `CTA Reservas y Delivery` content changes; the header block and unrelated sections remain untouched.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/routes/restaurante.tsx
git commit -m "feat: replace restaurant cta with location section"
```
