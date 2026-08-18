import { useState, useEffect } from "react";
import { X, Loader2, ListTree, Plus, Edit2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { AdminCategoryFormModal } from "./AdminCategoryFormModal";

interface AdminCategoryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChanged?: () => Promise<void>;
  onSave?: () => Promise<void>;
}

export function AdminCategoryListModal({
  isOpen,
  onClose,
  onCategoryChanged,
  onSave,
}: AdminCategoryListModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setErrorMsg("Error al cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !currentStatus })
        .eq("id", categoryId);

      if (error) throw error;
      
      // Actualizar estado local
      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, is_active: !currentStatus } : c
      ));
      
      // Notificar cambio
      await onCategoryChanged?.();
      await onSave?.();
    } catch (err: any) {
      console.error("Error toggling category:", err);
      alert("No se pudo actualizar el estado de la categoría.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center cursor-pointer font-sans"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col min-h-0 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 cursor-default my-0"
        >
          {/* Header */}
          <div className="bg-[#14231D] p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ListTree className="text-white/80" size={20} />
              <h2 className="font-sans font-extrabold text-base sm:text-lg text-white">
                Administrar Categorías
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tools */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
            <p className="text-xs text-gray-600">
              Activa o desactiva las categorías para controlar qué secciones se muestran en la carta pública.
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#2D473C] hover:bg-[#1E322A] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
            >
              <Plus size={14} /> Nueva Categoría
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-0 min-h-0">
            {errorMsg && (
              <div className="p-4 m-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={32} className="animate-spin text-[#2D473C]/50" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                No hay categorías registradas.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold sticky top-0 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{cat.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">/{cat.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(cat.id, cat.is_active)}
                            className={`w-10 h-5 rounded-full p-1 transition-colors relative flex items-center ${
                              cat.is_active ? "bg-emerald-500" : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm absolute ${
                                cat.is_active ? "right-1" : "left-1"
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold ${cat.is_active ? "text-emerald-700" : "text-gray-500"}`}>
                            {cat.is_active ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsFormOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold border border-gray-200 text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <AdminCategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={selectedCategory}
        onSave={async () => {
          await fetchCategories();
          await onCategoryChanged?.();
          await onSave?.();
          setIsFormOpen(false);
        }}
        onDelete={async () => {
          await fetchCategories();
          await onCategoryChanged?.();
          await onSave?.();
          setIsFormOpen(false);
        }}
      />
    </>
  );
}
