import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Calendar,
  X,
  Clock,
  MapPin,
  Users,
  UtensilsCrossed,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Phone,
  Check,
  Edit3,
  Save,
  ArrowLeft,
  CheckCircle2,
  Utensils,
  Truck,
  Package,
} from "lucide-react";
import {
  supabase,
  signOut,
  getUserOrders,
  getUserReservations,
  updateUserProfile,
} from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface CustomerHistoryModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  inline?: boolean;
}

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1;
  return { value: d < 10 ? `0${d}` : `${d}`, label: `${d}` };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => {
  const y = currentYear - 6 - i;
  return { value: `${y}`, label: `${y}` };
});

export function CustomerHistoryModal({ open, onClose, user, inline }: CustomerHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "reservations" | "profile">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<any | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);

  // Estado para edición de perfil
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileBirthDate, setProfileBirthDate] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [initialBirthDate, setInitialBirthDate] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    if (user) {
      const nameVal = user.user_metadata?.full_name || user.user_metadata?.name || "";
      const phoneVal = user.user_metadata?.phone !== undefined && user.user_metadata?.phone !== null
        ? String(user.user_metadata.phone)
        : String(user.phone || "");
      const dateVal = user.user_metadata?.birth_date || "";

      setProfileName(nameVal);
      setInitialName(nameVal);

      setProfilePhone(phoneVal);
      setInitialPhone(phoneVal);

      setProfileBirthDate(dateVal);
      setInitialBirthDate(dateVal);

      setProfileEmail(user.email || "");

      if (dateVal) {
        const parts = dateVal.split("-");
        if (parts.length === 3) {
          setBirthYear(parts[0]);
          setBirthMonth(parts[1]);
          setBirthDay(parts[2]);
        }
      }

      // Cargar datos directamente desde la tabla public.profiles de la BD
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.full_name) setProfileName(data.full_name);
            if (data.phone) setProfilePhone(data.phone);
            if (data.email) setProfileEmail(data.email);
            const bDate = data.birth_date || data.birthdate;
            if (bDate) {
              setProfileBirthDate(bDate);
              const parts = bDate.split("-");
              if (parts.length === 3) {
                setBirthYear(parts[0]);
                setBirthMonth(parts[1]);
                setBirthDay(parts[2]);
              }
            }
          }
        });
    }
  }, [user]);

  const hasChanges =
    activeTab === "profile" &&
    (profileName.trim() !== initialName.trim() ||
      profilePhone.trim() !== initialPhone.trim() ||
      profileBirthDate !== initialBirthDate);

  const handleDateChange = (d: string, m: string, y: string) => {
    setBirthDay(d);
    setBirthMonth(m);
    setBirthYear(y);
    if (d && m && y) {
      setProfileBirthDate(`${y}-${m}-${d}`);
    } else {
      setProfileBirthDate("");
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    if (open) {
      let localOrderIds: string[] = [];
      try {
        localOrderIds = JSON.parse(localStorage.getItem("las_flores_recent_orders") || "[]");
      } catch (e) {
        console.warn("Could not read local recent orders:", e);
      }

      const userId = user?.id;
      const userEmail = user?.email;

      if (userId && loadedUserIdRef.current !== userId) {
        setOrders([]);
        setReservations([]);
        loadedUserIdRef.current = userId;
      }

      const fetchHistory = async () => {
        setLoading(true);
        try {
          const [userOrders, userRes] = await Promise.all([
            getUserOrders(userId, userEmail, localOrderIds),
            getUserReservations(userId, userEmail),
          ]);
          if (!cancelled) {
            setOrders(userOrders);
            setReservations(userRes);
          }
        } catch (e) {
          console.error("Error al cargar historial:", e);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      fetchHistory();
    }

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
    };
  }, [open, user?.id, user?.email]);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    const nameToSave = profileName.trim();
    const phoneToSave = profilePhone.trim();
    const dateToSave = profileBirthDate;

    try {
      const updated = await updateUserProfile({
        full_name: nameToSave,
        phone: phoneToSave,
        birth_date: dateToSave,
      });

      setInitialName(nameToSave);
      setInitialPhone(phoneToSave);
      setInitialBirthDate(dateToSave);

      setProfileMessage({
        type: "success",
        text: "¡Perfil actualizado con éxito!",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("supabase_auth_changed", { detail: updated?.user })
        );
      }
    } catch (err: any) {
      console.error("Error al actualizar perfil:", err);
      setProfileMessage({
        type: "error",
        text: err?.message || "No se pudo actualizar el perfil. Inténtalo de nuevo.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCloseOrAccept = async () => {
    if (hasChanges) {
      await handleSaveProfile();
    }
    setSelectedTrackingOrder(null);
    onClose();
  };

  if (!open || !user) return null;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Cliente";

  const firstName = fullName.split(" ")[0];

  const content = (
      <div className={`doc-legible relative z-10 w-full max-w-[390px] bg-[#f8f4e6] text-nogal rounded-[24px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] shadow-2xl overflow-hidden border border-black/10 flex flex-col shrink-0 ${inline ? "h-full max-w-full shadow-none border-none rounded-none w-full" : "h-[92dvh] sm:h-[calc(100dvh-80px)] sm:max-h-[950px] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"}`}>
        {/* Header & Navbar Pinned Bar */}
        <div className="bg-white shrink-0 border-b border-black/10 shadow-xs z-20">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-black/5">
            <div className="w-8" />

            <img
              src="/images.png"
              alt="Logo Las Flores"
              className="h-9 object-contain drop-shadow-sm scale-[1.25] origin-center"
            />

            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full flex items-center justify-center text-nogal/70 hover:bg-black/5 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation Bar Fixed Tabs */}
          {!selectedTrackingOrder && (
            <div className="grid grid-cols-3 gap-1 p-1.5 bg-gray-100/90 m-3 rounded-2xl border border-black/5">
              <button
                type="button"
                onClick={() => { setActiveTab("orders"); setSelectedTrackingOrder(null); }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === "orders"
                    ? "bg-white text-eucalipto shadow-sm border border-black/5"
                    : "text-black/60 hover:text-black hover:bg-white/50"
                }`}
              >
                <ShoppingBag size={14} />
                <span className="truncate">Pedidos ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("reservations"); setSelectedTrackingOrder(null); }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === "reservations"
                    ? "bg-white text-eucalipto shadow-sm border border-black/5"
                    : "text-black/60 hover:text-black hover:bg-white/50"
                }`}
              >
                <Calendar size={14} />
                <span className="truncate">Reservas ({reservations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("profile"); setSelectedTrackingOrder(null); }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === "profile"
                    ? "bg-white text-eucalipto shadow-sm border border-black/5"
                    : "text-black/60 hover:text-black hover:bg-white/50"
                }`}
              >
                <UserIcon size={14} />
                <span className="truncate">Mi Perfil</span>
              </button>
            </div>
          )}
        </div>

        {/* Contenido de Historial */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {selectedTrackingOrder ? (
            <InlineOrderTracker 
              order={selectedTrackingOrder} 
              onBack={() => setSelectedTrackingOrder(null)} 
            />
          ) : loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw size={24} className="animate-spin text-eucalipto mx-auto" />
              <p className="text-xs font-bold text-black/50 uppercase tracking-widest">
                Cargando tu historial...
              </p>
            </div>
          ) : activeTab === "orders" ? (
            orders.length === 0 ? (
              <div className="py-16 text-center px-6 bg-white/70 rounded-2xl border border-black/5">
                <UtensilsCrossed size={32} className="text-black/30 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-base text-nogal mb-1">
                  Aún no tienes pedidos registrados
                </h4>
                <p className="text-xs text-black/50 leading-relaxed">
                  Realiza tu primer pedido desde nuestra carta digital y lo verás reflejado aquí.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs space-y-3 hover:border-eucalipto/30 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                    <div>
                      <span className="font-serif font-bold text-sm text-nogal block">
                        #{order.order_number}
                      </span>
                      <span className="text-xs text-black/45 block">
                        {new Date(order.created_at).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Lista de ítems */}
                  <div className="space-y-1 text-xs text-black/75">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="truncate pr-2">
                          {item.quantity}× {item.product_name}
                        </span>
                        <span className="font-bold text-nogal/90">
                          S/ {item.subtotal?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-black/55 capitalize">
                      {order.order_type === "delivery" ? (
                        <>
                          <MapPin size={14} className="text-eucalipto" />
                          <span>Delivery</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} className="text-nogal/50" />
                          <span>Recojo en local</span>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-black/45 block uppercase">Total</span>
                      <span className="font-serif font-bold text-sm text-eucalipto">
                        S/ {order.total?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botón de rastreo integrado dentro del modal */}
                  {order.order_type === "delivery" &&
                    !["entregado", "delivered", "cancelado", "cancelled"].includes(
                      (order.status || "").toLowerCase().trim()
                    ) && (
                      <div className="pt-3">
                        <button 
                          type="button"
                          onClick={() => setSelectedTrackingOrder(order)}
                          className="w-full py-2.5 bg-eucalipto hover:bg-eucalipto/90 text-piedra rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <MapPin size={14} />
                          Rastrear Pedido en Vivo
                        </button>
                      </div>
                  )}
                </div>
              ))
            )
          ) : activeTab === "reservations" ? (
            reservations.length === 0 ? (
              <div className="py-16 text-center px-6 bg-white/70 rounded-2xl border border-black/5">
                <Calendar size={32} className="text-black/30 mx-auto mb-3" />
                <h4 className="font-serif font-bold text-base text-nogal mb-1">
                  No tienes reservas agendadas
                </h4>
                <p className="text-xs text-black/50 leading-relaxed">
                  Reserva tu mesa con anticipación para disfrutar de nuestra experiencia culinaria.
                </p>
              </div>
            ) : (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl p-4 border border-black/5 shadow-xs space-y-3 hover:border-eucalipto/30 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-eucalipto/10 text-eucalipto flex items-center justify-center font-bold text-xs">
                        <Users size={14} />
                      </div>
                      <div>
                        <span className="font-serif font-bold text-sm text-nogal block">
                          {res.guest_count} {res.guest_count === 1 ? "Comensal" : "Comensales"}
                        </span>
                        <span className="text-xs text-black/45 capitalize block">
                          {res.service_type}
                        </span>
                      </div>
                    </div>

                    <ReservationStatusBadge status={res.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-black/75">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-eucalipto/70" />
                      <span>{res.reservation_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-eucalipto/70" />
                      <span>{res.reservation_time}</span>
                    </div>
                  </div>

                  {res.table_number && (
                    <div className="p-2 bg-piedra rounded-xl border border-eucalipto/10 text-xs font-bold text-eucalipto flex items-center gap-1.5">
                      <MapPin size={13} />
                      <span>Mesa asignada: {res.table_number}</span>
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 py-1">
              <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                  <h4 className="font-serif font-bold text-base text-nogal flex items-center gap-2">
                    <UserIcon size={18} className="text-eucalipto" />
                    <span>Datos del Cliente</span>
                  </h4>
                  <span className="text-xs text-eucalipto font-bold bg-eucalipto/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Información Oficial
                  </span>
                </div>

                <p className="text-xs text-black/60 leading-relaxed">
                  Completa tu información para agilizar tus pedidos y reservas.
                </p>

                {profileMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      profileMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {profileMessage.type === "success" && <Check size={16} />}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Ej: Luis Llocclla"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-eucalipto/30 focus:border-eucalipto bg-white font-medium text-nogal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-1">
                    Teléfono / WhatsApp de Contacto
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Ej: 987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-eucalipto/30 focus:border-eucalipto bg-white font-medium text-nogal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={birthDay}
                      onChange={(e) => handleDateChange(e.target.value, birthMonth, birthYear)}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-eucalipto/30 focus:border-eucalipto bg-white font-medium text-nogal cursor-pointer"
                    >
                      <option value="">Día</option>
                      {DAYS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={birthMonth}
                      onChange={(e) => handleDateChange(birthDay, e.target.value, birthYear)}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-eucalipto/30 focus:border-eucalipto bg-white font-medium text-nogal cursor-pointer"
                    >
                      <option value="">Mes</option>
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={birthYear}
                      onChange={(e) => handleDateChange(birthDay, birthMonth, e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-eucalipto/30 focus:border-eucalipto bg-white font-medium text-nogal cursor-pointer"
                    >
                      <option value="">Año</option>
                      {YEARS.map((y) => (
                        <option key={y.value} value={y.value}>
                          {y.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/45 mb-1">
                    Correo Electrónico (Asociado a tu cuenta)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileEmail || user?.email || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-xs bg-black/5 text-black/50 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer dinámico */}
        <div className="p-4 md:px-5 bg-white border-t border-black/5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseOrAccept}
            className="flex items-center gap-2.5 text-nogal hover:text-eucalipto transition-colors font-bold text-sm"
          >
            <div className="w-8 h-8 rounded-full border border-nogal/20 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            Volver
          </button>

          {activeTab === "profile" && !selectedTrackingOrder && (
            hasChanges ? (
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                disabled={savingProfile}
                className="py-2.5 px-5 rounded-xl bg-eucalipto text-piedra text-xs font-bold uppercase tracking-wider hover:bg-eucalipto/90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 ml-auto"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-eucalipto text-piedra text-xs font-bold uppercase tracking-wider hover:bg-eucalipto/90 transition-all shadow-xs ml-auto"
              >
                Aceptar
              </button>
            )
          )}
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-start sm:pt-2 p-4 md:p-0 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-eucalipto/75 backdrop-blur-sm" onClick={handleCloseOrAccept} />
      {content}
    </div>
  );
}

// Subcomponente de Seguimiento en Vivo Integrado en Modal
function InlineOrderTracker({ order, onBack }: { order: any; onBack: () => void }) {
  const [currentStatus, setCurrentStatus] = useState<string>(order.status || "pendiente");

  useEffect(() => {
    // Suscripción Realtime a cambios en la tabla 'orders'
    const subscription = supabase
      .channel(`modal_order_sync_${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            setCurrentStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    // Suscripción Realtime a eventos Broadcast del motorizado
    const broadcastChannel = supabase.channel(`delivery_tracking_${order.id}`);
    broadcastChannel
      .on("broadcast", { event: "status_update" }, (payload: any) => {
        if (payload?.payload?.status) {
          const s = payload.payload.status;
          if (s === "to_customer") setCurrentStatus("en_camino");
          else if (s === "delivered") setCurrentStatus("entregado");
          else if (s === "to_restaurant") setCurrentStatus("en_preparacion");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(broadcastChannel);
    };
  }, [order.id]);

  const norm = (currentStatus || "").toLowerCase().trim();
  const isDelivered = norm.includes("entregad") || norm.includes("delivered") || norm.includes("complet");
  const isOnWay = norm.includes("camino") || norm.includes("listo") || norm.includes("to_customer");
  const isKitchen = norm.includes("preparac") || norm.includes("cocina") || norm.includes("to_restaurant");

  let activeStep = 1;
  if (isDelivered) activeStep = 4;
  else if (isOnWay) activeStep = 3;
  else if (isKitchen) activeStep = 2;

  const steps = [
    { num: 1, title: "Comanda Registrada", desc: "Comanda registrada en caja Las Flores.", icon: Package },
    { num: 2, title: "En Cocina", desc: "Nuestros chefs están preparando tu orden.", icon: Utensils },
    { num: 3, title: "Repartidor en Camino", desc: "Tu motorizado ya tiene tu paquete y se dirige a tu domicilio.", icon: Truck },
    { num: 4, title: "Entregado", desc: "¡Pedido completado con éxito! Buen provecho.", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-black/10 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-eucalipto hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Volver a Mis Pedidos</span>
        </button>
        <span className="font-serif font-bold text-xs text-nogal">
          #{order.order_number}
        </span>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold tracking-widest text-nogal/50">
            Seguimiento en Vivo
          </span>
          <span className="text-xs uppercase font-bold px-2.5 py-0.5 bg-eucalipto/10 text-eucalipto rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-eucalipto animate-ping" />
            En Tiempo Real
          </span>
        </div>

        {/* Timeline */}
        <div className="relative pl-6 border-l-2 border-nogal/15 space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.num < activeStep;
            const isCurrent = step.num === activeStep;

            return (
              <div key={step.num} className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-[29px] top-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? "bg-eucalipto text-white"
                      : isCurrent
                      ? "bg-nogal text-chilca shadow-md ring-2 ring-eucalipto/30 scale-110"
                      : "bg-piedra text-nogal/40 border border-nogal/20"
                  }`}
                >
                  {isCompleted ? <Check size={13} /> : <Icon size={13} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-bold ${isCurrent ? "text-nogal font-black" : isCompleted ? "text-eucalipto" : "text-nogal/40"}`}>
                      {step.title}
                    </h4>
                    {isCurrent && (
                      <span className="text-xs uppercase font-extrabold px-1.5 py-0.2 bg-nogal text-chilca rounded animate-pulse">
                        En Proceso
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 leading-snug ${isCurrent ? "text-nogal/80 font-medium" : "text-nogal/45"}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-black/5 flex flex-col gap-3">
          <div>
            <span className="text-xs uppercase font-bold text-nogal/40 block">Destino Registrado:</span>
            <span className="text-xs font-bold text-nogal">{order.address || "Dirección registrada"}</span>
            {order.reference && (
              <span className="text-xs text-nogal/50 block italic mt-0.5">Ref: {order.reference}</span>
            )}
          </div>

          <a
            href={`https://wa.me/51980723422?text=${encodeURIComponent(`Hola Las Flores, tengo una consulta sobre mi pedido #${order.order_number || order.id}`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-1"
          >
            <Phone size={15} />
            <span>Contactar Soporte por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase().trim();
  const map: Record<string, { label: string; bg: string; text: string }> = {
    pendiente: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-800" },
    received: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-800" },
    en_preparacion: { label: "En Cocina", bg: "bg-blue-100", text: "text-blue-800" },
    preparing: { label: "En Cocina", bg: "bg-blue-100", text: "text-blue-800" },
    en_camino: { label: "En Camino", bg: "bg-purple-100", text: "text-purple-800" },
    on_the_way: { label: "En Camino", bg: "bg-purple-100", text: "text-purple-800" },
    entregado: { label: "Entregado", bg: "bg-emerald-100", text: "text-emerald-800" },
    delivered: { label: "Entregado", bg: "bg-emerald-100", text: "text-emerald-800" },
    cancelado: { label: "Cancelado", bg: "bg-red-100", text: "text-red-800" },
    cancelled: { label: "Cancelado", bg: "bg-red-100", text: "text-red-800" },
  };

  const style = map[norm] || { label: status, bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function ReservationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    confirmed: { label: "Confirmada", bg: "bg-emerald-100", text: "text-emerald-800" },
    pending: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-800" },
    completed: { label: "Completada", bg: "bg-blue-100", text: "text-blue-800" },
    cancelled: { label: "Cancelada", bg: "bg-red-100", text: "text-red-800" },
  };

  const style = map[status] || { label: status, bg: "bg-gray-100", text: "text-gray-800" };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
