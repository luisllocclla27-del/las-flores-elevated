import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { ShoppingCartIcon } from "@animateicons/react/lucide";
import { useCart } from "../context/CartContext";
import { BreakfastCustomizationModal } from "./BreakfastCustomizationModal";
import { useLiveMenuCategories } from "../lib/liveProducts";

/* ─── Paleta de Lujo (Eucalipto & Crema) ─── */
const R = {
  rojo: "#8B261D",
  verde: "var(--color-eucalipto)",
  morado: "var(--color-eucalipto)",
  eucalipto: "var(--color-eucalipto)",
  amarillo: "var(--color-eucalipto)",
  crema: "#FBF5E6",
  blanco: "#FFFFFF",
  textoBoton: "#FBF5E6",
};

export interface DishOption {
  id: string;
  name: string;
  desc?: string;
  price?: string | number;
}

export interface DishCustomizationSection {
  id: string;
  title: string;
  options: DishOption[];
}

export interface Dish {
  name: string;
  description: string;
  price: string;
  image?: string;
  is_customizable?: boolean;
  custom_options?: DishCustomizationSection[];
}

export interface Category {
  id: string;
  label: string;
  dishes: Dish[];
}

/**
 * FALLBACK VACÍO — Los platos ahora se cargan completamente desde Supabase en tiempo real.
 * Si no hay datos en la BD, se usa esta lista mínima para evitar crashes.
 */
export const categories: Category[] = [
  {
    id: "cargando",
    label: "Cargando categorías...",
    dishes: [],
  },
];

interface DishCardProps {
  dish: Dish;
  categoryId: string;
  onSelectBreakfast?: (dish: Dish) => void;
}

