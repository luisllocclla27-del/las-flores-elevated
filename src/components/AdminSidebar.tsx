import {
  BarChart3,
  ShoppingBag,
  Calendar,
  UtensilsCrossed,
  Ticket,
  Briefcase,
  Store,
  BookOpen,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export type AdminTab = "analytics" | "orders" | "reservations" | "menu" | "coupons" | "jobs" | "zones" | "complaints";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  applicationsCount: number;
  complaintsCount?: number;
  onSignOut: () => void;
  userEmail?: string;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  applicationsCount,
  complaintsCount = 0,
  onSignOut,
  userEmail,
}: AdminSidebarProps) {
  const menuItems = [
    { id: "analytics" as AdminTab, label: "Analítica & KPIs", icon: BarChart3 },
    { id: "orders" as AdminTab, label: "Comandas & Ventas", icon: ShoppingBag },
    { id: "reservations" as AdminTab, label: "Reservas de Mesas", icon: Calendar },
    { id: "menu" as AdminTab, label: "Carta & Productos", icon: UtensilsCrossed },
    { id: "coupons" as AdminTab, label: "Cupones Promocionales", icon: Ticket },
    { id: "jobs" as AdminTab, label: "Bolsa de Trabajo", icon: Briefcase, badge: applicationsCount },
    { id: "complaints" as AdminTab, label: "Libro de Reclamaciones", icon: BookOpen, badge: complaintsCount },
    { id: "zones" as AdminTab, label: "Zonas & Mesas", icon: Store },
  ];

  return (
    <aside className="w-64 bg-[#2D473C] text-[#F9F8F3] flex flex-col justify-between h-screen sticky top-0 border-r border-[#D4AF37]/30 shrink-0 font-sans shadow-xl z-40">
      {/* Brand Header & Nav Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none]">
        <div className="p-5 border-b border-emerald-900/60 flex items-center gap-3 sticky top-0 bg-[#2D473C] z-10">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border-2 border-[#D4AF37] shadow-md shrink-0">
            <img src="/favicon.png" alt="Las Flores" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <h2 className="font-serif font-black text-base text-white tracking-tight flex items-center gap-1.5">
              Las Flores
              <ShieldCheck size={14} className="text-[#D4AF37]" />
            </h2>
            <span className="text-xs font-sans uppercase font-extrabold text-emerald-200/80 tracking-wider block mt-0.5">
              Suite de Administración
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <span className="text-xs font-sans font-extrabold uppercase tracking-wider text-emerald-300/70 px-3 block mb-2 mt-1">
            Navegación Principal
          </span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full py-3 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                  isActive
                    ? "bg-[#D4AF37] text-[#2D473C] font-black shadow-md scale-[1.01]"
                    : "text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className={isActive ? "text-[#2D473C]" : "text-emerald-300 group-hover:text-white"} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black ${
                      isActive ? "bg-[#2D473C] text-white" : "bg-emerald-400 text-[#2D473C]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && <ChevronRight size={14} className="text-[#2D473C]" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout (Pinned to bottom of viewport) */}
      <div className="p-4 border-t border-emerald-900/60 bg-black/25 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <span className="text-xs uppercase font-extrabold text-emerald-300/80 block">Sesión Activa</span>
            <p className="font-bold text-white truncate text-xs">{userEmail || "Administrador"}</p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="w-full py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-2xs active:scale-98"
        >
          <LogOut size={15} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
