# Tarjetas de Familia Las Flores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar las cuatro tarjetas visibles de `/familia-las-flores` para mostrar solo la imagen y su reseña en una cuadrícula de dos columnas.

**Architecture:** El cambio permanece dentro de `src/routes/familia-las-flores.tsx`. Se elimina la lógica de filtrado y el modal de carta que solo servía al contenido retirado; `COLLABORATORS` seguirá siendo la fuente única de datos y se renderizará directamente.

**Tech Stack:** React 19, TanStack Router, TypeScript, Tailwind CSS, ESLint y Vite.

## Global Constraints

- Las tarjetas muestran únicamente imagen y reseña.
- La barra de categorías desaparece en móvil y escritorio.
- La cuadrícula usa una columna en pantallas pequeñas y dos columnas desde `md`.
- Solo se muestran los primeros cuatro colaboradores; los demás no se renderizan.
- No se modifican los datos restantes de colaboradores ni estilos globales.

---

### Task 1: Simplificar la vista de colaboradores

**Files:**
- Modify: `src/routes/familia-las-flores.tsx`

**Interfaces:**
- Consumes: `COLLABORATORS: Collaborator[]`.
- Produces: la vista de colaboradores sin filtros, con tarjetas de imagen y reseña.

- [ ] **Step 1: Retirar dependencias y estado sin uso**

Eliminar los imports de `Utensils` y `MobileCategoryFilter`, junto con `isMenuOpen`, `activeCategory`, sus efectos y `MenuModal` si ya no queda ninguna referencia.

- [ ] **Step 2: Retirar la barra de categorías**

Eliminar los bloques de filtros móvil y escritorio, incluyendo los botones de selección.

- [ ] **Step 3: Renderizar cuatro tarjetas 1x2 con contenido reducido**

Cambiar el render para iterar sobre `COLLABORATORS.slice(0, 4)`, usar `grid-cols-1 md:grid-cols-2`, conservar la imagen arriba y dejar debajo solo `c.quote`.

- [ ] **Step 4: Ejecutar validación enfocada**

Run: `npx eslint src/routes/familia-las-flores.tsx`
Expected: sin errores ni warnings nuevos en la ruta.

- [ ] **Step 5: Verificar build de producción**

Run: `npm run build`
Expected: compilación Vite y generación estática completadas correctamente.
