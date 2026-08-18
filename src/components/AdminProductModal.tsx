import { useState, useEffect, useRef } from "react";
import { X, Loader2, Utensils, DollarSign, FileText, Image as ImageIcon, Tag, Upload, Trash2, CheckCircle2, RefreshCw, Sparkles, AlertCircle, Plus, Wand2, Layers } from "lucide-react";
import { supabase } from "../lib/supabase";
import { compressImageToWebP } from "../lib/webp-compressor";

export interface CustomOption {
  id: string;
  name: string;
  desc?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  required: boolean;
  options: CustomOption[];
}

const PRESET_DESAYUNO: CustomSection[] = [
  {
    id: "sec_1",
    title: "1. Bebida fría",
    required: true,
    options: [
      { id: "opt_1", name: "Jugo de plátano", desc: "Refrescante y cremoso de fruta natural" },
      { id: "opt_2", name: "Jugo de mango", desc: "Dulce y tropical recién preparado" },
      { id: "opt_3", name: "Jugo de frutos rojos", desc: "Mezcla antioxidante y llena de sabor" },
      { id: "opt_4", name: "Jugo de naranja", desc: "100% natural exprimidito al momento" },
      { id: "opt_5", name: "Jugo de piña", desc: "Digestivo y refrescante de piña selecta" },
    ],
  },
  {
    id: "sec_2",
    title: "2. Bebida caliente",
    required: true,
    options: [
      { id: "opt_6", name: "Taza de café", desc: "Café pasado artesanal de grano andino" },
      { id: "opt_7", name: "Chocolate ayacuchano", desc: "Tradicional cacao especiado hervido a fuego lento" },
      { id: "opt_8", name: "Infusión", desc: "Hierbas aromáticas naturales (Manzanilla, Anís o Muña)" },
    ],
  },
  {
    id: "sec_3",
    title: "3. Sándwich",
    required: true,
    options: [
      { id: "opt_9", name: "Pan con Butifarra", desc: "Jugoso jamón del país acompañado de cebolla encurtida" },
      { id: "opt_10", name: "Pan con Chicharrón", desc: "Chicharrón tierno y crocante acompañado de camote frito" },
    ],
  },
  {
    id: "sec_4",
    title: "4. Acompañamiento",
    required: true,
    options: [
      { id: "opt_11", name: "Humita", desc: "Auténtica humita dulce o salada hecha en casa" },
      { id: "opt_12", name: "Huevos revueltos", desc: "Huevos de corral frescos preparados al gusto" },
      { id: "opt_13", name: "Ensalada de palta", desc: "Láminas de palta hass fresca con limón y sal" },
      { id: "opt_14", name: "Ensalada de frutas", desc: "Variedad de frutas de estación picadas" },
    ],
  },
];

const PRESET_RONDA: CustomSection[] = [
  {
    id: "sec_r1",
    title: "1. Entrada / Qapchi",
    required: true,
    options: [
      { id: "ro_1", name: "Qapchi Huamanguino con Papa Nativa", desc: "Crema de queso tradicional" },
      { id: "ro_2", name: "Causa Ayacuchana de Trucha", desc: "Causa crocante con ají amarillo" },
    ],
  },
  {
    id: "sec_r2",
    title: "2. Plato Principal",
    required: true,
    options: [
      { id: "ro_3", name: "Chicharrón de Cerdo Crocante", desc: "Porción generosa de chicharrón" },
      { id: "ro_4", name: "Cuy Chactado Ayacuchano", desc: "Cuy dorado tradicional" },
    ],
  },
  {
    id: "sec_r3",
    title: "3. Acompañamiento",
    required: true,
    options: [
      { id: "ro_5", name: "Mote Andino con Queso", desc: "Mote tierno salteado" },
      { id: "ro_6", name: "Papas Nativas Salteadas", desc: "Mix de papas nativas doradas" },
    ],
  },
];

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null; // Null means create new
  categories: any[];
  onSave: () => Promise<void>;
  onDelete?: (productId: string) => Promise<void>;
}

