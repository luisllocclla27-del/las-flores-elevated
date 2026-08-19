import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, GlassWater, Check, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Dish } from "./MenuModal";

interface BreakfastCustomizationModalProps {
  dish: Dish | null;
  open: boolean;
  onClose: () => void;
}

const BEBIDAS_FRIAS = [
  { id: "platano", name: "Jugo de plátano", desc: "Refrescante y cremoso de fruta natural" },
  { id: "mango", name: "Jugo de mango", desc: "Dulce y tropical recién preparado" },
  { id: "frutos_rojos", name: "Jugo de frutos rojos", desc: "Mezcla antioxidante y llena de sabor" },
  { id: "naranja", name: "Jugo de naranja", desc: "100% natural exprimidito al momento" },
  { id: "pina", name: "Jugo de piña", desc: "Digestivo y refrescante de piña selecta" },
];

const BEBIDAS_CALIENTES = [
  { id: "cafe", name: "Taza de café", desc: "Café pasado artesanal de grano andino" },
  { id: "chocolate", name: "Chocolate ayacuchano", desc: "Tradicional cacao especiado hervido a fuego lento" },
  { id: "infusion", name: "Infusión", desc: "Hierbas aromáticas naturales (Manzanilla, Anís o Muña)" },
];

const SANDWICHES = [
  {
    id: "butifarra",
    name: "Pan con Butifarra",
    desc: "Jugoso jamón del país acompañado de cebolla encurtida y pan crujiente.",
  },
  {
    id: "chicharron",
    name: "Pan con Chicharrón",
    desc: "Chicharrón tierno y crocante acompañado de camote frito y cebolla encurtida.",
  },
];

const ACOMPANAMIENTOS = [
  { id: "humita", name: "Humita", desc: "Auténtica humita dulce o salada hecha en casa" },
  { id: "huevos", name: "Huevos revueltos", desc: "Huevos de corral frescos preparados al gusto" },
  { id: "palta", name: "Ensalada de palta", desc: "Láminas de palta hass fresca con limón y sal marina" },
  { id: "frutas", name: "Ensalada de frutas", desc: "Variedad de frutas de estación picadas" },
];

const DEFAULT_SECTIONS = [
  { id: "sec_1", title: "1. Bebida fría", options: BEBIDAS_FRIAS },
  { id: "sec_2", title: "2. Bebida caliente", options: BEBIDAS_CALIENTES },
  { id: "sec_3", title: "3. Sándwich", options: SANDWICHES },
  { id: "sec_4", title: "4. Acompañamiento", options: ACOMPANAMIENTOS },
];

