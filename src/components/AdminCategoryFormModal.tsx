import { useState, useEffect } from "react";
import { X, Loader2, ListTree, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AdminCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: any | null; // Null means create new
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function AdminCategoryFormModal({
  isOpen,
  onClose,
  category,
  onSave,
  onDelete,
}: AdminCategoryFormModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("10");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name || "");
        setSlug(category.slug || "");
        setDescription(category.description || "");
        setSortOrder(category.sort_order ? category.sort_order.toString() : "10");
        setIsActive(category.is_active ?? true);
      } else {
        setName("");
        setSlug("");
        setDescription("");
        setSortOrder("10");
        setIsActive(true);
      }
      setErrorMsg("");
    }
  }, [isOpen, category]);

  // Auto-generate slug from name if creating new
  useEffect(() => {
    if (!category && name) {
      setSlug(
        name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [name, category]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setErrorMsg("El nombre y el slug son obligatorios.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 10,
        is_active: isActive,
      };

      if (category) {
        // Update
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", category.id);

        if (error) throw error;
      } else {
        // Create (Check if slug already exists)
        const { data: existing } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", payload.slug)
          .single();

        if (existing) {
          setErrorMsg(`El identificador "${payload.slug}" ya está en uso.`);
          setSaving(false);
          return;
        }

        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
      }

      await onSave();
      onClose();
    } catch (err: any) {
      console.error("Error saving category:", err);
      setErrorMsg(err.message || "Error al guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"? Los productos asociados podrían quedarse sin categoría.`)) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("categories").delete().eq("id", category.id);
      if (error) throw error;

      if (onDelete) await onDelete();
      else await onSave();

      onClose();
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setErrorMsg(err.message || "Error al eliminar la categoría.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center cursor-pointer font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col min-h-0 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 cursor-default my-0"
      >
        <div className="bg-[#2D473C] text-[#FAF8F5] p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ListTree className="text-white/80" size={20} />
            <h2 className="font-sans font-extrabold text-base sm:text-lg text-white">
              {category ? "Editar Categoría" : "Nueva Categoría"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Menú Infantil"
                className="w-full text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Identificador (Slug) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="menu-infantil"
                className="w-full text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              />
              <p className="text-xs text-gray-500 mt-1">Debe ser único, sin espacios ni caracteres especiales.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Descripción (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción de la categoría..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D] resize-none h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="pt-2 flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Estado Inicial</span>
                <span className="text-xs text-gray-500">¿Visible en la carta pública?</span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  isActive ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
            {category ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : "Eliminar"}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-[#2D473C] hover:bg-[#243B31] text-[#FAF8F5] text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin text-[#D4AF37]" />}
                {category ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
