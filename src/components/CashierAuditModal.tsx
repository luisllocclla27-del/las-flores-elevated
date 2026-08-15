import { useState } from "react";
import {
  X,
  Printer,
  Download,
  Banknote,
  CreditCard,
  Truck,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Store,
} from "lucide-react";
import { isCancelledStatus } from "../lib/orderStatus";

interface CashierAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
}

const getYYYYMMDD = (d?: Date | string) => {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("sv-SE");
};

export function CashierAuditModal({ isOpen, onClose, orders }: CashierAuditModalProps) {
  const todayStr = getYYYYMMDD(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  if (!isOpen) return null;

  // Filtrar órdenes por la fecha seleccionada
  const filteredOrders = orders.filter((o) => {
    if (!o.created_at) return false;
    const orderDate = getYYYYMMDD(o.created_at);
    return orderDate === selectedDate && !isCancelledStatus(o.status);
  });

  // Cálculos de montos
  let totalCash = 0;
  let totalOnline = 0;
  let totalDeliveryFees = 0;
  let totalDiscounts = 0;
  let countDelivery = 0;
  let countPickup = 0;

  filteredOrders.forEach((o) => {
    const total = Number(o.total || 0);
    const fee = Number(o.delivery_fee || 0);
    const discount = Number(o.discount_amount || o.discount || 0);
    const pm = (o.payment_method || "").toLowerCase().trim();
    const isCash = pm.includes("efectivo") || pm.includes("cash");
    const isCulqi = pm === "culqi";

    if (isCash) {
      totalCash += total;
    } else {
      totalOnline += total; // Incluye Yape, Plin, Culqi y otros pagos digitales
    }

    totalDeliveryFees += fee;
    totalDiscounts += discount;

    const isDelivery = (o.order_type || "delivery").toLowerCase().includes("delivery");
    if (isDelivery) countDelivery++;
    else countPickup++;
  });

  const totalSales = totalCash + totalOnline;

  // Función para exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      "N° Orden",
      "Fecha/Hora",
      "Cliente",
      "Teléfono",
      "Tipo",
      "Método de Pago",
      "Subtotal (S/)",
      "Delivery (S/)",
      "Total (S/)",
      "Estado",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.order_number || o.id?.slice(0, 8)}"`,
      `"${new Date(o.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}"`,
      `"${(o.client_name || "Cliente").replace(/"/g, '""')}"`,
      `"${o.client_phone || ""}"`,
      `"${o.order_type === "delivery" ? "Delivery" : "Recojo"}"`,
      `"${(o.payment_method || "Yape").toUpperCase()}"`,
      Number(o.subtotal || 0).toFixed(2),
      Number(o.delivery_fee || 0).toFixed(2),
      Number(o.total || 0).toFixed(2),
      `"${o.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cierre_de_Caja_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para imprimir reporte
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-[#2c4a3e]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#fbf5e6] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#2c4a3e]/20 flex flex-col overflow-hidden">
        {/* Encabezado del Modal */}
        <div className="bg-[#2c4a3e] text-white p-5 px-6 flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 flex items-center justify-center border border-[#d4af37]/40">
              <TrendingUp size={22} className="text-[#d4af37]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight tracking-wide text-[#fbf5e6]">
                Arqueo y Cierre de Caja
              </h2>
              <p className="text-xs text-white/70">
                Resumen contable y rendimiento diario de comandas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro de Fecha */}
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20">
              <Calendar size={15} className="text-[#d4af37]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cierre / Arqueo — Contenido Imprimible */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
          {/* Encabezado visible en Impresión */}
          <div className="hidden print:block text-center border-b pb-4 mb-4">
            <h1 className="text-xl font-bold font-serif text-black">RESTAURANTE LAS FLORES</h1>
            <p className="text-xs text-black/70 uppercase tracking-widest font-bold">REPORTE DE ARQUEO Y CIERRE DE CAJA</p>
            <p className="text-xs font-mono mt-1">Fecha de Cierre: {selectedDate}</p>
          </div>

          {/* Tarjetas de KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-2">
            {/* Total Efectivo a Rendir */}
            <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-black/50 tracking-wider">
                  Efectivo a Rendir
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                  <Banknote size={18} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-serif font-extrabold text-emerald-800 block">
                  S/ {totalCash.toFixed(2)}
                </span>
                <span className="text-[10px] text-black/50 font-medium">
                  Cobrado en efectivo por motorizados
                </span>
              </div>
            </div>

            {/* Total Pagado Online */}
            <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-black/50 tracking-wider">
                  Cobrado Online
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
                  <CreditCard size={18} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-serif font-extrabold text-purple-800 block">
                  S/ {totalOnline.toFixed(2)}
                </span>
                <span className="text-[10px] text-black/50 font-medium">
                  Yape, Plin y Tarjeta de Crédito
                </span>
              </div>
            </div>

            {/* Total Comisiones Delivery */}
            <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-black/50 tracking-wider">
                  Fletes Delivery
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
                  <Truck size={18} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-serif font-extrabold text-blue-800 block">
                  S/ {totalDeliveryFees.toFixed(2)}
                </span>
                <span className="text-[10px] text-black/50 font-medium">
                  Suma total de costos de envío
                </span>
              </div>
            </div>

            {/* Venta Total Bruta */}
            <div className="bg-[#2c4a3e] text-white p-5 rounded-2xl border border-[#2c4a3e] shadow-md flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-[#d4af37] tracking-wider">
                  Venta Total Neto
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center border border-[#d4af37]/40">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-serif font-extrabold text-[#fbf5e6] block">
                  S/ {totalSales.toFixed(2)}
                </span>
                <span className="text-[10px] text-white/70 font-medium">
                  {filteredOrders.length} comandas ({countDelivery} delivery / {countPickup} recojo)
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Detalle de Comandas */}
          <div className="bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden">
            <div className="p-4 bg-black/3 border-b border-black/10 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#2c4a3e] flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#2c4a3e]" />
                <span>Detalle de Comandas ({filteredOrders.length})</span>
              </h3>
              <span className="text-xs text-black/50 font-medium">
                Fecha: <strong>{selectedDate}</strong>
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-black/40 space-y-2">
                <Calendar size={36} className="mx-auto text-black/20" />
                <p className="font-medium text-sm">No hay comandas registradas para el {selectedDate}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#2c4a3e]/5 text-[#2c4a3e] font-extrabold uppercase tracking-wider text-[10px] border-b border-black/10">
                      <th className="p-3.5 pl-4">Orden</th>
                      <th className="p-3.5">Hora</th>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">Tipo</th>
                      <th className="p-3.5">Método Pago</th>
                      <th className="p-3.5 text-right">Subtotal</th>
                      <th className="p-3.5 text-right">Envío</th>
                      <th className="p-3.5 text-right pr-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-medium text-black/80">
                    {filteredOrders.map((o) => {
                      const pm = (o.payment_method || "").toLowerCase().trim();
                      const isCash = pm.includes("efectivo") || pm.includes("cash");
                      const createdTime = new Date(o.created_at).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <tr key={o.id} className="hover:bg-[#2c4a3e]/5 transition-colors">
                          <td className="p-3.5 pl-4 font-serif font-bold text-[#2c4a3e]">
                            #{o.order_number || o.id?.slice(0, 8)}
                          </td>
                          <td className="p-3.5 text-black/60">{createdTime}</td>
                          <td className="p-3.5 font-bold text-black">{o.client_name || "Cliente"}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                o.order_type === "delivery"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/80"
                              }`}
                            >
                              {o.order_type === "delivery" ? (
                                <>
                                  <Truck size={12} /> Delivery
                                </>
                              ) : (
                                <>
                                  <Store size={12} /> Recojo
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                isCash
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                                  : "bg-purple-50 text-purple-800 border border-purple-200/80"
                              }`}
                            >
                              {isCash ? (
                                <>
                                  <Banknote size={12} /> EFECTIVO
                                </>
                              ) : (
                                <>
                                  <CreditCard size={12} /> ONLINE
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3.5 text-right text-black/70">
                            S/ {Number(o.subtotal || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right text-black/70">
                            S/ {Number(o.delivery_fee || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right pr-4 font-bold text-[#2c4a3e]">
                            S/ {Number(o.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Acciones de Footer del Modal */}
        <div className="p-4 px-6 bg-white border-t border-black/10 flex items-center justify-between print:hidden">
          <div className="text-xs text-black/60 font-medium">
            Imprime el reporte o descárgalo en Excel/CSV para contabilidad.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredOrders.length === 0}
              className="py-2.5 px-4 rounded-xl bg-white border border-black/20 hover:bg-black/5 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download size={16} className="text-[#2c4a3e]" />
              <span>Exportar Excel (CSV)</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={filteredOrders.length === 0}
              className="py-2.5 px-5 rounded-xl bg-[#2c4a3e] hover:bg-[#2c4a3e]/90 text-[#fbf5e6] font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Printer size={16} className="text-[#d4af37]" />
              <span>Imprimir Ticket de Cierre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
