import { Eye, ChevronRight, Truck, Store } from "lucide-react";
import { normalizeOrderStatus, getNextOrderStatus, STATUS_LABELS } from "../lib/orderStatus";

interface CashierListViewProps {
  orders: any[];
  orderItems: any[];
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onViewDetail: (order: any) => void;
}

export function CashierListView({
  orders,
  orderItems,
  onStatusChange,
  onViewDetail,
}: CashierListViewProps) {
  const getNextStatus = (status: string) => {
    return getNextOrderStatus(status) || "entregado";
  };

  const getNextStatusLabel = (status: string, orderType: string) => {
    const normalized = normalizeOrderStatus(status);
    if (normalized === "pendiente") return "Enviar a Cocina";
    if (normalized === "en_preparacion") {
      return orderType === "delivery" ? "A En Camino" : "A Listo Recojo";
    }
    if (normalized === "en_camino") return "A Entregado";
    return "Entregado";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#2D473C] text-white uppercase text-xs font-black tracking-wider">
            <tr>
              <th className="py-3.5 px-4">N° Orden</th>
              <th className="py-3.5 px-4">Cliente</th>
              <th className="py-3.5 px-4">Modalidad</th>
              <th className="py-3.5 px-4">Hora</th>
              <th className="py-3.5 px-4">Estado Actual</th>
              <th className="py-3.5 px-4">Total (S/)</th>
              <th className="py-3.5 px-4 text-right">Acciones Rápida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                  No hay comandas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const nextStatus = getNextStatus(ord.status);
                const nextLabel = getNextStatusLabel(ord.status, ord.order_type);

                return (
                  <tr key={ord.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 font-black text-[#2D473C] text-sm tabular-nums">
                      #{ord.order_number || ord.id?.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {ord.client_name || "Cliente General"}
                      <span className="block text-xs text-gray-500 font-normal">{ord.client_phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 w-max ${
                        ord.order_type === "delivery"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-amber-50 text-amber-900 border border-amber-200"
                      }`}>
                        {ord.order_type === "delivery" ? <Truck size={11} /> : <Store size={11} />}
                        {ord.order_type === "delivery" ? "Delivery" : "Recojo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-semibold tabular-nums">
                      {ord.created_at ? new Date(ord.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-4 uppercase font-extrabold text-xs text-gray-800">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 inline-block">
                        {ord.status || "pendiente"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-[#2D473C] text-sm tabular-nums">
                      S/ {Number(ord.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewDetail(ord)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                          title="Ver detalle de comanda"
                        >
                          <Eye size={15} />
                        </button>
                        {ord.status !== "entregado" && ord.status !== "cancelado" && (
                          <button
                            onClick={() => onStatusChange(ord.id, nextStatus)}
                            className="px-3 py-1.5 bg-[#5F8575] hover:bg-[#4d7061] text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all shadow-2xs active:scale-98"
                          >
                            <span>{nextLabel}</span>
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
