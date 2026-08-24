import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { categories as staticCategories, Category, Dish } from "../components/MenuModal";

export type { Category, Dish };

function normalizeText(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveDeliveryPrice(productName: string, fallbackPrice: string): string {
  const normalizedName = normalizeText(productName);

  if (normalizedName.includes("duo de pastas")) return "S/ 56.00";
  if (normalizedName.includes("espagueti") && normalizedName.includes("pesto")) return "S/ 40.00";
  if (
    (normalizedName.includes("fetuchini") || normalizedName.includes("fetuccini") || normalizedName.includes("fettuccini")) &&
    normalizedName.includes("huancaina")
  ) {
    return "S/ 44.00";
  }

  return fallbackPrice;
}

function buildSizeCustomizationSection(medioPrice: number, enteroPrice: number) {
  return [
    {
      id: "tamano",
      title: "1. Tamaño",
      options: [
        { id: "medio_cuy", name: "Medio cuy", price: medioPrice },
        { id: "cuy_entero", name: "Cuy entero", price: enteroPrice },
      ],
    },
  ];
}

function buildChoiceCustomizationSection(title: string, options: Array<{ id: string; name: string; price: number }>) {
  return [
    {
      id: title.toLowerCase().replace(/\s+/g, "_"),
      title,
      options,
    },
  ];
}

export function resolveProductCustomOptions(productName: string, basePrice: number) {
  const normalizedName = normalizeText(productName);

  if (normalizedName.includes("filet") && normalizedName.includes("mignon")) {
    return [
      {
        id: "carbohidrato",
        title: "1. Carbohidrato",
        options: [
          { id: "papas_fritas_francesas", name: "Papas fritas francesas", price: 0 },
          { id: "papas_salteadas_mantequilla", name: "Papas salteadas en mantequilla", price: 0 },
        ],
      },
      {
        id: "ensalada",
        title: "2. Ensalada",
        options: [
          { id: "ensalada_organica", name: "Ensalada orgánica", price: 0 },
          { id: "ensalada_sancochada", name: "Ensalada sancochada", price: 0 },
        ],
      },
    ];
  }

  if (normalizedName.includes("espagueti") && normalizedName.includes("pesto")) {
    return [
      {
        id: "proteina",
        title: "1. Proteína",
        options: [
          { id: "milanesa", name: "Milanesa", price: 42 },
          { id: "pollo_grill", name: "Pollo al grill", price: 40 },
          { id: "filet_mignon", name: "Filet mignon", price: 46 },
        ],
      },
    ];
  }

  if ((normalizedName.includes("fetuchini") || normalizedName.includes("fetuccini") || normalizedName.includes("fettuccini")) && normalizedName.includes("huancaina")) {
    return buildChoiceCustomizationSection("1. Proteína", [
      { id: "pollo_grill", name: "Pollo al grill", price: 40 },
      { id: "lomo_saltado", name: "Lomo saltado", price: 44 },
    ]);
  }

  const isCuyLasFlores = normalizedName.includes("cuy las flores") && !normalizedName.includes("deshuesado");
  const isCuyLasFloresDeshuesado = normalizedName.includes("cuy las flores") && normalizedName.includes("deshuesado");
  const isMixto = normalizedName.includes("mixto") && !normalizedName.includes("deshuesado");
  const isMixtoDeshuesado = normalizedName.includes("mixto") && normalizedName.includes("deshuesado");

  if (isCuyLasFlores) {
    return buildSizeCustomizationSection(basePrice, Math.round(basePrice * 1.79));
  }

  if (isCuyLasFloresDeshuesado) {
    return buildSizeCustomizationSection(basePrice, Math.round(basePrice * 1.71));
  }

  if (isMixto) {
    return buildChoiceCustomizationSection("1. Tamaño", [
      { id: "mixto_clasico", name: "Mixto clásico", price: basePrice },
      { id: "mixto_deshuesado", name: "Mixto deshuesado", price: Math.round(basePrice * 1.12) },
    ]);
  }

  if (isMixtoDeshuesado) {
    return buildChoiceCustomizationSection("1. Tamaño", [
      { id: "mixto_clasico", name: "Mixto clásico", price: Math.round(basePrice / 1.12) },
      { id: "mixto_deshuesado", name: "Mixto deshuesado", price: basePrice },
    ]);
  }

  return undefined;
}

/**
 * Normaliza nombres de categorías para emparejar slug/id
 */
function normalizeCategorySlug(nameOrSlug: string): string {
  const s = (nameOrSlug || "").toLowerCase().trim();
  if (s.includes("desayuno")) return "desayuno";
  if (s.includes("entrada")) return "entradas";
  if (s.includes("típico") || s.includes("tipico")) return "tipicos";
  if (s.includes("chef") || s.includes("recomendaci")) return "chef";
  if (s.includes("especialidad")) return "especialidades";
  if (s.includes("grill") || s.includes("parrilla")) return "grill";
  if (s.includes("infantil") || s.includes("niño")) return "menu infantil";
  if (s.includes("calder") || s.includes("sopa")) return "calderia";
  if (s.includes("pasta")) return "pastas";
  if (s.includes("bebida")) return "bebidas";
  if (s.includes("postre")) return "postres";
  return s.replace(/\s+/g, "-");
}

/**
 * Obtiene la lista combinada y en tiempo real de categorías y platos desde Supabase
 */
export async function getLiveCategories(): Promise<Category[]> {
  try {
    // 1. Obtener todas las categorías de Supabase (activas e inactivas)
    const { data: dbCategories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    // 2. Obtener productos disponibles de Supabase
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*, categories(id, name, slug)")
      .order("sort_order", { ascending: true });

    if (prodError) {
      console.warn("Error fetching live products from Supabase:", prodError);
    }

    // Si no hay productos en la BD, devolver la lista estática
    if (!dbProducts || dbProducts.length === 0) {
      return staticCategories;
    }

    // Crear mapa de categorías basándose en Supabase o estático
    const categoriesMap = new Map<string, Category>();

    // Identificar slugs de categorías inactivas explícitamente en BD
    const inactiveSlugs = new Set<string>();
    if (dbCategories) {
      dbCategories.forEach(c => {
        if (c.is_active === false) {
          inactiveSlugs.add(c.slug || normalizeCategorySlug(c.name));
        }
      });
    }

    // Inicializar mapa con la estructura estática, omitiendo las que fueron desactivadas en BD
    staticCategories.forEach((cat) => {
      if (!inactiveSlugs.has(cat.id)) {
        categoriesMap.set(cat.id, {
          id: cat.id,
          label: cat.label,
          dishes: [],
        });
      }
    });

    // Agregar categorías nuevas de Supabase si existen y están activas
    if (dbCategories) {
      dbCategories.forEach((c) => {
        const slug = c.slug || normalizeCategorySlug(c.name);
        if (c.is_active !== false && !categoriesMap.has(slug)) {
          categoriesMap.set(slug, {
            id: slug,
            label: c.name,
            dishes: [],
          });
        }
      });
    }

    // Mapear productos de Supabase a sus respectivas categorías
    const liveDishesByCat = new Map<string, Dish[]>();

    dbProducts.forEach((prod) => {
      // Filtrar solo los productos disponibles (is_available === true o undefined)
      if (prod.is_available === false) return;

      const catSlug =
        prod.categories?.slug ||
        normalizeCategorySlug(prod.categories?.name || "") ||
        "entradas";

      const basePrice = Number(prod.price || 0);
      const customOptions = resolveProductCustomOptions(prod.name, basePrice) || prod.custom_options || undefined;

      const dish: Dish = {
        id: prod.id,
        name: prod.name,
        description: prod.description || "",
        price: `S/ ${Number(prod.price || 0).toFixed(2)}`,
        image: prod.image_url || undefined,
        is_customizable:
          (customOptions && customOptions.length > 0) ||
          prod.is_customizable === true ||
          prod.name.toLowerCase().includes("desayuno ayacuchano") ||
          false,
        custom_options: customOptions || prod.custom_options || undefined,
      };

      if (!liveDishesByCat.has(catSlug)) {
        liveDishesByCat.set(catSlug, []);
      }
      liveDishesByCat.get(catSlug)!.push(dish);
    });

    // Reemplazar o fusionar platos por categoría
    const result: Category[] = [];

    categoriesMap.forEach((cat, slug) => {
      const liveDishes = liveDishesByCat.get(slug);
      if (liveDishes && liveDishes.length > 0) {
        // Usar los platos en vivo de Supabase para esta categoría
        result.push({
          ...cat,
          dishes: liveDishes,
        });
      } else {
        // Si no hay platos en la BD para esta categoría, conservar los estáticos
        const defaultCat = staticCategories.find((c) => c.id === slug);
        if (defaultCat && defaultCat.dishes.length > 0) {
          result.push(defaultCat);
        }
      }
    });

    return result.length > 0 ? result : staticCategories;
  } catch (err) {
    console.error("Exception fetching live categories:", err);
    return staticCategories;
  }
}

/**
 * Hook de React para consumir categorías y platos con actualización en vivo por Realtime
 */
export function useLiveMenuCategories() {
  const [menuCategories, setMenuCategories] = useState<Category[]>(staticCategories);
  const [loading, setLoading] = useState(true);

  const refreshMenu = async () => {
    const liveData = await getLiveCategories();
    setMenuCategories(liveData);
    setLoading(false);
  };

  useEffect(() => {
    refreshMenu();

    // Suscripción Realtime a cambios en la tabla 'products' y 'categories'
    const channelName = `live-menu-updates-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        refreshMenu();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        refreshMenu();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { categories: menuCategories, loading, refreshMenu };
}
