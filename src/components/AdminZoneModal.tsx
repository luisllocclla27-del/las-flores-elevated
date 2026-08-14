import { useState, useEffect } from "react";
import type { RestaurantZone, ZoneUpdateInput } from "../features/zones/types";
import { updateRestaurantZone } from "../features/zones/api";
import { X, Loader2, Check } from "lucide-react";

interface AdminZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: RestaurantZone | null;
  onSaved: () => void;
}

export function AdminZoneModal({ isOpen, onClose, zone, onSaved }: AdminZoneModalProps) {
  const [name, setName] = useState(zone?.name || "");
  const [description, setDescription] = useState(zone?.description || "");
  const [imageUrl, setImageUrl] = useState(zone?.image_url || "");
  const [maxCapacity, setMaxCapacity] = useState(zone?.max_capacity_persons || 30);
  const [maxTables, setMaxTables] = useState(zone?.max_tables_count || 6);
  const [isActive, setIsActive] = useState(zone?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setDescription(zone.description || "");
      setImageUrl(zone.image_url || "");
      setMaxCapacity(zone.max_capacity_persons || 30);
      setMaxTables(zone.max_tables_count || 6);
      setIsActive(zone.is_active);
    }
  }, [zone]);

  if (!isOpen || !zone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const input: ZoneUpdateInput = {
        name,
        description,
        image_url: imageUrl,
        max_capacity_persons: Number(maxCapacity),
        max_tables_count: Number(maxTables),
        is_active: isActive,
      };
      await updateRestaurantZone(zone.id, input);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la información de la zona.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-eucalipto tracking-wider">
              Configuración de Salón
            </span>
            <h3 className="font-serif font-bold text-2xl text-ink mt-0.5">{zone.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-ink/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
              Nombre de la Zona / Salón
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
              URL de Foto Representativa
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/imagenes-reales/Salones/Terraza.webp"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
            />
            {imageUrl && (
              <div className="mt-2 h-28 w-full rounded-xl overflow-hidden border border-black/10 bg-cream">
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
              Descripción del Ambiente
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción corta visible para clientes"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                Aforo Máx. (Personas)
              </label>
              <input
                type="number"
                min={1}
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-ink/75 mb-1">
                Mesas Máximas
              </label>
              <input
                type="number"
                min={1}
                required
                value={maxTables}
                onChange={(e) => setMaxTables(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-xs text-ink outline-none focus:border-eucalipto font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-eucalipto focus:ring-eucalipto accent-eucalipto"
              />
              <span className="font-bold text-ink">Zona habilitada para selección de mesas</span>
            </label>
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
              className="px-6 py-2.5 bg-eucalipto text-cream font-bold rounded-xl hover:bg-eucalipto/90 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
