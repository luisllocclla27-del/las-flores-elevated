import { useState, useEffect } from "react";
import { X, Loader2, Ticket, Percent, DollarSign, Users, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AdminCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: any | null; // Null means create new
  onSave: () => Promise<void>;
  onDelete?: (couponId: string) => Promise<void>;
}

export function AdminCouponModal({
  isOpen,
  onClose,
  coupon,
  onSave,
  onDelete,
}: AdminCouponModalProps) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [orderTypeRestriction, setOrderTypeRestriction] = useState<"all" | "delivery" | "pickup">("delivery");
  const [minOrderTotal, setMinOrderTotal] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        setCode(coupon.code || "");
        setDiscountType(coupon.discount_type || "percent");
        setDiscountValue(coupon.discount_value ? coupon.discount_value.toString() : "");
        setMaxUses(coupon.max_uses ? coupon.max_uses.toString() : "100");
        setOrderTypeRestriction(coupon.order_type_restriction || "delivery");
        setMinOrderTotal(coupon.min_order_total ? coupon.min_order_total.toString() : "0");
        setIsActive(coupon.is_active ?? true);
      } else {
        setCode("");
        setDiscountType("percent");
        setDiscountValue("");
        setMaxUses("100");
        setOrderTypeRestriction("delivery");
        setMinOrderTotal("0");
        setIsActive(true);
      }
      setErrorMsg("");
    }
  }, [isOpen, coupon]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue || !maxUses) {
      setErrorMsg("Por favor completa los campos requeridos (Código, Valor, Límite de Usos).");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");

    try {
      const payload = {
        code: cleanCode,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        max_uses: parseInt(maxUses, 10),
        order_type_restriction: orderTypeRestriction,
        min_order_total: parseFloat(minOrderTotal || "0"),
        is_active: isActive,
      };

      if (coupon) {
        // Update
        const { error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", coupon.id);

        if (error) throw error;
      } else {
        // Create (Check if code already exists)
        const { data: existing } = await supabase
          .from("coupons")
          .select("id")
          .eq("code", cleanCode)
          .single();

        if (existing) {
          setErrorMsg(`El código "${cleanCode}" ya existe. Por favor usa uno diferente.`);
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from("coupons")
          .insert([{ ...payload, used_count: 0 }]);

        if (error) throw error;
      }

      await onSave();
      onClose();
    } catch (err: any) {
      console.error("Error saving coupon:", err);
      setErrorMsg(err.message || "Error al guardar el cupón de descuento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!coupon) return;
    if (!window.confirm(`¿Estás seguro de eliminar el cupón "${coupon.code}"?`)) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);
      if (error) throw error;

      if (onDelete) await onDelete(coupon.id);
      else await onSave();

      onClose();
    } catch (err: any) {
      console.error("Error deleting coupon:", err);
      setErrorMsg(err.message || "Error al eliminar el cupón.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-6 pt-6 sm:pt-10 pb-10 overflow-y-auto font-sans flex items-start justify-center cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col min-h-0 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 cursor-default my-0"
      >
        
        {/* Modal Header (Fijo Arriba) */}
        <div className="bg-[#2D473C] text-[#FAF8F5] p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <Ticket className="text-[#D4AF37]" size={20} />
            <h2 className="font-sans font-extrabold text-base sm:text-lg text-white">
              {coupon ? "Editar Cupón de Descuento" : "Crear Código de Descuento"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form (Scrollable Interno) */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden font-sans">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Coupon Code Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Ticket size={13} className="text-emerald-700" /> Código del Cupón *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: FLORES, AYACUCHO10, DELIVERYS"
              className="w-full text-base font-black font-mono tracking-wider uppercase bg-amber-50/50 border border-amber-300 rounded-xl px-4 py-2.5 text-[#14231D] focus:outline-none focus:ring-2 focus:ring-[#14231D]"
            />
            <p className="text-xs text-gray-500 mt-1">El código que escribirán los clientes en el carrito (ej. <strong>FLORES</strong>).</p>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Percent size={13} className="text-emerald-700" /> Tipo de Descuento *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo (S/)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-700" /> Valor *
              </label>
              <input
                type="number"
                step="0.10"
                min="0.1"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "15 (para 15%)" : "10 (para S/ 10)"}
                className="w-full text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-emerald-800 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              />
            </div>
          </div>

          {/* Max Uses & Order Type Restriction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users size={13} className="text-emerald-700" /> Límite de Usos *
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="100"
                className="w-full text-sm font-extrabold bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              />
              <p className="text-xs text-gray-500 mt-1">Ej: Válido solo para los <strong>100 primeros pedidos</strong>.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Truck size={13} className="text-emerald-700" /> Modalidad Válida
              </label>
              <select
                value={orderTypeRestriction}
                onChange={(e) => setOrderTypeRestriction(e.target.value as any)}
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              >
                <option value="delivery">Solo Delivery a Domicilio</option>
                <option value="pickup">Solo Recojo en Tienda</option>
                <option value="all">Todas las Modalidades</option>
              </select>
            </div>
          </div>

          {/* Min Order Total (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Compra Mínima Requerida (S/)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={minOrderTotal}
              onChange={(e) => setMinOrderTotal(e.target.value)}
              placeholder="0 (Sin mínimo)"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
            />
            <p className="text-xs text-gray-400 mt-0.5">Ingresa 0 si no requiere un monto mínimo de pedido.</p>
          </div>

          {/* Active Switch */}
          <div className="pt-2 flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Estado del Cupón</span>
              <span className="text-xs text-gray-500">¿Permitir usar este cupón activamente?</span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                isActive ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          </div>

          {/* Actions (Fijo Abajo fuera del Scroll) */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0 font-sans">
            {coupon ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : "Eliminar Cupón"}
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-[#FAF8F5] text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : null}
                {coupon ? "Guardar Cambios" : "Crear Cupón"}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

