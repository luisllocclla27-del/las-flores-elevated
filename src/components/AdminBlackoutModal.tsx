import { useState } from "react";
import type { RestaurantZone, ZoneBlackoutInput, BlackoutType } from "../features/zones/types";
import { createZoneBlackout } from "../features/zones/api";
import { X, Loader2, ShieldAlert } from "lucide-react";

interface AdminBlackoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: RestaurantZone[];
  onCreated: () => void;
}

function getLocalPeruDateStr(): string {
  const d = new Date();
  const peruDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Lima" }));
  const yyyy = peruDate.getFullYear();
  const mm = String(peruDate.getMonth() + 1).padStart(2, "0");
  const dd = String(peruDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AdminBlackoutModal({ isOpen, onClose, zones, onCreated }: AdminBlackoutModalProps) {
  const todayStr = getLocalPeruDateStr();

  const [zoneId, setZoneId] = useState<string>("global");
  const [blackoutType, setBlackoutType] = useState<BlackoutType>("full_day");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Por favor especifica un motivo para el apagado de reservas.");
      return;
    }

    setSaving(true);
    try {
      const input: ZoneBlackoutInput = {
        zone_id: zoneId === "global" ? null : zoneId,
        blackout_type: blackoutType,
        start_date: startDate,
        end_date: blackoutType === "full_day" || blackoutType === "time_slot" ? endDate : null,
        start_time: blackoutType === "time_slot" ? startTime : null,
        end_time: blackoutType === "time_slot" ? endTime : null,
        reason: reason.trim(),
        is_active: true,
      };

      await createZoneBlackout(input);
      onCreated();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar apagado:", err);
      const errMsg = err?.message || err?.details || "Asegúrate de haber ejecutado el script SQL (supabase/zones_and_blackouts.sql) en el editor SQL de Supabase.";
      alert(`Error al registrar el apagado de reservas:\n\n${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-serif italic font-bold text-2xl text-[#3b1f10]">Apagado de Reservas</h3>
              <p className="text-xs text-[#3b1f10]/60">Bloquea la recepción de reservas en línea</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#3b1f10]/50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#3b1f10]/80 mb-1">
              Zona a Apagar / Bloquear
            </label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#d4a373]/30 bg-[#f7f5ef] text-xs text-[#3b1f10] font-bold outline-none cursor-pointer focus:border-[#8C1D40]"
            >
              <option value="global">Todo el Restaurante (Apagado General)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Salón: {z.name} ({z.max_tables_count} mesas max)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
              Modalidad de Bloqueo
            </label>
            <select
              value={blackoutType}
              onChange={(e) => setBlackoutType(e.target.value as BlackoutType)}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none cursor-pointer focus:border-red-500"
            >
              <option value="full_day">Día Completo (Bloquea todo el día)</option>
              <option value="time_slot">Rango de Horas / Turno (ej. 2:00 PM a 6:00 PM)</option>
              <option value="indefinite">Indefinido (Hasta volver a encender)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-red-500 font-semibold"
              />
            </div>

            {blackoutType !== "indefinite" && (
              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-red-500 font-semibold"
                />
              </div>
            )}
          </div>

          {blackoutType === "time_slot" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-red-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-red-500 font-semibold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
              Motivo del Bloqueo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Reserva telefónica exclusiva de la zona / Evento de empresa"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-ink/70 hover:bg-black/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>Confirmar Apagado</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