function DishCard({ dish, categoryId, onSelectBreakfast }: DishCardProps) {
  const { addItem } = useCart();
  const priceNum = parseFloat(dish.price.replace("S/ ", ""));

  const isCustomizable =
    dish.is_customizable === true ||
    (dish.custom_options?.length || 0) > 0 ||
    dish.name.toLowerCase().includes("desayuno ayacuchano") ||
    dish.name.toLowerCase().includes("arma tu ronda");

  const handleAdd = () => {
    if (isCustomizable && onSelectBreakfast) {
      onSelectBreakfast(dish);
    } else {
      addItem({
        id: `${categoryId}-${dish.name}`,
        name: dish.name,
        price: priceNum,
        image: dish.image,
      });
    }
  };

  return (
    <div
      onClick={isCustomizable ? handleAdd : undefined}
      className={`bg-white rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-300 group border-2 border-transparent hover:border-piedra/50 ${
        isCustomizable ? "cursor-pointer" : ""
      }`}
    >
      {dish.image ? (
        <div className="h-44 overflow-hidden relative m-2.5 rounded-xl border border-black/5">
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
          <img
            src={dish.image}
            alt={dish.name}
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-44 m-2.5 rounded-xl bg-black/5 flex items-center justify-center relative">
          <span className="font-serif italic text-black/30 text-xl px-4 text-center">
            {dish.name}
          </span>
        </div>
      )}
      <div className="px-5 pb-5 pt-3 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-lg font-serif font-bold leading-tight text-nogal">
            {dish.name}
          </h3>
          <span className="font-serif font-bold text-sm flex-shrink-0 px-3 py-1 rounded-full bg-eucalipto/10 text-eucalipto">
            {dish.price}
          </span>
        </div>
        <p className="text-black/60 text-xs flex-1 mb-5 leading-relaxed font-medium">
          {dish.description}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-eucalipto/30 text-eucalipto font-bold text-sm bg-piedra hover:bg-eucalipto hover:text-white shadow-xs hover:shadow-sm active:scale-[0.99]"
        >
          <Plus size={15} strokeWidth={2.5} />
          {isCustomizable ? "Personalizar y Agregar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
}

export function MenuModal({ open, onClose }: MenuModalProps) {
  const { categories: liveCategories } = useLiveMenuCategories();
  const [activeId, setActiveId] = useState("desayuno");
  const [selectedBreakfastDish, setSelectedBreakfastDish] = useState<Dish | null>(null);
  const { totalItems, setIsOpen: setSidebarOpen } = useCart();
  const [isBouncing, setIsBouncing] = useState(false);
  const prevTotalItems = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevTotalItems.current && totalItems > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 400);
      return () => clearTimeout(timer);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const currentCategories = liveCategories && liveCategories.length > 0 ? liveCategories : categories;
  const active = currentCategories.find((c) => c.id === activeId) || currentCategories[0];

  if (!active) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-piedra overflow-hidden animate-in fade-in zoom-in-[0.98] duration-300">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center px-6">
            <p className="font-serif text-2xl text-nogal/60 mb-2">Cargando menú...</p>
            <p className="text-sm text-nogal/40">Por favor espera mientras cargamos la carta desde la base de datos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-piedra overflow-hidden animate-in fade-in zoom-in-[0.98] duration-300">
      {/* Header — Light & Luxurious Warm Cream Header */}
      <div
        className="relative bg-piedra/95 backdrop-blur-md border-b border-black/5 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-20 shadow-sm"
      >
        <div className="flex items-center gap-4 relative">
          <div
            className="hidden md:flex w-12 h-12 rounded-full border border-eucalipto/20 overflow-hidden flex-shrink-0 bg-white p-1 shadow-sm"
          >
            <img src="/favicon.png" alt="Las Flores" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-serif font-bold tracking-wide text-2xl md:text-3xl text-eucalipto">
              Nuestra Carta
            </h2>
            <p
              className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-bold text-eucalipto/60"
            >
              Para Delivery & Recojo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6 relative">
          <button
            onClick={() => {
              setSidebarOpen(true);
            }}
            className={`relative transition-all duration-300 flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-eucalipto text-piedra ${
              isBouncing ? "scale-[1.03] ring-4 ring-cafe/30 shadow-lg bg-eucalipto" : ""
            }`}
          >
            <ShoppingCartIcon size={18} className={`transition-transform duration-300 ${isBouncing ? "-rotate-12 scale-110" : ""}`} />
            <span className="hidden md:inline">Ver Pedido</span>
            {totalItems > 0 && (
              <span
                className={`absolute -top-2 -right-2 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm bg-cochinilla transition-all duration-300 ${
                  isBouncing ? "scale-[1.35] rotate-12" : "scale-100"
                }`}
              >
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            className="text-nogal/50 hover:text-nogal transition-colors p-2 rounded-full hover:bg-black/5"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Vertical Categories Sidebar (Desktop) / Horizontal Tabs (Mobile) */}
        <div
          className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-black/5 overflow-x-auto md:overflow-y-auto z-10 scrollbar-none"
          style={{ background: R.crema }}
        >
          <div className="flex flex-row md:flex-col p-3 md:p-4 gap-1 w-max min-w-full md:w-auto">
            {currentCategories.map((cat) => {
              const isActive = activeId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className={`text-center md:text-left whitespace-nowrap md:whitespace-normal px-5 md:px-6 py-3.5 md:py-3.5 text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] transition-all rounded-xl ${
                    isActive
                      ? "bg-eucalipto text-piedra shadow-xs font-bold"
                      : "text-nogal/60 hover:text-eucalipto hover:bg-black/5 font-medium"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10" style={{ background: `${R.crema}80` }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-black/5 pb-4">
              <h2 className="font-serif text-3xl md:text-4xl font-bold" style={{ color: R.morado }}>
                {active?.label || "Cargando..."}
              </h2>
              <span
                className="text-[10px] uppercase tracking-[0.3em] font-bold px-4 py-2 rounded-full"
                style={{ background: `${R.morado}15`, color: R.morado }}
              >
                {(active?.dishes?.length || 0)} platos
              </span>
            </div>

            <div
              key={activeId}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-500"
            >
              {(active?.dishes || []).map((dish, i) => (
                <DishCard
                  key={i}
                  dish={dish}
                  categoryId={activeId}
                  onSelectBreakfast={(d) => setSelectedBreakfastDish(d)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <BreakfastCustomizationModal
        dish={selectedBreakfastDish}
        open={!!selectedBreakfastDish}
        onClose={() => setSelectedBreakfastDish(null)}
      />
    </div>
  );
}




