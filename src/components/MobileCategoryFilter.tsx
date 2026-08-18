import { useEffect, useRef, useState } from "react";
import { MoreVertical, X, Check } from "lucide-react";

export interface CategoryFilterOption {
  key: string;
  label: string;
}

interface MobileCategoryFilterProps {
  categories: CategoryFilterOption[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Color de acento para el estado activo (pill, botón "..." y fila seleccionada de la hoja). Hex. */
  accentColor?: string;
  /** Color de texto sobre el acento cuando el pill activo usa fondo sólido. Hex. */
  accentTextColor?: string;
}

/**
 * Barra de categorías con scroll horizontal + botón "⋮" fijo (no se va con el
 * scroll) que abre la lista completa en una hoja inferior — así el cliente
 * siempre sabe que hay más categorías, sin depender de que note el carrusel.
 * La hoja se anima igual que el modal del carrito (transform + doble rAF).
 */
export function MobileCategoryFilter({
  categories,
  activeKey,
  onSelect,
  accentColor = "#2D473C",
  accentTextColor = "#D4AF37",
}: MobileCategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, moved: false });

  const handleDragStart = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { isDragging: true, startX: e.pageX, startScrollLeft: el.scrollLeft, moved: false };
  };
  const handleDragMove = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el || !dragState.current.isDragging) return;
    const delta = e.pageX - dragState.current.startX;
    if (Math.abs(delta) > 3) dragState.current.moved = true;
    el.scrollLeft = dragState.current.startScrollLeft - delta;
  };
  const handleDragEnd = () => {
    dragState.current.isDragging = false;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let rafId1: number | undefined;
    let rafId2: number | undefined;
    let timer: number | undefined;
    if (isOpen) {
      setVisible(true);
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => setEntered(true));
      });
      document.body.style.overflow = "hidden";
    } else {
      setEntered(false);
      timer = window.setTimeout(() => setVisible(false), 350);
      document.body.style.overflow = "";
    }
    return () => {
      if (rafId1 !== undefined) cancelAnimationFrame(rafId1);
      if (rafId2 !== undefined) cancelAnimationFrame(rafId2);
      if (timer !== undefined) window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelectFromSheet = (key: string) => {
    onSelect(key);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 pr-3">
        <div
          ref={scrollRef}
          className="flex items-center gap-2.5 overflow-x-auto py-3 scrollbar-none flex-1 min-w-0 cursor-grab active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: "touch" }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {categories.map((cat) => {
            const isActive = activeKey === cat.key;
            return (
              <button
                key={cat.key}
                onClick={(e) => {
                  if (dragState.current.moved) return;
                  onSelect(cat.key);
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
                }}
                style={isActive ? { background: accentColor, color: accentTextColor } : undefined}
                className={`flex-shrink-0 whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive ? "shadow-md" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ver todas las categorías"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {visible && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-[350ms] ease-out ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`relative z-10 w-full max-w-[480px] bg-[#F9F8F3] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75dvh] transition-transform duration-[350ms] ease-out ${
              entered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Todas las categorías
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto py-2">
              {categories.map((cat) => {
                const isActive = activeKey === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleSelectFromSheet(cat.key)}
                    style={isActive ? { color: accentColor, background: `${accentColor}0D` } : undefined}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-left text-sm font-bold transition-colors ${
                      isActive ? "" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat.label}
                    {isActive && <Check size={16} style={{ color: accentColor }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