export function AdminProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  onDelete,
}: AdminProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price ? product.price.toString() : "");
        setCategoryId(product.category_id || (categories[0]?.id || ""));
        setImageUrl(product.image_url || "");
        setIsAvailable(product.is_available ?? true);
        const customizableVal = product.is_customizable ?? (product.name?.toLowerCase().includes("desayuno ayacuchano") || false);
        setIsCustomizable(customizableVal);
        
        if (product.custom_options && Array.isArray(product.custom_options) && product.custom_options.length > 0) {
          setCustomSections(product.custom_options);
        } else if (product.name?.toLowerCase().includes("desayuno ayacuchano")) {
          setCustomSections(PRESET_DESAYUNO);
        } else {
          setCustomSections([]);
        }
      } else {
        setName("");
        setDescription("");
        setPrice("");
        setCategoryId(categories[0]?.id || "");
        setImageUrl("");
        setIsAvailable(true);
        setIsCustomizable(false);
        setCustomSections([]);
      }
      setUploadSuccessMsg("");
      setErrorMsg("");

      // Reset scroll position to top when modal opens
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [isOpen, product, categories]);

  // Zero-IT Staff Image Upload: Compress & Upload to Supabase Storage automatically
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");
    setUploadSuccessMsg("");

    try {
      // 1. Compress image to optimized WebP in browser
      const compressed = await compressImageToWebP(file, 1200, 1200, 0.85);

      // 2. Try uploading to Supabase Storage bucket 'products'
      const cleanFileName = `plato_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("products")
        .upload(cleanFileName, compressed.blob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        // Successfully stored in Supabase Storage CDN!
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(cleanFileName);

        setImageUrl(publicUrlData.publicUrl);
        setUploadSuccessMsg(`¡Imagen optimizada (${compressed.originalSizeKb}KB ➔ ${compressed.compressedSizeKb}KB WebP) y subida con éxito!`);
      } else {
        // Fallback: If bucket is not public/ready, use compressed Data URL directly
        console.warn("Storage upload fallback to compressed Data URL:", uploadErr);
        setImageUrl(compressed.dataUrl);
        setUploadSuccessMsg(`¡Foto optimizada a WebP (${compressed.compressedSizeKb} KB) y lista para guardar!`);
      }
    } catch (err: any) {
      console.error("Error al procesar la foto:", err);
      setErrorMsg("No se pudo procesar la foto seleccionada. Intenta con otra imagen.");
    } finally {
      setUploading(false);
    }
  };

  // Soft Disable Product Logic (preserves historical BI sales analytics)
  const handleToggleDisableProduct = async () => {
    if (!product) return;
    const newStatus = !isAvailable;
    const actionText = newStatus ? "reactivar" : "desactivar (ocultar de carta)";
    const confirmAction = window.confirm(
      `¿Estás seguro de ${actionText} el plato "${product.name}"?\n\n` +
      (newStatus
        ? "El plato volverá a estar disponible para pedidos en la carta pública."
        : "El plato se ocultará de la carta pública pero se conservará intacto todo su historial de ventas para BI y análisis.")
    );
    if (!confirmAction) return;

    setDeleting(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_available: newStatus })
        .eq("id", product.id);

      if (error) throw error;

      setIsAvailable(newStatus);
      await onSave();
      onClose();
    } catch (err: any) {
      console.error("Error toggling product status:", err);
      setErrorMsg(err.message || "No se pudo cambiar el estado del plato.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product || !onDelete) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar permanentemente el plato "${product.name}" de la carta?`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setErrorMsg("");

    try {
      await onDelete(product.id);
      onClose();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setErrorMsg(err.message || "No se pudo eliminar el plato.");
    } finally {
      setDeleting(false);
    }
  };

  // Helper functions for Custom Sections builder
  const handleAddSection = () => {
    const newSec: CustomSection = {
      id: `sec_${Date.now()}`,
      title: `${customSections.length + 1}. Nombre de la sección`,
      required: true,
      options: [
        { id: `opt_${Date.now()}_1`, name: "Opción 1", desc: "Descripción breve" },
      ],
    };
    setCustomSections([...customSections, newSec]);
  };

  const handleRemoveSection = (secId: string) => {
    setCustomSections(customSections.filter((s) => s.id !== secId));
  };

  const handleUpdateSectionTitle = (secId: string, title: string) => {
    setCustomSections(
      customSections.map((s) => (s.id === secId ? { ...s, title } : s))
    );
  };

  const handleAddOption = (secId: string) => {
    setCustomSections(
      customSections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            options: [
              ...s.options,
              { id: `opt_${Date.now()}`, name: "Nueva Opción", desc: "" },
            ],
          };
        }
        return s;
      })
    );
  };

  const handleRemoveOption = (secId: string, optId: string) => {
    setCustomSections(
      customSections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            options: s.options.filter((o) => o.id !== optId),
          };
        }
        return s;
      })
    );
  };

  const handleUpdateOption = (
    secId: string,
    optId: string,
    field: "name" | "desc",
    val: string
  ) => {
    setCustomSections(
      customSections.map((s) => {
        if (s.id === secId) {
          return {
            ...s,
            options: s.options.map((o) =>
              o.id === optId ? { ...o, [field]: val } : o
            ),
          };
        }
        return s;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      setErrorMsg("Por favor completa los campos requeridos (Nombre, Precio, Categoría).");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category_id: categoryId,
        image_url: imageUrl.trim() || null,
        is_available: isAvailable,
      };

      if (product) {
        // Update
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("products")
          .insert([payload]);

        if (error) throw error;
      }

      await onSave();
      onClose();
    } catch (err: any) {
      console.error("Error saving product:", err);
      setErrorMsg(err.message || "Error al guardar el plato.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Cierre por clic directo en el fondo oscuro exterior
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-5 pt-4 sm:pt-6 pb-16 overflow-y-auto font-sans flex items-start justify-center cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[82vh] flex flex-col min-h-0 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 cursor-default my-0"
      >
        
        {/* Header (Fijo en la parte superior) */}
        <div className="bg-eucalipto text-piedra p-4 sm:p-5 flex items-center justify-between border-b border-chilca/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <Utensils className="text-chilca" size={20} />
            <h2 className="font-sans font-extrabold text-base sm:text-lg text-white">
              {product ? "Editar / Actualizar Plato" : "Nuevo Lanzamiento o Promoción"}
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

        {/* Form Body (Scrollable Interno - Inicia siempre en el tope) */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden font-sans">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {uploadSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText size={13} className="text-emerald-700" /> Nombre del Plato o Promoción *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Promoción Fiestas Patrias - Cuy Chactado"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D] focus:bg-white transition-all font-semibold"
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag size={13} className="text-emerald-700" /> Categoría *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D] focus:bg-white transition-all font-semibold"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-700" /> Precio (S/) *
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="35.00"
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D] focus:bg-white transition-all font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Descripción o Detalles de la Promoción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del plato, ingredientes o términos del lanzamiento..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#14231D] focus:bg-white transition-all"
            />
          </div>

          {/* Staff Image Upload Section */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon size={14} className="text-emerald-700" /> Foto del Plato / Promoción
              </span>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Almacenamiento Automático
              </span>
            </label>

            {/* Current Image Preview & Change Button */}
            {imageUrl ? (
              <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-sm">
                  <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Imagen Cargar y Lista
                  </span>
                  <p className="text-xs text-gray-500 line-clamp-1 break-all">{imageUrl}</p>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-1 px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin text-emerald-700" /> : <RefreshCw size={12} className="text-emerald-700" />}
                    <span>Actualizar / Cambiar Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              /* One-Click Upload Area for Staff */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-emerald-600/40 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl text-center cursor-pointer transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                </div>
                <span className="text-xs font-bold text-nogal block">
                  {uploading ? "Optimizando y Subiendo Foto..." : "Haga clic aquí para Seleccionar Foto (Celular o PC)"}
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  El sistema comprime la foto automáticamente y genera su enlace permanente.
                </span>
              </div>
            )}

            {/* Hidden Input File */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Manual URL Fallback / Google Drive converter */}
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-800 font-semibold py-1">
                ¿Prefieres ingresar o pegar un enlace manualmente?
              </summary>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  const inputVal = e.target.value;
                  if (inputVal.includes("drive.google.com")) {
                    const match = inputVal.match(/\/d\/([a-zA-Z0-9_-]+)/) || inputVal.match(/id=([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      setImageUrl(`https://drive.google.com/uc?export=view&id=${match[1]}`);
                      return;
                    }
                  }
                  setImageUrl(inputVal);
                }}
                placeholder="Pega la URL de la foto o enlace público de Google Drive..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
              />
            </details>
          </div>

          {/* Availability Toggle */}
          <div className="pt-2 flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Disponibilidad en Carta Web</span>
              <span className="text-xs text-gray-500">¿El plato o promoción está activo para clientes?</span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                isAvailable ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Customization Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
            <div>
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" /> ¿Es un plato personalizable? (Arma tu plato / Ronda)
              </span>
              <span className="text-xs text-amber-800/80 block mt-0.5">
                Permite al cliente seleccionar opciones (Bebidas, Acompañamientos, etc.) antes de agregar.
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsCustomizable(!isCustomizable)}
              className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                isCustomizable ? "bg-amber-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isCustomizable ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Customization Options Builder */}
          {isCustomizable && (
            <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="text-amber-700" size={18} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                    Constructor de Secciones y Opciones
                  </h4>
                </div>

                {/* Preset Loaders */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomSections(PRESET_DESAYUNO)}
                    className="px-2.5 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
                  >
                    <Wand2 size={12} /> Cargar Plantilla Desayuno
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomSections(PRESET_RONDA)}
                    className="px-2.5 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
                  >
                    <Wand2 size={12} /> Cargar Plantilla Ronda
                  </button>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-4">
                {customSections.length === 0 ? (
                  <div className="p-6 text-center bg-white/80 rounded-xl border border-dashed border-amber-300 text-amber-900">
                    <p className="text-xs font-medium mb-2">No has agregado secciones para este plato personalizable.</p>
                    <p className="text-xs text-amber-700 mb-3">Puedes cargar una plantilla rápida arriba o hacer clic abajo para crear tu primera sección.</p>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      + Crear Primera Sección
                    </button>
                  </div>
                ) : (
                  customSections.map((sec, secIdx) => (
                    <div
                      key={sec.id}
                      className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-xs space-y-3"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0">
                            {secIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => handleUpdateSectionTitle(sec.id, e.target.value)}
                            placeholder="Nombre de sección (ej. 1. Elegir Bebida Fría)"
                            className="flex-1 font-bold text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSection(sec.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar Sección"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Options in Section */}
                      <div className="pl-8 space-y-2 border-l-2 border-amber-100">
                        {sec.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => handleUpdateOption(sec.id, opt.id, "name", e.target.value)}
                              placeholder="Nombre opción (ej. Jugo de mango)"
                              className="flex-1 text-xs font-semibold bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              value={opt.desc || ""}
                              onChange={(e) => handleUpdateOption(sec.id, opt.id, "desc", e.target.value)}
                              placeholder="Detalle (opcional)"
                              className="flex-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(sec.id, opt.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddOption(sec.id)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 pt-1"
                        >
                          <Plus size={13} /> Agregar otra opción a esta sección
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {customSections.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-amber-300"
                  >
                    <Plus size={15} /> Agregar Nueva Sección al Plato
                  </button>
                )}
              </div>
            </div>
          )}

          </div>

          {/* Modal Actions (Fijo Abajo fuera del Scroll) */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0 font-sans">
            
            {/* Soft disable action */}
            {product ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDisableProduct}
                  disabled={deleting}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 border ${
                    isAvailable
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
                  }`}
                  title="Deshabilita el plato de la carta sin borrar su historial para reportes de BI"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>{isAvailable ? "Desactivar (Ocultar)" : "Reactivar en Carta"}</span>
                </button>
              </div>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2.5 rounded-xl bg-eucalipto hover:bg-eucalipto text-piedra text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin text-chilca" /> : null}
                {product ? "Guardar Cambios" : "Publicar en Carta"}
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}




