import { useState, useEffect } from "react";
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  PackageX,
  UtensilsCrossed,
  RefreshCw,
  Power,
  SlidersHorizontal,
} from "lucide-react";
import { supabase, toggleProductAvailability, Product } from "../lib/supabase";

interface CashierStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashierStockModal({ isOpen, onClose }: CashierStockModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*, categories(id, name, slug)").order("sort_order", { ascending: true }),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (err) {
      console.error("Error al cargar productos de stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStockData();

      // Suscripción Realtime a cambios en la tabla 'products'
      const channel = supabase
        .channel("cashier-stock-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            fetchStockData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (productId: string, currentStatus: boolean) => {
    setTogglingId(productId);
    try {
      const newStatus = !currentStatus;
      await toggleProductAvailability(productId, newStatus);

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: newStatus } : p))
      );
    } catch (err) {
      console.error("Error al cambiar estado de disponibilidad:", err);
      alert("No se pudo cambiar la disponibilidad del plato.");
    } finally {
      setTogglingId(null);
    }
  };

  // Filtrado de productos por búsqueda y categoría
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase().trim());

    const catSlug = p.categories?.slug || p.category_id || "";
    const matchesCategory =
      selectedCategory === "all" || catSlug === selectedCategory || p.categories?.id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeCount = products.filter((p) => p.is_available !== false).length;
  const soldOutCount = products.length - activeCount;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2c4a3e]/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-[#fbf5e6] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#2c4a3e]/20 flex flex-col overflow-hidden"
      >
        {/* Encabezado del Modal */}
        <div className="bg-[#2c4a3e] text-white p-5 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 flex items-center justify-center border border-[#d4af37]/40">
              <PackageX size={22} className="text-[#d4af37]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight tracking-wide text-[#fbf5e6]">
                Control de Stock y Disponibilidad
              </h2>
              <p className="text-xs text-white/70">
                Apaga o activa platos agotados con 1 solo toque
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <span className="text-emerald-400 font-extrabold">{activeCount} Activos</span>
              <span className="text-white/40">•</span>
              <span className="text-rose-400 font-extrabold">{soldOutCount} Agotados</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 px-6 bg-white border-b border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar plato o bebida..."
              className="w-full bg-black/4 border border-black/10 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-black focus:outline-none focus:border-[#2c4a3e]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#2c4a3e] text-white shadow-xs"
                  : "bg-black/4 text-black/60 hover:bg-black/8"
              }`}
            >
              Todos ({products.length})
            </button>

            {categories.map((c) => {
              const active = selectedCategory === c.slug || selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug || c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[#2c4a3e] text-white shadow-xs"
                      : "bg-black/4 text-black/60 hover:bg-black/8"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Productos con Toggle de 1 Toque */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="p-12 text-center text-black/50 space-y-3">
              <RefreshCw size={32} className="animate-spin mx-auto text-[#2c4a3e]" />
              <p className="text-xs font-bold uppercase tracking-wider">Cargando menú en vivo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-black/40 space-y-2">
              <UtensilsCrossed size={40} className="mx-auto text-black/20" />
              <p className="font-bold text-sm text-black/60">No se encontraron platos</p>
              <p className="text-xs text-black/40">Intenta cambiar el término de búsqueda o la categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map((p) => {
                const isAvailable = p.is_available !== false;
                const isToggling = togglingId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isAvailable
                        ? "bg-white border-black/10 shadow-xs"
                        : "bg-rose-50/50 border-rose-200/80 shadow-none opacity-85"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-black/10 flex-none"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center flex-none border border-black/10">
                          <UtensilsCrossed size={20} className="text-black/30" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-black truncate">{p.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-serif font-extrabold text-[#2c4a3e]">
                            S/ {Number(p.price || 0).toFixed(2)}
                          </span>
                          <span className="text-xs text-black/40 uppercase font-semibold truncate">
                            {p.categories?.name || "General"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón Toggle de 1 Toque */}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggle(p.id, isAvailable)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer flex-none ${
                        isAvailable
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/80"
                          : "bg-rose-600 text-white hover:bg-rose-700 shadow-md"
                      }`}
                    >
                      <Power size={14} className={isToggling ? "animate-spin" : ""} />
                      <span>{isAvailable ? "DISPONIBLE" : "AGOTADO HOY"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 px-6 bg-white border-t border-black/10 flex items-center justify-between">
          <p className="text-xs text-black/60 font-medium">
            Los cambios se sincronizan en tiempo real con la carta web de los clientes.
          </p>

          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#2c4a3e] text-[#fbf5e6] font-bold text-xs uppercase tracking-wider hover:bg-[#2c4a3e]/90 transition-all cursor-pointer shadow-md"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
