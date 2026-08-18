import { useState, useEffect } from "react";
import type { RestaurantZone, ZoneBlackout } from "../features/zones/types";
import { listRestaurantZones, listZoneBlackouts, toggleBlackoutStatus } from "../features/zones/api";
import { AdminZoneModal } from "./AdminZoneModal";
import { AdminBlackoutModal } from "./AdminBlackoutModal";
import { LayoutGrid, ShieldAlert, Power, Edit3, Users, RefreshCw, Loader2, AlertCircle, MapPin, Clock } from "lucide-react";

export function AdminZonesSection() {
  const [zones, setZones] = useState<RestaurantZone[]>([]);
  const [blackouts, setBlackouts] = useState<ZoneBlackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"zones" | "blackouts">("zones");

  const [selectedZoneToEdit, setSelectedZoneToEdit] = useState<RestaurantZone | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [zData, bData] = await Promise.all([
        listRestaurantZones(),
        listZoneBlackouts(),
      ]);
      setZones(zData);
      setBlackouts(bData);
    } catch (err: any) {
      console.error(err);
      setError("No se pudieron cargar las zonas y bloqueos. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlackout = async (id: string, currentStatus: boolean) => {
    try {
      await toggleBlackoutStatus(id, !currentStatus);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Error al cambiar el estado del apagado.");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-ink/60 space-y-3">
        <Loader2 size={32} className="animate-spin mx-auto text-eucalipto" />
        <p className="text-sm font-semibold">Cargando salones y configuración de apagado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto" />
        <p className="text-sm font-bold">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const activeBlackoutsCount = blackouts.filter((b) => b.is_active).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-[#d4a373]/25 shadow-sm">
        <div>
          <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[#d4a373] block">
            Gestión del Establecimiento
          </span>
          <h2 className="font-serif italic text-2xl font-bold text-[#3b1f10]">
            Salones & Apagado de Reservas
          </h2>
          <p className="text-xs text-[#3b1f10]/60 mt-1 max-w-2xl font-sans">
            Administra la configuración de fotos, aforo y mesas por salón. Bloquea la entrada de reservas por teléfono o eventos especiales para evitar cruces.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsBlackoutModalOpen(true)}
            className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-[#8C1D40] hover:bg-[#721733] text-white font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border border-[#8C1D40]"
          >
            <Power size={16} />
            <span>Apagar Zona / Local</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-[#f7f5ef] hover:bg-[#fdf8f0] text-[#3b1f10] border border-[#d4a373]/30 transition-colors shadow-xs cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw size={16} className="text-[#2e5339]" />
          </button>
        </div>
      </div>

      <div className="flex border border-[#d4a373]/25 bg-[#f7f5ef] p-1 rounded-2xl max-w-md shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSubTab("zones")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "zones"
              ? "bg-[#2e5339] text-white shadow-xs"
              : "text-[#3b1f10]/60 hover:text-[#3b1f10]"
          }`}
        >
          <LayoutGrid size={15} />
          <span>Salones del Local ({zones.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("blackouts")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "blackouts"
              ? "bg-[#8C1D40] text-white shadow-xs"
              : "text-[#3b1f10]/60 hover:text-[#3b1f10]"
          }`}
        >
          <Power size={15} />
          <span>Bloqueos / Apagados ({activeBlackoutsCount})</span>
        </button>
      </div>

      {activeSubTab === "zones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white rounded-3xl border border-[#d4a373]/25 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full bg-[#f7f5ef] overflow-hidden">
                  {zone.image_url ? (
                    <img
                      src={zone.image_url}
                      alt={zone.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#3b1f10]/40 font-bold text-xs">
                      Sin foto asignada
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-[#3b1f10]/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                    {zone.max_tables_count} Mesas
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-xl text-[#3b1f10]">{zone.name}</h3>
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                      style={{ backgroundColor: zone.color }}
                      title={`Color identificador: ${zone.color}`}
                    />
                  </div>

                  <p className="text-xs text-[#3b1f10]/70 leading-relaxed min-h-[36px]">
                    {zone.description || "Sin descripción asignada."}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-[#d4a373]/15 text-[#3b1f10]/80">
                    <span className="flex items-center gap-1.5 font-semibold text-[#2e5339]">
                      <Users size={15} />
                      <span>Aforo: {zone.max_capacity_persons} pers.</span>
                    </span>

                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        zone.is_active
                          ? "bg-emerald-50 text-[#2e5339] border-emerald-200"
                          : "bg-red-50 text-[#8C1D40] border-red-200"
                      }`}
                    >
                      {zone.is_active ? "HABILITADO" : "DESHABILITADO"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#f7f5ef]/50 border-t border-[#d4a373]/20">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedZoneToEdit(zone);
                    setIsZoneModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-white border border-[#d4a373]/30 hover:bg-[#2e5339] hover:text-white hover:border-[#2e5339] text-[#3b1f10] font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 size={14} className="text-[#2e5339] group-hover:text-white" />
                  <span>Editar Foto y Datos</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === "blackouts" && (
        <div className="bg-white rounded-3xl border border-[#d4a373]/25 shadow-sm overflow-hidden">
          <div className="p-5 bg-[#f7f5ef] border-b border-[#d4a373]/20 flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#3b1f10]">Historial de Apagados y Bloqueos</h3>
            <span className="text-xs text-[#3b1f10]/60 font-semibold">
              Total registrados: {blackouts.length}
            </span>
          </div>

          {blackouts.length === 0 ? (
            <div className="p-12 text-center text-[#3b1f10]/50 space-y-3">
              <ShieldAlert size={40} className="mx-auto text-[#d4a373]" />
              <p className="text-sm font-bold text-[#3b1f10]">No hay apagados o bloqueos registrados.</p>
              <p className="text-xs text-[#3b1f10]/60">
                Las reservas públicas están funcionando normalmente en todas las zonas del restaurante.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f5ef] text-[#3b1f10]/60 font-serif font-bold uppercase tracking-wider border-b border-[#d4a373]/20">
                  <tr>
                    <th className="py-4 px-5">Zona / Ámbito</th>
                    <th className="py-4 px-5">Tipo Bloqueo</th>
                    <th className="py-4 px-5">Fecha / Horario</th>
                    <th className="py-4 px-5">Motivo</th>
                    <th className="py-4 px-5">Estado</th>
                    <th className="py-4 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4a373]/15">
                  {blackouts.map((b) => (
                    <tr key={b.id} className="hover:bg-[#fdf8f0]/80 transition-colors">
                      <td className="py-4 px-5 font-bold text-[#3b1f10]">
                        {b.zone_id ? (
                          <span className="flex items-center gap-1.5 text-[#2e5339]">
                            <MapPin size={13} className="text-[#2e5339]" />
                            {b.restaurant_zones?.name || b.zone_id}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-[#8C1D40] font-bold uppercase text-xs border border-rose-200">
                            Todo el Local
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="capitalize font-semibold text-[#3b1f10]">
                          {b.blackout_type === "full_day"
                            ? "Día Completo"
                            : b.blackout_type === "time_slot"
                            ? "Turno / Horas"
                            : "Indefinido"}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#3b1f10]">
                            {b.start_date} {b.end_date ? ` al ${b.end_date}` : ""}
                          </span>
                          {b.start_time && b.end_time && (
                            <span className="text-[#3b1f10]/60 flex items-center gap-1">
                              <Clock size={11} /> {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)} hrs
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-[#3b1f10]/80 max-w-xs truncate" title={b.reason}>
                        {b.reason}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            b.is_active
                              ? "bg-rose-50 text-[#8C1D40] border-rose-200"
                              : "bg-emerald-50 text-[#2e5339] border-emerald-200"
                          }`}
                        >
                          {b.is_active ? "Apagado Activo" : "Operativo"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleBlackout(b.id, b.is_active)}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                            b.is_active
                              ? "bg-[#2e5339] hover:bg-[#23412c] text-white shadow-xs"
                              : "bg-[#f7f5ef] hover:bg-white text-[#3b1f10] border border-[#d4a373]/30"
                          }`}
                        >
                          <Power size={13} />
                          <span>{b.is_active ? "Encender Zona" : "Reactivar Apagado"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AdminZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setSelectedZoneToEdit(null);
        }}
        zone={selectedZoneToEdit}
        onSaved={loadData}
      />

      <AdminBlackoutModal
        isOpen={isBlackoutModalOpen}
        onClose={() => setIsBlackoutModalOpen(false)}
        zones={zones}
        onCreated={loadData}
      />
    </div>
  );
}