export function BreakfastCustomizationModal({ dish, open, onClose }: BreakfastCustomizationModalProps) {
  const { addItem, setIsOpen: setSidebarOpen } = useCart();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reiniciar selecciones al abrir el modal
  useEffect(() => {
    if (open) {
      setSelections({});
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !dish || !isMounted) return null;

  const sectionsList =
    dish.custom_options && Array.isArray(dish.custom_options) && dish.custom_options.length > 0
      ? dish.custom_options
      : DEFAULT_SECTIONS;

  const selectedCount = sectionsList.filter((s) => !!selections[s.id || s.title]).length;
  const isComplete = selectedCount >= sectionsList.length;

  const handleSelectOption = (sectionId: string, optionName: string) => {
    setSelections((prev) => ({
      ...prev,
      [sectionId]: optionName,
    }));
  };

  const resolveSelectedPrice = () => {
    let priceString = dish.price;

    sectionsList.forEach((section) => {
      const selectedOptionName = selections[section.id || section.title];
      if (!selectedOptionName) return;

      const matched = section.options.find(
        (option: any) => option.name === selectedOptionName || option.id === selectedOptionName,
      );

      const anyMatched = matched as any;
      if (anyMatched?.price) {
        priceString = typeof anyMatched.price === "number" ? `S/ ${anyMatched.price.toFixed(2)}` : anyMatched.price;
      }
    });

    return parseFloat(priceString.toString().replace("S/ ", ""));
  };

  const handleConfirm = () => {
    if (!isComplete) return;

    const itemUniqueId = `custom-${dish.name.replace(/\s+/g, "-")}-${Date.now()}`;

    const formattedCustomizations: Record<string, string> = {};
    sectionsList.forEach((s) => {
      const key = s.title.replace(/^\d+\.\s*/, "");
      const val = selections[s.id || s.title];
      if (val) formattedCustomizations[key] = val;
    });

    addItem({
      id: itemUniqueId,
      productId: dish.id,
      name: dish.name,
      price: resolveSelectedPrice(),
      image: dish.image,
      customizations: formattedCustomizations,
    });

    onClose();
    setSidebarOpen(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-250">
      {/* Fondo oscuro traslúcido con blur */}
      <div
        className="absolute inset-0 bg-eucalipto/80 backdrop-blur-md cursor-pointer transition-opacity"
        onClick={onClose}
      />

      {/* Modal Principal */}
      <div className="relative z-10 w-full max-w-2xl bg-[#FAF6EE] text-nogal rounded-[28px] shadow-2xl overflow-hidden border border-black/10 flex flex-col max-h-[92vh] md:max-h-[88vh] animate-in zoom-in-95 duration-300">
        
        {/* Cabecera con Imagen y Etiquetas */}
        <div className="relative h-44 sm:h-52 md:h-56 overflow-hidden flex-shrink-0 bg-eucalipto">
          {dish.image ? (
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover brightness-[0.82] hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-eucalipto via-ink to-eucalipto flex items-center justify-center" />
          )}

          {/* Gradiente de sombra sobre la imagen */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

          {/* Botón de Cierre */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-nogal transition-colors flex items-center justify-center shadow-md backdrop-blur-xs active:scale-95"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>

          {/* Información del Plato */}
          <div className="absolute bottom-4 left-5 right-5 z-10 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold px-3 py-1 rounded-full bg-retablo text-white shadow-xs flex items-center gap-1">
                <Sparkles size={11} /> Personaliza tu pedido
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-piedra">
                {selectedCount}/{sectionsList.length} Seleccionados
              </span>
            </div>
            <div className="flex justify-between items-end gap-3">
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-piedra drop-shadow-sm leading-tight">
                {dish.name}
              </h2>
              <span className="font-serif font-bold text-xl sm:text-2xl text-piedra flex-shrink-0 bg-white/15 px-3.5 py-1 rounded-2xl backdrop-blur-md border border-white/20 shadow-xs">
                S/ {resolveSelectedPrice().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Cuerpo Scrolleable con Secciones Dinámicas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 custom-scrollbar">
          {sectionsList.map((section, idx) => {
            const secKey = section.id || section.title;
            const currentSelected = selections[secKey];
            const isSecComplete = !!currentSelected;

            return (
              <div key={secKey} className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-black/5">
                <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-eucalipto/10 text-eucalipto flex items-center justify-center font-serif font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-nogal">{section.title}</h3>
                      <p className="text-[11px] text-black/50 font-medium">Selección obligatoria • 1 opción</p>
                    </div>
                  </div>
                  {isSecComplete ? (
                    <span className="text-[11px] font-bold text-eucalipto bg-eucalipto/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check size={13} /> Listo
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Requerido
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {section.options.map((item: any) => {
                    const isSelected = currentSelected === item.name;
                    return (
                      <div
                        key={item.id || item.name}
                        onClick={() => handleSelectOption(secKey, item.name)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-eucalipto/10 border-eucalipto text-nogal shadow-xs"
                            : "bg-black/2 border-transparent hover:border-black/10 hover:bg-black/4"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "border-eucalipto bg-eucalipto text-white" : "border-black/30 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-serif font-bold text-nogal leading-tight">
                            {item.name}
                          </span>
                          {item.desc && (
                            <span className="block text-[10px] text-black/50 truncate font-medium">
                              {item.desc}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Resumen de Selecciones */}
          <div className="bg-[#FAF6EE] rounded-2xl p-4 sm:p-5 border border-black/5">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-black/60 mb-3 flex items-center gap-1.5">
              <Utensils size={14} /> Resumen de tus selecciones
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sectionsList.map((sec) => {
                const secKey = sec.id || sec.title;
                const val = selections[secKey];
                const cleanTitle = sec.title.replace(/^\d+\.\s*/, "");

                return (
                  <div
                    key={secKey}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs ${
                      val ? "bg-white border-eucalipto/30 text-nogal" : "bg-white/40 border-black/5 text-nogal/40"
                    }`}
                  >
                    <span className="font-bold truncate max-w-[40%]">{cleanTitle}:</span>
                    <span className={`truncate max-w-[55%] font-medium ${val ? "text-eucalipto font-bold" : "italic text-black/30"}`}>
                      {val || "— Pendiente —"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Barra de Acción */}
        <div className="p-4 sm:p-5 bg-white border-t border-black/10 flex items-center justify-between gap-4 shadow-lg flex-shrink-0">
          <div className="text-left">
            <span className="text-[11px] font-serif tracking-[0.15em] font-bold text-black/45 uppercase block">
              Precio Total
            </span>
            <span className="font-serif font-bold text-2xl md:text-3xl text-eucalipto">S/ {resolveSelectedPrice().toFixed(2)}</span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!isComplete}
            className={`px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
              isComplete
                ? "bg-eucalipto text-white hover:bg-eucalipto/90 shadow-md active:scale-[0.98]"
                : "bg-[#E5E5E5] text-[#8E8E8E] cursor-not-allowed shadow-none"
            }`}
          >
            <ShoppingBag size={18} />
            {isComplete ? "Confirmar y Agregar al Carrito" : `Elige tus opciones (${selectedCount}/${sectionsList.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

