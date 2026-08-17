import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { sendReviewRequestEmail } from "../lib/emailService";
import { playOrderChime } from "../utils/audioAlert";
import { CashierOrderCard } from "../components/CashierOrderCard";
import { CashierReservationCard } from "../components/CashierReservationCard";
import { AdminOrderDetailModal } from "../components/AdminOrderDetailModal";
import { CashierKPIHeader } from "../components/CashierKPIHeader";
import { CashierKanbanView } from "../components/CashierKanbanView";
import { CashierListView } from "../components/CashierListView";
import { CashierAuditModal } from "../components/CashierAuditModal";
import { CashierStockModal } from "../components/CashierStockModal";
import {
  Search,
  RefreshCw,
  UtensilsCrossed,
  X,
  Calendar,
  ShoppingBag,
  Columns3,
  LayoutGrid,
  List,
  TrendingUp,
  PackageX,
} from "lucide-react";

const getLocalYYYYMMDD = (d?: Date | string) => {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("sv-SE");
};

export const Route = createFileRoute("/caja")({
  component: CashierDashboardRoute,
});

function CashierDashboardRoute() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // View mode switcher: 'orders' vs 'reservations'
  const [viewMode, setViewMode] = useState<"orders" | "reservations">("orders");

  // Layout layout mode switcher for orders: 'kanban' | 'grid' | 'list'
  const [layoutMode, setLayoutMode] = useState<"kanban" | "grid" | "list">("kanban");

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pendiente");
  
  // Reservations state
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>("today");
  const [resDateFrom, setResDateFrom] = useState<string>("");
  const [resDateTo, setResDateTo] = useState<string>("");
  const [activeDateFilter, setActiveDateFilter] = useState<"today" | "week" | "month" | "all" | "custom">("all");

  const setQuickDateRange = (type: "today" | "week" | "month" | "all") => {
    setActiveDateFilter(type);
    const today = new Date();
    const todayStr = getLocalYYYYMMDD(today);

    if (type === "today") {
      setResDateFrom(todayStr);
      setResDateTo(todayStr);
    } else if (type === "week") {
      const day = today.getDay();
      const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setResDateFrom(getLocalYYYYMMDD(monday));
      setResDateTo(getLocalYYYYMMDD(sunday));
    } else if (type === "month") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const lastDay = new Date(year, month + 1, 0);

      const fMonth = String(month + 1).padStart(2, "0");
      const lDay = String(lastDay.getDate()).padStart(2, "0");

      setResDateFrom(`${year}-${fMonth}-01`);
      setResDateTo(`${year}-${fMonth}-${lDay}`);
    } else if (type === "all") {
      setResDateFrom("");
      setResDateTo("");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState<string>("");
  const [orderDateTo, setOrderDateTo] = useState<string>("");
  const [activeOrderDateFilter, setActiveOrderDateFilter] = useState<"today" | "week" | "month" | "all" | "custom">("today");

  const setQuickOrderDateRange = (type: "today" | "week" | "month" | "all") => {
    setActiveOrderDateFilter(type);
    const today = new Date();
    const todayStr = getLocalYYYYMMDD(today);

    if (type === "today") {
      setOrderDateFrom(todayStr);
      setOrderDateTo(todayStr);
    } else if (type === "week") {
      const day = today.getDay();
      const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setOrderDateFrom(getLocalYYYYMMDD(monday));
      setOrderDateTo(getLocalYYYYMMDD(sunday));
    } else if (type === "month") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const fMonth = String(month + 1).padStart(2, "0");
      const lDay = String(lastDay.getDate()).padStart(2, "0");
      setOrderDateFrom(`${year}-${fMonth}-01`);
      setOrderDateTo(`${year}-${fMonth}-${lDay}`);
    } else if (type === "all") {
      setOrderDateFrom("");
      setOrderDateTo("");
    }
  };
  const [historicalStatusFilter, setHistoricalStatusFilter] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // Floating Stacked Toast Alerts
  interface NotificationItem {
    id: string;
    type: "order" | "reservation";
    title: string;
    subtitle: string;
    detail: string;
    data: any;
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notif: Omit<NotificationItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: NotificationItem = { ...notif, id };

    if (soundEnabledRef.current) {
      playOrderChime();
    }

    setNotifications((prev) => [item, ...prev.slice(0, 7)]); // Máximo 8 apiladas

    // Auto colapsar/cerrar en 8.5 segundos para dar tiempo suficiente de lectura
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 8500);
  };

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = "/restaurante";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role?.toLowerCase();
      if (userRole !== "admin" && userRole !== "cashier" && userRole !== "staff") {
        console.warn("Acceso denegado a caja. Rol insuficiente:", userRole);
        window.location.href = "/restaurante";
        return;
      }

      setIsAuthorized(true);
      await fetchData();
    } catch (err) {
      console.error("Error al comprobar permisos de caja:", err);
      window.location.href = "/restaurante";
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      // Limitar consulta a los últimos 7 días para evitar descargar todo el histórico
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateFilter = sevenDaysAgo.toISOString();

      const { data: ordData, error: ordErr } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateFilter)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!ordErr && ordData) {
        setOrders((prev) => {
          if (prev.length > 0 && ordData.length > prev.length) {
            const prevIds = new Set(prev.map((o: any) => o.id));
            const newOrders = ordData.filter((o: any) => !prevIds.has(o.id));
            newOrders.forEach((newest: any) => {
              addNotification({
                type: "order",
                title: "¡NUEVO PEDIDO RECIBIDO!",
                subtitle: `#${newest.order_number || "LF-NUEVO"}`,
                detail: `${newest.client_name || "Cliente"} — S/ ${Number(newest.total || 0).toFixed(2)}`,
                data: newest,
              });
            });
          }
          return ordData;
        });
      }

      if (ordData && ordData.length > 0) {
        const orderIds = ordData.map((o: any) => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*, products(name, image_url)")
          .in("order_id", orderIds);
        if (itemsData) setOrderItems(itemsData);
      } else {
        setOrderItems([]);
      }

      // 3. Fetch Reservations
      const { data: resData, error: resErr } = await supabase
        .from("reservations")
        .select("*")
        .gte("created_at", dateFilter)
        .order("reservation_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (!resErr && resData) {
        const todayStr = getLocalYYYYMMDD(new Date());
        const pastUnfulfilled = resData.filter(res =>
          (res.status === "pending" || res.status === "confirmed") &&
          res.reservation_date && res.reservation_date < todayStr
        );

        // Auto-cancelar reservas pasadas — sin mutar el objeto original (inmutabilidad React)
        if (pastUnfulfilled.length > 0) {
          pastUnfulfilled.forEach(res => {
            supabase.from("reservations").update({ status: "cancelled" }).eq("id", res.id).then();
          });
        }

        // Construir nuevo array con status actualizados de forma inmutable
        const updatedResData = resData.map(res =>
          pastUnfulfilled.some(p => p.id === res.id) ? { ...res, status: "cancelled" } : res
        );

        setReservations((prev) => {
          if (prev.length > 0 && updatedResData.length > prev.length) {
            const prevResIds = new Set(prev.map((r: any) => r.id));
            const newRes = updatedResData.filter((r: any) => !prevResIds.has(r.id));
            newRes.forEach((newest: any) => {
              addNotification({
                type: "reservation",
                title: "¡NUEVA RESERVA DE MESA!",
                subtitle: newest.client_name || "Cliente Reserva",
                detail: `${newest.reservation_date || "Fecha"} • ${newest.reservation_time || ""} • ${newest.guest_count || 1} pers.`,
                data: newest,
              });
            });
          }
          return updatedResData;
        });
      }
    } catch (err) {
      console.error("Error fetching cashier data:", err);
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  };

  // checkAuth se ejecuta solo una vez al montar — no debe depender de soundEnabled
  useEffect(() => {
    checkAuth();
  }, []);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    // 1. Supabase Realtime WebSocket
    const channel = supabase
      .channel("cashier-realtime-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as any;
            addNotification({
              type: "order",
              title: "¡NUEVO PEDIDO RECIBIDO!",
              subtitle: `#${n.order_number || "LF-NUEVO"}`,
              detail: `${n.client_name || "Cliente"} — S/ ${Number(n.total || 0).toFixed(2)}`,
              data: n,
            });
          }
          fetchData(true);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as any;
            addNotification({
              type: "reservation",
              title: "¡NUEVA RESERVA DE MESA!",
              subtitle: n.client_name || "Cliente Reserva",
              detail: `${n.reservation_date || "Fecha"} • ${n.reservation_time || ""} • ${n.guest_count || 1} pers.`,
              data: n,
            });
          }
          fetchData(true);
        }
      )
      .subscribe();

    // 2. Polling silencioso de respaldo cada 5 segundos para garantizar 100% de frescura
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Disparar automáticamente correo de solicitud de reseña de 5 estrellas al marcar como entregado
      const s = (newStatus || "").toLowerCase();
      if (s.includes("entregad") || s.includes("complet") || s.includes("delivered")) {
        const targetOrd = orders.find((o) => o.id === orderId);
        let emailToUse = targetOrd?.client_email || targetOrd?.customer_email || targetOrd?.email;
        let nameToUse = targetOrd?.client_name || targetOrd?.customer_name || targetOrd?.name || "Cliente";

        if (!emailToUse) {
          const { data: dbOrd } = await supabase
            .from("orders")
            .select("client_email, customer_email, email, client_name, customer_name, name")
            .eq("id", orderId)
            .maybeSingle();

          if (dbOrd) {
            emailToUse = dbOrd.client_email || dbOrd.customer_email || dbOrd.email;
            nameToUse = dbOrd.client_name || dbOrd.customer_name || dbOrd.name || nameToUse;
          }
        }

        if (emailToUse && emailToUse.includes("@")) {
          sendReviewRequestEmail({
            name: nameToUse,
            email: emailToUse,
          }).catch((e) => console.warn("Background review request email warning:", e));
        }
      }

      await fetchData();
    } catch (err: any) {
      console.error("Error updating order status:", err);
      alert(`No se pudo actualizar el estado del pedido: ${err?.message || "Revisa la política RLS en Supabase."}`);
    }
  };

  const handleUpdateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", reservationId);

      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      console.error("Error updating reservation status:", err);
      alert(`No se pudo actualizar el estado de la reserva: ${err?.message || "Revisa la política RLS."}`);
    }
  };

  const getNormalizedStatus = (status: string | null | undefined) => {
    if (!status) return "pendiente";
    const s = status.toLowerCase().trim();
    if (s.includes("cocina") || s.includes("preparac") || s.includes("kitchen")) return "en_preparacion";
    if (s.includes("camino") || s.includes("listo") || s.includes("way") || s.includes("pickup")) return "en_camino";
    if (s.includes("entregad") || s.includes("complet") || s.includes("delivered")) return "entregado";
    if (s.includes("cancel") || s.includes("rechaz")) return "cancelado";
    return "pendiente";
  };

  const todayStr = getLocalYYYYMMDD(new Date());

  // Filtered orders list
  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      (ord.order_number || "").toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.client_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.client_phone || "").includes(searchQuery);

    // En modo Kanban, pasamos todas las comandas que coincidan con la búsqueda (el filtrado por fecha solo aplica a entregados dentro del Kanban)
    if (layoutMode === "kanban") {
      return matchSearch;
    }

    const normStatus = getNormalizedStatus(ord.status);
    let matchStatus = false;
    
    if (statusFilter === "all") {
      if (historicalStatusFilter === "all") {
        matchStatus = true;
      } else {
        matchStatus = normStatus === historicalStatusFilter;
      }
    } else {
      matchStatus = normStatus === statusFilter;
    }

    const ordDateStr = ord.created_at ? getLocalYYYYMMDD(new Date(ord.created_at)) : "";
    let matchDate = true;
    
    if (statusFilter === "entregado") {
      matchDate = ordDateStr === todayStr;
    } else if (statusFilter === "all") {
      matchDate = (!orderDateFrom || ordDateStr >= orderDateFrom) &&
                  (!orderDateTo || ordDateStr <= orderDateTo);
    }

    return matchSearch && matchStatus && matchDate;
  });

  // Filtered reservations list
  const filteredReservations = reservations.filter((res) => {
    const matchSearch =
      (res.client_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.client_phone || "").includes(searchQuery) ||
      (res.reservation_date || "").includes(searchQuery);

    const resStatus = (res.status || "pending").toLowerCase().trim();
    const isCancelled = resStatus === "cancelled" || resStatus === "cancelada";
    
    let matchStatus = true;
    if (reservationStatusFilter === "today") {
      // Reservas del día ignora canceladas
      matchStatus = res.reservation_date === todayStr && !isCancelled;
    } else if (reservationStatusFilter === "pendiente") {
      matchStatus = resStatus === "pending" || resStatus === "pendiente";
    } else if (reservationStatusFilter === "confirmada") {
      matchStatus = resStatus === "confirmed" || resStatus === "confirmada";
    } else if (reservationStatusFilter === "completed") {
      matchStatus = resStatus === "completed" || resStatus === "completada" || resStatus === "asistio";
    }

    const matchDateRange =
      (!resDateFrom || res.reservation_date >= resDateFrom) &&
      (!resDateTo || res.reservation_date <= resDateTo);

    return matchSearch && matchStatus && matchDateRange;
  });

  // KPI Calculations
  const todayRevenue = orders
    .filter((o) => {
      if (getNormalizedStatus(o.status) !== "entregado") return false;
      const ordDateStr = o.created_at ? getLocalYYYYMMDD(new Date(o.created_at)) : "";
      return ordDateStr === todayStr;
    })
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const pendingOrders = orders.filter((o) => getNormalizedStatus(o.status) === "pendiente");
  const inKitchenOrders = orders.filter((o) => getNormalizedStatus(o.status) === "en_preparacion");
  const onWayOrders = orders.filter((o) => getNormalizedStatus(o.status) === "en_camino");
  const activeOrdersCount = pendingOrders.length + inKitchenOrders.length + onWayOrders.length;

  const avgWaitMins = (() => {
    const active = [...pendingOrders, ...inKitchenOrders];
    if (active.length === 0) return 0;
    const now = Date.now();
    const totalMins = active.reduce((sum, o) => {
      if (!o.created_at) return sum;
      const created = new Date(o.created_at).getTime();
      return sum + Math.max(0, Math.floor((now - created) / (1000 * 60)));
    }, 0);
    return Math.round(totalMins / active.length);
  })();

  const todayReservationsCount = reservations.filter((r) => {
    const s = (r.status || "").toLowerCase();
    return r.reservation_date === todayStr && s !== "cancelled" && s !== "cancelada";
  }).length;
  const pendingReservationsCount = reservations.filter((r) => {
    const s = (r.status || "pending").toLowerCase();
    return s === "pending" || s === "pendiente";
  }).length;
  const confirmedReservationsCount = reservations.filter((r) => {
    const s = (r.status || "").toLowerCase();
    return s === "confirmed" || s === "confirmada";
  }).length;

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#231A14] pb-20 font-sans selection:bg-[#D4AF37] selection:text-[#2D473C]">
      
      {/* Floating Stacked Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => {
              if (notif.type === "reservation") {
                setViewMode("reservations");
                setReservationStatusFilter("pendiente");
              } else {
                setViewMode("orders");
              }
              setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
            }}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3.5 animate-in slide-in-from-top-4 duration-300 cursor-pointer transition-all hover:scale-102 ${
              notif.type === "order"
                ? "bg-[#1E2E27] text-white border-[#F97316]"
                : "bg-[#17382B] text-white border-[#10B981]"
            }`}
          >
            {/* Ícono distintivo */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                notif.type === "order"
                  ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 animate-bounce"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 animate-bounce"
              }`}
            >
              {notif.type === "order" ? (
                <ShoppingBag size={22} className="text-white" />
              ) : (
                <Calendar size={22} className="text-white" />
              )}
            </div>

            {/* Texto de la comanda/reserva */}
            <div className="flex-1 min-w-0">
              <span
                className={`text-[10px] font-sans font-black uppercase tracking-wider block ${
                  notif.type === "order" ? "text-orange-400" : "text-emerald-300"
                }`}
              >
                {notif.title}
              </span>
              <h4 className="font-serif font-black text-sm text-white truncate">
                {notif.subtitle}
              </h4>
              <p className="text-xs text-gray-300 truncate font-medium mt-0.5">
                {notif.detail}
              </p>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 shrink-0 transition-colors"
              title="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Executive KPI Header */}
        <CashierKPIHeader
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playOrderChime();
          }}
          todayRevenue={todayRevenue}
          activeOrdersCount={activeOrdersCount}
          avgWaitMins={avgWaitMins}
          todayReservationsCount={todayReservationsCount}
        />

        {/* View Mode Switcher Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
          
          {/* Main Module Switcher (Comandas vs Reservas vs Arqueo) */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setViewMode("orders")}
              className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-2 ${
                viewMode === "orders"
                  ? "bg-[#2D473C] text-white shadow-md font-black border border-[#2D473C]"
                  : "text-gray-600 hover:text-[#2D473C] hover:bg-gray-100 font-bold"
              }`}
            >
              <ShoppingBag size={16} className={viewMode === "orders" ? "text-[#D4AF37]" : "text-gray-400"} />
              <span>Comandas & Pedidos ({pendingOrders.length} Pendientes)</span>
            </button>

            <button
              onClick={() => setViewMode("reservations")}
              className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-2 ${
                viewMode === "reservations"
                  ? "bg-[#2D473C] text-white shadow-md font-black border border-[#2D473C]"
                  : "text-gray-600 hover:text-[#2D473C] hover:bg-gray-100 font-bold"
              }`}
            >
              <Calendar size={16} className={viewMode === "reservations" ? "text-[#D4AF37]" : "text-gray-400"} />
              <span>Reservas de Mesas ({todayReservationsCount} Hoy)</span>
            </button>

            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="py-2.5 px-4 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-2 bg-[#D4AF37]/15 text-[#2D473C] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 cursor-pointer shadow-2xs"
            >
              <TrendingUp size={16} className="text-[#2D473C]" />
              <span>Arqueo de Caja</span>
            </button>

            <button
              onClick={() => setIsStockModalOpen(true)}
              className="py-2.5 px-4 rounded-xl text-xs font-sans font-bold transition-all flex items-center justify-center gap-2 bg-[#2D473C]/10 text-[#2D473C] hover:bg-[#2D473C]/20 border border-[#2D473C]/30 cursor-pointer shadow-2xs"
            >
              <PackageX size={16} className="text-[#2D473C]" />
              <span>Control de Stock</span>
            </button>
          </div>

          {/* Layout Switcher (Kanban vs Grid vs List) — Only in Orders view */}
          {viewMode === "orders" && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/80 w-full sm:w-auto justify-center">
              <button
                onClick={() => setLayoutMode("kanban")}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  layoutMode === "kanban"
                    ? "bg-white text-[#2D473C] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Vista Kanban por Columnas"
              >
                <Columns3 size={15} className="text-[#D4AF37]" />
                <span>Kanban</span>
              </button>

              <button
                onClick={() => setLayoutMode("grid")}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  layoutMode === "grid"
                    ? "bg-white text-[#2D473C] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Vista Cuadrícula Táctil"
              >
                <LayoutGrid size={15} className="text-[#5F8575]" />
                <span>Grid</span>
              </button>

              <button
                onClick={() => setLayoutMode("list")}
                className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  layoutMode === "list"
                    ? "bg-white text-[#2D473C] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Vista Lista Compacta"
              >
                <List size={15} className="text-gray-600" />
                <span>Lista</span>
              </button>
            </div>
          )}

        </div>

        {/* ==================================================================== */}
        {/* VISTA 1: COMANDAS Y PEDIDOS */}
        {/* ==================================================================== */}
        {viewMode === "orders" && (
          <>
            {/* Quick Filter Status Tabs for Orders (Shown in Grid / List mode) */}
            {layoutMode !== "kanban" && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                
                <button
                  onClick={() => setStatusFilter("pendiente")}
                  className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                    statusFilter === "pendiente"
                      ? "bg-white text-gray-900 border-t-4 border-t-[#D4AF37] shadow-md font-extrabold scale-[1.01]"
                      : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-500">
                      Pendientes
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === "pendiente" ? "bg-[#D4AF37] text-[#2D473C]" : "bg-amber-100 text-amber-900"
                    }`}>
                      Acción
                    </span>
                  </div>
                  <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-gray-900">
                    {pendingOrders.length}
                  </span>
                  <p className="text-[10px] mt-0.5 font-medium text-gray-500">Por enviar a cocina</p>
                </button>

                <button
                  onClick={() => setStatusFilter("en_preparacion")}
                  className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                    statusFilter === "en_preparacion"
                      ? "bg-white text-gray-900 border-t-4 border-t-blue-500 shadow-md font-extrabold scale-[1.01]"
                      : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-500">
                      En Cocina
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === "en_preparacion" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900"
                    }`}>
                      Cocina
                    </span>
                  </div>
                  <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-gray-900">
                    {inKitchenOrders.length}
                  </span>
                  <p className="text-[10px] mt-0.5 font-medium text-gray-500">En preparación</p>
                </button>

                <button
                  onClick={() => setStatusFilter("en_camino")}
                  className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                    statusFilter === "en_camino"
                      ? "bg-white text-gray-900 border-t-4 border-t-purple-500 shadow-md font-extrabold scale-[1.01]"
                      : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-500">
                      Despacho / Recojo
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === "en_camino" ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-900"
                    }`}>
                      Despacho
                    </span>
                  </div>
                  <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-gray-900">
                    {onWayOrders.length}
                  </span>
                  <p className="text-[10px] mt-0.5 font-medium text-gray-500">Delivery / Recojo</p>
                </button>

                <button
                  onClick={() => setStatusFilter("entregado")}
                  className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                    statusFilter === "entregado"
                      ? "bg-white text-gray-900 border-t-4 border-t-emerald-500 shadow-md font-extrabold scale-[1.01]"
                      : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-500">
                      Entregados Hoy
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === "entregado" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"
                    }`}>
                      Completado
                    </span>
                  </div>
                  <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-gray-900">
                    {orders.filter((o) => getNormalizedStatus(o.status) === "entregado" && (o.created_at ? getLocalYYYYMMDD(new Date(o.created_at)) === todayStr : false)).length}
                  </span>
                  <p className="text-[10px] mt-0.5 font-medium text-gray-500">Total completados hoy</p>
                </button>

                <button
                  onClick={() => setStatusFilter("all")}
                  className={`p-4 rounded-2xl text-left transition-all col-span-2 sm:col-span-1 font-sans ${
                    statusFilter === "all"
                      ? "bg-white text-gray-900 border-t-4 border-t-[#2D473C] shadow-md font-extrabold scale-[1.01]"
                      : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-[#2D473C]">
                      Todos los Pedidos
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statusFilter === "all" ? "bg-[#2D473C] text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      Total
                    </span>
                  </div>
                  <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-[#2D473C]">
                    {orders.length}
                  </span>
                  <p className="text-[10px] mt-0.5 font-medium text-[#5F8575]">Total registrado</p>
                </button>

              </div>
            )}

            {/* Filter Controls Wrapper */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por # de orden, cliente o teléfono..."
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2D473C]"
                    />
                  </div>
                  
                  {statusFilter === "all" && layoutMode !== "kanban" && (
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-serif font-bold text-gray-500 uppercase">Estado:</span>
                        <select
                          value={historicalStatusFilter}
                          onChange={(e) => setHistoricalStatusFilter(e.target.value)}
                          className="text-xs bg-transparent font-semibold text-gray-800 focus:outline-none cursor-pointer"
                        >
                          <option value="all">Todos</option>
                          <option value="pendiente">Pendientes</option>
                          <option value="en_preparacion">En Preparación</option>
                          <option value="en_camino">En Camino / Listo</option>
                          <option value="entregado">Entregados</option>
                          <option value="cancelado">Cancelados</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-serif font-bold text-gray-500 uppercase">Desde:</span>
                        <input
                          type="date"
                          value={orderDateFrom}
                          onChange={(e) => { setOrderDateFrom(e.target.value); setActiveOrderDateFilter("custom"); }}
                          className="text-xs bg-transparent font-semibold text-gray-800 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-serif font-bold text-gray-500 uppercase">Hasta:</span>
                        <input
                          type="date"
                          value={orderDateTo}
                          onChange={(e) => { setOrderDateTo(e.target.value); setActiveOrderDateFilter("custom"); }}
                          className="text-xs bg-transparent font-semibold text-gray-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => fetchData()}
                    disabled={refreshing}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin text-[#2D473C]" : ""} />
                    Actualizar Datos
                  </button>
                </div>
              </div>
            </div>

            {/* Display according to layoutMode */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={28} className="animate-spin text-[#2D473C] mx-auto" />
                <p className="text-sm font-bold text-gray-600">Cargando comandas en tiempo real...</p>
              </div>
            ) : layoutMode === "kanban" ? (
              <CashierKanbanView
                orders={filteredOrders}
                orderItems={orderItems}
                onStatusChange={handleUpdateOrderStatus}
                onViewDetail={(ord) => {
                  setSelectedOrder(ord);
                  setIsDetailModalOpen(true);
                }}
              />
            ) : layoutMode === "list" ? (
              <CashierListView
                orders={filteredOrders}
                orderItems={orderItems}
                onStatusChange={handleUpdateOrderStatus}
                onViewDetail={(ord) => {
                  setSelectedOrder(ord);
                  setIsDetailModalOpen(true);
                }}
              />
            ) : (
              /* Grid Layout Mode */
              filteredOrders.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
                  <UtensilsCrossed size={36} className="text-gray-300 mx-auto mb-3" />
                  <h3 className="font-serif font-bold text-base text-gray-800">No hay comandas en este estado</h3>
                  <p className="text-xs text-gray-500 mt-1">Selecciona otro filtro o realiza una búsqueda diferente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredOrders.map((order) => (
                    <CashierOrderCard
                      key={order.id}
                      order={order}
                      orderItems={orderItems}
                      onStatusChange={handleUpdateOrderStatus}
                      onViewDetail={(ord) => {
                        setSelectedOrder(ord);
                        setIsDetailModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* ==================================================================== */}
        {/* VISTA 2: RESERVAS DE MESAS */}
        {/* ==================================================================== */}
        {viewMode === "reservations" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <button
                onClick={() => setReservationStatusFilter("today")}
                className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                  reservationStatusFilter === "today"
                    ? "bg-white text-gray-900 border-t-4 border-t-[#2D473C] shadow-md font-extrabold scale-[1.01]"
                    : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-[#2D473C]">
                    Reservas del Día
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    reservationStatusFilter === "today" ? "bg-[#2D473C] text-white" : "bg-emerald-100 text-emerald-900"
                  }`}>
                    Hoy
                  </span>
                </div>
                <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-[#2D473C]">
                  {todayReservationsCount}
                </span>
                <p className="text-[10px] mt-0.5 font-medium text-[#5F8575]">Programadas para HOY</p>
              </button>

              <button
                onClick={() => setReservationStatusFilter("pendiente")}
                className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                  reservationStatusFilter === "pendiente"
                    ? "bg-white text-gray-900 border-t-4 border-t-[#D4AF37] shadow-md font-extrabold scale-[1.01]"
                    : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-amber-900">
                    Pendientes
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    reservationStatusFilter === "pendiente" ? "bg-[#D4AF37] text-[#2D473C]" : "bg-amber-100 text-amber-900"
                  }`}>
                    Por Confirmar
                  </span>
                </div>
                <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-amber-950">
                  {pendingReservationsCount}
                </span>
                <p className="text-[10px] mt-0.5 font-medium text-amber-800">Por confirmar WhatsApp</p>
              </button>

              <button
                onClick={() => {
                  setReservationStatusFilter("confirmada");
                  if (!resDateFrom && !resDateTo) setQuickDateRange("month");
                }}
                className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden font-sans ${
                  reservationStatusFilter === "confirmada"
                    ? "bg-white text-gray-900 border-t-4 border-t-blue-500 shadow-md font-extrabold scale-[1.01]"
                    : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-blue-900">
                    Confirmadas
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    reservationStatusFilter === "confirmada" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900"
                  }`}>
                    Confirmado
                  </span>
                </div>
                <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-blue-950">
                  {confirmedReservationsCount}
                </span>
                <p className="text-[10px] mt-0.5 font-medium text-blue-800">Listas para recibir</p>
              </button>

              <button
                onClick={() => {
                  setReservationStatusFilter("all");
                  if (!resDateFrom && !resDateTo) setQuickDateRange("month");
                }}
                className={`p-4 rounded-2xl text-left transition-all font-sans ${
                  reservationStatusFilter === "all"
                    ? "bg-white text-gray-900 border-t-4 border-t-gray-500 shadow-md font-extrabold scale-[1.01]"
                    : "bg-white/70 text-gray-600 border border-transparent hover:bg-white shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-gray-700">
                    Todas / Historial
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    reservationStatusFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    Total
                  </span>
                </div>
                <span className="font-sans text-3xl font-black tracking-tight tabular-nums block mt-2 text-gray-900">
                  {reservations.length}
                </span>
                <p className="text-[10px] mt-0.5 font-medium text-gray-600">Total de reservas</p>
              </button>

            </div>

            {/* Search Bar & Optional Date Range Panel */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar cliente o teléfono..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2D473C]"
                  />
                </div>

                {(reservationStatusFilter === "all" || reservationStatusFilter === "confirmada") && (
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] font-serif font-bold text-gray-500 uppercase">Desde:</span>
                      <input
                        type="date"
                        value={resDateFrom}
                        onChange={(e) => { setResDateFrom(e.target.value); setActiveDateFilter("custom"); }}
                        className="text-xs bg-transparent font-semibold text-gray-800 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] font-serif font-bold text-gray-500 uppercase">Hasta:</span>
                      <input
                        type="date"
                        value={resDateTo}
                        onChange={(e) => { setResDateTo(e.target.value); setActiveDateFilter("custom"); }}
                        className="text-xs bg-transparent font-semibold text-gray-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => fetchData()}
                  disabled={refreshing}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0 w-full lg:w-auto justify-center"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin text-[#2D473C]" : ""} />
                  <span>Actualizar Datos</span>
                </button>
              </div>
            </div>

            {/* Reservations Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={28} className="animate-spin text-[#2D473C] mx-auto" />
                <p className="text-sm font-bold text-gray-600">Cargando reservas en vivo...</p>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
                <Calendar size={36} className="text-gray-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-base text-gray-800">No hay reservas registradas en este filtro</h3>
                <p className="text-xs text-gray-500 mt-1">Selecciona otro filtro de reserva o realiza una búsqueda diferente.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(
                  reservationStatusFilter === "pendiente"
                    ? { "ORDEN_LLEGADA": [...filteredReservations].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()) }
                    : filteredReservations.reduce((acc, res) => {
                        const date = res.reservation_date || "Sin fecha";
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(res);
                        return acc;
                      }, {} as Record<string, typeof filteredReservations>)
                )
                .sort(([dateA], [dateB]) => {
                  if (reservationStatusFilter === "pendiente") return 0;
                  if (dateA === "Sin fecha") return 1;
                  if (dateB === "Sin fecha") return -1;
                  return new Date(dateA).getTime() - new Date(dateB).getTime();
                })
                .map(([dateStr, items]) => {
                  let dateLabel = dateStr;
                  if (dateStr === "ORDEN_LLEGADA") {
                    dateLabel = "Por orden de ingreso";
                  } else if (dateStr !== "Sin fecha") {
                    const [yyyy, mm, dd] = dateStr.split('-');
                    const dateObj = new Date(Number(yyyy), Number(mm)-1, Number(dd));
                    const isToday = dateStr === getLocalYYYYMMDD(new Date());
                    dateLabel = isToday 
                      ? "HOY — " + dateObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
                      : dateObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
                  }
                  return (
                    <div key={dateStr} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="font-serif font-black text-xl text-[#2D473C] uppercase tracking-widest">{dateLabel}</h3>
                        <div className="h-px bg-emerald-200/50 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(items as any[]).map((reservation) => (
                          <CashierReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onStatusChange={handleUpdateReservationStatus}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* Detail & Printable Ticket Modal */}
      <AdminOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleUpdateOrderStatus}
      />

      {/* Arqueo y Cierre de Caja Modal */}
      <CashierAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        orders={orders}
      />

      {/* Control de Stock y Agotados Modal */}
      <CashierStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />

    </div>
  );
}
