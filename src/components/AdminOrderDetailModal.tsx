import { useState, useEffect } from "react";
import { X, Loader2, MapPin, Phone, User, ShoppingBag, Clock, FileText, ExternalLink, MessageSquare, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import { sendReviewRequestEmail } from "../lib/emailService";
import { openWhatsAppDispatch, generateDeliveryGoogleMapsUrl } from "../utils/whatsappDispatch";

interface AdminOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
}

export function AdminOrderDetailModal({
  isOpen,
  onClose,
  order,
  onStatusChange,
}: AdminOrderDetailModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);

  const handleSendReviewEmail = async () => {
    if (!order) return;
    const emailToUse = order.client_email || order.customer_email || order.email;
    const nameToUse = order.client_name || order.customer_name || order.name || "Cliente";

    if (!emailToUse || !emailToUse.includes("@")) {
      alert("Este pedido no tiene un correo electrónico válido registrado.");
      return;
    }

    setSendingReview(true);
    try {
      await sendReviewRequestEmail({ name: nameToUse, email: emailToUse });
      alert(`¡Correo de solicitud de reseña de 5 estrellas enviado con éxito a ${emailToUse}!`);
    } catch (err: any) {
      alert(`Error al enviar el correo: ${err?.message || "Revisa la configuración"}`);
    } finally {
      setSendingReview(false);
    }
  };

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderItems();
    }
  }, [isOpen, order]);

  const fetchOrderItems = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, products(name, image_url)")
        .eq("order_id", order.id);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching order items:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    await onStatusChange(order.id, newStatus);
    setUpdating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">Recibido</span>;
      case "preparing":
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-300">En Preparación</span>;
      case "on_the_way":
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-300">En Camino</span>;
      case "delivered":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-300">Entregado</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-300">Cancelado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  // WhatsApp template
  const rawPhone = order.client_phone ? order.client_phone.replace(/\D/g, "") : "";
  const fullPhone = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone;
  const whatsappUrl = `https://wa.me/${fullPhone}?text=Hola%20${encodeURIComponent(order.client_name)},%20te%20saludamos%20de%20Restaurante%20Las%20Flores.%20Tu%20pedido%20%23${order.order_number}%20est%C3%A1%20en%20estado:%20${encodeURIComponent(order.status)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#14231D] text-piedra px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-chilca">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-piedra flex items-center gap-2">
                Pedido #{order.order_number}
                <span className={`text-xs px-2 py-0.5 rounded font-normal ${
                  order.order_type === 'delivery' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {order.order_type === 'delivery' ? 'Delivery' : 'Recojo en tienda'}
                </span>
              </h2>
              <p className="text-xs text-piedra/70 flex items-center gap-1 mt-0.5">
                <Clock size={12} />
                {new Date(order.created_at).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-piedra/80 hover:text-piedra flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Status Controls */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Estado Actual</span>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <User size={14} className="text-eucalipto" /> Cliente
              </div>
              <p className="font-bold text-gray-900">{order.client_name || "Cliente no especificado"}</p>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Phone size={13} className="text-gray-400" />
                  {order.client_phone || "Sin teléfono"}
                </span>

                {order.client_phone && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    WhatsApp <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-2"><MapPin size={14} className="text-eucalipto" /> Dirección / Entrega</span>
                {order.order_type === 'delivery' && (order.address || order.delivery_address || order.latitude) && (
                  <a
                    href={generateDeliveryGoogleMapsUrl(order.latitude, order.longitude, order.address || order.delivery_address)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    <span>GPS Mapa</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {order.order_type === 'delivery' 
                  ? (order.address || order.delivery_address || "Sin dirección especificada") 
                  : "Recojo en local - Jr. Dos de Mayo 208"}
                {order.reference ? ` (${order.reference})` : ""}
              </p>
              {order.notes && (
                <div className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-100 flex items-start gap-1.5 mt-2">
                  <FileText size={13} className="shrink-0 mt-0.5" />
                  <span><strong>Nota:</strong> {order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              Productos Solicitados ({items.length})
            </h3>

            {loading ? (
              <div className="py-8 flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-eucalipto" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border rounded-xl">No hay items en este pedido</p>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                      <th className="px-4 py-3 text-right">P. Unit</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.products?.image_url && (
                              <img
                                src={item.products.image_url}
                                alt={item.products.name}
                                className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{item.product_name || item.products?.name || "Producto"}</div>
                              {item.notes && <div className="text-xs text-gray-400">{item.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">x{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">S/ {Number(item.unit_price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">S/ {Number(item.subtotal || item.quantity * item.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Total Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Monto Total del Pedido</span>
            <span className="text-2xl font-extrabold text-eucalipto">
              S/ {Number(order.total).toFixed(2)}
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {order.order_type === "delivery" && (
              <button
                onClick={() => openWhatsAppDispatch(order, items)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <MessageSquare size={16} />
                <span>Enviar a Motorizado</span>
              </button>
            )}

            <button
              onClick={handleSendReviewEmail}
              disabled={sendingReview}
              className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#b8952b] text-[#1b2a24] font-serif font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Star size={15} fill="#1b2a24" />
              <span>{sendingReview ? "Enviando..." : "Enviar Correo de Reseña"}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

