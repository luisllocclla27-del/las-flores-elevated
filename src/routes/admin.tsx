import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, signOut } from "../lib/supabase";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Ticket,
  Briefcase,
  Store,
  Calendar,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Check,
  X,
  Filter,
} from "lucide-react";

import { AdminOrderDetailModal } from "../components/AdminOrderDetailModal";
import { AdminProductModal } from "../components/AdminProductModal";
import { AdminCouponModal } from "../components/AdminCouponModal";
import { AdminCategoryListModal } from "../components/AdminCategoryListModal";
import { AdminAnalyticsSection } from "../components/AdminAnalyticsSection";
import { AdminJobsSection } from "../components/AdminJobsSection";
import { AdminZonesSection } from "../components/AdminZonesSection";
import { AdminComplaintsSection } from "../components/AdminComplaintsSection";
import { AdminSidebar, AdminTab } from "../components/AdminSidebar";
import { removeProductById } from "../utils/adminProducts";

const getLocalYYYYMMDD = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [applicationsCount, setApplicationsCount] = useState<number>(0);
  const [complaintsCount, setComplaintsCount] = useState<number>(0);

  // Search & Filter states
  const [resSearch, setResSearch] = useState("");
  const [resStatusFilter, setResStatusFilter] = useState("all");
  const [resDateFrom, setResDateFrom] = useState<string>("");
  const [resDateTo, setResDateTo] = useState<string>("");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderDateFrom, setOrderDateFrom] = useState<string>("");
  const [orderDateTo, setOrderDateTo] = useState<string>("");

  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState("all");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();

    const channel = supabase
      .channel("admin-realtime-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "coupons" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = "/restaurante";
        return;
      }

      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        window.location.href = "/restaurante";
        return;
      }

      setIsAuthorized(true);
      await fetchData();
    } catch (error) {
      console.error("Error checking auth:", error);
      window.location.href = "/restaurante";
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Limitar a los últimos 30 días para Admin (vista más amplia que Caja)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString();

      // 1. Reservations
      const { data: resData } = await supabase
        .from("reservations")
        .select("*")
        .gte("created_at", dateFilter)
        .order("reservation_date", { ascending: false })
        .limit(300);
      if (resData) setReservations(resData);

      // 2. Orders
      const { data: ordData } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", dateFilter)
      if (ordData) {
        setOrders(ordData);
        if (ordData.length > 0) {
          const orderIds = ordData.map((o: any) => o.id);
          const { data: itemsData } = await supabase
            .from("order_items")
            .select("*, products(name, image_url)")
            .in("order_id", orderIds);
          if (itemsData) setOrderItems(itemsData);
        } else {
          setOrderItems([]);
        }
      }

      // 4. Products
      const { data: prodData } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("category_id", { ascending: true })
        .order("sort_order", { ascending: true });
      if (prodData) setProducts(prodData);

      // 5. Categories
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (catData) setCategories(catData);

      // 6. Coupons
      const { data: coupData } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (coupData) setCoupons(coupData);

      // 7. Job Applications Count
      const { count: jobAppsCount } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true });
      if (jobAppsCount !== null && jobAppsCount !== undefined) {
        setApplicationsCount(jobAppsCount);
      }

      // 8. Complaints Count (Pending)
      const { count: pendingComplaints } = await supabase
        .from("complaints")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (pendingComplaints !== null && pendingComplaints !== undefined) {
        setComplaintsCount(pendingComplaints);
      }

    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/restaurante";
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar estado del pedido.");
    }
  };

  const handleUpdateReservationStatus = async (resId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("reservations").update({ status: newStatus }).eq("id", resId);
      if (error) throw error;
      setReservations((prev) => prev.map((r) => (r.id === resId ? { ...r, status: newStatus } : r)));
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la reserva.");
    }
  };

  const handleToggleProductAvailability = async (productId: string, currentAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_available: !currentAvailable })
        .eq("id", productId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, is_available: !currentAvailable } : p)));
    } catch (err) {
      console.error(err);
      alert("Error al cambiar disponibilidad.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find((product) => product.id === productId);
    if (!productToDelete) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar permanentemente el plato "${productToDelete.name}" de la carta?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;

      setProducts((prev) => removeProductById(prev, productId));

      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
      if (isProductModalOpen) {
        setIsProductModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el plato.");
    }
  };

  // Filtered lists
  const filteredReservations = reservations.filter((res) => {
    const matchSearch =
      (res.client_name || "").toLowerCase().includes(resSearch.toLowerCase()) ||
      (res.client_phone || "").includes(resSearch);
    const matchStatus = resStatusFilter === "all" || res.status === resStatusFilter;

    const matchDateRange =
      (!resDateFrom || res.reservation_date >= resDateFrom) &&
      (!resDateTo || res.reservation_date <= resDateTo);

    return matchSearch && matchStatus && matchDateRange;
  });

  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      (ord.order_number || "").toString().includes(orderSearch) ||
      (ord.client_name || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
      (ord.client_phone || "").includes(orderSearch);
    const matchStatus = orderStatusFilter === "all" || ord.status === orderStatusFilter;

    const ordDate = ord.created_at ? getLocalYYYYMMDD(new Date(ord.created_at)) : "";
    const matchDateRange =
      (!orderDateFrom || ordDate >= orderDateFrom) &&
      (!orderDateTo || ordDate <= orderDateTo);

    return matchSearch && matchStatus && matchDateRange;
  });

  const filteredProducts = products.filter((prod) => {
    const matchSearch = (prod.name || "").toLowerCase().includes(menuSearch.toLowerCase());
    const matchCategory = menuCategoryFilter === "all" || prod.category_id === menuCategoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F3] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <RefreshCw size={32} className="animate-spin text-[#2D473C] mx-auto" />
          <p className="text-sm font-bold text-gray-700">Cargando Suite de Administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-legible min-h-screen bg-[#F9F8F3] flex font-sans selection:bg-[#D4AF37] selection:text-[#2D473C]">
      
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        applicationsCount={applicationsCount}
        complaintsCount={complaintsCount}
        onSignOut={handleSignOut}
        userEmail={userEmail}
      />

      {/* Main Command Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Upper Command Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          <div>
            <h1 className="font-serif text-xl font-black text-[#2D473C] flex items-center gap-2">
              Panel de Administración
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                REALTIME
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Bienvenido de nuevo, <strong className="text-gray-800 font-bold">{userEmail || "Administrador"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-extrabold flex items-center gap-2 transition-colors disabled:opacity-50"
              title="Actualizar Datos en Vivo"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-[#2D473C]" : ""} />
              <span>Actualizar</span>
            </button>

            <Link
              to="/caja"
              className="px-4 py-2 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-white text-xs font-black flex items-center gap-2 transition-all shadow-2xs active:scale-98"
            >
              <ShoppingBag size={15} className="text-[#D4AF37]" />
              <span>Ir a Panel de Caja</span>
            </Link>

            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29e2f] text-[#2D473C] text-xs font-black flex items-center gap-2 transition-all shadow-2xs active:scale-98"
            >
              <Plus size={16} />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </header>

        {/* Content Body Area */}
        <main className="p-6 space-y-6 flex-1">
          
          {/* ================= ANALYTICS TAB ================= */}
          {activeTab === "analytics" && (
            <AdminAnalyticsSection
              orders={orders}
              orderItems={orderItems}
              products={products}
              reservations={reservations}
            />
          )}

          {/* ================= ORDERS TAB ================= */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar por # de orden, cliente..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2D473C]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="received">Recibidos</option>
                    <option value="preparing">En Cocina</option>
                    <option value="on_the_way">En Camino</option>
                    <option value="delivered">Entregados</option>
                    <option value="cancelled">Cancelados</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#2D473C] text-white uppercase text-xs font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-4">N° Orden</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          No hay comandas registradas que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-black text-gray-900">
                            #{ord.order_number || ord.id?.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-800">
                            {ord.client_name || "Cliente"}
                            <span className="block text-xs text-gray-400 font-normal">{ord.client_phone}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold uppercase text-xs text-gray-700">
                            {ord.order_type === "delivery" ? "Delivery" : "Recojo"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 font-medium">
                            {ord.created_at ? new Date(ord.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </td>
                          <td className="py-3 px-4 uppercase font-bold text-xs text-gray-800">
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 inline-block">
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-[#2D473C] text-sm tabular-nums">
                            S/ {Number(ord.total || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrder(ord);
                                setIsOrderModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                              title="Ver Detalle"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= RESERVATIONS TAB ================= */}
          {activeTab === "reservations" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    placeholder="Buscar comensal o teléfono..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2D473C]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select
                    value={resStatusFilter}
                    onChange={(e) => setResStatusFilter(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-bold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todas las Reservas</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                </div>
              </div>

              {/* Reservations Table */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#2D473C] text-white uppercase text-xs font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Comensal</th>
                      <th className="py-3 px-4">Fecha & Hora</th>
                      <th className="py-3 px-4">Personas</th>
                      <th className="py-3 px-4">Mesa / Zona</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                          No hay reservas registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((res) => (
                        <tr key={res.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {res.client_name || "Cliente Reserva"}
                            <span className="block text-xs text-gray-400 font-normal">{res.client_phone}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-semibold">
                            {res.reservation_date} — {res.reservation_time || "Hora por fijar"}
                          </td>
                          <td className="py-3 px-4 font-black text-[#2D473C]">
                            {res.guest_count || 1} personas
                          </td>
                          <td className="py-3 px-4 text-gray-600 font-medium">
                            {res.table_number || res.zone_id || "Aleatoria"}
                          </td>
                          <td className="py-3 px-4 uppercase font-bold text-xs">
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 inline-block">
                              {res.status || "pending"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {res.status !== "confirmed" && res.status !== "completed" && (
                                <button
                                  onClick={() => handleUpdateReservationStatus(res.id, "confirmed")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                                >
                                  Confirmar
                                </button>
                              )}
                              {res.status !== "cancelled" && (
                                <button
                                  onClick={() => handleUpdateReservationStatus(res.id, "cancelled")}
                                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 rounded-lg font-bold text-xs"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MENU & PRODUCTS TAB ================= */}
          {activeTab === "menu" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Buscar plato o bebida..."
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2D473C]"
                    />
                  </div>

                  <select
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-bold text-gray-800 focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">Todas las Categorías</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                  >
                    Gestionar Categorías
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-white text-xs font-black flex items-center gap-2 shadow-2xs"
                  >
                    <Plus size={15} />
                    <span>Agregar Plato</span>
                  </button>
                </div>
              </div>

              {/* High-Resolution Executive Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Image Header */}
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <UtensilsCrossed size={36} />
                        </div>
                      )}

                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-black uppercase shadow-xs ${
                        product.is_available ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      }`}>
                        {product.is_available ? "En Stock" : "Agotado"}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-2 flex-1">
                      <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                        {product.categories?.name || "Sin categoría"}
                      </span>
                      <h4 className="font-serif font-bold text-base text-gray-900 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {product.description || "Sin descripción"}
                      </p>
                    </div>

                    {/* Price & Actions Footer */}
                    <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="font-sans font-black text-lg text-[#2D473C] tabular-nums">
                        S/ {Number(product.price || 0).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleProductAvailability(product.id, product.is_available)}
                          className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                            product.is_available
                              ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-900"
                              : "bg-red-100 hover:bg-red-200 text-red-900"
                          }`}
                          title="Alternar disponibilidad de stock"
                        >
                          {product.is_available ? <Check size={15} /> : <X size={15} />}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsProductModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                          title="Editar plato"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                          title="Eliminar plato"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= COUPONS TAB ================= */}
          {activeTab === "coupons" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-black text-lg text-[#2D473C]">Cupones & Códigos Promocionales</h3>
                  <p className="text-xs text-gray-500">Gestión de descuentos y promociones especiales</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedCoupon(null);
                    setIsCouponModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-white text-xs font-black flex items-center gap-2 shadow-2xs"
                >
                  <Plus size={15} />
                  <span>Crear Cupón</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-base text-[#2D473C] bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                        {coupon.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        coupon.is_active ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
                      }`}>
                        {coupon.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Descuento: <strong className="text-gray-900 font-bold">{coupon.discount_percentage}%</strong></p>
                      <p>Usos acumulados: <strong className="text-gray-900 font-bold">{coupon.used_count || 0}</strong></p>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setIsCouponModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold flex items-center gap-1"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= JOBS TAB ================= */}
          {activeTab === "jobs" && <AdminJobsSection />}

          {/* ================= COMPLAINTS TAB (LIBRO DE RECLAMACIONES) ================= */}
          {activeTab === "complaints" && (
            <AdminComplaintsSection onPendingCountChange={(cnt) => setComplaintsCount(cnt)} />
          )}

          {/* ================= ZONES TAB ================= */}
          {activeTab === "zones" && <AdminZonesSection />}

        </main>
      </div>

      {/* Modales Secundarios */}
      <AdminOrderDetailModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleUpdateOrderStatus}
      />

      <AdminProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        categories={categories}
        onSave={fetchData}
      />

      <AdminCouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupon={selectedCoupon}
        onSave={fetchData}
      />

      <AdminCategoryListModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={fetchData}
      />

    </div>
  );
}
